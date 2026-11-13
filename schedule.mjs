export const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];

export const ROLE_LABEL = {
  konan: "כונן",
  aide: "ע׳ כונן",
  rangeAm: "מטווחים בוקר",
  rangePm: "מטווחים צהריים",
  rangeEve: "מטווחים ערב",
  night: "כונן לילה",
  kiryot: "קריות",
  driver: "נהג",
  yomi054: "יומית 054",
  yomi224: "יומית 224",
  guard: "שמירה",
  rasar: "רס״ר",
  team: "כוננות",
  weekly: "שבועית",
  task: "משימה",
};

export const QUALS = [
  ["konan", "כונן"],
  ["aide", "ע׳ כונן"],
  ["ranges", "מטווחים"],
  ["kiryot", "קריות"],
  ["rasar", "רס״ר"],
  ["guards", "שמירות"],
  ["driver", "נהג"],
  ["manager", "מנהל אירוע"],
];

const QUAL_FOR = {
  konan: "konan",
  aide: "aide",
  rangeAm: "ranges",
  rangePm: "ranges",
  rangeEve: "ranges",
  night: "konan",
  kiryot: "kiryot",
  driver: "driver",
  guard: "guards",
  rasar: "rasar",
};

export const RULES = [
  ["overlap", "בלי חפיפה לאותו אדם"],
  ["exclusive", "רס״ר וקריות תופסים את כל היום"],
  ["sleep", "אחרי כונן לילה או שמירת 00–08 אין משימה לפני 12:00"],
  ["kiryotOnce", "קריות פעם אחת בשבוע, אלא אם אין ברירה"],
  ["afterKiryotNoDay", "אחרי קריות אין כונן יום למחרת"],
  ["nightBoys", "כונן לילה: בנים קודם", true],
  ["quals", "רק מי שכשיר נכנס לתפקיד"],
  ["unavailable", "מי שלא זמין לא משובץ"],
  ["noYomiWeeklyDay", "ביום שבועיות אין יומיות"],
  ["neverYomi", "מי שסומן לא עושה יומיות"],
  ["neverWeekly", "מי שסומן לא עושה שבועיות"],
  ["aidePriority", "עדיפות לע׳ כונן למי שסומן", true],
  ["weekly084", "084 על מי שבמטווחי הבוקר ביום השבועיות", true],
];

const CELL_KEYS = ["konan", "aide", "rangeAm", "rangePm", "rangeEve", "night", "kiryot", "driver"];

function person(name, quals, extra = {}) {
  return {
    name,
    quals,
    boy: false,
    neverYomi: false,
    neverWeekly: false,
    aidePriority: false,
    unavailable: [],
    ...extra,
  };
}

function five(fill) {
  return Array.from({ length: 5 }, (_, i) => (typeof fill === "function" ? fill(i) : fill));
}

export function seed() {
  const all = [0, 1, 2, 3, 4];
  return {
    people: [
      person("יהלי", ["aide", "ranges", "rasar", "guards"], { aidePriority: true }),
      person("אביגייל", ["aide", "ranges", "rasar", "guards"]),
      person("עפרי", ["konan", "ranges", "guards"]),
      person("רוני", ["konan", "ranges", "rasar", "guards"], { unavailable: all }),
      person("נעמי", ["konan", "aide", "rasar", "guards"]),
      person("רעות", ["konan", "ranges", "rasar", "guards"]),
      person("ברנר", ["kiryot", "aide", "ranges", "konan", "rasar", "guards"], { boy: true }),
      person("לירוי", ["kiryot", "ranges", "rasar", "guards"], { boy: true, unavailable: all }),
      person("בן", ["kiryot", "konan", "aide", "rasar", "guards"], { boy: true }),
      person("שון", ["kiryot", "konan", "aide", "rasar", "guards"], { boy: true }),
      person("נדב", ["driver", "guards"], { boy: true, neverYomi: true }),
      person("ליהי", ["manager"], { neverYomi: true }),
      person("איה", ["manager", "ranges", "aide", "rasar", "guards"]),
      person("מזרחי", ["manager"], { boy: true, neverYomi: true }),
      person("אריאל", ["kiryot", "ranges", "rasar", "guards"], { boy: true }),
      person("עדי", ["manager", "ranges", "guards", "driver", "rasar"]),
      person("הראל", ["kiryot", "aide", "rasar", "guards"], { boy: true }),
      person("פולינה", ["konan", "aide", "ranges", "rasar", "guards"]),
      person("ליה", ["rasar", "guards"], { neverWeekly: true }),
      person("נועה כהן", ["rasar", "guards"], { neverWeekly: true }),
      person("אלון", ["rasar"], { boy: true }),
    ],
    weekDay: 3,
    cells: {
      konan: ["עפרי", "רעות", "נעמי", "פולינה", "בן"],
      aide: ["יהלי", "יהלי", "יהלי", "יהלי", "אביגייל"],
      rangeAm: ["", "", "", "אביגייל", "עפרי"],
      rangePm: ["", "", "", "עפרי", ""],
      rangeEve: ["", "", "", "עדי", ""],
      night: ["בן", "ברנר", "שון", "ברנר", ""],
      kiryot: ["שון", "הראל", "בן", "אריאל", ""],
      driver: ["נדב", "נדב", "נדב", "נדב", "עדי"],
    },
    pairs: {
      yomi054: [["עפרי", "איה"], ["אביגייל", "נעמי"], ["אביגייל", "רעות"], ["", ""], ["עפרי", "רעות"]],
      yomi224: [["אביגייל", "רעות"], ["רעות", "עפרי"], ["פולינה", "איה"], ["", ""], ["איה", "פולינה"]],
      rasar: [["ברנר", "אלון"], ["שון", ""], ["עדי", ""], ["בן", "נועה כהן"], ["נעמי", "יהלי"]],
    },
    teams: [
      { manager: "ליהי", a: "יהלי", b: "איה" },
      { manager: "מזרחי", a: "יהלי", b: "איה" },
      { manager: "ליהי", a: "יהלי", b: "הראל" },
      { manager: "מזרחי", a: "יהלי", b: "הראל" },
      { manager: "ליהי", a: "אביגייל", b: "איה" },
    ],
    guards: [
      [],
      [
        { person: "אביגייל", start: "12:00", end: "16:00" },
        { person: "בן", start: "16:00", end: "20:00" },
      ],
      [{ person: "עפרי", start: "12:00", end: "16:00" }],
      [{ person: "ליה", start: "12:00", end: "16:00" }],
      [{ person: "נדב", start: "04:00", end: "08:00" }],
    ],
    weeklies: [
      { id: "w1", group: "224", person: "רעות", task: "ווסט מטב" },
      { id: "w2", group: "224", person: "עדי", task: "ארן + מנ״א + חמצנים" },
      { id: "w3", group: "224", person: "נעמי", task: "חובשים + משקי, קלסרים, פלזמה, קשר" },
      { id: "w4", group: "224", person: "יהלי", task: "תאים + מכשירים" },
      { id: "w5", group: "084", person: "אביגייל", task: "וסט חובש + תכולת אמבולנס" },
      { id: "w6", group: "054", person: "ליהי", task: "ווסט מטב" },
      { id: "w7", group: "054", person: "הראל", task: "ארן + מנ״א + חמצנים" },
      { id: "w8", group: "054", person: "מזרחי", task: "חובשים + משקי, קלסרים, פלזמה, קשר" },
      { id: "w9", group: "054", person: "איה", task: "תאים + מכשירים" },
      { id: "w10", group: "מחסן", person: "עפרי", task: "וסט רופא 3" },
      { id: "w11", group: "מחסן", person: "נדב", task: "וסט רופא 4" },
      { id: "w12", group: "מחסן", person: "אלון", task: "וסטי חובשים (3)" },
    ],
    tasks: [],
    rules: Object.fromEntries(RULES.map(([id]) => [id, true])),
    custom: [
      { id: "c-thu-kir", type: "dayWithout", day: 4, role: "kiryot", enabled: true, text: "" },
      { id: "c-thu-night", type: "dayWithout", day: 4, role: "night", enabled: true, text: "" },
    ],
  };
}

export function blankState() {
  const base = seed();
  base.people.forEach((p) => {
    p.unavailable = [];
  });
  for (const key of CELL_KEYS) base.cells[key] = five("");
  base.pairs.yomi054 = five(() => ["", ""]);
  base.pairs.yomi224 = five(() => ["", ""]);
  base.pairs.rasar = five(() => ["", ""]);
  base.teams = five(() => ({ manager: "", a: "", b: "" }));
  base.guards = five(() => []);
  base.weeklies = [];
  base.tasks = [];
  return base;
}

function hm(value) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || ""));
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59 || h > 24) return null;
  if (h === 24) return min === 0 ? 24 * 60 : null;
  return h * 60 + min;
}

function names(list) {
  return (list || []).map((n) => String(n || "").trim()).filter(Boolean);
}

function taskPeople(task) {
  if (task.people?.length) return names(task.people);
  return task.person ? [task.person] : [];
}

function findPerson(state, name) {
  return state.people.find((p) => p.name === name);
}

function hasRole(state, name, role, day) {
  if (!name) return false;
  if (CELL_KEYS.includes(role)) return state.cells[role][day] === name;
  if (role === "yomi054" || role === "yomi224" || role === "rasar") return names(state.pairs[role][day]).includes(name);
  if (role === "guard") return state.guards[day].some((g) => g.person === name);
  if (role === "team") {
    const t = state.teams[day];
    return t.manager === name || t.a === name || t.b === name;
  }
  if (role === "weekly") return day === state.weekDay && state.weeklies.some((w) => w.person === name);
  if (role === "task") return state.tasks.some((t) => t.day === day && taskPeople(t).includes(name));
  return false;
}

function intervals(state) {
  const list = [];
  const push = (person, day, a, b, role) => {
    if (!person || b <= a) return;
    list.push({ person, day, start: day * 1440 + a, end: day * 1440 + b, role });
  };
  for (let d = 0; d < 5; d++) {
    push(state.cells.konan[d], d, 8 * 60, 18 * 60, "konan");
    push(state.cells.aide[d], d, 9 * 60, 18 * 60, "aide");
    push(state.cells.rangeAm[d], d, 6 * 60, 12 * 60, "rangeAm");
    push(state.cells.rangePm[d], d, 12 * 60, 18 * 60, "rangePm");
    push(state.cells.rangeEve[d], d, 18 * 60, 24 * 60, "rangeEve");
    const night = state.cells.night[d];
    if (night) {
      list.push({ person: night, day: d, start: d * 1440 + 18 * 60, end: d * 1440 + 24 * 60, role: "night" });
      list.push({ person: night, day: d + 1, start: (d + 1) * 1440, end: (d + 1) * 1440 + 8 * 60, role: "night" });
    }
    push(state.cells.kiryot[d], d, 0, 24 * 60, "kiryot");
    push(state.cells.driver[d], d, 8 * 60, 18 * 60, "driver");
    for (const name of names(state.pairs.rasar[d])) push(name, d, 0, 24 * 60, "rasar");
    const team = state.teams[d];
    for (const name of names([team.manager, team.a, team.b])) push(name, d, 8 * 60, 18 * 60, "team");
    for (const g of state.guards[d]) {
      const a = hm(g.start);
      const b = hm(g.end);
      if (a == null || b == null) continue;
      push(g.person, d, a, b, "guard");
    }
    for (const t of state.tasks) {
      if (t.day !== d) continue;
      const a = hm(t.start);
      const b = hm(t.end);
      if (a == null || b == null) continue;
      for (const person of taskPeople(t)) push(person, d, a, b, "task");
    }
  }
  return list;
}

function allowedOverlap(a, b) {
  const key = [a, b].sort().join("+");
  return key === "aide+team" || key === "driver+guard";
}

function dayName(day) {
  return DAYS[day] || "היום שאחרי";
}

export function audit(state) {
  const out = [];
  const err = (text) => out.push({ level: "error", text });
  const warn = (text) => out.push({ level: "warn", text });
  const rules = state.rules || {};
  const ivs = intervals(state);

  if (rules.overlap) {
    const by = new Map();
    for (const iv of ivs) {
      if (!by.has(iv.person)) by.set(iv.person, []);
      by.get(iv.person).push(iv);
    }
    for (const [name, slots] of by) {
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const a = slots[i];
          const b = slots[j];
          if (a.end <= b.start || b.end <= a.start) continue;
          if (a.role === "kiryot" || a.role === "rasar" || b.role === "kiryot" || b.role === "rasar") continue;
          if (allowedOverlap(a.role, b.role)) continue;
          const day = Math.min(a.day, b.day);
          err(`${name} בחפיפה ב${dayName(day)}: ${ROLE_LABEL[a.role]} ו${ROLE_LABEL[b.role]}`);
        }
      }
    }
  }

  if (rules.exclusive) {
    for (let d = 0; d < 5; d++) {
      const blocked = new Map();
      if (state.cells.kiryot[d]) blocked.set(state.cells.kiryot[d], "kiryot");
      for (const name of names(state.pairs.rasar[d])) blocked.set(name, blocked.get(name) || "rasar");
      for (const [name, role] of blocked) {
        const others = ivs.filter((iv) => iv.person === name && iv.day === d && iv.role !== role);
        const extra = new Set(others.map((iv) => ROLE_LABEL[iv.role]));
        for (const y of ["yomi054", "yomi224"]) {
          if (names(state.pairs[y][d]).includes(name)) extra.add(ROLE_LABEL[y]);
        }
        if (d === state.weekDay && state.weeklies.some((w) => w.person === name)) extra.add("שבועית");
        if (extra.size) err(`${name} על ${ROLE_LABEL[role]} ב${DAYS[d]} וגם ${[...extra].join(", ")}`);
      }
    }
  }

  if (rules.sleep) {
    const blocks = [];
    for (let d = 0; d < 5; d++) {
      if (state.cells.night[d]) blocks.push({ person: state.cells.night[d], day: d + 1, until: 12 * 60 });
      for (const g of state.guards[d]) {
        const a = hm(g.start);
        const b = hm(g.end);
        if (g.person && a != null && b != null && a < 8 * 60 && b <= 8 * 60) blocks.push({ person: g.person, day: d, until: 12 * 60 });
      }
    }
    for (const block of blocks) {
      if (block.day > 4) continue;
      for (const iv of ivs) {
        if (iv.person !== block.person || iv.day !== block.day) continue;
        if (iv.role === "night") continue;
        if (iv.role === "guard" && iv.start % 1440 < 8 * 60 && iv.end % 1440 <= 8 * 60) continue;
        if (iv.start % 1440 < block.until) err(`${block.person} בשעות שינה ב${dayName(block.day)} על ${ROLE_LABEL[iv.role]}`);
      }
      for (const y of ["yomi054", "yomi224"]) {
        if (names(state.pairs[y][block.day] || []).includes(block.person)) err(`${block.person} בשעות שינה ב${dayName(block.day)} על ${ROLE_LABEL[y]}`);
      }
      if (block.day === state.weekDay && state.weeklies.some((w) => w.person === block.person)) {
        err(`${block.person} בשעות שינה ב${dayName(block.day)} על שבועית`);
      }
    }
  }

  if (rules.kiryotOnce) {
    const count = new Map();
    for (const name of state.cells.kiryot) if (name) count.set(name, (count.get(name) || 0) + 1);
    for (const [name, n] of count) if (n > 1) err(`${name} על קריות ${n} פעמים השבוע`);
  }

  if (rules.afterKiryotNoDay) {
    for (let d = 0; d < 4; d++) {
      const name = state.cells.kiryot[d];
      if (name && state.cells.konan[d + 1] === name) err(`${name} על קריות ב${DAYS[d]} וכונן יום ב${DAYS[d + 1]}`);
    }
  }

  if (rules.noYomiWeeklyDay) {
    const d = state.weekDay;
    const filled = names(state.pairs.yomi054[d]).concat(names(state.pairs.yomi224[d]));
    if (filled.length) err(`יש יומיות ב${DAYS[d]}, יום השבועיות`);
  }

  const checkPerson = (name, role, day) => {
    if (!name) return;
    const p = findPerson(state, name);
    if (!p) {
      err(`${name} לא ברשימת האנשים`);
      return;
    }
    if (rules.unavailable && p.unavailable.includes(day)) err(`${name} לא זמין/ה ב${DAYS[day]} ומשובץ/ת ל${ROLE_LABEL[role]}`);
    const qual = role === "team" ? null : QUAL_FOR[role];
    if (rules.quals && qual && !p.quals.includes(qual)) err(`${name} לא כשיר/ה ל${ROLE_LABEL[role]}`);
    if (rules.neverYomi && p.neverYomi && (role === "yomi054" || role === "yomi224")) err(`${name} לא עושה יומיות`);
    if (rules.neverWeekly && p.neverWeekly && role === "weekly") err(`${name} לא עושה שבועיות`);
  };

  for (let d = 0; d < 5; d++) {
    for (const key of CELL_KEYS) checkPerson(state.cells[key][d], key, d);
    for (const key of ["yomi054", "yomi224", "rasar"]) {
      const pair = names(state.pairs[key][d]);
      if (pair[0] && pair[0] === pair[1]) err(`${pair[0]} פעמיים ב${ROLE_LABEL[key]} ב${DAYS[d]}`);
      for (const name of pair) checkPerson(name, key, d);
    }
    const team = state.teams[d];
    const crew = names([team.manager, team.a, team.b]);
    if (new Set(crew).size !== crew.length) err(`אותו אדם פעמיים בכוננות ב${DAYS[d]}`);
    if (rules.quals && team.manager) {
      const mgr = findPerson(state, team.manager);
      if (mgr && !mgr.quals.includes("manager")) err(`${team.manager} לא כשיר/ה למנהל אירוע`);
    }
    checkPerson(team.manager, "team", d);
    checkPerson(team.a, "team", d);
    checkPerson(team.b, "team", d);
    for (const g of state.guards[d]) {
      const a = hm(g.start);
      const b = hm(g.end);
      if (g.person && (a == null || b == null || b <= a)) err(`שמירה לא תקינה ב${DAYS[d]}`);
      checkPerson(g.person, "guard", d);
    }
    if (d === state.weekDay) for (const w of state.weeklies) checkPerson(w.person, "weekly", d);
    for (const t of state.tasks) if (t.day === d) for (const person of taskPeople(t)) checkPerson(person, "task", d);
  }

  if (rules.nightBoys) {
    for (let d = 0; d < 5; d++) {
      const name = state.cells.night[d];
      if (!name) continue;
      const current = findPerson(state, name);
      if (current?.boy && current.quals.includes("konan")) continue;
      const free = state.people.filter((p) => p.boy && p.quals.includes("konan") && p.name !== name && freeForNight(state, p.name, d, ivs));
      if (free.length) warn(`${DAYS[d]}: כונן לילה הוא ${name}. בנים פנויים: ${free.map((p) => p.name).join(", ")}`);
    }
  }

  if (rules.aidePriority) {
    for (let d = 0; d < 5; d++) {
      const current = state.cells.aide[d];
      for (const p of state.people) {
        if (!p.aidePriority || p.name === current || !p.quals.includes("aide")) continue;
        if (p.unavailable.includes(d)) continue;
        if (state.cells.kiryot[d] === p.name || names(state.pairs.rasar[d]).includes(p.name)) continue;
        const hit = ivs.some((iv) => iv.person === p.name && iv.day === d && iv.role !== "aide" && iv.start < d * 1440 + 18 * 60 && iv.end > d * 1440 + 9 * 60);
        if (!hit) warn(`${DAYS[d]}: ע׳ כונן הוא ${current || "ריק"}, ו${p.name} פנוי/ה בעדיפות`);
      }
    }
  }

  if (rules.weekly084) {
    const morning = state.cells.rangeAm[state.weekDay];
    const row = state.weeklies.find((w) => w.group === "084" && w.person);
    if (morning && row && row.person !== morning) warn(`084 על ${row.person}, ומטווחי הבוקר ב${DAYS[state.weekDay]} על ${morning}`);
    if (morning && !row) warn(`אין 084 ל${morning}, שנמצא/ת במטווחי הבוקר`);
  }

  for (const c of state.custom || []) {
    if (!c.enabled || c.type === "note") continue;
    if (c.type === "never" && c.person && c.role) {
      for (let d = 0; d < 5; d++) if (hasRole(state, c.person, c.role, d)) err(`${c.person} על ${ROLE_LABEL[c.role]} ב${DAYS[d]}, בניגוד לאילוץ`);
    }
    if (c.type === "after" && c.role && c.role2) {
      for (let d = 0; d < 4; d++) {
        const people = new Set(ivs.filter((iv) => iv.day === d && iv.role === c.role).map((iv) => iv.person));
        for (const y of ["yomi054", "yomi224", "rasar"]) if (c.role === y) names(state.pairs[y][d]).forEach((n) => people.add(n));
        if (c.role === "weekly" && d === state.weekDay) state.weeklies.forEach((w) => people.add(w.person));
        for (const name of people) if (name && hasRole(state, name, c.role2, d + 1)) err(`${name}: ${ROLE_LABEL[c.role]} ב${DAYS[d]} ואז ${ROLE_LABEL[c.role2]} ב${DAYS[d + 1]}`);
      }
    }
    if (c.type === "maxOnce" && c.role) {
      const count = new Map();
      for (let d = 0; d < 5; d++) {
        const who = new Set();
        if (CELL_KEYS.includes(c.role) && state.cells[c.role][d]) who.add(state.cells[c.role][d]);
        if (state.pairs[c.role]) names(state.pairs[c.role][d]).forEach((n) => who.add(n));
        if (c.role === "guard") state.guards[d].forEach((g) => g.person && who.add(g.person));
        if (c.role === "team") names([state.teams[d].manager, state.teams[d].a, state.teams[d].b]).forEach((n) => who.add(n));
        for (const name of who) count.set(name, (count.get(name) || 0) + 1);
      }
      for (const [name, n] of count) if (n > 1) err(`${name} על ${ROLE_LABEL[c.role]} ${n} פעמים, בניגוד לאילוץ`);
    }
    if (c.type === "dayWithout" && c.role != null && c.day != null) {
      const d = Number(c.day);
      let filled = false;
      if (CELL_KEYS.includes(c.role)) filled = Boolean(state.cells[c.role][d]);
      else if (state.pairs[c.role]) filled = names(state.pairs[c.role][d]).length > 0;
      else if (c.role === "guard") filled = state.guards[d].some((g) => g.person);
      else if (c.role === "team") filled = names([state.teams[d].manager, state.teams[d].a, state.teams[d].b]).length > 0;
      if (filled) err(`${ROLE_LABEL[c.role]} משובץ ב${DAYS[d]}, והאילוץ אוסר את זה`);
    }
  }

  const seen = new Set();
  return out.filter((item) => {
    if (seen.has(item.text)) return false;
    seen.add(item.text);
    return true;
  });
}

function freeForNight(state, name, day, ivs) {
  const p = findPerson(state, name);
  if (!p || p.unavailable.includes(day)) return false;
  if (state.cells.kiryot[day] === name || names(state.pairs.rasar[day]).includes(name)) return false;
  const start = day * 1440 + 18 * 60;
  const end = (day + 1) * 1440 + 8 * 60;
  if (ivs.some((iv) => iv.person === name && iv.start < end && start < iv.end)) return false;
  if (day < 4 && (state.cells.kiryot[day + 1] === name || names(state.pairs.rasar[day + 1]).includes(name))) return false;
  return true;
}

const isDirect = typeof process !== "undefined" && process.argv?.[1]?.endsWith("schedule.mjs");
if (isDirect) {
  const issues = audit(seed());
  const errors = issues.filter((item) => item.level === "error");
  if (errors.length) {
    console.log(errors);
    process.exit(1);
  }
  const several = seed();
  several.tasks.push({ id: "t", title: "בדיקה", day: 0, people: ["עפרי", "יהלי"], start: "08:00", end: "12:00" });
  const hits = audit(several).filter((item) => item.level === "error" && (item.text.includes("עפרי") || item.text.includes("יהלי")));
  if (hits.length < 2) {
    console.log(hits);
    process.exit(1);
  }
  console.log(`seed ok, warnings ${issues.length}`);
}
