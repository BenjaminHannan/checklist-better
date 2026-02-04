const STORAGE_KEY = "checklist-calendar-data";
const CLOUD_ENDPOINT_KEY = "checklist-calendar-endpoint";
const SYNC_INTERVAL_MS = 30000;

const monthLabel = document.getElementById("monthLabel");
const calendarGrid = document.getElementById("calendarGrid");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const todayBtn = document.getElementById("todayBtn");
const classList = document.getElementById("classList");
const classForm = document.getElementById("classForm");
const classNameInput = document.getElementById("className");
const classColorInput = document.getElementById("classColor");
const quickAddForm = document.getElementById("quickAddForm");
const quickTitle = document.getElementById("quickTitle");
const quickDate = document.getElementById("quickDate");
const quickClass = document.getElementById("quickClass");
const filterClass = document.getElementById("filterClass");
const hideCompleted = document.getElementById("hideCompleted");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskNotes = document.getElementById("taskNotes");
const taskClass = document.getElementById("taskClass");
const taskDone = document.getElementById("taskDone");
const deleteTask = document.getElementById("deleteTask");
const exportBtn = document.getElementById("exportData");
const importInput = document.getElementById("importData");
const cloudForm = document.getElementById("cloudForm");
const cloudEndpointInput = document.getElementById("cloudEndpoint");
const syncNowBtn = document.getElementById("syncNow");
const syncStatus = document.getElementById("syncStatus");

let currentDate = new Date();
let selectedDate = null;
let editingTaskId = null;

const defaultData = {
  classes: [
    { id: "general", name: "General", color: "#4f46e5" },
  ],
  tasks: [],
  updatedAt: 0,
};

const loadData = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...defaultData };
  try {
    const parsed = JSON.parse(raw);
    return {
      classes: parsed.classes?.length ? parsed.classes : defaultData.classes,
      tasks: parsed.tasks ?? [],
      updatedAt: parsed.updatedAt ?? 0,
    };
  } catch (error) {
    console.error("Failed to parse data", error);
    return { ...defaultData };
  }
};

let data = loadData();
let syncTimer = null;

const getCloudEndpoint = () => localStorage.getItem(CLOUD_ENDPOINT_KEY) || "";

const setSyncStatus = (message, tone = "") => {
  syncStatus.textContent = message;
  syncStatus.classList.remove("connected", "error");
  if (tone) syncStatus.classList.add(tone);
};

const saveData = () => {
  data.updatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const scheduleSync = () => {
  if (!getCloudEndpoint()) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncWithCloud(false);
  }, 1200);
};

const saveDataAndSync = () => {
  saveData();
  scheduleSync();
};

const syncWithCloud = async (showStatus = true) => {
  const endpoint = getCloudEndpoint();
  if (!endpoint) {
    if (showStatus) setSyncStatus("Not connected");
    return;
  }

  if (showStatus) setSyncStatus("Syncing...");

  try {
    const response = await fetch(endpoint, { method: "GET" });
    if (!response.ok) throw new Error("Failed to load");
    const remote = await response.json();
    const remoteUpdated = remote.updatedAt ?? 0;
    const localUpdated = data.updatedAt ?? 0;

    if (remoteUpdated > localUpdated) {
      data = {
        classes: remote.classes?.length ? remote.classes : defaultData.classes,
        tasks: remote.tasks ?? [],
        updatedAt: remoteUpdated,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      renderAll();
      if (showStatus) setSyncStatus("Synced from cloud", "connected");
      return;
    }

    if (localUpdated >= remoteUpdated) {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (showStatus) setSyncStatus("Synced to cloud", "connected");
    }
  } catch (error) {
    console.error(error);
    if (showStatus) setSyncStatus("Sync failed. Check your URL.", "error");
  }
};

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const getMonthDetails = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return {
    year,
    month,
    firstDay,
    lastDay,
    daysInMonth: lastDay.getDate(),
    startWeekday: firstDay.getDay(),
  };
};

const renderClasses = () => {
  classList.innerHTML = "";
  data.classes.forEach((item) => {
    const row = document.createElement("div");
    row.className = "class-chip";
    row.innerHTML = `
      <span>
        <span class="color-dot" style="background:${item.color}"></span>
        ${item.name}
      </span>
      <button data-id="${item.id}" class="ghost" type="button">Remove</button>
    `;
    row.querySelector("button").addEventListener("click", () => removeClass(item.id));
    classList.appendChild(row);
  });

  const options = data.classes.map((item) =>
    `<option value="${item.id}">${item.name}</option>`
  );
  quickClass.innerHTML = options.join("");
  taskClass.innerHTML = options.join("");
  filterClass.innerHTML = `<option value="all">All classes</option>${options.join("")}`;
};

const removeClass = (classId) => {
  if (classId === "general") return;
  data.classes = data.classes.filter((item) => item.id !== classId);
  data.tasks = data.tasks.map((task) =>
    task.classId === classId ? { ...task, classId: "general" } : task
  );
  saveDataAndSync();
  renderAll();
};

const renderCalendar = () => {
  calendarGrid.innerHTML = "";
  const { year, month, daysInMonth, startWeekday } = getMonthDetails(currentDate);
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  monthLabel.textContent = monthName;

  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const todayKey = formatDateKey(new Date());

  for (let cell = 0; cell < totalCells; cell += 1) {
    const dayOffset = cell - startWeekday + 1;
    const date = new Date(year, month, dayOffset);
    const isCurrentMonth = dayOffset > 0 && dayOffset <= daysInMonth;
    const dateKey = formatDateKey(date);

    const dayEl = document.createElement("div");
    dayEl.className = "day";
    if (!isCurrentMonth) dayEl.classList.add("inactive");
    if (dateKey === todayKey) dayEl.classList.add("today");
    dayEl.dataset.date = dateKey;

    const number = document.createElement("div");
    number.className = "day-number";
    number.textContent = date.getDate();
    dayEl.appendChild(number);

    const tasks = filterTasksByDate(dateKey);
    tasks.slice(0, 3).forEach((task) => {
      const pill = document.createElement("div");
      pill.className = "task-pill";
      if (task.done) pill.classList.add("done");
      const classInfo = data.classes.find((item) => item.id === task.classId);
      pill.style.background = classInfo ? `${classInfo.color}22` : "var(--accent)";
      pill.innerHTML = `<span>${task.title}</span>`;
      dayEl.appendChild(pill);
    });

    if (tasks.length > 3) {
      const more = document.createElement("div");
      more.className = "task-pill";
      more.textContent = `+${tasks.length - 3} more`;
      dayEl.appendChild(more);
    }

    dayEl.addEventListener("click", () => openModal(dateKey));
    calendarGrid.appendChild(dayEl);
  }
};

const filterTasksByDate = (dateKey) => {
  const selectedClass = filterClass.value;
  const hideDone = hideCompleted.checked;
  return data.tasks
    .filter((task) => task.date === dateKey)
    .filter((task) => selectedClass === "all" || task.classId === selectedClass)
    .filter((task) => !hideDone || !task.done)
    .sort((a, b) => a.title.localeCompare(b.title));
};

const openModal = (dateKey) => {
  selectedDate = dateKey;
  editingTaskId = null;
  modalTitle.textContent = `Tasks for ${dateKey}`;
  taskForm.reset();
  taskDone.checked = false;
  deleteTask.classList.add("hidden");
  renderModalTasks();
  modal.classList.remove("hidden");
};

const renderModalTasks = () => {
  modalBody.innerHTML = "";
  const tasks = filterTasksByDate(selectedDate);
  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No tasks yet. Add one below!";
    empty.className = "subtitle";
    modalBody.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const row = document.createElement("div");
    row.className = "task-row";
    const classInfo = data.classes.find((item) => item.id === task.classId);
    row.innerHTML = `
      <div>
        <strong>${task.title}</strong><br />
        <small>${classInfo ? classInfo.name : "General"}</small>
      </div>
      <div class="row">
        <button type="button" class="ghost" data-edit="${task.id}">Edit</button>
        <button type="button" class="ghost" data-toggle="${task.id}">${task.done ? "Undo" : "Done"}</button>
      </div>
    `;
    row.querySelector("[data-edit]").addEventListener("click", () => editTask(task.id));
    row.querySelector("[data-toggle]").addEventListener("click", () => toggleTask(task.id));
    modalBody.appendChild(row);
  });
};

const editTask = (taskId) => {
  const task = data.tasks.find((item) => item.id === taskId);
  if (!task) return;
  editingTaskId = taskId;
  taskTitle.value = task.title;
  taskNotes.value = task.notes;
  taskClass.value = task.classId;
  taskDone.checked = task.done;
  deleteTask.classList.remove("hidden");
};

const toggleTask = (taskId) => {
  data.tasks = data.tasks.map((task) =>
    task.id === taskId ? { ...task, done: !task.done } : task
  );
  saveDataAndSync();
  renderAll();
  if (selectedDate) renderModalTasks();
};

const addTask = ({ title, date, classId, notes = "", done = false }) => {
  data.tasks.push({
    id: crypto.randomUUID(),
    title,
    date,
    classId,
    notes,
    done,
  });
};

const updateTask = (taskId, updates) => {
  data.tasks = data.tasks.map((task) =>
    task.id === taskId ? { ...task, ...updates } : task
  );
};

const deleteTaskById = (taskId) => {
  data.tasks = data.tasks.filter((task) => task.id !== taskId);
};

const renderAll = () => {
  renderClasses();
  renderCalendar();
};

classForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = classNameInput.value.trim();
  if (!name) return;
  data.classes.push({
    id: crypto.randomUUID(),
    name,
    color: classColorInput.value,
  });
  classForm.reset();
  classColorInput.value = "#4f46e5";
  saveDataAndSync();
  renderAll();
});

quickAddForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask({
    title: quickTitle.value.trim(),
    date: quickDate.value,
    classId: quickClass.value,
    notes: "",
  });
  quickAddForm.reset();
  saveDataAndSync();
  renderAll();
});

filterClass.addEventListener("change", renderCalendar);
hideCompleted.addEventListener("change", renderCalendar);

prevMonth.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  renderCalendar();
});

nextMonth.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  renderCalendar();
});

todayBtn.addEventListener("click", () => {
  currentDate = new Date();
  renderCalendar();
});

closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.classList.add("hidden");
  }
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!selectedDate) return;
  const payload = {
    title: taskTitle.value.trim(),
    classId: taskClass.value,
    notes: taskNotes.value.trim(),
    done: taskDone.checked,
  };

  if (editingTaskId) {
    updateTask(editingTaskId, payload);
  } else {
    addTask({ ...payload, date: selectedDate });
  }

  saveDataAndSync();
  renderAll();
  renderModalTasks();
  taskForm.reset();
  taskDone.checked = false;
  editingTaskId = null;
  deleteTask.classList.add("hidden");
});

deleteTask.addEventListener("click", () => {
  if (!editingTaskId) return;
  deleteTaskById(editingTaskId);
  saveDataAndSync();
  renderAll();
  renderModalTasks();
  taskForm.reset();
  taskDone.checked = false;
  editingTaskId = null;
  deleteTask.classList.add("hidden");
});

exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "checklist-calendar-data.json";
  link.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    try {
      const imported = JSON.parse(loadEvent.target.result);
      if (imported && imported.classes && imported.tasks) {
        data = {
          classes: imported.classes,
          tasks: imported.tasks,
          updatedAt: imported.updatedAt ?? Date.now(),
        };
        saveDataAndSync();
        renderAll();
      }
    } catch (error) {
      console.error("Invalid import file", error);
    }
  };
  reader.readAsText(file);
  importInput.value = "";
});

cloudForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const endpoint = cloudEndpointInput.value.trim();
  if (!endpoint) return;
  localStorage.setItem(CLOUD_ENDPOINT_KEY, endpoint);
  setSyncStatus("Connected. Syncing...", "connected");
  syncWithCloud(true);
});

syncNowBtn.addEventListener("click", () => syncWithCloud(true));

const initCloud = () => {
  const endpoint = getCloudEndpoint();
  if (endpoint) {
    cloudEndpointInput.value = endpoint;
    setSyncStatus("Connected", "connected");
    syncWithCloud(false);
    setInterval(() => syncWithCloud(false), SYNC_INTERVAL_MS);
  }
};

renderAll();
initCloud();
