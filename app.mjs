import { DAYS, QUALS, ROLE_LABEL, RULES, audit, blankState, generate, idleOn } from "./schedule.mjs";

const KEY = "clinic-schedule-v2";
const CELL_ROWS = [
  ["konan", "08:00–18:00"],
  ["aide", "09:00–18:00"],
  ["rangeAm", "06:00–12:00"],
  ["rangePm", "12:00–18:00"],
  ["rangeEve", "18:00–00:00"],
  ["night", "18:00–08:00"],
  ["kiryot", "כל היום"],
  ["driver", ""],
];
const PAIR_ROWS = ["yomi054", "yomi224"];
const GROUPS = ["224", "084", "054", "מחסן"];

let state = load();
const ui = { tab: "edit", edit: "konan:0", weekEdit: "" };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blankState();
    return normalize(JSON.parse(raw));
  } catch {
    return blankState();
  }
}

function normalize(input) {
  const base = blankState();
  if (!input || !Array.isArray(input.people) || !input.cells) return base;
  return {
    ...base,
    ...input,
    cells: { ...base.cells, ...input.cells },
    pairs: { ...base.pairs, ...input.pairs },
    rules: { ...base.rules, ...input.rules },
    teams: input.teams?.length === 5 ? input.teams : base.teams,
    guards: input.guards?.length === 5 ? input.guards : base.guards,
    weeklies: input.weeklies || [],
    tasks: (input.tasks || []).map((task) => ({
      ...task,
      people: task.people?.length ? task.people : task.person ? [task.person] : [],
    })),
    custom: input.custom || [],
    need: {
      rangeAm: input.need?.rangeAm?.length === 5 ? input.need.rangeAm : base.need.rangeAm,
      rangePm: input.need?.rangePm?.length === 5 ? input.need.rangePm : base.need.rangePm,
      rangeEve: input.need?.rangeEve?.length === 5 ? input.need.rangeEve : base.need.rangeEve,
    },
  };
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ponytail: private-mode storage can throw; the schedule still has to show
  }
}

function status(text) {
  const note = document.querySelector("#status");
  if (note) note.textContent = text;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function personByName(name) {
  return state.people.find((p) => p.name === name);
}

function qualified(role) {
  const qual = {
    konan: "konan",
    aide: "aide",
    rangeAm: "ranges",
    rangePm: "ranges",
    rangeEve: "ranges",
    night: "night",
    kiryot: "kiryot",
    driver: "driver",
    guard: "guards",
    rasar: "rasar",
    manager: "manager",
  }[role];
  const people = [...state.people].sort((a, b) => a.name.localeCompare(b.name, "he"));
  if (!qual) return { fit: people, rest: [] };
  const ok = (p) => p.quals.includes(qual) || (role === "night" && p.quals.includes("konan"));
  return {
    fit: people.filter(ok),
    rest: people.filter((p) => !ok(p)),
  };
}

function render() {
  const issues = audit(state);
  const badCells = new Set();
  for (const item of issues) {
    if (item.level !== "error") continue;
    const day = DAYS.findIndex((name) => item.text.includes(name));
    if (day >= 0) badCells.add(String(day));
  }
  document.querySelector("#app").innerHTML = `
    <div class="board">
      <section class="sheet">${grid(issues)}</section>
      <div class="rail">
        ${weeklyCard()}
        <aside class="side">
          ${issuesHtml(issues)}
          <nav class="tabs">
            ${tab("edit", "עריכה")}
            ${tab("people", "אנשים")}
            ${tab("duties", "תורנויות")}
            ${tab("rules", "אילוצים")}
            ${tab("tasks", "משימות")}
          </nav>
          <div class="panel">${panel()}</div>
        </aside>
      </div>
    </div>`;
}

function tab(id, label) {
  return `<button type="button" data-tab="${id}" class="${ui.tab === id ? "on" : ""}">${label}</button>`;
}

function issuesHtml(issues) {
  if (!issues.length) return `<div class="issues"><p class="ok">הלוז עומד באילוצים הפעילים</p></div>`;
  const shown = issues.slice(0, 8).map((item) => `<p class="${item.level === "error" ? "error" : "warn"}">${esc(item.text)}</p>`).join("");
  const more = issues.length > 8 ? `<p class="note">ועוד ${issues.length - 8}</p>` : "";
  return `<div class="issues">${shown}${more}</div>`;
}

function grid() {
  const head = DAYS.map((day) => `<th>${day}</th>`).join("");
  const rows = [
    ...CELL_ROWS.map(([key, hours]) => singleRow(key, hours)),
    ...PAIR_ROWS.map((key) => pairRow(key)),
    guardRow(),
    pairRow("rasar", "כל היום"),
    teamRow(),
    taskRow(),
    idleRow(),
  ];
  return `<table>
    <thead><tr><th class="role">תפקיד</th>${head}</tr></thead>
    <tbody>${rows.join("")}</tbody>
  </table>`;
}

function idleRow() {
  const tds = DAYS.map((_, day) => {
    const count = idleOn(state, day).length;
    return cell(`idle:${day}`, count ? `${count} בלי לוז` : "כולם משובצים", count === 0);
  }).join("");
  return `<tr>${roleHead("בלי לוז", "")}${tds}</tr>`;
}

function roleHead(label, hours) {
  const sub = hours ? `<span class="hours" dir="ltr">${esc(hours)}</span>` : "";
  return `<th class="role">${esc(label)}${sub}</th>`;
}

function cell(edit, text, empty) {
  const on = ui.edit === edit ? " on" : "";
  return `<td class="cell${on}" data-edit="${edit}">${empty ? `<span class="empty">—</span>` : text}</td>`;
}

function singleRow(key, hours) {
  const tds = state.cells[key].map((name, day) => {
    const open = state.need?.[key]?.[day] && !name;
    return cell(`${key}:${day}`, open ? "יש" : esc(name), !name && !open);
  }).join("");
  return `<tr>${roleHead(ROLE_LABEL[key], hours)}${tds}</tr>`;
}

function pairRow(key, hours = "") {
  const tds = state.pairs[key].map((pair, day) => {
    const names = pair.filter(Boolean);
    const html = names.map((name) => `<span class="pair">${esc(name)}</span>`).join("");
    return cell(`${key}:${day}`, html, names.length === 0);
  }).join("");
  return `<tr>${roleHead(ROLE_LABEL[key], hours)}${tds}</tr>`;
}

function guardRow() {
  const tds = state.guards.map((list, day) => {
    const html = list.map((g) => `<span class="pair">${esc(g.person)}<span class="when" dir="ltr">${esc(g.start)}–${esc(g.end)}</span></span>`).join("");
    return cell(`guard:${day}`, html, list.length === 0);
  }).join("");
  return `<tr>${roleHead("שמירות", "")}${tds}</tr>`;
}

function teamRow() {
  const tds = state.teams.map((team, day) => {
    const bits = [team.manager && `${esc(team.manager)} <span class="note">מנהל</span>`, team.a, team.b].filter(Boolean);
    const html = bits.map((bit) => `<span class="pair">${bit}</span>`).join("");
    return cell(`team:${day}`, html, bits.length === 0);
  }).join("");
  return `<tr>${roleHead("כוננות", "08:00–18:00")}${tds}</tr>`;
}

function taskRow() {
  const tds = DAYS.map((_, day) => {
    const list = state.tasks.filter((task) => task.day === day);
    const html = list.map((task) => `<span class="pair">${esc(taskLabel(task))} ${esc(task.title)}<span class="when" dir="ltr">${esc(task.start)}–${esc(task.end)}</span><button type="button" class="remove" data-act="del-task" data-id="${esc(task.id)}">הסרה</button></span>`).join("");
    return `<td>${list.length ? html : `<span class="empty">—</span>`}</td>`;
  }).join("");
  return `<tr>${roleHead("משימות", "")}${tds}</tr>`;
}

function panel() {
  if (ui.tab === "people") return peoplePanel();
  if (ui.tab === "duties") return dutiesPanel();
  if (ui.tab === "rules") return rulesPanel();
  if (ui.tab === "tasks") return tasksPanel();
  return editPanel();
}

function groupTitle(group) {
  return group === "מחסן" ? "שבועית ציוד מחסן" : `שבועית ${group}`;
}

function weeklyCard() {
  const dayOpts = DAYS.map((day, index) => `<option value="${index}" ${index === state.weekDay ? "selected" : ""}>${day}</option>`).join("");
  const people = state.people.map((p) => `<option>${esc(p.name)}</option>`).join("");
  const extra = [...new Set(state.weeklies.map((row) => row.group))].filter((group) => !GROUPS.includes(group));
  const body = [...GROUPS, ...extra].map((group) => {
    const rows = state.weeklies.filter((row) => row.group === group).map((row) => {
      if (ui.weekEdit === row.id) {
        const opts = state.people.map((p) => `<option ${p.name === row.person ? "selected" : ""}>${esc(p.name)}</option>`).join("");
        return `<tr class="on">
          <td class="name"><select data-act="weekly-person" data-id="${esc(row.id)}">${opts}</select></td>
          <td><input data-act="weekly-task" data-id="${esc(row.id)}" value="${esc(row.task)}"></td>
          <td class="x"><button type="button" class="remove" data-act="del-weekly" data-id="${esc(row.id)}">הסרה</button></td>
        </tr>`;
      }
      return `<tr data-act="edit-weekly" data-id="${esc(row.id)}">
        <td class="name">${esc(row.person)}</td>
        <td colspan="2">${esc(row.task)}</td>
      </tr>`;
    }).join("");
    return `<tr class="grp"><td colspan="3">${groupTitle(group)}</td></tr>${rows}`;
  }).join("");
  const groups = [...GROUPS, ...extra].map((group) => `<option>${esc(group)}</option>`).join("");
  return `<section class="weekly">
    <h2><span>שבועיות</span><select data-act="week-day" aria-label="יום השבועיות">${dayOpts}</select></h2>
    <table><tbody>${body}</tbody></table>
    <p class="hint">לחיצה על שורה לעריכה. 084 על מי שבמטווחי הבוקר.</p>
    <form class="stack add" data-form="weekly">
      <select name="group" aria-label="קבוצה">${groups}</select>
      <select name="person" aria-label="אדם">${people}</select>
      <input name="task" type="text" placeholder="משימה" required>
      <button class="primary" type="submit">הוספה</button>
    </form>
  </section>`;
}

function editPanel() {
  const [role, dayText] = ui.edit.split(":");
  const day = Number(dayText);
  if (!role || Number.isNaN(day)) return `<p class="hint">בחרו משבצת בלוח.</p>`;
  const title = `${ROLE_LABEL[role] || role} · ${DAYS[day]}`;
  if (role === "idle") {
    const list = idleOn(state, day);
    const rows = list.map((person) => `<p>${esc(person.name)}${day > 0 && state.cells.night[day - 1] === person.name ? ` <span class="note">ישן/ה עד 12:00</span>` : ""}</p>`).join("");
    return `<h2>בלי לוז · ${DAYS[day]}</h2><p class="hint">זמינים בלי שום שיבוץ ביום הזה.</p>${rows || `<p class="hint">כולם משובצים.</p>`}`;
  }
  if (role === "guard") return `<h2>${title}</h2>${guardEditor(day)}`;
  if (role === "team") return `<h2>${title}</h2>${teamEditor(day)}`;
  if (state.pairs[role]) return `<h2>${title}</h2>${pairEditor(role, day)}`;
  return `<h2>${title}</h2>${singleEditor(role, day)}`;
}

function nameButtons(role, current, onPick) {
  const { fit, rest } = qualified(role);
  const button = (p, dim) => {
    const mark = p.unavailable.length === 5 ? " · לא זמין" : "";
    const cls = [current === p.name ? "on" : "", dim ? "dim" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-pick="${esc(p.name)}" data-act="${onPick}">${esc(p.name)}${mark}</button>`;
  };
  return `
    <div class="picks">${fit.map((p) => button(p, false)).join("") || `<span class="hint">אין כשירים</span>`}</div>
    ${rest.length ? `<details><summary class="note">שאר האנשים</summary><div class="picks">${rest.map((p) => button(p, true)).join("")}</div></details>` : ""}
    <button type="button" class="linkish" data-act="${onPick}" data-pick="">ניקוי</button>`;
}

function singleEditor(role, day) {
  return nameButtons(role, state.cells[role][day], "set-cell");
}

function pairEditor(role, day) {
  const [a, b] = state.pairs[role][day];
  return `<h3>ראשון</h3>${nameButtons(role, a, "set-pair-0")}<h3>שני</h3>${nameButtons(role, b, "set-pair-1")}`;
}

function teamEditor(day) {
  const team = state.teams[day];
  return `
    <h3>מנהל אירוע</h3>${nameButtons("manager", team.manager, "set-manager")}
    <h3>חובש</h3>${nameButtons("team", team.a, "set-med-a")}
    <h3>חובש</h3>${nameButtons("team", team.b, "set-med-b")}`;
}

function guardEditor(day) {
  const lines = state.guards[day].map((g, index) => `
    <div class="rowline">${esc(g.person)} <span class="when" dir="ltr">${esc(g.start)}–${esc(g.end)}</span>
      <button type="button" class="linkish" data-act="del-guard" data-day="${day}" data-index="${index}">הסרה</button>
    </div>`).join("");
  return `${lines || `<p class="hint">אין שמירות ביום הזה.</p>`}
    <form class="stack" data-form="guard" data-day="${day}">
      ${personField("guard")}
      <label class="field">התחלה<input type="time" name="start" value="12:00" required></label>
      <label class="field">סיום<input type="time" name="end" value="16:00" required></label>
      <button class="primary" type="submit">הוספת שמירה</button>
    </form>`;
}

function personField(role) {
  const { fit, rest } = qualified(role);
  const opts = [...fit, ...rest].map((p) => `<option>${esc(p.name)}</option>`).join("");
  return `<label class="field">אדם<select name="person">${opts}</select></label>`;
}

function peoplePanel() {
  const rows = state.people.map((p) => {
    const days = DAYS.map((day, index) => {
      const on = p.unavailable.includes(index) ? " on" : "";
      return `<button type="button" class="${on}" data-act="unavail" data-name="${esc(p.name)}" data-day="${index}">${day.slice(0, 1)}</button>`;
    }).join("");
    return `<article class="person">
      <header><strong>${esc(p.name)}</strong><button type="button" class="linkish" data-act="del-person" data-name="${esc(p.name)}">הסרה</button></header>
      <div class="quals">${p.quals.map((q) => QUALS.find(([id]) => id === q)?.[1] || q).join(" · ") || "בלי כשירות"}</div>
      <div class="days"><span>לא זמין</span>${days}</div>
      <label class="note"><input type="checkbox" data-act="flag" data-flag="boy" data-name="${esc(p.name)}" ${p.boy ? "checked" : ""}> בן, לתעדוף כונן לילה</label>
      <label class="note"><input type="checkbox" data-act="flag" data-flag="neverYomi" data-name="${esc(p.name)}" ${p.neverYomi ? "checked" : ""}> בלי יומיות</label>
      <label class="note"><input type="checkbox" data-act="flag" data-flag="neverWeekly" data-name="${esc(p.name)}" ${p.neverWeekly ? "checked" : ""}> בלי שבועיות</label>
      <label class="note"><input type="checkbox" data-act="flag" data-flag="aidePriority" data-name="${esc(p.name)}" ${p.aidePriority ? "checked" : ""}> עדיפות לע׳ כונן</label>
    </article>`;
  }).join("");
  const quals = QUALS.map(([id, label]) => `<label><input type="checkbox" name="qual" value="${id}"> ${label}</label>`).join("");
  return `<h2>אנשים</h2><p class="hint">יום מסומן = לא זמין.</p>${rows}
    <form class="stack" data-form="person">
      <h3>אדם חדש</h3>
      <label class="field">שם<input name="name" type="text" required></label>
      <div class="checks">${quals}</div>
      <label class="note"><input type="checkbox" name="boy"> בן</label>
      <button class="primary" type="submit">הוספה</button>
    </form>`;
}

function dutiesPanel() {
  const guards = state.guards.flatMap((list, day) => list.map((g, index) =>
    `<div class="rowline">${DAYS[day]} · ${esc(g.person)} <span class="when" dir="ltr">${esc(g.start)}–${esc(g.end)}</span>
      <button type="button" class="linkish" data-act="del-guard" data-day="${day}" data-index="${index}">הסרה</button></div>`)).join("");
  const rasar = state.pairs.rasar.map((pair, day) => namesLine(pair) &&
    `<div class="rowline">${DAYS[day]} · ${pair.filter(Boolean).map(esc).join(", ")}
      <button type="button" class="linkish" data-act="clear-rasar" data-day="${day}">ניקוי</button></div>`).join("");
  return `<h2>תורנויות</h2>
    <p class="hint">מזינים שמירות, רס״ר וזמינות, מסמנים מטווחים, ואז «צור לוז».</p>
    <h3>שמירות</h3>
    ${guards || `<p class="hint">אין שמירות.</p>`}
    <form class="stack" data-form="guard">
      ${dayField()}
      ${personField("guard")}
      <label class="field">התחלה<input type="time" name="start" value="12:00" required></label>
      <label class="field">סיום<input type="time" name="end" value="16:00" required></label>
      <button class="primary" type="submit">הוספת שמירה</button>
    </form>
    <h3>רס״ר</h3>
    ${rasar || `<p class="hint">אין רס״ר.</p>`}
    <form class="stack" data-form="rasar">
      ${dayField()}
      ${personField("rasar")}
      <button class="primary" type="submit">הוספה לרס״ר</button>
    </form>
    <h3>מטווחים השבוע</h3>
    ${["rangeAm", "rangePm", "rangeEve"].map((key) => `<div class="rowline"><b>${ROLE_LABEL[key]}</b> ${DAYS.map((day, index) => `<label class="note"><input type="checkbox" data-act="need" data-key="${key}" data-day="${index}" ${state.need?.[key]?.[index] ? "checked" : ""}> ${day}</label>`).join(" ")}</div>`).join("")}`;
}

function namesLine(pair) {
  return pair.some(Boolean);
}

function dayField() {
  const opts = DAYS.map((day, index) => `<option value="${index}">${day}</option>`).join("");
  return `<label class="field">יום<select name="day">${opts}</select></label>`;
}

function rulesPanel() {
  const toggles = RULES.map(([id, label, warn]) => `
    <label class="rule"><input type="checkbox" data-act="rule" data-rule="${id}" ${state.rules[id] ? "checked" : ""}> ${esc(label)}${warn ? ` <span class="note">אזהרה</span>` : ""}</label>`).join("");
  const custom = state.custom.map((c) => `
    <div class="rowline">
      <label class="rule"><input type="checkbox" data-act="custom-on" data-id="${esc(c.id)}" ${c.enabled ? "checked" : ""}> ${esc(customLabel(c))}</label>
      <button type="button" class="linkish" data-act="del-custom" data-id="${esc(c.id)}">הסרה</button>
    </div>`).join("");
  const roleOpts = Object.entries(ROLE_LABEL).map(([id, label]) => `<option value="${id}">${label}</option>`).join("");
  const people = state.people.map((p) => `<option>${esc(p.name)}</option>`).join("");
  return `<h2>אילוצים</h2>${toggles}
    <h3>שנוספו</h3>${custom || `<p class="hint">אין אילוצים נוספים.</p>`}
    <form class="stack" data-form="custom">
      <label class="field">סוג
        <select name="type">
          <option value="never">אדם לא עושה תפקיד</option>
          <option value="after">אחרי תפקיד אין תפקיד למחרת</option>
          <option value="maxOnce">תפקיד פעם אחת בשבוע</option>
          <option value="dayWithout">ביום מסוים אין תפקיד</option>
          <option value="note">הערה לבדיקה ידנית</option>
        </select>
      </label>
      <label class="field">אדם<select name="person"><option value=""></option>${people}</select></label>
      <label class="field">תפקיד<select name="role">${roleOpts}</select></label>
      <label class="field">תפקיד למחרת<select name="role2">${roleOpts}</select></label>
      ${dayField()}
      <label class="field">הערה<input name="text" type="text"></label>
      <button class="primary" type="submit">הוספת אילוץ</button>
    </form>`;
}

function customLabel(c) {
  if (c.type === "note") return c.text || "הערה";
  if (c.type === "never") return `${c.person} לא עושה ${ROLE_LABEL[c.role]}`;
  if (c.type === "after") return `אחרי ${ROLE_LABEL[c.role]} אין ${ROLE_LABEL[c.role2]} למחרת`;
  if (c.type === "maxOnce") return `${ROLE_LABEL[c.role]} פעם אחת בשבוע`;
  if (c.type === "dayWithout") return `${DAYS[c.day]} בלי ${ROLE_LABEL[c.role]}`;
  return "אילוץ";
}

function taskPeople(task) {
  if (task.people?.length) return task.people.filter(Boolean);
  return task.person ? [task.person] : [];
}

function taskLabel(task) {
  const people = taskPeople(task);
  return people.length === state.people.length ? "כולם" : people.join(", ");
}

function tasksPanel() {
  const rows = state.tasks.map((task) => `
    <div class="rowline">${DAYS[task.day]} · ${esc(taskLabel(task))} · ${esc(task.title)}
      <span class="when" dir="ltr">${esc(task.start)}–${esc(task.end)}</span>
      <button type="button" class="remove" data-act="del-task" data-id="${esc(task.id)}">הסרה</button>
    </div>`).join("");
  const people = state.people.map((p) => `<label><input type="checkbox" name="people" value="${esc(p.name)}"> ${esc(p.name)}</label>`).join("");
  return `<h2>משימות מזדמנות</h2>
    <p class="hint">משימה חד-פעמית לשבוע הזה. ההסרה נמצאת ליד כל משימה, גם בשורת המשימות בלוח.</p>
    ${rows || `<p class="hint">אין משימות.</p>`}
    <form class="stack" data-form="task">
      <label class="field">שם המשימה<input name="title" type="text" required></label>
      ${dayField()}
      <div class="checks">
        <label><input type="checkbox" data-act="all-people"> כולם</label>
        ${people}
      </div>
      <label class="field">התחלה<input type="time" name="start" value="08:00" required></label>
      <label class="field">סיום<input type="time" name="end" value="12:00" required></label>
      <button class="primary" type="submit">הוספה</button>
    </form>`;
}

document.querySelector("#app").addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit]");
  if (edit) {
    ui.edit = edit.dataset.edit;
    ui.tab = "edit";
    render();
    return;
  }
  const tabBtn = event.target.closest("[data-tab]");
  if (tabBtn) {
    ui.tab = tabBtn.dataset.tab;
    render();
    return;
  }
  const act = event.target.closest("[data-act]");
  if (!act) return;
  const action = act.dataset.act;
  if (action === "set-cell") state.cells[ui.edit.split(":")[0]][Number(ui.edit.split(":")[1])] = act.dataset.pick;
  if (action === "set-pair-0" || action === "set-pair-1") {
    const [role, day] = ui.edit.split(":");
    const index = action.endsWith("0") ? 0 : 1;
    state.pairs[role][Number(day)][index] = act.dataset.pick;
  }
  if (action === "set-manager" || action === "set-med-a" || action === "set-med-b") {
    const day = Number(ui.edit.split(":")[1]);
    const key = action === "set-manager" ? "manager" : action === "set-med-a" ? "a" : "b";
    state.teams[day][key] = act.dataset.pick;
  }
  if (action === "del-guard") state.guards[Number(act.dataset.day)].splice(Number(act.dataset.index), 1);
  if (action === "clear-rasar") state.pairs.rasar[Number(act.dataset.day)] = ["", ""];
  if (action === "unavail") {
    const person = personByName(act.dataset.name);
    const day = Number(act.dataset.day);
    person.unavailable = person.unavailable.includes(day)
      ? person.unavailable.filter((item) => item !== day)
      : [...person.unavailable, day];
  }
  if (action === "del-person") {
    const name = act.dataset.name;
    state.people = state.people.filter((p) => p.name !== name);
    clearName(name);
  }
  if (action === "del-task") state.tasks = state.tasks.filter((task) => task.id !== act.dataset.id);
  if (action === "edit-weekly") {
    ui.weekEdit = act.dataset.id;
    render();
    return;
  }
  if (action === "del-weekly") {
    state.weeklies = state.weeklies.filter((row) => row.id !== act.dataset.id);
    if (ui.weekEdit === act.dataset.id) ui.weekEdit = "";
  }
  if (action === "del-custom") state.custom = state.custom.filter((row) => row.id !== act.dataset.id);
  if (action === "rule" || action === "flag" || action === "custom-on" || action === "week-day" || action === "all-people" || action === "weekly-person" || action === "weekly-task" || action === "need") return;
  save();
  render();
});

document.querySelector("#app").addEventListener("change", (event) => {
  if (event.target.dataset.act === "all-people") {
    const form = event.target.closest("form");
    form.querySelectorAll('input[name="people"]').forEach((box) => {
      box.checked = event.target.checked;
    });
    return;
  }
  if (event.target.name === "people") {
    const form = event.target.closest("form");
    const boxes = [...form.querySelectorAll('input[name="people"]')];
    const all = form.querySelector('[data-act="all-people"]');
    if (all) all.checked = boxes.every((box) => box.checked);
    return;
  }
  const act = event.target.closest("[data-act]");
  if (!act) return;
  if (act.dataset.act === "rule") state.rules[act.dataset.rule] = act.checked;
  if (act.dataset.act === "flag") personByName(act.dataset.name)[act.dataset.flag] = act.checked;
  if (act.dataset.act === "custom-on") state.custom.find((row) => row.id === act.dataset.id).enabled = act.checked;
  if (act.dataset.act === "weekly-person" || act.dataset.act === "weekly-task") {
    const row = state.weeklies.find((item) => item.id === act.dataset.id);
    if (row) row[act.dataset.act === "weekly-person" ? "person" : "task"] = act.value;
  }
  if (act.dataset.act === "week-day") state.weekDay = Number(act.value);
  if (act.dataset.act === "need") {
    state.need = state.need || { rangeAm: [false, false, false, false, false], rangePm: [false, false, false, false, false], rangeEve: [false, false, false, false, false] };
    state.need[act.dataset.key][Number(act.dataset.day)] = act.checked;
  }
  save();
  render();
});

document.querySelector("#app").addEventListener("submit", (event) => {
  const form = event.target.closest("form");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  if (form.dataset.form === "guard") {
    const day = form.dataset.day != null ? Number(form.dataset.day) : Number(data.get("day"));
    state.guards[day].push({ person: data.get("person"), start: data.get("start"), end: data.get("end") });
  }
  if (form.dataset.form === "rasar") {
    const day = Number(data.get("day"));
    const pair = state.pairs.rasar[day];
    if (!pair[0]) pair[0] = data.get("person");
    else if (!pair[1]) pair[1] = data.get("person");
    else pair[1] = data.get("person");
  }
  if (form.dataset.form === "person") {
    const name = String(data.get("name") || "").trim();
    if (!name || state.people.some((p) => p.name === name)) return;
    state.people.push({
      name,
      quals: data.getAll("qual"),
      boy: data.get("boy") === "on",
      neverYomi: false,
      neverWeekly: false,
      aidePriority: false,
      unavailable: [],
    });
  }
  if (form.dataset.form === "task") {
    const people = data.getAll("people");
    if (!people.length) return;
    state.tasks.push({
      id: uid(),
      title: String(data.get("title")).trim(),
      day: Number(data.get("day")),
      people,
      start: data.get("start"),
      end: data.get("end"),
    });
  }
  if (form.dataset.form === "weekly") {
    const id = uid();
    state.weeklies.push({
      id,
      group: data.get("group"),
      person: data.get("person"),
      task: String(data.get("task")).trim(),
    });
    ui.weekEdit = id;
  }
  if (form.dataset.form === "custom") {
    state.custom.push({
      id: uid(),
      type: data.get("type"),
      enabled: true,
      person: data.get("person"),
      role: data.get("role"),
      role2: data.get("role2"),
      day: Number(data.get("day")),
      text: String(data.get("text") || "").trim(),
    });
  }
  save();
  render();
});

function clearName(name) {
  for (const key of Object.keys(state.cells)) {
    state.cells[key] = state.cells[key].map((value) => (value === name ? "" : value));
  }
  for (const key of Object.keys(state.pairs)) {
    state.pairs[key] = state.pairs[key].map((pair) => pair.map((value) => (value === name ? "" : value)));
  }
  state.teams = state.teams.map((team) => ({
    manager: team.manager === name ? "" : team.manager,
    a: team.a === name ? "" : team.a,
    b: team.b === name ? "" : team.b,
  }));
  state.guards = state.guards.map((list) => list.filter((g) => g.person !== name));
  state.weeklies = state.weeklies.filter((row) => row.person !== name);
  state.tasks = state.tasks.flatMap((task) => {
    const people = taskPeople(task).filter((person) => person !== name);
    return people.length ? [{ ...task, people }] : [];
  });
}

document.querySelector("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "clinic-schedule.json";
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#import").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    state = normalize(JSON.parse(await file.text()));
    save();
    render();
  } catch {
    window.alert("הקובץ לא נקרא");
  }
});

document.querySelector("#reset").addEventListener("click", () => {
  state = blankState();
  save();
  render();
  status("הלוז ריק");
});

document.addEventListener("click", (event) => {
  if (event.target.closest("#generate")) runGenerate();
});

function runGenerate() {
  status("מייצר לוז…");
  setTimeout(() => {
    try {
      const next = generate(state);
      if (!next) {
        status("לא נמצא לוז בלי הפרות");
        return;
      }
      state = next;
      save();
      render();
      status("הלוז נוצר");
    } catch (error) {
      status(error.message || String(error));
    }
  }, 30);
}

render();
