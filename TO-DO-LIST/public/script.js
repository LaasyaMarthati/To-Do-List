const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const prioritySelect = document.getElementById('priority-select');
const dueDateInput = document.getElementById('due-date');
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authSection = document.getElementById("auth-section");
const profileDropdown = document.getElementById("profile-dropdown");
const profileEmail = document.getElementById("profile-email");

function getToken() {
  return localStorage.getItem("token");
}

let todos = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  if (getToken()) fetchTodos();

  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    document.querySelector(".dark-toggle").innerText = "☀️";
  }
});

async function fetchTodos() {
  const res = await fetch('/api/todos', {
    headers: { "Authorization": `Bearer ${getToken()}` }
  });
  todos = await res.json();
  renderTodos();
}

/* ===== RENDER TODOS WITH CHECKBOX ===== */
function renderTodos() {
  todoList.innerHTML = '';
  const emptyMsg = document.getElementById('empty-msg');

  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });

  filteredTodos.forEach(todo => {
    const li = document.createElement('li');

    li.innerHTML = `
      <input type="checkbox"
        ${todo.completed ? "checked" : ""}
        onclick="completeViaCheckbox('${todo._id}', ${todo.completed})"
      />

      <span class="priority-dot ${todo.priority}"></span>

      <span>${todo.text}</span>

      <div class="todo-actions">
        <button onclick="pinTodo('${todo._id}')">${todo.pinned ? '📌' : '📍'}</button>
        <button onclick="editTodo('${todo._id}')">✏️</button>
        <button onclick="deleteTodo('${todo._id}')">🗑</button>
      </div>
    `;

    todoList.appendChild(li);
  });

  emptyMsg.style.display = filteredTodos.length === 0 ? "block" : "none";
}

/* ===== COMPLETE VIA CHECKBOX ===== */
async function completeViaCheckbox(id, alreadyCompleted) {
  if (alreadyCompleted) return;

  alert("🎉 Yay! Task completed");

  const res = await fetch(`/api/todos/${id}`, {
    method: 'PUT',
    headers: { "Authorization": `Bearer ${getToken()}` }
  });

  const updatedTodo = await res.json();
  todos = todos.map(t => t._id === id ? updatedTodo : t);
  renderTodos();
}

/* ===== ADD TODO ===== */
addBtn.addEventListener('click', async () => {
  const text = todoInput.value.trim();
  if (!text) return;

  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ text })
  });

  const newTodo = await res.json();
  todos.unshift(newTodo);
  todoInput.value = '';
  renderTodos();
});

/* ===== FILTERS ===== */
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

function updateAuthUI() {
  if (getToken()) {
    authSection.style.display = "none";
    document.getElementById("app-section").style.display = "block";
  } else {
    authSection.style.display = "block";
    document.getElementById("app-section").style.display = "none";
  }
}

function toggleDark() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}
