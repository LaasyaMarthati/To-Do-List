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
    document.body.classList.add
