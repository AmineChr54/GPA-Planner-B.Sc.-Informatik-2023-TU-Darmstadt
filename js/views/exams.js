/* ==========================================================================
   Prüfungen — dates with countdown, failed attempts, § 32 oral exam, Abwahl budget.
   ========================================================================== */
"use strict";

(() => {
  const { esc, t, fmt, pill, areaShort, groupName, icon, daysUntil, dateShort, semInfo } = UI;

  UI.views.exams = (c) => {
    const S = Store.get();
    const open = c.ms.filter((m) => m.status === "open" && !m.ungraded && !m.choice).sort((a, b) => (a.examDate || "9999").localeCompare(b.examDate || "9999") || (a.sem || 99) - (b.sem || 99));
    const upcoming = open.filter((m) => m.examDate && daysUntil(m.examDate) >= 0);
    const dropped = c.ms.filter((m) => m.status === "dropped");
    const budgets = Engine.abwahlAreas().map((x) => {
      const used = Engine.abwahlUsed(c.ms, x.key);
      return `<div class="budget a-${x.a} ${used ? "used" : ""}" style="--c:var(--a-${x.a})"><span>${esc(x.g ? groupName("B112", x.g) : areaShort("B111"))}</span><b>${used}/1</b></div>`;
    }).join("") + `<div class="budget free" style="--c:var(--a-B12)"><span>${areaShort("B12")}</span><b>∞</b></div><div class="budget free" style="--c:var(--a-B2)"><span>${areaShort("B2")}</span><b>∞</b></div>`;
    return `
      <div class="page-head"><div><h1>${t("exams.title")}</h1><p class="lede">${t("exams.lede")}</p></div></div>
      <section class="card"><h2>${t("exams.upcoming")}</h2>${upcoming.length ? `<ul class="upc">${upcoming.map((m) => { const d = daysUntil(m.examDate); return `<li><span class="date">${dateShort(m.examDate)}</span><span class="nm">${esc(m.name)}${(m.attempts || 0) >= 2 ? " " + pill("bad", t("att.last")) : m.attempts === 1 ? " " + pill("warn", t("att.second")) : ""}</span><span class="cd ${d <= 7 ? "soon" : ""}">${d === 0 ? t("today") : d === 1 ? t("tomorrow") : t("inDays", { n: d })}</span></li>`; }).join("")}</ul>` : `<p class="empty">${t("exams.noneYet")}</p>`}</section>
      <section class="card flush"><header class="card-h"><h2>${t("exams.all")}</h2><span class="sub">${t("exams.allSub")}</span></header>
        <div class="tscroll"><table class="tbl ex"><thead><tr><th>${t("col.module")}</th><th>${t("col.date")}</th><th>${t("col.attempt")}</th><th class="hide-s">${t("col.rule")}</th><th></th></tr></thead><tbody>
        ${open.map((m) => {
          const cd = Engine.canDrop(c.ms, m), att = m.attempts || 0;
          const rule = m.a === "A" || m.a === "C" ? t("rule.pflicht") : m.a === "B12" || m.a === "B2" ? t("rule.six") : cd.ok ? t("rule.five") : t("rule.fiveUsed");
          const d = m.examDate ? daysUntil(m.examDate) : null;
          return `<tr class="${att >= 2 ? "risk" : ""}"><td class="cell-name" style="border-left:4px solid var(--a-${m.a})"><button class="linklike mname" data-act="open" data-id="${m.id}">${esc(m.name)}</button><div class="meta"><span>${areaShort(m.a)}</span><span>${fmt(+m.cp, 0)} CP</span>${m.sem ? `<span>${esc(UI.semLabel(+m.sem))}</span>` : ""}</div></td>
            <td><input type="date" value="${esc(m.examDate || "")}" data-id="${m.id}" data-f="examDate" data-key="ed-${m.id}" aria-label="${t("col.date")}">${d != null ? `<div class="fine ${d >= 0 && d <= 7 ? "soon" : ""}">${d >= 0 ? (d === 0 ? t("today") : t("inDays", { n: d })) : t("daysAgo", { n: -d })}</div>` : ""}</td>
            <td><select data-id="${m.id}" data-f="attempts" data-key="at-${m.id}" class="${att >= 2 ? "risk" : att === 1 ? "warnsel" : ""}" aria-label="${t("col.attempt")}">${[0, 1, 2].map((k) => `<option value="${k}" ${att === k ? "selected" : ""}>${t("att.opt" + k)}</option>`).join("")}</select></td>
            <td class="hide-s fine">${rule}</td>
            <td>${cd.ok ? `<button class="btn sm ghost" data-act="drop" data-id="${m.id}">${t("btn.drop")}</button>` : ""}</td></tr>`;
        }).join("")}</tbody></table></div></section>
      <div class="grid2">
        <section class="card"><h2>${t("oral.title")}</h2><p class="fine" style="margin-top:-6px">${t("oral.text")}</p>
          <label class="switch"><input type="checkbox" data-act-change="oral" data-key="oral" ${S.oral ? "checked" : ""}><span>${S.oral ? t("oral.used") : t("oral.free")}</span></label>
          ${S.oral ? `<input type="text" class="wide" placeholder="${t("oral.which")}" value="${esc(S.oral.module || "")}" data-act-change="oralWhich" data-key="oralw">` : ""}</section>
        <section class="card"><h2>${t("abwahl.title")}</h2><p class="fine" style="margin-top:-6px">${t("abwahl.text")}</p><div class="budgets">${budgets}</div></section>
      </div>
      ${dropped.length ? `<section class="card"><h2>${t("dropped.title")}</h2><ul class="hints">${dropped.map((m) => `<li class="hint info"><span class="hdot"></span><span class="htxt">${esc(m.name)} · ${areaShort(m.a)}${m.g ? " · " + esc(groupName(m.a, m.g)) : ""}</span><button class="btn sm" data-act="undrop" data-id="${m.id}">${t("btn.undrop")}</button></li>`).join("")}</ul></section>` : ""}`;
  };
})();
