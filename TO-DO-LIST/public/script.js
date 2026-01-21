const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const prioritySelect = document.getElementById('priority-select');
const dueDateInput = document.getElementById('due-date');
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const profileDropdown = document.getElementById("profile-dropdown");
const profileEmail = document.getElementById("profile-email");

function getToken() {
  return localStorage.getItem("token");
}

function toggleProfileMenu() {
  profileDropdown.classList.toggle("hidden");
}

/* ===== DARK MODE ===== */
function toggleDark() {
  document.body.classList.toggle("dark");
  const darkBtn = document.getElementById("darkBtn");

  if (document.body.classList.contains("dark")) {
    darkBtn.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    darkBtn.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
}

let todos = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();

  const savedTheme = localStorage.getItem("theme");
  const darkBtn = document.getElementById("darkBtn");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    darkBtn.textContent = "☀️";
  }

  if (getToken()) {
    fetchTodos();
  }
});

async function fetchTodos() {
  const res = await fetch('/api/todos', {
    headers: { "Authorization": `Bearer ${getToken()}` }
  });
  todos = await res.json();
  renderTodos();
}

function renderTodos() {
  todoList.innerHTML = '';
  const emptyMsg = document.getElementById('empty-msg');

  const filtered = todos.filter(t => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  filtered.forEach(todo => {
    const li = document.createElement('li');
    if (todo.completed) li.classList.add('completed');

    li.innerHTML = `
      <span class="priority-dot ${todo.priority}"></span>
      <span onclick="toggleTodo('${todo._id}')">${todo.text}</span>
      <div class="todo-actions">
        <button onclick="deleteTodo('${todo._id}')">🗑</button>
      </div>
    `;

    todoList.appendChild(li);
  });

  emptyMsg.style.display = filtered.length ? "none" : "block";
}

addBtn.addEventListener('click', addTodo);

async function addTodo() {
  if (!todoInput.value.trim()) return;

  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      text: todoInput.value,
      priority: prioritySelect.value,
      dueDate: dueDateInput.value || null
    })
  });

  todos.unshift(await res.json());
  todoInput.value = '';
  dueDateInput.value = '';
  renderTodos();
}

async function toggleTodo(id) {
  await fetch(`/api/todos/${id}`, {
    method: 'PUT',
    headers: { "Authorization": `Bearer ${getToken()}` }
  });
  fetchTodos();
}

async function deleteTodo(id) {
  await fetch(`/api/todos/${id}`, {
    method: 'DELETE',
    headers: { "Authorization": `Bearer ${getToken()}` }
  });
  todos = todos.filter(t => t._id !== id);
  renderTodos();
}

filterBtns.forEach(btn => {
  btn.onclick = () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTodos();
  };
});

function updateAuthUI() {
  const authSection = document.getElementById("auth-section");
  const appSection = document.getElementById("app-section");

  if (getToken()) {
    authSection.style.display = "none";
    appSection.style.display = "block";
  } else {
    authSection.style.display = "block";
    appSection.style.display = "none";
  }
}
