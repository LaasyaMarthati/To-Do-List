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

/* TOKEN */
const getToken = () => localStorage.getItem("token");

/* 🌙 DARK MODE */
function toggleDark() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  document.getElementById("darkBtn").textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("darkMode", isDark);
}

window.onload = () => {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    document.getElementById("darkBtn").textContent = "☀️";
  }
  updateAuthUI();
  if (getToken()) fetchTodos();
};

/* AUTH UI */
function updateAuthUI() {
  authSection.style.display = getToken() ? "none" : "block";
  appSection.style.display = getToken() ? "block" : "none";
}

/* AUTH */
async function signup() {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ email: emailInput.value, password: passwordInput.value })
  });
  const data = await res.json();
  localStorage.setItem("token", data.token);
  updateAuthUI();
  fetchTodos();
}

async function login() {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ email: emailInput.value, password: passwordInput.value })
  });
  const data = await res.json();
  localStorage.setItem("token", data.token);
  updateAuthUI();
  fetchTodos();
}

/* 🔓 LOGOUT */
function logout() {
  localStorage.removeItem("token");
  todos = [];
  updateAuthUI();
}

/* ❌ DELETE ACCOUNT */
async function deleteAccount() {
  if (!confirm("Are you sure you want to delete your account?")) return;
  await fetch("/api/auth/delete", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  logout();
}

/* TODOS */
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
  emptyMsg.classList.toggle("hidden", filtered.le
