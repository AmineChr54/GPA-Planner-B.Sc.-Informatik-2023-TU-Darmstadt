/* ==========================================================================
   Lernfortschritt Tracker — Track Folien, Übungen & Altklausuren per module.
   Direct count inputs with +/- steppers, binary checkmarks, dynamic
   Altklausuren / Gedächtnisprotokolle, and calendar sync.
   ========================================================================== */
"use strict";

(() => {
  const { $, $$, esc, t, fmt, icon, state } = UI;

  if (!state.trackerSem) state.trackerSem = "current";

  function renderTrackerHeader(c) {
    const sems = Store.get().sems || [];
    const curSem = state.trackerSem;

    return `
      <div class="cal-top-bar tracker-top-bar">
        <div class="tracker-title-group">
          <h2>📊 ${t("tracker.title") || "Lernfortschritt"}</h2>
          <span class="fine">${t("tracker.sub") || "Übungsblätter, Folien und Altklausuren abhaken"}</span>
        </div>
        <div class="cal-top-actions">
          <label class="tracker-sem-select-label">
            
            <select class="tracker-sem-select" data-act="setTrackerSem">
              <option value="current" ${curSem !== "all" ? "selected" : ""}>${t("tracker.curSem")}</option>
              <option value="all" ${curSem === "all" ? "selected" : ""}>${t("tracker.allSem")}</option>
            </select>
          </label>
          <button class="btn sm" data-act="addCustomTopicModal">${icon("plus")}${t("tracker.addCustom") || "Freies Thema"}</button>
          <div class="seg-ctrl" role="tablist">
            <button class="seg-btn" data-act="setExamsMode" data-v="calendar" title="Kalender">📅 ${t("cal.tabCal") || "Kalender"}</button>
            <button class="seg-btn active" data-act="setExamsMode" data-v="tracker" title="Lernfortschritt">📊 ${t("cal.tabTracker") || "Lernfortschritt"}</button>
            <button class="seg-btn" data-act="setExamsMode" data-v="timeline" title="Timeline">📋 ${t("cal.tabTimeline") || "Timeline"}</button>
          </div>
        </div>
      </div>
    `;
  }

  /* Render progress card for a single module */
  function renderModuleCard(m, tr) {
    const folienCount = tr.folienCount || 0;
    const folienDone = new Set(tr.folienDone || []);
    const uebungenCount = tr.uebungenCount || 0;
    const uebungenDone = new Set(tr.uebungenDone || []);
    const altklausuren = tr.altklausuren || [];
    const akDoneCount = altklausuren.filter((a) => a.done).length;

    const totalItems = folienCount + uebungenCount + altklausuren.length;
    const totalDone = folienDone.size + uebungenDone.size + akDoneCount;
    const pct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

    // Folien bubbles
    const folienBubbles = [];
    for (let i = 1; i <= folienCount; i++) {
      const isDone = folienDone.has(i);
      folienBubbles.push(`
        <button class="trk-bubble ${isDone ? "done" : ""}" data-act="toggleTrk" data-id="${m.id}" data-type="folien" data-num="${i}" title="Vorlesung / Folie ${i}: ${isDone ? "Erledigt" : "Offen"}">
          ${isDone ? "✓" : i}
        </button>
      `);
    }

    // Übungen bubbles
    const uebungenBubbles = [];
    for (let i = 1; i <= uebungenCount; i++) {
      const isDone = uebungenDone.has(i);
      const label = `Ü${String(i).padStart(2, "0")}`;
      uebungenBubbles.push(`
        <button class="trk-bubble uebung ${isDone ? "done" : ""}" data-act="toggleTrk" data-id="${m.id}" data-type="uebungen" data-num="${i}" title="Übungsblatt ${i}: ${isDone ? "Erledigt" : "Offen"}">
          ${isDone ? "✓" : label}
        </button>
      `);
    }

    // Altklausuren list
    const akList = altklausuren.map((ak) => `
      <li class="trk-ak-item ${ak.done ? "done" : ""}">
        <label class="trk-ak-label">
          <input type="checkbox" data-act-change="toggleAk" data-id="${m.id}" data-akid="${ak.id}" ${ak.done ? "checked" : ""}>
          <span>${esc(ak.name)}</span>
        </label>
        <button class="icon-btn xs trk-ak-del" data-act="delAk" data-id="${m.id}" data-akid="${ak.id}" title="Löschen">${icon("x")}</button>
      </li>
    `).join("");

    const isCustom = m.isCustom;
    const areaCls = isCustom ? "a-B2" : `a-${m.a || "A"}`;

    return `
      <section class="card trk-card ${areaCls}">
        <div class="trk-card-head">
          <div class="trk-title-wrap">
            <span class="swatch" style="background:var(--${areaCls}, #2470ad)"></span>
            <div>
              <h3 class="trk-mod-name">${esc(m.name)}</h3>
              <div class="meta">
                ${m.code ? `<span class="mono">${esc(m.code)}</span> · ` : ""}${m.cp ? `<span>${fmt(+m.cp, 0)} CP</span> · ` : ""}${m.sem ? `<span>${UI.semLabel(+m.sem)}</span>` : ""}
                ${isCustom ? `<span class="chip">Freies Thema</span> <button class="linklike muted" data-act="delCustomTopic" data-id="${m.id}">[Entfernen]</button>` : ""}
              </div>
            </div>
          </div>
          <div class="trk-pct-badge ${pct === 100 ? "complete" : ""}">
            <b>${pct}%</b>
            <span class="fine">${totalDone}/${totalItems}</span>
          </div>
        </div>

        <div class="trk-progress-bar-wrap">
          <div class="trk-progress-bar" style="width:${pct}%"></div>
        </div>

        <!-- Folien Section -->
        <div class="trk-section">
          <div class="trk-sec-h">
            <span>📑 <b>${t("tracker.folien") || "Vorlesungen / Folien"}</b> (${folienDone.size}/${folienCount})</span>
            <div class="trk-stepper">
              <button class="trk-step-btn" data-act="stepTrk" data-id="${m.id}" data-type="folien" data-dir="-1" title="Weniger">−</button>
              <input type="number" class="trk-count-input" value="${folienCount}" min="0" max="60" data-act-change="setTrkCount" data-id="${m.id}" data-type="folien">
              <button class="trk-step-btn" data-act="stepTrk" data-id="${m.id}" data-type="folien" data-dir="1" title="Mehr">+</button>
            </div>
          </div>
          <div class="trk-bubbles-grid">
            ${folienBubbles.length ? folienBubbles.join("") : `<span class="fine muted">${t("tracker.noneConfigured") || "Keine Einheiten eingetragen (Zahl oben anpassen)"}</span>`}
          </div>
        </div>

        <!-- Übungen Section -->
        <div class="trk-section">
          <div class="trk-sec-h">
            <span>✏️ <b>${t("tracker.uebungen") || "Übungsblätter"}</b> (${uebungenDone.size}/${uebungenCount})</span>
            <div class="trk-stepper">
              <button class="trk-step-btn" data-act="stepTrk" data-id="${m.id}" data-type="uebungen" data-dir="-1" title="Weniger">−</button>
              <input type="number" class="trk-count-input" value="${uebungenCount}" min="0" max="60" data-act-change="setTrkCount" data-id="${m.id}" data-type="uebungen">
              <button class="trk-step-btn" data-act="stepTrk" data-id="${m.id}" data-type="uebungen" data-dir="1" title="Mehr">+</button>
            </div>
          </div>
          <div class="trk-bubbles-grid">
            ${uebungenBubbles.length ? uebungenBubbles.join("") : `<span class="fine muted">${t("tracker.noneConfigured") || "Keine Blätter eingetragen (Zahl oben anpassen)"}</span>`}
          </div>
        </div>

        <!-- Altklausuren Section -->
        <div class="trk-section trk-ak-sec">
          <div class="trk-sec-h">
            <span>📝 <b>${t("tracker.altklausuren") || "Altklausuren & Gedächtnisprotokolle"}</b> (${akDoneCount}/${altklausuren.length})</span>
            <button class="btn xs ghost" data-act="addAkModal" data-id="${m.id}">${icon("plus")}${t("tracker.addAk") || "Altklausur"}</button>
          </div>
          ${altklausuren.length ? `<ul class="trk-ak-list">${akList}</ul>` : `<p class="fine muted" style="margin:4px 0 0">${t("tracker.noAkYet") || "Noch keine Altklausuren hinzugefügt (z. B. aus Discord oder Fachschaft)."}</p>`}
        </div>
      </section>
    `;
  }

  /* Main Tracker View HTML */
  UI.renderTracker = (c) => {
    const S = Store.get();
    const curSem = state.trackerSem;

    const open = c.ms.filter((m) => m.status === "open" && !m.ungraded && !m.choice);
    // "current" = the exams of this term: a date in the exam list / own date, or planned for the current semester
    const curTerm = UI.termOrd(ExamDates.get() && ExamDates.get().term ? ExamDates.get().term : "");
    const isCurrent = (m) => {
      const ex = UI.examOf(m);
      if (ex && ex.date) return true;
      return !!m.sem && UI.termOrd(UI.semInfo(+m.sem).term.label) === curTerm;
    };
    const targetMods = curSem === "all" ? open : open.filter(isCurrent);

    // Include custom topics from tracker
    const customTopics = (S.customTrackerTopics || []).map((t) => ({
      id: t.id,
      name: t.name,
      cp: t.cp || 0,
      isCustom: true,
      status: "open",
    }));

    const allCards = [...targetMods, ...customTopics];

    return `
      <div class="card flush cal-card">
        ${renderTrackerHeader(c)}
        <div class="trk-container">
          ${allCards.length ? allCards.map((m) => {
            const tr = Store.getTracker(m.id);
            return renderModuleCard(m, tr);
          }).join("") : `<div class="empty card"><p>${t("tracker.noModules") || "Keine Module für diese Auswahl gefunden."}</p></div>`}
        </div>
      </div>
    `;
  };

  /* Small styled dialog asking for one name (replaces the browser prompt()) */
  function askName({ title, label, hint, placeholder, sub, onOk }) {
    UI.dialog(title, `
      <form id="ask-form" class="modal-form">
        ${sub ? `<p class="fine" style="margin:0">${esc(sub)}</p>` : ""}
        <label><b>${esc(label)}</b>
          <input type="text" id="ask-name" required autofocus maxlength="80" placeholder="${esc(placeholder)}">
        </label>
        <p class="fine" style="margin:0">${esc(hint)}</p>
        <div class="modal-foot">
          <button type="button" class="btn" data-act="close">${t("btn.cancel")}</button>
          <button type="submit" class="btn primary">${t("btn.save")}</button>
        </div>
      </form>`);
    $("#ask-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = $("#ask-name").value.trim();
      if (!v) return;
      UI.closeModal();
      onOk(v);
    });
  }

  /* Event Handlers & Actions for Tracker */
  Object.assign(UI.act, {
    setTrackerSem: (el) => {
      state.trackerSem = el.value;
      UI.render();
    },
    toggleTrk: (el) => {
      const { id, type, num } = el.dataset;
      Store.toggleTrackerItem(id, type, +num);
    },
    stepTrk: (el) => {
      const { id, type, dir } = el.dataset;
      const tr = Store.getTracker(id);
      const cur = type === "folien" ? tr.folienCount || 0 : tr.uebungenCount || 0;
      const next = Math.max(0, Math.min(99, cur + (+dir)));
      Store.setTrackerCounts(id, type, next);
    },
    addAkModal: (el) => {
      const m = Store.byId(el.dataset.id);
      askName({
        title: t("tracker.addAk"), label: t("tracker.akLabel"), hint: t("tracker.akHint"), placeholder: t("tracker.akPlaceholder"),
        sub: m ? m.name : "",
        onOk: (name) => Store.addAltklausur(el.dataset.id, name),
      });
    },
    delAk: (el) => {
      Store.removeAltklausur(el.dataset.id, el.dataset.akid);
      UI.toast(t("tracker.akRemoved"));
    },
    addCustomTopicModal: () => {
      askName({
        title: t("tracker.addCustom"), label: t("tracker.customLabel"), hint: t("tracker.customHint"), placeholder: t("tracker.customPlaceholder"),
        onOk: (name) => {
          const id = "custom_" + Math.random().toString(36).slice(2, 9);
          Store.set((S) => { S.customTrackerTopics = S.customTrackerTopics || []; S.customTrackerTopics.push({ id, name }); });
          Store.setTrackerCounts(id, "folien", 10);
          Store.setTrackerCounts(id, "uebungen", 10);
          UI.toast(t("tracker.customAdded"), "good");
        },
      });
    },
    delCustomTopic: (el) => {
      const id = el.dataset.id;
      Store.set((S) => {
        S.customTrackerTopics = (S.customTrackerTopics || []).filter((x) => x.id !== id);
      });
      UI.toast(t("tracker.akRemoved"));
    },
  });

  Object.assign(UI.change, {
    setTrkCount: (el) => {
      const { id, type } = el.dataset;
      Store.setTrackerCounts(id, type, el.value);
    },
    toggleAk: (el) => {
      const { id, akid } = el.dataset;
      Store.toggleAltklausur(id, akid);
    },
  });
})();
