/* ============================================================
   KF-MedReminder — Medication Reminder PWA
   Notification API + LocalStorage
   ============================================================ */

// --- i18n ---
const I18N = {
  ja: {
    app_name: "おくすりリマインダー",
    app_tagline: "親の薬管理をサポートする服薬リマインダー",
    tab_today: "今日の服薬",
    tab_meds: "薬の管理",
    tab_history: "履歴",
    no_meds_today: "薬が登録されていません。「薬の管理」タブから追加してください。",
    add_med: "薬を登録",
    med_name_label: "薬の名前",
    med_name_placeholder: "例: アムロジピン",
    med_dose_label: "用量（任意）",
    med_dose_placeholder: "例: 5mg 1錠",
    med_times_label: "服薬タイミング",
    notify_times_label: "通知時刻",
    morning: "朝",
    noon: "昼",
    evening: "夕",
    bedtime: "就寝前",
    add_btn: "登録",
    med_list: "登録済みの薬",
    take_btn: "飲みました",
    taken_label: "服用済み",
    delete_confirm: "この薬を削除しますか？",
    export_csv: "CSVエクスポート",
    about_title: "このアプリについて",
    about_description: "親や家族の薬管理が心配な方のための服薬リマインダーアプリです。ブラウザ通知で服薬を知らせ、履歴を記録します。",
    tech_title: "使用技術",
    compliance_rate: "服薬率",
    taken_count: "服用",
    missed_count: "未服用",
    no_history: "この月の履歴はありません",
    notification_title: "おくすりの時間です",
    notification_granted: "通知が有効になりました",
    notification_denied: "通知が拒否されました。ブラウザの設定から許可してください。",
    install_banner_title: "ホーム画面に追加してください",
    install_banner_text: "ホーム画面に追加すると、通知機能が使えるようになります。<br>Safari: 共有ボタン → 「ホーム画面に追加」<br>Chrome: メニュー → 「ホーム画面に追加」",
    total_pills_label: "総錠数（任意）",
    total_pills_placeholder: "例: 30",
    remaining_pills: "残り",
    pills_unit: "錠",
    overdue_banner: "まだ飲んでいない薬があります！",
  },
  en: {
    app_name: "Med Reminder",
    app_tagline: "Medication reminder to support family care",
    tab_today: "Today",
    tab_meds: "Manage Meds",
    tab_history: "History",
    no_meds_today: "No medications registered. Add some from the Manage Meds tab.",
    add_med: "Add Medication",
    med_name_label: "Medication Name",
    med_name_placeholder: "e.g. Amlodipine",
    med_dose_label: "Dosage (optional)",
    med_dose_placeholder: "e.g. 5mg, 1 tablet",
    med_times_label: "Schedule",
    notify_times_label: "Notification Times",
    morning: "Morning",
    noon: "Noon",
    evening: "Evening",
    bedtime: "Bedtime",
    add_btn: "Add",
    med_list: "Registered Medications",
    take_btn: "Taken",
    taken_label: "Taken",
    delete_confirm: "Delete this medication?",
    export_csv: "Export CSV",
    about_title: "About This App",
    about_description: "A medication reminder app for those worried about managing a family member's medications. Uses browser notifications and tracks history.",
    tech_title: "Technologies Used",
    compliance_rate: "Compliance Rate",
    taken_count: "Taken",
    missed_count: "Missed",
    no_history: "No history for this month",
    notification_title: "Time to take your medication",
    notification_granted: "Notifications enabled",
    notification_denied: "Notifications denied. Please enable them in browser settings.",
    install_banner_title: "Add to Home Screen",
    install_banner_text: "Add to home screen to enable notifications.<br>Safari: Share → Add to Home Screen<br>Chrome: Menu → Add to Home Screen",
    total_pills_label: "Total Pills (optional)",
    total_pills_placeholder: "e.g. 30",
    remaining_pills: "Remaining",
    pills_unit: "pills",
    overdue_banner: "You have medications that haven't been taken yet!",
  }
};

let currentLang = localStorage.getItem("kf-mr-lang") || "ja";

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("kf-mr-lang", lang);
  document.getElementById("lang-select").value = lang;
  document.documentElement.lang = lang;
  applyI18n();
  renderToday();
  renderMedList();
  renderHistory();
}

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || key;
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

// --- Data Layer ---
const MEDS_KEY = "kf-med-reminder-meds";
const LOG_KEY = "kf-med-reminder-log";
const TIMES_KEY = "kf-med-reminder-times";

function loadMeds() { try { return JSON.parse(localStorage.getItem(MEDS_KEY)) || []; } catch { return []; } }
function saveMeds(meds) { localStorage.setItem(MEDS_KEY, JSON.stringify(meds)); }
function loadLog() { try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; } catch { return []; } }
function saveLog(log) { localStorage.setItem(LOG_KEY, JSON.stringify(log)); }
function loadTimes() {
  try {
    return JSON.parse(localStorage.getItem(TIMES_KEY)) || { morning: "07:00", noon: "12:00", evening: "18:00", bedtime: "21:00" };
  } catch {
    return { morning: "07:00", noon: "12:00", evening: "18:00", bedtime: "21:00" };
  }
}
function saveTimes(times) { localStorage.setItem(TIMES_KEY, JSON.stringify(times)); }

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// --- Medication Management ---
function addMed() {
  const name = document.getElementById("input-med-name").value.trim();
  const dose = document.getElementById("input-med-dose").value.trim();
  const totalPillsStr = document.getElementById("input-total-pills").value.trim();
  if (!name) return;

  const checkboxes = document.querySelectorAll(".checkbox-group input:checked");
  const times = Array.from(checkboxes).map(cb => cb.value);
  if (times.length === 0) return;

  // Save notification times
  const notifyTimes = {};
  ["morning", "noon", "evening", "bedtime"].forEach(slot => {
    notifyTimes[slot] = document.getElementById("time-" + slot).value;
  });
  saveTimes(notifyTimes);

  const totalPills = totalPillsStr ? parseInt(totalPillsStr, 10) : null;

  const meds = loadMeds();
  meds.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    dose,
    times,
    totalPills: (totalPills && totalPills > 0) ? totalPills : null,
    remainingPills: (totalPills && totalPills > 0) ? totalPills : null,
    createdAt: todayStr(),
  });
  saveMeds(meds);

  document.getElementById("input-med-name").value = "";
  document.getElementById("input-med-dose").value = "";
  document.getElementById("input-total-pills").value = "";
  document.querySelectorAll(".checkbox-group input").forEach(cb => cb.checked = false);

  renderMedList();
  renderToday();
}

function deleteMed(id) {
  if (!confirm(t("delete_confirm"))) return;
  let meds = loadMeds();
  meds = meds.filter(m => m.id !== id);
  saveMeds(meds);
  renderMedList();
  renderToday();
}

function renderMedList() {
  const list = document.getElementById("med-list");
  const meds = loadMeds();
  if (meds.length === 0) {
    list.innerHTML = `<p class="empty-state" style="padding:20px">${t("no_meds_today")}</p>`;
    return;
  }
  const slotNames = { morning: t("morning"), noon: t("noon"), evening: t("evening"), bedtime: t("bedtime") };
  list.innerHTML = meds.map(m => {
    const pillsInfo = m.remainingPills !== null
      ? ` | ${t("remaining_pills")}: ${m.remainingPills}${t("pills_unit")}`
      : "";
    return `
    <div class="card-item">
      <div class="card-item-text">
        <div class="card-item-front">${escHtml(m.name)}</div>
        <div class="card-item-back">${escHtml(m.dose || "")} — ${m.times.map(t => slotNames[t] || t).join(", ")}${pillsInfo}</div>
      </div>
      <div class="card-item-actions">
        <button class="btn btn-sm btn-danger-outline" onclick="deleteMed('${m.id}')">&times;</button>
      </div>
    </div>
  `;
  }).join("");
}

// --- Overdue Banner ---
function checkOverdueMeds() {
  const bannerEl = document.getElementById("overdue-banner");
  if (!bannerEl) return;

  const meds = loadMeds();
  if (meds.length === 0) {
    bannerEl.style.display = "none";
    return;
  }

  const today = todayStr();
  const log = loadLog();
  const todayLog = log.filter(l => l.date === today);
  const notifyTimes = loadTimes();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const slots = ["morning", "noon", "evening", "bedtime"];
  let hasOverdue = false;

  for (const slot of slots) {
    const timeStr = notifyTimes[slot];
    if (!timeStr) continue;
    const [h, m] = timeStr.split(":").map(Number);
    const slotMinutes = h * 60 + m;

    // Only check if current time is past the notification time
    if (currentMinutes < slotMinutes) continue;

    const slotMeds = meds.filter(med => med.times.includes(slot));
    for (const med of slotMeds) {
      const isTaken = todayLog.some(l => l.medId === med.id && l.slot === slot);
      if (!isTaken) {
        hasOverdue = true;
        break;
      }
    }
    if (hasOverdue) break;
  }

  bannerEl.style.display = hasOverdue ? "block" : "none";
  if (hasOverdue) {
    bannerEl.textContent = t("overdue_banner");
  }
}

// --- Today's View ---
function renderToday() {
  const meds = loadMeds();
  const container = document.getElementById("today-list");
  const noMeds = document.getElementById("no-meds-today");

  if (meds.length === 0) {
    container.innerHTML = "";
    noMeds.style.display = "";
    checkOverdueMeds();
    return;
  }
  noMeds.style.display = "none";

  const today = todayStr();
  const log = loadLog();
  const todayLog = log.filter(l => l.date === today);
  const notifyTimes = loadTimes();
  const slots = ["morning", "noon", "evening", "bedtime"];
  const slotNames = { morning: t("morning"), noon: t("noon"), evening: t("evening"), bedtime: t("bedtime") };

  let html = "";
  for (const slot of slots) {
    const slotMeds = meds.filter(m => m.times.includes(slot));
    if (slotMeds.length === 0) continue;

    html += `<div class="today-slot">
      <div class="today-slot-title">${slotNames[slot]}（${notifyTimes[slot] || ""}）</div>`;
    for (const m of slotMeds) {
      const isTaken = todayLog.some(l => l.medId === m.id && l.slot === slot);
      const pillsInfo = m.remainingPills !== null
        ? `<div class="med-row-pills" style="font-size:0.8rem; color:#888;">${t("remaining_pills")}: ${m.remainingPills}${t("pills_unit")}</div>`
        : "";
      html += `<div class="med-row ${isTaken ? "taken" : ""}">
        <div class="med-row-info">
          <div class="med-row-name">${escHtml(m.name)}</div>
          ${m.dose ? `<div class="med-row-dose">${escHtml(m.dose)}</div>` : ""}
          ${pillsInfo}
        </div>
        ${isTaken
          ? `<span class="taken-label">${t("taken_label")}</span>`
          : `<button class="btn btn-take-large" onclick="takeMed('${m.id}','${slot}')">${t("take_btn")}</button>`
        }
      </div>`;
    }
    html += `</div>`;
  }
  container.innerHTML = html;
  checkOverdueMeds();
}

function takeMed(medId, slot) {
  const log = loadLog();
  log.push({
    medId,
    slot,
    date: todayStr(),
    time: new Date().toTimeString().slice(0, 5),
  });
  saveLog(log);

  // Decrement remaining pills
  const meds = loadMeds();
  const med = meds.find(m => m.id === medId);
  if (med && med.remainingPills !== null && med.remainingPills > 0) {
    med.remainingPills--;
    saveMeds(meds);
  }

  renderToday();
}

// --- History ---
let historyYear, historyMonth;

function initHistory() {
  const now = new Date();
  historyYear = now.getFullYear();
  historyMonth = now.getMonth(); // 0-indexed
}

function prevMonth() {
  historyMonth--;
  if (historyMonth < 0) { historyMonth = 11; historyYear--; }
  renderHistory();
}

function nextMonth() {
  historyMonth++;
  if (historyMonth > 11) { historyMonth = 0; historyYear++; }
  renderHistory();
}

function renderHistory() {
  const monthLabel = document.getElementById("history-month");
  const summaryEl = document.getElementById("monthly-summary");
  const listEl = document.getElementById("history-list");

  const monthStr = historyYear + "-" + String(historyMonth + 1).padStart(2, "0");
  monthLabel.textContent = historyYear + "/" + (historyMonth + 1);

  const meds = loadMeds();
  const log = loadLog();
  const monthLog = log.filter(l => l.date.startsWith(monthStr));

  // Calculate expected doses for the month
  const daysInMonth = new Date(historyYear, historyMonth + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let totalExpected = 0;
  let totalTaken = 0;

  const dayData = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(historyYear, historyMonth, d);
    if (dateObj > today) break;
    const dateStr = historyYear + "-" + String(historyMonth + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    const dayLog = monthLog.filter(l => l.date === dateStr);

    let dayExpected = 0;
    let dayTaken = 0;
    const items = [];
    for (const m of meds) {
      if (m.createdAt > dateStr) continue;
      for (const slot of m.times) {
        dayExpected++;
        const taken = dayLog.some(l => l.medId === m.id && l.slot === slot);
        if (taken) dayTaken++;
        items.push({ name: m.name, slot, taken });
      }
    }
    totalExpected += dayExpected;
    totalTaken += dayTaken;
    if (dayExpected > 0) {
      dayData.push({ dateStr, d, dayExpected, dayTaken, items });
    }
  }

  // Summary
  const rate = totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 0;
  summaryEl.innerHTML = `
    <div class="summary-rate">${rate}%</div>
    <div class="summary-label">${t("compliance_rate")} (${t("taken_count")}: ${totalTaken} / ${totalExpected})</div>
  `;

  // Day-by-day list
  if (dayData.length === 0) {
    listEl.innerHTML = `<p class="empty-state" style="padding:20px">${t("no_history")}</p>`;
    return;
  }

  const slotNames = { morning: t("morning"), noon: t("noon"), evening: t("evening"), bedtime: t("bedtime") };
  listEl.innerHTML = dayData.reverse().map(day => `
    <div class="history-day">
      <div class="history-day-date">${day.dateStr}</div>
      <div class="history-day-items">
        ${day.items.map(item =>
          `<span class="${item.taken ? "history-taken" : "history-missed"}">${item.taken ? "\u2713" : "\u2717"} ${escHtml(item.name)} (${slotNames[item.slot] || item.slot})</span>`
        ).join("<br>")}
      </div>
    </div>
  `).join("");
}

// --- CSV Export ---
function exportCSV() {
  const log = loadLog();
  const meds = loadMeds();
  const medMap = {};
  meds.forEach(m => medMap[m.id] = m.name);

  const slotNames = { morning: t("morning"), noon: t("noon"), evening: t("evening"), bedtime: t("bedtime") };
  let csv = "Date,Time,Medication,Slot\n";
  for (const l of log) {
    csv += `${l.date},${l.time},${escCsv(medMap[l.medId] || l.medId)},${slotNames[l.slot] || l.slot}\n`;
  }

  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kf-med-reminder-" + todayStr() + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}

function escCsv(str) {
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// --- Notifications ---
let notificationTimers = [];

function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function scheduleNotifications() {
  // Clear existing timers
  notificationTimers.forEach(id => clearTimeout(id));
  notificationTimers = [];

  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const meds = loadMeds();
  if (meds.length === 0) return;

  const notifyTimes = loadTimes();
  const now = new Date();
  const today = todayStr();
  const log = loadLog();

  const slots = ["morning", "noon", "evening", "bedtime"];
  const slotNames = { morning: t("morning"), noon: t("noon"), evening: t("evening"), bedtime: t("bedtime") };

  for (const slot of slots) {
    const timeStr = notifyTimes[slot];
    if (!timeStr) continue;

    const slotMeds = meds.filter(m => m.times.includes(slot));
    if (slotMeds.length === 0) continue;

    // Check if all meds for this slot are already taken
    const allTaken = slotMeds.every(m => log.some(l => l.date === today && l.medId === m.id && l.slot === slot));
    if (allTaken) continue;

    const [h, m] = timeStr.split(":").map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);

    const diff = target - now;
    if (diff > 0) {
      const timerId = setTimeout(() => {
        const names = slotMeds.map(m => m.name).join(", ");
        new Notification(t("notification_title"), {
          body: `${slotNames[slot]}: ${names}`,
          icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💊</text></svg>",
        });
      }, diff);
      notificationTimers.push(timerId);
    }
  }
}

// --- Tab Navigation ---
function showTab(tabName) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(el => el.classList.remove("active"));
  document.getElementById("tab-" + tabName).classList.add("active");
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add("active");
  if (tabName === "today") renderToday();
  if (tabName === "meds") renderMedList();
  if (tabName === "history") renderHistory();
}

// --- Helpers ---
function escHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// --- Service Worker Registration ---
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// --- Install Banner ---
function showInstallBanner() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                       || window.navigator.standalone === true;
  const dismissed = localStorage.getItem('install_banner_dismissed');

  if ((isIOS || isAndroid) && !isStandalone && !dismissed) {
    const banner = document.getElementById('install-banner');
    if (banner) {
      banner.style.display = 'block';
      const titleEl = document.getElementById('install-banner-title');
      const textEl = document.getElementById('install-banner-text');
      if (titleEl) titleEl.textContent = t('install_banner_title');
      if (textEl) textEl.innerHTML = t('install_banner_text');
    }
  }
}

function dismissInstallBanner() {
  const banner = document.getElementById('install-banner');
  if (banner) banner.style.display = 'none';
  localStorage.setItem('install_banner_dismissed', 'true');
}

// --- Init ---
initHistory();

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("lang-select").value = currentLang;
  document.documentElement.lang = currentLang;

  // Restore notification times
  const times = loadTimes();
  ["morning", "noon", "evening", "bedtime"].forEach(slot => {
    const el = document.getElementById("time-" + slot);
    if (el && times[slot]) el.value = times[slot];
  });

  applyI18n();
  renderToday();
  renderMedList();
  renderHistory();
  requestNotificationPermission();
  scheduleNotifications();

  // Re-schedule every minute and check overdue
  setInterval(() => {
    scheduleNotifications();
    checkOverdueMeds();
  }, 60000);

  showInstallBanner();
});
