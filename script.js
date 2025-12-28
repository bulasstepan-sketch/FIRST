const STORAGE_KEY = "valorantTrainingData";

const uiState = {
  activePlanId: null,
  rightTab: "today",
  progressExerciseId: null,
};

const state = loadStateFromLocalStorage();
if (!state.plans || state.plans.length === 0) {
  state.plans = [
    { id: "plan-1", name: "Plan 1", exercises: [] },
    { id: "plan-2", name: "Plan 2", exercises: [] },
  ];
  state.sessions = [];
}

uiState.activePlanId = state.ui?.activePlanId || state.plans[0].id;
uiState.rightTab = state.ui?.rightTab || "today";
uiState.progressExerciseId = state.ui?.progressExerciseId || null;

const planTabs = document.getElementById("planTabs");
const exerciseList = document.getElementById("exerciseList");
const addExerciseBtn = document.getElementById("addExerciseBtn");
const todayHeader = document.getElementById("todayHeader");
const todayList = document.getElementById("todayList");
const todaySummary = document.getElementById("todaySummary");
const saveTodayBtn = document.getElementById("saveTodayBtn");
const rightTabs = document.getElementById("rightTabs");
const todayTab = document.getElementById("todayTab");
const progressTab = document.getElementById("progressTab");
const progressSelect = document.getElementById("progressSelect");
const progressBody = document.getElementById("progressBody");
const currentDate = document.getElementById("currentDate");

addExerciseBtn.addEventListener("click", () => {
  const plan = getActivePlan();
  plan.exercises.push({
    id: generateId("ex"),
    name: "New exercise",
    metricType: "score",
    targetValue: "",
  });
  saveAndRender();
});

rightTabs.addEventListener("click", (event) => {
  const button = event.target.closest(".tab-btn");
  if (!button) return;
  uiState.rightTab = button.dataset.tab;
  renderRightTabs();
  persistUi();
});

saveTodayBtn.addEventListener("click", () => {
  const plan = getActivePlan();
  const date = getTodayDate();
  const results = Array.from(todayList.querySelectorAll(".today-item")).map((item) => {
    const exerciseId = item.dataset.exerciseId;
    const done = item.querySelector("input[type=checkbox]").checked;
    const valueInput = item.querySelector("input[type=number]").value.trim();
    const comment = item.querySelector("input[type=text]").value.trim();
    return {
      exerciseId,
      done,
      resultValue: valueInput === "" ? null : Number(valueInput),
      comment,
    };
  });

  const sessionId = `sess-${date}-${plan.id}`;
  const existing = state.sessions.find((sess) => sess.id === sessionId);
  if (existing) {
    existing.results = results;
  } else {
    state.sessions.push({
      id: sessionId,
      date,
      planId: plan.id,
      results,
    });
  }
  saveAndRender();
});

function loadStateFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { plans: [], sessions: [], ui: {} };
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return { plans: [], sessions: [], ui: {} };
  }
}

function saveStateToLocalStorage() {
  state.ui = {
    activePlanId: uiState.activePlanId,
    rightTab: uiState.rightTab,
    progressExerciseId: uiState.progressExerciseId,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveAndRender() {
  saveStateToLocalStorage();
  renderUI();
}

function persistUi() {
  saveStateToLocalStorage();
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}

function getActivePlan() {
  return state.plans.find((plan) => plan.id === uiState.activePlanId) || state.plans[0];
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatTarget(targetValue) {
  if (targetValue === "" || targetValue === null || typeof targetValue === "undefined") {
    return "Target: —";
  }
  return `Target: ${targetValue}`;
}

function renderUI() {
  currentDate.textContent = `Active date: ${getTodayDate()}`;
  renderPlanTabs();
  renderPlanStructure();
  renderRightTabs();
}

function renderPlanTabs() {
  planTabs.innerHTML = "";
  state.plans.forEach((plan) => {
    const tabWrapper = document.createElement("div");
    tabWrapper.className = "plan-tab";

    const tabBtn = document.createElement("button");
    tabBtn.className = "tab-btn" + (plan.id === uiState.activePlanId ? " active" : "");
    tabBtn.textContent = plan.name;
    tabBtn.addEventListener("click", () => {
      uiState.activePlanId = plan.id;
      uiState.progressExerciseId = null;
      saveAndRender();
    });

    const renameBtn = document.createElement("button");
    renameBtn.className = "btn";
    renameBtn.textContent = "Rename";
    renameBtn.addEventListener("click", () => renamePlan(plan));

    tabWrapper.appendChild(tabBtn);
    tabWrapper.appendChild(renameBtn);
    planTabs.appendChild(tabWrapper);
  });
}

function renamePlan(plan) {
  const nextName = window.prompt("Rename plan", plan.name);
  if (!nextName) return;
  plan.name = nextName.trim() || plan.name;
  saveAndRender();
}

function renderPlanStructure() {
  const plan = getActivePlan();
  exerciseList.innerHTML = "";

  if (plan.exercises.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No exercises yet. Add one to get started.";
    exerciseList.appendChild(empty);
    return;
  }

  plan.exercises.forEach((exercise, index) => {
    const item = document.createElement("div");
    item.className = "exercise-item";

    const info = document.createElement("div");
    info.className = "exercise-info";

    const name = document.createElement("div");
    name.className = "exercise-name";
    name.textContent = exercise.name;

    const meta = document.createElement("div");
    meta.className = "exercise-meta";
    meta.textContent = `${exercise.metricType} · ${formatTarget(exercise.targetValue)}`;

    info.appendChild(name);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "exercise-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => editExercise(exercise));

    const upBtn = document.createElement("button");
    upBtn.className = "btn";
    upBtn.textContent = "↑";
    upBtn.disabled = index === 0;
    upBtn.addEventListener("click", () => moveExercise(index, -1));

    const downBtn = document.createElement("button");
    downBtn.className = "btn";
    downBtn.textContent = "↓";
    downBtn.disabled = index === plan.exercises.length - 1;
    downBtn.addEventListener("click", () => moveExercise(index, 1));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      plan.exercises.splice(index, 1);
      saveAndRender();
    });

    actions.appendChild(editBtn);
    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(info);
    item.appendChild(actions);
    exerciseList.appendChild(item);
  });
}

function editExercise(exercise) {
  const nextName = window.prompt("Exercise name", exercise.name);
  if (!nextName) return;
  const nextMetric = window.prompt("Metric type", exercise.metricType) || exercise.metricType;
  const nextTarget = window.prompt("Target value (optional)", exercise.targetValue === "" ? "" : String(exercise.targetValue));

  exercise.name = nextName.trim() || exercise.name;
  exercise.metricType = nextMetric.trim() || exercise.metricType;
  if (nextTarget === null) {
    saveAndRender();
    return;
  }
  const trimmedTarget = nextTarget.trim();
  exercise.targetValue = trimmedTarget === "" ? "" : Number(trimmedTarget);
  saveAndRender();
}

function moveExercise(index, direction) {
  const plan = getActivePlan();
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= plan.exercises.length) return;
  const [item] = plan.exercises.splice(index, 1);
  plan.exercises.splice(newIndex, 0, item);
  saveAndRender();
}

function renderRightTabs() {
  Array.from(rightTabs.querySelectorAll(".tab-btn")).forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === uiState.rightTab);
  });
  todayTab.classList.toggle("hidden", uiState.rightTab !== "today");
  progressTab.classList.toggle("hidden", uiState.rightTab !== "progress");
  renderToday();
  renderProgress();
}

function renderToday() {
  const plan = getActivePlan();
  const date = getTodayDate();
  todayHeader.textContent = `Today: ${date}`;

  const session = state.sessions.find((sess) => sess.planId === plan.id && sess.date === date);
  todayList.innerHTML = "";

  if (plan.exercises.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No exercises in this plan yet.";
    todayList.appendChild(empty);
    todaySummary.textContent = "Completed 0 of 0 exercises today.";
    return;
  }

  plan.exercises.forEach((exercise) => {
    const existing = session?.results.find((result) => result.exerciseId === exercise.id);

    const item = document.createElement("div");
    item.className = "today-item";
    item.dataset.exerciseId = exercise.id;

    const info = document.createElement("div");
    info.className = "today-info";

    const name = document.createElement("div");
    name.className = "exercise-name";
    name.textContent = exercise.name;

    const meta = document.createElement("div");
    meta.className = "today-meta";
    meta.textContent = `${exercise.metricType} · ${formatTarget(exercise.targetValue)}`;

    info.appendChild(name);
    info.appendChild(meta);

    const inputs = document.createElement("div");
    inputs.className = "today-inputs";

    const doneInput = document.createElement("input");
    doneInput.type = "checkbox";
    doneInput.checked = existing?.done || false;
    doneInput.addEventListener("change", updateTodaySummary);

    const valueInput = document.createElement("input");
    valueInput.type = "number";
    valueInput.placeholder = exercise.metricType;
    valueInput.value = existing?.resultValue ?? "";
    valueInput.addEventListener("input", updateTodaySummary);

    const commentInput = document.createElement("input");
    commentInput.type = "text";
    commentInput.placeholder = "Comment";
    commentInput.value = existing?.comment || "";

    inputs.appendChild(doneInput);
    inputs.appendChild(valueInput);
    inputs.appendChild(commentInput);

    item.appendChild(info);
    item.appendChild(inputs);
    todayList.appendChild(item);
  });
  updateTodaySummary();
}

function updateTodaySummary() {
  const items = Array.from(todayList.querySelectorAll(".today-item"));
  const total = items.length;
  const completed = items.filter((item) => item.querySelector("input[type=checkbox]").checked).length;
  todaySummary.textContent = `Completed ${completed} of ${total} exercises today.`;
}

function renderProgress() {
  const plan = getActivePlan();
  progressSelect.innerHTML = "";

  if (plan.exercises.length === 0) {
    progressBody.textContent = "No data yet for this exercise.";
    return;
  }

  plan.exercises.forEach((exercise) => {
    const option = document.createElement("option");
    option.value = exercise.id;
    option.textContent = exercise.name;
    progressSelect.appendChild(option);
  });

  if (!uiState.progressExerciseId || !plan.exercises.some((ex) => ex.id === uiState.progressExerciseId)) {
    uiState.progressExerciseId = plan.exercises[0].id;
  }

  progressSelect.value = uiState.progressExerciseId;
  progressSelect.onchange = () => {
    uiState.progressExerciseId = progressSelect.value;
    persistUi();
    renderProgressBody();
  };

  renderProgressBody();
}

function renderProgressBody() {
  const plan = getActivePlan();
  const exerciseId = uiState.progressExerciseId;

  const sessions = state.sessions
    .filter((sess) => sess.planId === plan.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const hasData = sessions.some((sess) =>
    sess.results.some((result) => result.exerciseId === exerciseId && (result.resultValue !== null || result.done || result.comment))
  );

  if (!hasData) {
    progressBody.textContent = "No data yet for this exercise.";
    return;
  }

  const dates = getLastSevenDates();
  const lastSevenEntries = dates.map((date) => {
    const session = sessions.find((sess) => sess.date === date);
    const result = session?.results.find((res) => res.exerciseId === exerciseId);
    return {
      date,
      value: result?.resultValue ?? null,
    };
  });

  const allValues = sessions
    .map((sess) => sess.results.find((res) => res.exerciseId === exerciseId)?.resultValue)
    .filter((value) => typeof value === "number");
  const lastSevenValues = lastSevenEntries.map((entry) => entry.value).filter((value) => typeof value === "number");

  const fragment = document.createDocumentFragment();

  const title = document.createElement("div");
  title.className = "exercise-name";
  title.textContent = plan.exercises.find((ex) => ex.id === exerciseId)?.name || "";
  fragment.appendChild(title);

  const listTitle = document.createElement("div");
  listTitle.className = "muted";
  listTitle.textContent = "Last 7 days";
  fragment.appendChild(listTitle);

  const list = document.createElement("div");
  list.className = "progress-list";
  lastSevenEntries.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "progress-row";
    row.innerHTML = `<span>${entry.date}</span><span>${entry.value ?? "no entry"}</span>`;
    list.appendChild(row);
  });
  fragment.appendChild(list);

  const averages = document.createElement("div");
  averages.innerHTML = `
    <div>Average (last 7 days): ${formatAverage(average(lastSevenValues))}</div>
    <div>Average (all time): ${formatAverage(average(allValues))}</div>
  `;
  fragment.appendChild(averages);

  progressBody.innerHTML = "";
  progressBody.appendChild(fragment);
}

function getLastSevenDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

function average(values) {
  if (!values.length) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 100) / 100;
}

function formatAverage(value) {
  return value === null ? "N/A" : value;
}

renderUI();
