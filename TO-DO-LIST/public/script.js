const todoInput = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const todoList = document.getElementById("todo-list");
const filterBtns = document.querySelectorAll(".filter-btn");
const prioritySelect = document.getElementById("priority-select");
const dueDateInput = document.getElementById("due-date");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");

const loading = document.getElementById("loading");
const emptyMsg = document.getElementById("empty-msg");

let todos = [];
let currentFilter = "all";

/* ===== TOKEN ===== */
function getToken() {
  return localStorage.getItem("token");
}

/* ===== DARK MODE ===== */
function toggleDark() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  document.getElementById("darkBtn").textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("darkMode", isDark);
}

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    document.getElementById("darkBtn").textContent = "☀️";
  }
  updateAuthUI();
  if (getToken()) fetchTodos();
});

/* ===== AUTH UI ===== */
function updateAuthUI() {
  if (getToken()) {
    authSection.style.display = "none";
    appSection.style.display = "block";
  } else {
    authSection.style.display = "block";
    appSection.style.display = "none";
  }
}

/* ===== AUTH ===== */
async function signup() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return alert("Enter credentials");

  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.message);

  localStorage.setItem("token", data.token);
  updateAuthUI();
  fetchTodos();
}

async function login() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return alert("Enter credentials");

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.message);

  localStorage.setItem("token", data.token);
  updateAuthUI();
  fetchTodos();
}

/* ===== TODOS ===== */
async function fetchTodos() {
  loading.classList.remove("hidden");
  const res = await fetch("/api/todos", {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  todos = await res.json();
  renderTodos();
  loading.classList.add("hidden");
}

function renderTodos() {
  todoList.innerHTML = "";

  const filtered = todos.filter(t =>
    currentFilter === "all" ||
    (currentFilter === "active" && !t.completed) ||
    (currentFilter === "completed" && t.completed)
  );

  emptyMsg.classList.toggle("hidden", filtered.length !== 0);

  filtered.forEach(t => {
    const li = document.createElement("li");
    li.className = t.completed ? "completed" : "";
    li.innerHTML = `
      <span onclick="toggleTodo('${t._id}')">${t.text}</span>
      <button onclick="deleteTodo('${t._id}')"><i class="fas fa-trash"></i></button>
    `;
    todoList.appendChild(li);
  });
}

addBtn.onclick = async () => {
  if (!todoInput.value.trim()) return;
  const res = await fetch("/api/todos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      text: todoInput.value,
      priority: prioritySelect.value,
      dueDate: dueDateInput.value || null
    })
  });
  todos.unshift(await res.json());
  todoInput.value = "";
  dueDateInput.value = "";
  renderTodos();
};

async function toggleTodo(id) {
  const res = await fetch(`/api/todos/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  const updated = await res.json();
  todos = todos.map(t => t._id === id ? updated : t);
  renderTodos();
}

async function deleteTodo(id) {
  await fetch(`/api/todos/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  todos = todos.filter(t => t._id !== id);
  renderTodos();
}

filterBtns.forEach(btn => {
  btn.onclick = () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTodos();
  };
});
