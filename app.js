/* ============================================================
   Stage Clock — vanilla JS application
   ============================================================ */

(function () {
  "use strict";

  // ---------- State ----------
  const state = {
    mode: "time", // time | countdown | agenda
    agenda: [], // [{time, title, speaker, duration}]
    currentIndex: -1, // currently selected agenda item
    timer: {
      totalSeconds: 300,
      remainingSeconds: 300,
      running: false,
      autoAdvance: true,
    },
    settings: {
      textColor: "#ffffff",
      bgColor: "#000000",
      showUpNext: true,
    },
    clockInterval: null,
    timerInterval: null,
  };

  // ---------- DOM helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const els = {
    stage: $("#stage"),
    modes: {
      time: $("#mode-time"),
      countdown: $("#mode-countdown"),
      agenda: $("#mode-agenda"),
    },
    clockTime: $("#clock-time"),
    clockDate: $("#clock-date"),
    countdownDisplay: $("#countdown-display"),
    countdownStatus: $("#countdown-status"),
    upNext: $("#up-next"),
    upNextTitle: $("#up-next-title"),
    upNextSpeaker: $("#up-next-speaker"),
    upNextTime: $("#up-next-time"),
    agendaList: $("#agenda-list"),
    settingsPanel: $("#settings-panel"),
    openSettings: $("#open-settings"),
    closeSettings: $("#close-settings"),
    modeBtns: $$(".mode-btn"),
    inputMinutes: $("#input-minutes"),
    inputSeconds: $("#input-seconds"),
    btnStart: $("#btn-start"),
    btnPause: $("#btn-pause"),
    btnReset: $("#btn-reset"),
    btnStop: $("#btn-stop"),
    autoAdvance: $("#auto-advance"),
    agendaFile: $("#agenda-file"),
    btnLoadSample: $("#btn-load-sample"),
    btnClearAgenda: $("#btn-clear-agenda"),
    agendaSummary: $("#agenda-summary"),
    colorText: $("#color-text"),
    colorBg: $("#color-bg"),
    showUpNext: $("#show-up-next"),
    btnFullscreen: $("#btn-fullscreen"),
    btnPresenter: $("#btn-presenter"),
    presenterOverlay: $("#presenter-overlay"),
    closePresenter: $("#close-presenter"),
    presenterCurrentTitle: $("#presenter-current-title"),
    presenterCurrentSpeaker: $("#presenter-current-speaker"),
    presenterCurrentTime: $("#presenter-current-time"),
    presenterNextTitle: $("#presenter-next-title"),
    presenterNextSpeaker: $("#presenter-next-speaker"),
    presenterNextTime: $("#presenter-next-time"),
    presenterCountdown: $("#presenter-countdown"),
    presenterStatus: $("#presenter-status"),
  };

  // ---------- Persistence ----------
  const STORAGE_KEY = "stageclock-state-v1";

  function saveState() {
    try {
      const persist = {
        mode: state.mode,
        agenda: state.agenda,
        currentIndex: state.currentIndex,
        timer: {
          totalSeconds: state.timer.totalSeconds,
          autoAdvance: state.timer.autoAdvance,
        },
        settings: state.settings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
    } catch (e) {
      /* storage may be unavailable; ignore */
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.mode) state.mode = data.mode;
      if (Array.isArray(data.agenda)) state.agenda = data.agenda;
      if (typeof data.currentIndex === "number") state.currentIndex = data.currentIndex;
      if (data.timer) {
        if (typeof data.timer.totalSeconds === "number") state.timer.totalSeconds = data.timer.totalSeconds;
        state.timer.remainingSeconds = state.timer.totalSeconds;
        if (typeof data.timer.autoAdvance === "boolean") state.timer.autoAdvance = data.timer.autoAdvance;
      }
      if (data.settings) Object.assign(state.settings, data.settings);
    } catch (e) {
      /* ignore corrupt state */
    }
  }

  // ---------- Formatting ----------
  function pad(n) { return String(n).padStart(2, "0"); }

  function formatClock(d) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function formatDate(d) {
    return d.toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  }

  function formatSeconds(total) {
    const safe = Math.max(0, Math.floor(total));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${pad(m)}:${pad(s)}`;
  }

  function formatHm(timeStr) {
    // Accepts "HH:MM", "HH:MM:SS", Date, or empty
    if (!timeStr) return "";
    if (timeStr instanceof Date) return `${pad(timeStr.getHours())}:${pad(timeStr.getMinutes())}`;
    const str = String(timeStr).trim();
    const m = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return str;
    return `${m[1].padStart(2, "0")}:${m[2]}`;
  }

  // ---------- Clock ----------
  function tickClock() {
    const now = new Date();
    els.clockTime.textContent = formatClock(now);
    els.clockDate.textContent = formatDate(now);
  }

  function startClock() {
    tickClock();
    if (state.clockInterval) clearInterval(state.clockInterval);
    state.clockInterval = setInterval(tickClock, 1000);
  }

  // ---------- Mode switching ----------
  function setMode(mode) {
    if (!els.modes[mode]) return;
    state.mode = mode;
    Object.keys(els.modes).forEach((key) => {
      els.modes[key].hidden = key !== mode;
    });
    els.modeBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.modebtn === mode);
    });
    if (mode === "agenda") renderAgenda();
    if (mode === "countdown") {
      updateCountdownDisplay();
      updateUpNext();
    }
    saveState();
  }

  // ---------- Countdown timer ----------
  function setTimerFromInputs() {
    const m = Math.max(0, parseInt(els.inputMinutes.value, 10) || 0);
    const s = Math.max(0, Math.min(59, parseInt(els.inputSeconds.value, 10) || 0));
    state.timer.totalSeconds = m * 60 + s;
    state.timer.remainingSeconds = state.timer.totalSeconds;
    saveState();
  }

  function updateCountdownDisplay() {
    els.countdownDisplay.textContent = formatSeconds(state.timer.remainingSeconds);
    els.presenterCountdown.textContent = formatSeconds(state.timer.remainingSeconds);

    const warn = state.timer.remainingSeconds <= 300 && state.timer.remainingSeconds > 60;
    const danger = state.timer.remainingSeconds <= 60 && state.timer.remainingSeconds > 0;

    els.countdownDisplay.classList.toggle("warn", warn);
    els.countdownDisplay.classList.toggle("danger", danger);
    els.presenterCountdown.classList.toggle("warn", warn);
    els.presenterCountdown.classList.toggle("danger", danger);
  }

  function setStatus(text) {
    els.countdownStatus.textContent = text;
    els.presenterStatus.textContent = text;
  }

  function tickTimer() {
    state.timer.remainingSeconds -= 1;
    if (state.timer.remainingSeconds <= 0) {
      state.timer.remainingSeconds = 0;
      updateCountdownDisplay();
      stopTimer();
      setStatus("Time's up");
      playAlarm();
      if (state.timer.autoAdvance) {
        advanceToNext();
      }
      return;
    }
    updateCountdownDisplay();
  }

  function startTimer() {
    if (state.timer.running) return;
    if (state.timer.remainingSeconds <= 0) {
      state.timer.remainingSeconds = state.timer.totalSeconds;
    }
    state.timer.running = true;
    setStatus("Running");
    els.btnStart.disabled = true;
    els.btnPause.disabled = false;
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(tickTimer, 1000);
    updateCountdownDisplay();
  }

  function pauseTimer() {
    if (!state.timer.running) return;
    state.timer.running = false;
    setStatus("Paused");
    els.btnStart.disabled = false;
    els.btnPause.disabled = true;
    if (state.timerInterval) clearInterval(state.timerInterval);
  }

  function resetTimer() {
    pauseTimer();
    state.timer.remainingSeconds = state.timer.totalSeconds;
    setStatus("Ready");
    updateCountdownDisplay();
  }

  function stopTimer() {
    state.timer.running = false;
    setStatus("Stopped");
    els.btnStart.disabled = false;
    els.btnPause.disabled = true;
    if (state.timerInterval) clearInterval(state.timerInterval);
  }

  // ---------- Alarm ----------
  let audioCtx = null;
  function playAlarm() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx;
      const now = ctx.currentTime;
      // Three short beeps
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, now + i * 0.5);
        gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.5 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.5 + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.5);
        osc.stop(now + i * 0.5 + 0.4);
      }
    } catch (e) {
      /* audio not available */
    }
  }

  // ---------- Agenda ----------
  function advanceToNext() {
    if (state.agenda.length === 0) return;
    const next = state.currentIndex + 1;
    if (next < state.agenda.length) {
      setCurrentItem(next);
      loadCurrentItemDuration();
    }
  }

  function loadCurrentItemDuration() {
    const item = state.agenda[state.currentIndex];
    if (item && item.duration) {
      const mins = parseFloat(item.duration);
      if (!isNaN(mins) && mins > 0) {
        state.timer.totalSeconds = Math.round(mins * 60);
        state.timer.remainingSeconds = state.timer.totalSeconds;
        els.inputMinutes.value = Math.floor(mins);
        els.inputSeconds.value = Math.round((mins % 1) * 60);
        updateCountdownDisplay();
        saveState();
      }
    }
  }

  function setCurrentItem(index) {
    if (index < -1 || index >= state.agenda.length) return;
    state.currentIndex = index;
    renderAgenda();
    updateUpNext();
    updatePresenter();
    saveState();
  }

  function renderAgenda() {
    els.agendaList.innerHTML = "";
    if (state.agenda.length === 0) {
      els.agendaList.innerHTML = '<p class="hint">No agenda loaded. Open settings to import an Excel/CSV file.</p>';
      return;
    }
    state.agenda.forEach((item, idx) => {
      const div = document.createElement("div");
      div.className = "agenda-item";
      if (idx < state.currentIndex) div.classList.add("completed");
      if (idx === state.currentIndex) div.classList.add("current");
      if (idx === state.currentIndex + 1) div.classList.add("next");

      div.innerHTML = `
        <span class="ag-time">${formatHm(item.time) || "—"}</span>
        <span class="ag-body">
          <span class="ag-title">${escapeHtml(item.title || "Untitled")}</span>
          <span class="ag-speaker">${escapeHtml(item.speaker || "")}</span>
        </span>
        <span class="ag-duration">${item.duration ? item.duration + " min" : ""}</span>
      `;
      div.addEventListener("click", () => {
        setCurrentItem(idx);
        loadCurrentItemDuration();
      });
      els.agendaList.appendChild(div);
    });
  }

  function updateUpNext() {
    const show = state.settings.showUpNext && state.mode === "countdown";
    const nextItem = state.agenda[state.currentIndex + 1];
    if (show && nextItem) {
      els.upNext.hidden = false;
      els.upNextTitle.textContent = nextItem.title || "Untitled";
      els.upNextSpeaker.textContent = nextItem.speaker ? "· " + nextItem.speaker : "";
      els.upNextTime.textContent = formatHm(nextItem.time) ? "· " + formatHm(nextItem.time) : "";
    } else {
      els.upNext.hidden = true;
    }
  }

  function updatePresenter() {
    const current = state.agenda[state.currentIndex];
    const next = state.agenda[state.currentIndex + 1];
    if (current) {
      els.presenterCurrentTitle.textContent = current.title || "Untitled";
      els.presenterCurrentSpeaker.textContent = current.speaker || "";
      els.presenterCurrentTime.textContent = formatHm(current.time);
    } else {
      els.presenterCurrentTitle.textContent = "—";
      els.presenterCurrentSpeaker.textContent = "";
      els.presenterCurrentTime.textContent = "";
    }
    if (next) {
      els.presenterNextTitle.textContent = next.title || "Untitled";
      els.presenterNextSpeaker.textContent = next.speaker || "";
      els.presenterNextTime.textContent = formatHm(next.time);
    } else {
      els.presenterNextTitle.textContent = "—";
      els.presenterNextSpeaker.textContent = "";
      els.presenterNextTime.textContent = "";
    }
  }

  // ---------- Agenda import ----------
  function parseAgendaRows(rows) {
    // rows: array of arrays (raw cells)
    if (!rows || !rows.length) return [];
    const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
    const findCol = (names) => {
      for (const n of names) {
        const i = header.indexOf(n);
        if (i !== -1) return i;
      }
      // partial match fallback
      for (const n of names) {
        const i = header.findIndex((h) => h && h.includes(n));
        if (i !== -1) return i;
      }
      return -1;
    };

    const timeCol = findCol(["time", "start", "start time", "starttime"]);
    const titleCol = findCol(["title", "item", "name", "session", "topic"]);
    const speakerCol = findCol(["speaker", "presenter", "host", "by"]);
    const durationCol = findCol(["duration", "length", "mins", "minutes"]);

    const items = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.every((c) => c === null || c === undefined || String(c).trim() === "")) continue;
      const title = titleCol !== -1 ? String(row[titleCol] || "").trim() : "";
      if (!title && timeCol === -1) continue;

      let timeVal = "";
      if (timeCol !== -1) {
        const raw = row[timeCol];
        if (raw instanceof Date) timeVal = raw;
        else if (typeof raw === "number" && XLSX && XLSX.SSF) {
          // Excel time fraction -> HH:MM
          try {
            const frac = raw - Math.floor(raw);
            const totalMin = Math.round(frac * 24 * 60);
            timeVal = `${pad(Math.floor(totalMin / 60) % 24)}:${pad(totalMin % 60)}`;
          } catch (e) { timeVal = String(raw); }
        } else {
          timeVal = String(raw || "").trim();
        }
      }

      let dur = "";
      if (durationCol !== -1) {
        const raw = row[durationCol];
        if (typeof raw === "number") dur = String(raw);
        else {
          const m = String(raw || "").match(/(\d+(\.\d+)?)/);
          dur = m ? m[1] : "";
        }
      }

      items.push({
        time: timeVal,
        title: title || "Untitled",
        speaker: speakerCol !== -1 ? String(row[speakerCol] || "").trim() : "",
        duration: dur,
      });
    }
    return items;
  }

  function handleFile(file) {
    if (!file) return;
    if (typeof XLSX === "undefined") {
      alert("Excel parser is still loading. Please try again in a moment.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
        const items = parseAgendaRows(rows);
        if (items.length === 0) {
          alert("No agenda rows found. Ensure columns include Time, Title, Speaker, Duration.");
          return;
        }
        state.agenda = items;
        state.currentIndex = -1;
        renderAgenda();
        updateUpNext();
        updatePresenter();
        els.agendaSummary.textContent = `Loaded ${items.length} agenda item(s).`;
        saveState();
      } catch (err) {
        alert("Failed to read file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function loadSampleAgenda() {
    const sample = [
      ["Time", "Title", "Speaker", "Duration"],
      ["09:00", "Welcome & Opening", "Jane Doe", 10],
      ["09:10", "Keynote: The Future of Stagecraft", "John Smith", 45],
      ["10:00", "Lighting Design Basics", "Alice Lee", 30],
      ["10:30", "Coffee Break", "", 15],
      ["10:45", "Sound Engineering Panel", "Bob Chen", 60],
      ["11:45", "Closing Remarks", "Jane Doe", 10],
    ];
    const items = parseAgendaRows(sample);
    state.agenda = items;
    state.currentIndex = -1;
    renderAgenda();
    updateUpNext();
    updatePresenter();
    els.agendaSummary.textContent = `Loaded ${items.length} sample agenda item(s).`;
    saveState();
  }

  function clearAgenda() {
    state.agenda = [];
    state.currentIndex = -1;
    renderAgenda();
    updateUpNext();
    updatePresenter();
    els.agendaSummary.textContent = "Agenda cleared.";
    saveState();
  }

  // ---------- Appearance ----------
  function applyAppearance() {
    document.documentElement.style.setProperty("--text-color", state.settings.textColor);
    document.documentElement.style.setProperty("--bg-color", state.settings.bgColor);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }

  // ---------- Settings panel ----------
  function openSettings() {
    els.settingsPanel.hidden = false;
    document.body.classList.add("settings-open");
  }

  function closeSettings() {
    els.settingsPanel.hidden = true;
    document.body.classList.remove("settings-open");
  }

  // ---------- Presenter ----------
  function openPresenter() {
    updatePresenter();
    updateCountdownDisplay();
    els.presenterOverlay.hidden = false;
  }

  function closePresenter() {
    els.presenterOverlay.hidden = true;
  }

  // ---------- Keyboard shortcuts ----------
  function handleKeydown(e) {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        state.timer.running ? pauseTimer() : startTimer();
        break;
      case "r":
      case "R":
        resetTimer();
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "s":
      case "S":
        els.settingsPanel.hidden ? openSettings() : closeSettings();
        break;
      case "1":
        setMode("time");
        break;
      case "2":
        setMode("countdown");
        break;
      case "3":
        setMode("agenda");
        break;
      case "ArrowRight":
        if (state.currentIndex < state.agenda.length - 1) {
          setCurrentItem(state.currentIndex + 1);
          loadCurrentItemDuration();
        }
        break;
      case "ArrowLeft":
        if (state.currentIndex > 0) {
          setCurrentItem(state.currentIndex - 1);
          loadCurrentItemDuration();
        }
        break;
      case "Escape":
        if (!els.settingsPanel.hidden) closeSettings();
        else if (!els.presenterOverlay.hidden) closePresenter();
        break;
    }
  }

  // ---------- Utilities ----------
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  // ---------- Wire up events ----------
  function bindEvents() {
    els.modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => setMode(btn.dataset.modebtn));
    });

    els.openSettings.addEventListener("click", openSettings);
    els.closeSettings.addEventListener("click", closeSettings);
    els.closePresenter.addEventListener("click", closePresenter);

    els.inputMinutes.addEventListener("change", () => {
      setTimerFromInputs();
      updateCountdownDisplay();
    });
    els.inputSeconds.addEventListener("change", () => {
      setTimerFromInputs();
      updateCountdownDisplay();
    });

    els.btnStart.addEventListener("click", startTimer);
    els.btnPause.addEventListener("click", pauseTimer);
    els.btnReset.addEventListener("click", resetTimer);
    els.btnStop.addEventListener("click", stopTimer);

    els.autoAdvance.addEventListener("change", () => {
      state.timer.autoAdvance = els.autoAdvance.checked;
      saveState();
    });

    els.agendaFile.addEventListener("change", (e) => handleFile(e.target.files[0]));
    els.btnLoadSample.addEventListener("click", loadSampleAgenda);
    els.btnClearAgenda.addEventListener("click", clearAgenda);

    els.colorText.addEventListener("input", () => {
      state.settings.textColor = els.colorText.value;
      applyAppearance();
      saveState();
    });
    els.colorBg.addEventListener("input", () => {
      state.settings.bgColor = els.colorBg.value;
      applyAppearance();
      saveState();
    });

    els.showUpNext.addEventListener("change", () => {
      state.settings.showUpNext = els.showUpNext.checked;
      updateUpNext();
      saveState();
    });

    els.btnFullscreen.addEventListener("click", toggleFullscreen);
    els.btnPresenter.addEventListener("click", openPresenter);

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("fullscreenchange", () => {
      // keep display consistent after entering/exiting fullscreen
    });
  }

  // ---------- Init ----------
  function init() {
    loadState();

    // Reflect loaded state into UI controls
    els.inputMinutes.value = Math.floor(state.timer.totalSeconds / 60);
    els.inputSeconds.value = state.timer.totalSeconds % 60;
    els.autoAdvance.checked = state.timer.autoAdvance;
    els.colorText.value = state.settings.textColor;
    els.colorBg.value = state.settings.bgColor;
    els.showUpNext.checked = state.settings.showUpNext;

    applyAppearance();
    startClock();
    setMode(state.mode);
    updateCountdownDisplay();
    updatePresenter();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
