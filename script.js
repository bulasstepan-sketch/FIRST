const STORAGE_KEY = "valorantTrainingData";

const uiState = {
  activePlanId: null,
  rightTab: "today",
  editingPlanId: null,
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

function renderUI() {
  renderPlanTabs();
  renderExercises();
  renderRightTabs();
}

function renderPlanTabs() {
  planTabs.innerHTML = "";
  state.plans.forEach((plan) => {
    const tabWrapper = document.createElement("div");
    tabWrapper.className = "plan-tab";

    if (uiState.editingPlanId === plan.id) {
      const input = document.createElement("input");
      input.type = "text";
      input.value = plan.name;
      input.addEventListener("change", () => {
        plan.name = input.value.trim() || plan.name;
        uiState.editingPlanId = null;
        saveAndRender();
      });
      input.addEventListener("blur", () => {
        uiState.editingPlanId = null;
        renderPlanTabs();
      });
      tabWrapper.appendChild(input);
    } else {
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
      renameBtn.addEventListener("click", () => {
        uiState.editingPlanId = plan.id;
        renderPlanTabs();
      });

      tabWrapper.appendChild(tabBtn);
      tabWrapper.appendChild(renameBtn);
    }

    planTabs.appendChild(tabWrapper);
  });
}

function renderExercises() {
  const plan = getActivePlan();
  exerciseList.innerHTML = "";
  plan.exercises.forEach((exercise, index) => {
    const item = document.createElement("div");
    item.className = "exercise-item";

    const fields = document.createElement("div");
    fields.className = "exercise-fields";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = exercise.name;
    nameInput.addEventListener("change", () => {
      exercise.name = nameInput.value.trim() || exercise.name;
      saveAndRender();
    });

    const metricInput = document.createElement("input");
    metricInput.type = "text";
    metricInput.value = exercise.metricType;
    metricInput.addEventListener("change", () => {
      exercise.metricType = metricInput.value.trim() || exercise.metricType;
      saveAndRender();
    });

    const targetInput = document.createElement("input");
    targetInput.type = "number";
    targetInput.placeholder = "Target";
    targetInput.value = exercise.targetValue === "" ? "" : exercise.targetValue;
    targetInput.addEventListener("change", () => {
      const next = targetInput.value.trim();
      exercise.targetValue = next === "" ? "" : Number(next);
      saveAndRender();
    });

    fields.appendChild(nameInput);
    fields.appendChild(metricInput);
    fields.appendChild(targetInput);

    const actions = document.createElement("div");
    actions.className = "exercise-actions";

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

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(fields);
    item.appendChild(actions);
    exerciseList.appendChild(item);
  });
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

  plan.exercises.forEach((exercise) => {
    const existing = session?.results.find((result) => result.exerciseId === exercise.id);

    const item = document.createElement("div");
    item.className = "today-item";
    item.dataset.exerciseId = exercise.id;

    const doneInput = document.createElement("input");
    doneInput.type = "checkbox";
    doneInput.checked = existing?.done || false;
    doneInput.addEventListener("change", updateTodaySummary);

    const fields = document.createElement("div");
    fields.className = "today-fields";

    const nameLabel = document.createElement("div");
    nameLabel.textContent = exercise.name;

    const valueInput = document.createElement("input");
    valueInput.type = "number";
    valueInput.placeholder = exercise.metricType;
    valueInput.value = existing?.resultValue ?? "";
    valueInput.addEventListener("input", updateTodaySummary);

    const commentInput = document.createElement("input");
    commentInput.type = "text";
    commentInput.placeholder = "Comment";
    commentInput.value = existing?.comment || "";

    fields.appendChild(nameLabel);
    fields.appendChild(valueInput);
    fields.appendChild(commentInput);

    item.appendChild(doneInput);
    item.appendChild(fields);
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

  const entries = sessions
    .map((sess) => {
      const result = sess.results.find((res) => res.exerciseId === exerciseId);
      if (!result) return null;
      return {
        date: sess.date,
        value: result.resultValue,
      };
    })
    .filter(Boolean);

  if (entries.length === 0) {
    progressBody.textContent = "No data yet for this exercise.";
    return;
  }

  const lastSeven = entries.slice(0, 7);
  const lastSevenValues = lastSeven.map((entry) => entry.value).filter((value) => typeof value === "number");
  const allValues = entries.map((entry) => entry.value).filter((value) => typeof value === "number");

  const lastSevenAvg = average(lastSevenValues);
  const allTimeAvg = average(allValues);

  const fragment = document.createDocumentFragment();
  const listTitle = document.createElement("div");
  listTitle.textContent = "Last 7 days:";
  fragment.appendChild(listTitle);

  lastSeven.forEach((entry) => {
    const row = document.createElement("div");
    row.textContent = `${entry.date}: ${entry.value ?? "—"}`;
    fragment.appendChild(row);
  });

  const lastSevenLine = document.createElement("div");
  lastSevenLine.textContent = lastSevenAvg === null ? "Average (last 7 days): N/A" : `Average (last 7 days): ${lastSevenAvg}`;
  fragment.appendChild(lastSevenLine);

  const allTimeLine = document.createElement("div");
  allTimeLine.textContent = allTimeAvg === null ? "Average (all time): N/A" : `Average (all time): ${allTimeAvg}`;
  fragment.appendChild(allTimeLine);

  progressBody.innerHTML = "";
  progressBody.appendChild(fragment);
}

function average(values) {
  if (!values.length) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 100) / 100;
}

renderUI();
