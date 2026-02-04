const STORAGE_KEY = "checklistBetterData";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const dayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const state = {
  classes: [],
  items: [],
  selectedDate: formatDate(new Date()),
  currentMonth: new Date(),
  filterClassId: "all",
};

const classForm = document.getElementById("classForm");
const classNameInput = document.getElementById("className");
const classColorInput = document.getElementById("classColor");
const classList = document.getElementById("classList");
const classFilter = document.getElementById("classFilter");
const itemForm = document.getElementById("itemForm");
const itemTitle = document.getElementById("itemTitle");
const itemTime = document.getElementById("itemTime");
const itemClass = document.getElementById("itemClass");
const itemNotes = document.getElementById("itemNotes");
const itemList = document.getElementById("itemList");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const selectedDateStats = document.getElementById("selectedDateStats");
const calendarGrid = document.getElementById("calendarGrid");
const monthLabel = document.getElementById("monthLabel");
const monthStats = document.getElementById("monthStats");
const agendaList = document.getElementById("agendaList");
const progressBar = document.getElementById("progressBar");
const progressLabel = document.getElementById("progressLabel");

const exportButton = document.getElementById("exportData");
const importInput = document.getElementById("importData");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    state.classes = [
      { id: crypto.randomUUID(), name: "General", color: "#4f46e5" },
      { id: crypto.randomUUID(), name: "Math", color: "#06b6d4" },
      { id: crypto.randomUUID(), name: "History", color: "#f97316" },
    ];
    state.items = [];
    saveState();
    return;
  }
  const parsed = JSON.parse(stored);
  state.classes = parsed.classes || [];
  state.items = parsed.items || [];
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    classes: state.classes,
    items: state.items,
  }));
}

function renderClasses() {
  classList.innerHTML = "";
  state.classes.forEach((klass) => {
    const li = document.createElement("li");
    li.className = "class-card";
    li.innerHTML = `
      <div class="class-card__info">
        <span class="color-dot" style="background:${klass.color}"></span>
        <div>
          <strong>${klass.name}</strong>
        </div>
      </div>
      <button class="link-button" data-remove-class="${klass.id}">Remove</button>
    `;
    classList.appendChild(li);
  });

  const filterOptions = [
    { id: "all", name: "All classes" },
    ...state.classes,
  ];
  classFilter.innerHTML = filterOptions
    .map(
      (option) =>
        `<option value="${option.id}">${option.name}</option>`
    )
    .join("");
  classFilter.value = state.filterClassId;

  itemClass.innerHTML = state.classes
    .map(
      (klass) =>
        `<option value="${klass.id}">${klass.name}</option>`
    )
    .join("");
}

function renderCalendar() {
  calendarGrid.innerHTML = "";
  weekdays.forEach((day) => {
    const label = document.createElement("div");
    label.textContent = day;
    label.className = "calendar__weekday";
    calendarGrid.appendChild(label);
  });

  const firstDayOfMonth = new Date(
    state.currentMonth.getFullYear(),
    state.currentMonth.getMonth(),
    1
  );
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = new Date(
    state.currentMonth.getFullYear(),
    state.currentMonth.getMonth() + 1,
    0
  ).getDate();

  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  const monthTasks = state.items.filter((item) =>
    item.date.startsWith(formatDate(firstDayOfMonth).slice(0, 7))
  );
  const completedInMonth = monthTasks.filter((item) => item.done).length;
  monthLabel.textContent = monthFormatter.format(state.currentMonth);
  monthStats.textContent = `${completedInMonth}/${monthTasks.length} completed`;

  for (let cell = 0; cell < totalCells; cell += 1) {
    const dayOffset = cell - startDay + 1;
    const date = new Date(
      state.currentMonth.getFullYear(),
      state.currentMonth.getMonth(),
      dayOffset
    );
    const isCurrentMonth = dayOffset > 0 && dayOffset <= daysInMonth;
    const dateString = formatDate(date);
    const dayItems = state.items.filter((item) => {
      const isSameDay = item.date === dateString;
      const matchesFilter =
        state.filterClassId === "all" || item.classId === state.filterClassId;
      return isSameDay && matchesFilter;
    });
    const dayClasses = [...new Set(dayItems.map((item) => item.classId))]
      .map((classId) => state.classes.find((klass) => klass.id === classId))
      .filter(Boolean);

    const dayCell = document.createElement("div");
    dayCell.className = "calendar__day";
    if (!isCurrentMonth) {
      dayCell.classList.add("calendar__day--muted");
    }
    if (dateString === state.selectedDate) {
      dayCell.classList.add("calendar__day--selected");
    }
    dayCell.innerHTML = `
      <div class="calendar__day-number">${date.getDate()}</div>
      <div class="calendar__dots">
        ${dayClasses
          .slice(0, 4)
          .map(
            (klass) =>
              `<span class="color-dot" style="background:${klass.color}"></span>`
          )
          .join("")}
      </div>
      <div class="calendar__badge">${dayItems.length} items</div>
    `;
    dayCell.addEventListener("click", () => {
      state.selectedDate = dateString;
      renderAll();
    });
    calendarGrid.appendChild(dayCell);
  }
}

function renderItems() {
  const itemsForDay = state.items.filter(
    (item) => item.date === state.selectedDate
  );
  selectedDateLabel.textContent = dayFormatter.format(
    new Date(state.selectedDate)
  );
  const completedCount = itemsForDay.filter((item) => item.done).length;
  selectedDateStats.textContent = `${completedCount}/${itemsForDay.length} completed`;

  itemList.innerHTML = "";
  if (itemsForDay.length === 0) {
    itemList.innerHTML = "<li class=\"muted\">No items yet. Add your first task above.</li>";
    return;
  }

  itemsForDay
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
    .forEach((item) => {
      const klass = state.classes.find((entry) => entry.id === item.classId);
      const li = document.createElement("li");
      li.className = "item-card";
      li.innerHTML = `
        <div class="item-card__header">
          <label class="item-card__title">
            <input type="checkbox" data-toggle="${item.id}" ${
              item.done ? "checked" : ""
            } />
            ${item.title}
          </label>
          <span class="badge" style="border-color:${klass?.color}">${
            klass?.name || "Class"
          }</span>
        </div>
        <div class="item-card__meta">
          ${item.time ? `<span>⏰ ${item.time}</span>` : ""}
          ${item.notes ? `<span>📝 ${item.notes}</span>` : ""}
        </div>
        <div class="item-card__actions">
          <button class="link-button" data-copy="${item.id}">Copy</button>
          <button class="link-button" data-remove="${item.id}">Delete</button>
        </div>
      `;
      itemList.appendChild(li);
    });
}

function renderAgenda() {
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 7);
  const upcoming = state.items
    .filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= new Date(formatDate(today)) && itemDate <= endDate;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  agendaList.innerHTML = "";
  if (upcoming.length === 0) {
    agendaList.innerHTML = "<li class=\"muted\">Nothing coming up. Add tasks to fill your week.</li>";
  } else {
    upcoming.forEach((item) => {
      const klass = state.classes.find((entry) => entry.id === item.classId);
      const li = document.createElement("li");
      li.className = "agenda-item";
      li.innerHTML = `
        <strong>${item.title}</strong>
        <span class="muted">${dayFormatter.format(new Date(item.date))}</span>
        <span class="badge" style="border-color:${klass?.color}">${
          klass?.name || "Class"
        }</span>
      `;
      agendaList.appendChild(li);
    });
  }

  const totalItems = state.items.length;
  const completed = state.items.filter((item) => item.done).length;
  const progress = totalItems === 0 ? 0 : Math.round((completed / totalItems) * 100);
  progressBar.style.width = `${progress}%`;
  progressLabel.textContent = `${progress}% completion rate`;
}

function renderAll() {
  renderClasses();
  renderCalendar();
  renderItems();
  renderAgenda();
}

classForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = classNameInput.value.trim();
  if (!name) return;
  state.classes.push({
    id: crypto.randomUUID(),
    name,
    color: classColorInput.value,
  });
  classNameInput.value = "";
  saveState();
  renderAll();
});

classList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const classId = button.dataset.removeClass;
  if (!classId) return;
  state.classes = state.classes.filter((klass) => klass.id !== classId);
  state.items = state.items.map((item) =>
    item.classId === classId ? { ...item, classId: state.classes[0]?.id } : item
  );
  saveState();
  renderAll();
});

classFilter.addEventListener("change", (event) => {
  state.filterClassId = event.target.value;
  renderCalendar();
});

itemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = itemTitle.value.trim();
  if (!title) return;
  state.items.push({
    id: crypto.randomUUID(),
    date: state.selectedDate,
    title,
    time: itemTime.value,
    classId: itemClass.value,
    notes: itemNotes.value.trim(),
    done: false,
  });
  itemTitle.value = "";
  itemTime.value = "";
  itemNotes.value = "";
  saveState();
  renderAll();
});

itemList.addEventListener("click", (event) => {
  const toggle = event.target.closest("input[data-toggle]");
  if (toggle) {
    const id = toggle.dataset.toggle;
    state.items = state.items.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    saveState();
    renderAll();
    return;
  }
  const removeButton = event.target.closest("button[data-remove]");
  if (removeButton) {
    const id = removeButton.dataset.remove;
    state.items = state.items.filter((item) => item.id !== id);
    saveState();
    renderAll();
    return;
  }
  const copyButton = event.target.closest("button[data-copy]");
  if (copyButton) {
    const id = copyButton.dataset.copy;
    const item = state.items.find((entry) => entry.id === id);
    if (!item) return;
    const copy = { ...item, id: crypto.randomUUID(), date: state.selectedDate };
    state.items.push(copy);
    saveState();
    renderAll();
  }
});

prevMonth.addEventListener("click", () => {
  state.currentMonth = new Date(
    state.currentMonth.getFullYear(),
    state.currentMonth.getMonth() - 1,
    1
  );
  renderCalendar();
});

nextMonth.addEventListener("click", () => {
  state.currentMonth = new Date(
    state.currentMonth.getFullYear(),
    state.currentMonth.getMonth() + 1,
    1
  );
  renderCalendar();
});

exportButton.addEventListener("click", () => {
  const data = JSON.stringify({
    exportedAt: new Date().toISOString(),
    classes: state.classes,
    items: state.items,
  });
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `checklist-better-${formatDate(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state.classes = parsed.classes || state.classes;
      state.items = parsed.items || state.items;
      saveState();
      renderAll();
    } catch (error) {
      alert("Could not import that file. Try exporting again.");
    }
  };
  reader.readAsText(file);
});

loadState();
renderAll();
