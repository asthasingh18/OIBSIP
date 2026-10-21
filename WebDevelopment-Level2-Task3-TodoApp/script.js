
/* =========================================
   DAYORA — DAILY TASK PLANNER
   Task management + Local Storage
========================================= */

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const addTaskBtn = document.getElementById("add-task-btn");
const formMessage = document.getElementById("form-message");

const pendingList = document.getElementById("pending-list");
const completedList = document.getElementById("completed-list");

const pendingEmpty = document.getElementById("pending-empty");
const completedEmpty = document.getElementById("completed-empty");

const pendingCount = document.getElementById("pending-count");
const completedCount = document.getElementById("completed-count");

const totalPending = document.getElementById("total-pending");
const totalCompleted = document.getElementById("total-completed");

const STORAGE_KEY = "dayora_tasks";

let tasks = loadTasks();

/* -----------------------------------------
   Load tasks from localStorage
----------------------------------------- */

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (!savedTasks) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        // Ignore malformed entries instead of breaking the app.
        return parsedTasks.filter((task) => {
            return (
                task &&
                typeof task.id === "string" &&
                typeof task.text === "string" &&
                task.text.trim().length > 0 &&
                typeof task.completed === "boolean"
            );
        }).map((task) => ({
            id: task.id,
            text: task.text,
            completed: task.completed,
            createdAt: task.createdAt || new Date().toISOString(),
            completedAt: task.completedAt || null
        }));
    } catch (error) {
        console.error("Could not load saved tasks:", error);
        return [];
    }
}

/* -----------------------------------------
   Save tasks to localStorage
----------------------------------------- */

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Could not save tasks:", error);
        showMessage(
            "Your changes could not be saved. Check your browser storage settings."
        );
        return false;
    }
}

/* -----------------------------------------
   Generate unique task IDs
----------------------------------------- */

function createTaskId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* -----------------------------------------
   Display friendly messages
----------------------------------------- */

function showMessage(message) {
    formMessage.textContent = message;
}

/* -----------------------------------------
   Format timestamps
----------------------------------------- */

function formatTimestamp(timestamp) {
    if (!timestamp) {
        return "";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

/* -----------------------------------------
   Create a new task
----------------------------------------- */

function addTask(event) {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (!text) {
        showMessage("Please enter a task before adding it.");
        taskInput.focus();
        return;
    }

    if (text.length > 200) {
        showMessage("Tasks must be 200 characters or fewer.");
        return;
    }

    const newTask = {
        id: createTaskId(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    tasks.unshift(newTask);

    saveTasks();
    renderTasks();

    taskInput.value = "";
    taskInput.focus();
    showMessage("");
}

/* -----------------------------------------
   Mark a task complete or pending
----------------------------------------- */

function toggleTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) {
        return;
    }

    task.completed = !task.completed;

    if (task.completed) {
        task.completedAt = new Date().toISOString();
    } else {
        task.completedAt = null;
    }

    saveTasks();
    renderTasks();
}

/* -----------------------------------------
   Edit a task
----------------------------------------- */

function editTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) {
        return;
    }

    const taskItem = document.querySelector(
        `[data-task-id="${CSS.escape(taskId)}"]`
    );

    if (!taskItem) {
        return;
    }

    const content = taskItem.querySelector(".task-content");
    const actions = taskItem.querySelector(".task-actions");

    if (!content || !actions) {
        return;
    }

    // Preserve the original task text in case editing is cancelled.
    const originalText = task.text;

    content.replaceChildren();

    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "task-edit-input";
    editInput.value = originalText;
    editInput.maxLength = 200;
    editInput.setAttribute("aria-label", "Edit task");

    const editActions = document.createElement("div");
    editActions.className = "edit-actions";

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Save";
    saveButton.setAttribute("aria-label", "Save task changes");

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.className = "cancel-edit";

    cancelButton.setAttribute("aria-label", "Cancel task editing");

    editActions.append(saveButton, cancelButton);
    content.append(editInput, editActions);

    // Hide task actions while editing.
    actions.hidden = true;

    function cancelEditing() {
        renderTasks();
    }

    function saveEditing() {
        const updatedText = editInput.value.trim();

        if (!updatedText) {
            showMessage("A task cannot be empty.");
            editInput.focus();
            return;
        }

        if (updatedText.length > 200) {
            showMessage("Tasks must be 200 characters or fewer.");
            editInput.focus();
            return;
        }

        task.text = updatedText;

        saveTasks();
        renderTasks();
        showMessage("");
    }

    saveButton.addEventListener("click", saveEditing);
    cancelButton.addEventListener("click", cancelEditing);

    editInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            saveEditing();
        }

        if (event.key === "Escape") {
            cancelEditing();
        }
    });

    editInput.focus();
    editInput.select();
}

/* -----------------------------------------
   Delete a task
----------------------------------------- */

function deleteTask(taskId) {
    const taskExists = tasks.some((task) => task.id === taskId);

    if (!taskExists) {
        return;
    }

    tasks = tasks.filter((task) => task.id !== taskId);

    saveTasks();
    renderTasks();
    showMessage("");
}

/* -----------------------------------------
   Build a task card safely
----------------------------------------- */

function createTaskElement(task) {
    const listItem = document.createElement("li");
    listItem.className = "task-item";
    listItem.dataset.taskId = task.id;

    const taskMain = document.createElement("div");
    taskMain.className = "task-main";

    const checkButton = document.createElement("button");
    checkButton.type = "button";
    checkButton.className = "task-check";
    checkButton.textContent = task.completed ? "✓" : "";
    checkButton.setAttribute(
        "aria-label",
        task.completed
            ? "Mark task as pending"
            : "Mark task as complete"
    );
    checkButton.setAttribute(
        "aria-pressed",
        String(task.completed)
    );

    checkButton.addEventListener("click", () => {
        toggleTask(task.id);
    });

    const taskContent = document.createElement("div");
    taskContent.className = "task-content";

    const taskText = document.createElement("p");
    taskText.className = "task-text";
    taskText.textContent = task.text;

    taskContent.appendChild(taskText);

    const createdTime = document.createElement("span");
    createdTime.className = "task-time";
    createdTime.textContent = `Added ${formatTimestamp(task.createdAt)}`;

    taskContent.appendChild(createdTime);

    if (task.completed && task.completedAt) {
        const completedTime = document.createElement("span");
        completedTime.className = "task-time";
        completedTime.textContent =
            `Completed ${formatTimestamp(task.completedAt)}`;

        taskContent.appendChild(completedTime);
    }

    taskMain.append(checkButton, taskContent);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "task-action";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit task: ${task.text}`);

    editButton.addEventListener("click", () => {
        editTask(task.id);
    });

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "task-action complete-action";
    toggleButton.textContent = task.completed ? "Undo" : "Complete";
    toggleButton.setAttribute(
        "aria-label",
        task.completed
            ? `Move ${task.text} back to pending`
            : `Complete ${task.text}`
    );

    toggleButton.addEventListener("click", () => {
        toggleTask(task.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "task-action delete-action";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute(
        "aria-label",
        `Delete task: ${task.text}`
    );

    deleteButton.addEventListener("click", () => {
        deleteTask(task.id);
    });

    actions.append(editButton, toggleButton, deleteButton);
    listItem.append(taskMain, actions);

    return listItem;
}

/* -----------------------------------------
   Render both task lists and update counts
----------------------------------------- */

function renderTasks() {
    const pendingTasks = tasks.filter((task) => !task.completed);
    const completedTasks = tasks.filter((task) => task.completed);

    // Clear old task cards.
    pendingList.replaceChildren();
    completedList.replaceChildren();

    // Render pending tasks.
    pendingTasks.forEach((task) => {
        pendingList.appendChild(createTaskElement(task));
    });

    // Render completed tasks.
    completedTasks.forEach((task) => {
        completedList.appendChild(createTaskElement(task));
    });

    // Update the individual list counters.
    pendingCount.textContent =
        `${pendingTasks.length} pending`;

    completedCount.textContent =
        `${completedTasks.length} completed`;

    // Update the overview counters.
    totalPending.textContent = pendingTasks.length;
    totalCompleted.textContent = completedTasks.length;

    // Show empty states only when their lists are empty.
    pendingEmpty.hidden = pendingTasks.length > 0;
    completedEmpty.hidden = completedTasks.length > 0;
}

/* -----------------------------------------
   Register events and initialize the app
----------------------------------------- */

taskForm.addEventListener("submit", addTask);

renderTasks();
