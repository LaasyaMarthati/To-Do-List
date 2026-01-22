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

function toggleProfileMenu() {
  profileDropdown.classList.toggle("hidden");
}

let todos = []; // Local copy of tasks
let currentFilter = 'all';

// 1. Fetch Todos from Backend on load
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();

  if (getToken()) {
    fetchTodos();
  }

  // Load saved dark mode preference
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    document.querySelector(".dark-toggle").innerText = "☀️";
  }
});

async function fetchTodos() {
  const loading = document.getElementById('loading');
  loading.style.display = "block";

  try {
    const res = await fetch('/api/todos', {
      headers: {
        "Authorization": Bearer ${getToken()}
      }
    });

    todos = await res.json();
    renderTodos();

  } catch (err) {
    console.error("Failed to load todos!");
    console.error('Error fetching todos:', err);
  } finally {
    loading.style.display = "none";
  }
}

// 2. Render Todos to the Screen
function renderTodos() {
  todoList.innerHTML = ''; // Clear current list
  const emptyMsg = document.getElementById('empty-msg');

  todos.sort((a, b) => b.pinned - a.pinned);

  // Filter logic
  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true; // 'all'
  });

  filteredTodos.forEach(todo => {
    const li = document.createElement('li');

    if (todo.completed) li.classList.add('completed');

    li.innerHTML = `
      <div class="todo-left">
        <span class="priority-dot ${todo.priority}"></span>

        <div class="todo-text-wrapper">
          <span id="text-${todo._id}" onclick="toggleTodo('${todo._id}')">
            ${todo.text}
          </span>

          ${
            todo.dueDate
              ? `<small class="due-text">
                  Due: ${new Date(todo.dueDate).toLocaleString()}
                </small>`
              : ''
          }
        </div>
      </div>

      <div class="todo-actions">
        <button class="pin-btn" onclick="pinTodo('${todo._id}')">
          ${todo.pinned ? '📌' : '📍'}
        </button>

        <button class="edit-btn" onclick="editTodo('${todo._id}')">
          <i class="fas fa-pen"></i>
        </button>

        <button class="delete-btn" onclick="deleteTodo('${todo._id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    todoList.appendChild(li);
  });

  if (filteredTodos.length === 0) {
    emptyMsg.style.display = "block";
  } else {
    emptyMsg.style.display = "none";
  }
}

// 3. Add New Task
addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTodo();
});

async function addTodo() {
  const text = todoInput.value.trim();
  const priority = prioritySelect.value;
  const dueDate = dueDateInput.value || null;

  if (!text) return;

  try {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Bearer ${getToken()}
      },
      body: JSON.stringify({ text, priority, dueDate })
    });

    dueDateInput.value = '';
    const newTodo = await res.json();

    todos.unshift(newTodo);
    todoInput.value = '';
    renderTodos();

  } catch (err) {
    console.error("Could not add task.");
  }
}

// 4. Toggle Complete Status
async function toggleTodo(id) {
  try {
    const res = await fetch(/api/todos/${id}, {
      method: 'PUT',
      headers: {
        "Authorization": Bearer ${getToken()}
      }
    });

    const updatedTodo = await res.json();

    todos = todos.map(t =>
      t._id === id ? updatedTodo : t
    );

    renderTodos();

  } catch (err) {
    console.error("Operation failed.");
  }
}

// 5. Delete Task
async function deleteTodo(id) {
  if (!confirm('Are you sure?')) return;

  try {
    await fetch(/api/todos/${id}, {
      method: 'DELETE',
      headers: {
        "Authorization": Bearer ${getToken()}
      }
    });

    todos = todos.filter(t => t._id !== id);
    renderTodos();

  } catch (err) {
    alert("Could not delete task!");
  }
}

// 6. Filter Buttons Logic
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentFilter = btn.getAttribute('data-filter');
    renderTodos();
  });
});

function editTodo(id) {
  const span = document.getElementById(text-${id});
  const oldText = span.innerText;

  const input = document.createElement('input');
  input.value = oldText;
  input.className = "edit-input";

  span.replaceWith(input);
  input.focus();

  async function saveEdit() {
    const newText = input.value.trim();

    if (!newText) {
      renderTodos();
      return;
    }

    try {
      const res = await fetch(/api/todos/${id}/edit, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': Bearer ${getToken()}
        },
        body: JSON.stringify({ text: newText })
      });

      const updatedTodo = await res.json();

      todos = todos.map(t =>
        t._id === id ? updatedTodo : t
      );

      renderTodos();

    } catch (err) {
      console.error("Could not edit task");
      renderTodos();
    }
  }

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEdit();
  });

  input.addEventListener('blur', saveEdit);
}

async function pinTodo(id) {
  try {
    const res = await fetch(/api/todos/${id}/pin, {
      method: 'PUT',
      headers: {
        "Authorization": Bearer ${getToken()}
      }
    });

    const updatedTodo = await res.json();

    todos = todos.map(t =>
      t._id === id ? updatedTodo : t
    );

    renderTodos();

  } catch (err) {
    console.error("Could not pin task");
  }
}

async function signup() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    localStorage.setItem("token", data.token);
    updateAuthUI();
    fetchTodos();

  } catch (err) {
    alert("Signup failed. Try again.");
  }
}

async function login() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    localStorage.setItem("token", data.token);
    updateAuthUI();
    fetchTodos();

  } catch (err) {
    alert("Login failed. Try again.");
  }
}

function logout() {
  localStorage.removeItem("token");
  todos = [];
  renderTodos();
  profileDropdown.classList.add("hidden");
  updateAuthUI();
}

async function deleteAccount() {
  if (!confirm("This will delete your account and all your todos. Continue?")) return;

  await fetch("/api/auth/delete", {
    method: "DELETE",
    headers: {
      "Authorization": Bearer ${getToken()}
    }
  });

  logout();
}

function updateAuthUI() {
  const token = getToken();
  const authSection = document.getElementById("auth-section");
  const appSection = document.getElementById("app-section");

  if (token) {
    authSection.style.display = "none";
    appSection.style.display = "block";
    profileDropdown.classList.add("hidden");
    profileEmail.innerText = emailInput.value || "Logged in user";
  } else {
    authSection.style.display = "block";
    appSection.style.display = "none";
  }
}

// ===== DARK MODE FUNCTION =====
function toggleDark() {
  document.body.classList.toggle("dark");

  const darkBtn = document.querySelector(".dark-toggle");

  if (document.body.classList.contains("dark")) {
    darkBtn.innerText = "☀️";
    localStorage.setItem('darkMode', 'true');
  } else {
    darkBtn.innerText = "🌙";
    localStorage.setItem('darkMode', 'false');
  }
}
