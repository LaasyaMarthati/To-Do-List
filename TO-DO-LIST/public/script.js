const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const prioritySelect = document.getElementById('priority-select');
const dueDateInput = document.getElementById('due-date');

let todos = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
  }
  fetchTodos();
});

async function fetchTodos() {
  const res = await fetch('/api/todos', {
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  });
  todos = await res.json();
  renderTodos();
}

function renderTodos() {
  todoList.innerHTML = '';

  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });

  filteredTodos.forEach(todo => {
    const li = document.createElement('li');

    li.innerHTML = `
      <input type="checkbox"
        class="todo-checkbox"
        ${todo.completed ? 'checked' : ''}
        onclick="completeTask('${todo._id}')">

      <span class="priority-dot ${todo.priority}"></span>

      <span>${todo.text}</span>

      <div class="todo-actions">
        <button onclick="editTodo('${todo._id}')">
          <i class="fas fa-pen"></i>
        </button>
        <button onclick="deleteTodo('${todo._id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    todoList.appendChild(li);
  });
}

/* ✅ COMPLETE TASK WITH MESSAGE */
async function completeTask(id) {
  await toggleTodo(id);
  alert("🎉 Yay! Task completed!");
  currentFilter = 'completed';
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-filter="completed"]').classList.add('active');
}

/* BACKEND STATUS TOGGLE (UNCHANGED) */
async function toggleTodo(id) {
  const res = await fetch(`/api/todos/${id}`, {
    method: 'PUT',
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  });
  const updated = await res.json();
  todos = todos.map(t => t._id === id ? updated : t);
  renderTodos();
}

/* ADD TODO */
addBtn.addEventListener('click', async () => {
  if (!todoInput.value.trim()) return;

  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({
      text: todoInput.value,
      priority: prioritySelect.value,
      dueDate: dueDateInput.value || null
    })
  });

  const newTodo = await res.json();
  todos.unshift(newTodo);
  todoInput.value = '';
  renderTodos();
});

/* DELETE */
async function deleteTodo(id) {
  await fetch(`/api/todos/${id}`, {
    method: 'DELETE',
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  });
  todos = todos.filter(t => t._id !== id);
  renderTodos();
}

/* FILTERS */
filterBtns.forEach(btn => {
  btn.onclick = () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTodos();
  };
});
