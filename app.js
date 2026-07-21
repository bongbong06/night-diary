const STORAGE_KEY = "diaryEntries";

function getDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// --- state ---
const now = new Date();
const todayKey = getDateKey(now);
const yesterdayKey = getDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
let data = loadAll();

// --- elements ---
const views = {
  today: document.getElementById("view-today"),
  list: document.getElementById("view-list"),
  detail: document.getElementById("view-detail"),
};
const entryInput = document.getElementById("entry-input");
const goalInput = document.getElementById("goal-input");
const yesterdayGoalEl = document.getElementById("yesterday-goal");
const todayDateEl = document.getElementById("today-date");
const historyIcon = document.getElementById("history-icon");
const historyListEl = document.getElementById("history-list");
const historyEmptyEl = document.getElementById("history-empty");
const detailDateEl = document.getElementById("detail-date");
const detailEntryEl = document.getElementById("detail-entry");
const detailGoalEl = document.getElementById("detail-goal");

function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    el.hidden = key !== name;
  });
}

// --- today view ---
function initToday() {
  todayDateEl.textContent = formatDateLabel(now);

  const todayEntry = data[todayKey] || { entry: "", tomorrowGoal: "" };
  entryInput.value = todayEntry.entry;
  goalInput.value = todayEntry.tomorrowGoal;
  autoResize(entryInput);

  const yEntry = data[yesterdayKey];
  if (yEntry && yEntry.tomorrowGoal) {
    yesterdayGoalEl.textContent = `어제 목표: ${yEntry.tomorrowGoal}`;
    yesterdayGoalEl.hidden = false;
  }

  const persist = debounce(() => {
    data[todayKey] = {
      entry: entryInput.value,
      tomorrowGoal: goalInput.value,
    };
    saveAll(data);
  }, 400);

  entryInput.addEventListener("input", () => {
    autoResize(entryInput);
    persist();
  });
  goalInput.addEventListener("input", persist);
}

// --- history list view ---
function openHistoryList() {
  historyListEl.innerHTML = "";
  const keys = Object.keys(data)
    .filter((k) => k !== todayKey && data[k].entry)
    .sort()
    .reverse();

  historyEmptyEl.hidden = keys.length > 0;

  keys.forEach((key) => {
    const item = data[key];
    const li = document.createElement("li");
    const dateSpan = document.createElement("span");
    dateSpan.className = "item-date";
    dateSpan.textContent = key;
    const previewSpan = document.createElement("span");
    previewSpan.className = "item-preview";
    previewSpan.textContent = (item.entry || "").split("\n")[0];
    li.appendChild(dateSpan);
    li.appendChild(previewSpan);
    li.addEventListener("click", () => openHistoryDetail(key));
    historyListEl.appendChild(li);
  });

  showView("list");
}

function openHistoryDetail(key) {
  const item = data[key];
  detailDateEl.textContent = key;
  detailEntryEl.textContent = item.entry || "";
  detailGoalEl.textContent = item.tomorrowGoal || "(없음)";
  showView("detail");
}

// --- wiring ---
historyIcon.addEventListener("click", openHistoryList);
document.getElementById("back-from-list").addEventListener("click", () => showView("today"));
document.getElementById("back-from-detail").addEventListener("click", () => openHistoryList());

initToday();
showView("today");

// --- PWA service worker ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
