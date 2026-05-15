let todoInput;
let addBtn;
let todoList;
let filterBtns;
let prioritySelect;
let dueDateInput;
let emailInput;
let passwordInput;
let authSection;
let profileDropdown;
let profileEmail;

let todos = [];
let currentFilter = "all";

// ======================= TOKEN =======================
function getToken() {
  return localStorage.getItem("token");
}

// ======================= PROFILE =======================
function toggleProfileMenu() {
  if (profileDropdown) {
    profileDropdown.classList.toggle("hidden");
  }
}

// ======================= UI =======================
function showApp() {
  const appSection = document.getElementById("app-section");

  if (authSection) authSection.style.display = "none";
  if (appSection) appSection.style.display = "block";
}

function showLogin() {
  const appSection = document.getElementById("app-section");

  if (authSection) authSection.style.display = "block";
  if (appSection) appSection.style.display = "none";
}

function updateAuthUI() {
  if (getToken()) {
    showApp();

    if (profileEmail) {
      profileEmail.innerText = emailInput?.value || "Logged in user";
    }
  } else {
    showLogin();
  }
}

// ======================= PAGE LOAD =======================
document.addEventListener("DOMContentLoaded", async () => {
  // Load elements after DOM ready
  todoInput = document.getElementById("todo-input");
  addBtn = document.getElementById("add-btn");
  todoList = document.getElementById("todo-list");
  filterBtns = document.querySelectorAll(".filter-btn");
  prioritySelect = document.getElementById("priority-select");
  dueDateInput = document.getElementById("due-date");
  emailInput = document.getElementById("email");
  passwordInput = document.getElementById("password");
  authSection = document.getElementById("auth-section");
  profileDropdown = document.getElementById("profile-dropdown");
  profileEmail = document.getElementById("profile-email");

  // ================= GOOGLE LOGIN TOKEN =================
  const params = new URLSearchParams(window.location.search);
  const tokenFromGoogle = params.get("token");

  if (tokenFromGoogle) {
    localStorage.setItem("token", tokenFromGoogle);

    // remove token from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // show correct section
  updateAuthUI();

  if (getToken()) {
    await fetchTodos();
  }

  // Add Todo button
  if (addBtn) {
    addBtn.addEventListener("click", addTodo);
  }

  // Enter key add todo
  if (todoInput) {
    todoInput.addEventListener("keypress", e => {
      if (e.key === "Enter") addTodo();
    });
  }

  // Filter buttons
  if (filterBtns) {
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));

        btn.classList.add("active");
        currentFilter = btn.getAttribute("data-filter");

        renderTodos();
      });
    });
  }

  // Dark mode restore
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");

    const darkToggle = document.querySelector(".dark-toggle");
    if (darkToggle) darkToggle.innerText = "☀️";
  }
});

// ======================= FETCH TODOS =======================
async function fetchTodos() {
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "block";

  try {
    const res = await fetch("/api/todos", {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    todos = await res.json();
    renderTodos();
  } catch (err) {
    console.error("Failed to load todos!", err);
  } finally {
    if (loading) loading.style.display = "none";
  }
}

// ======================= RENDER TODOS =======================
function renderTodos() {
  if (!todoList) return;

  todoList.innerHTML = "";

  const emptyMsg = document.getElementById("empty-msg");

  if (!Array.isArray(todos)) return;

  todos.sort((a, b) => b.pinned - a.pinned);

  const filteredTodos = todos.filter(todo => {
    if (currentFilter === "active") return !todo.completed;
    if (currentFilter === "completed") return todo.completed;
    return true;
  });

  filteredTodos.forEach(todo => {
    const li = document.createElement("li");

    if (todo.completed) li.classList.add("completed");

    li.innerHTML = `
      <div class="todo-left">
        <span class="priority-dot ${todo.priority}"></span>

        <div class="todo-text-wrapper">
          <span id="text-${todo._id}" onclick="toggleTodo('${todo._id}')">
            ${todo.text}
          </span>

          ${
            todo.dueDate
              ? `<small class="due-text">Due: ${new Date(todo.dueDate).toLocaleString()}</small>`
              : ""
          }
        </div>
      </div>

      <div class="todo-actions">
        <button class="pin-btn" onclick="pinTodo('${todo._id}')">
          ${todo.pinned ? "📌" : "📍"}
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

  if (emptyMsg) {
    emptyMsg.style.display = filteredTodos.length === 0 ? "block" : "none";
  }
}

// ======================= ADD TODO =======================
async function addTodo() {
  const text = todoInput?.value.trim();
  const priority = prioritySelect ? prioritySelect.value : "medium";
  const dueDate = dueDateInput ? dueDateInput.value : null;

  if (!text) return;

  try {
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ text, priority, dueDate })
    });

    const newTodo = await res.json();

    todos.unshift(newTodo);

    if (todoInput) todoInput.value = "";
    if (dueDateInput) dueDateInput.value = "";

    renderTodos();
  } catch (err) {
    console.error("Could not add task.");
  }
}

// ======================= TOGGLE TODO =======================
async function toggleTodo(id) {
  try {
    const res = await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const updatedTodo = await res.json();

    todos = todos.map(t => (t._id === id ? updatedTodo : t));
    renderTodos();
  } catch (err) {
    console.error("Operation failed.");
  }
}

// ======================= DELETE TODO =======================
async function deleteTodo(id) {
  if (!confirm("Are you sure?")) return;

  try {
    await fetch(`/api/todos/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    todos = todos.filter(t => t._id !== id);
    renderTodos();
  } catch (err) {
    alert("Could not delete task!");
  }
}

// ======================= EDIT TODO =======================
function editTodo(id) {
  const span = document.getElementById(`text-${id}`);
  if (!span) return;

  const oldText = span.innerText;

  const input = document.createElement("input");
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
      const res = await fetch(`/api/todos/${id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ text: newText })
      });

      const updatedTodo = await res.json();

      todos = todos.map(t => (t._id === id ? updatedTodo : t));
      renderTodos();
    } catch (err) {
      console.error("Could not edit task");
      renderTodos();
    }
  }

  input.addEventListener("keypress", e => {
    if (e.key === "Enter") saveEdit();
  });

  input.addEventListener("blur", saveEdit);
}

// ======================= PIN TODO =======================
async function pinTodo(id) {
  try {
    const res = await fetch(`/api/todos/${id}/pin`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const updatedTodo = await res.json();

    todos = todos.map(t => (t._id === id ? updatedTodo : t));
    renderTodos();
  } catch (err) {
    console.error("Could not pin task");
  }
}

// ======================= SIGNUP =======================
async function signup() {
  const email = emailInput?.value.trim();
  const password = passwordInput?.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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

// ======================= LOGIN =======================
async function login() {
  const email = emailInput?.value.trim();
  const password = passwordInput?.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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

// ======================= LOGOUT =======================
function logout() {
  localStorage.removeItem("token");

  todos = [];
  renderTodos();

  if (profileDropdown) {
    profileDropdown.classList.add("hidden");
  }

  updateAuthUI();
}

// ======================= DELETE ACCOUNT =======================
async function deleteAccount() {
  if (!confirm("This will delete your account and all your todos. Continue?")) return;

  await fetch("/api/auth/delete", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  logout();
}

// ======================= DARK MODE =======================
function toggleDark() {
  document.body.classList.toggle("dark");

  const darkBtn = document.querySelector(".dark-toggle");
  if (!darkBtn) return;

  if (document.body.classList.contains("dark")) {
    darkBtn.innerText = "☀️";
    localStorage.setItem("darkMode", "true");
  } else {
    darkBtn.innerText = "🌙";
    localStorage.setItem("darkMode", "false");
  }
}

// ======================= PAYMENT =======================
const buyBtn = document.getElementById("buyPremium");

if (buyBtn) {
  buyBtn.onclick = async function () {
    const token = getToken();

    if (!token) {
      alert("Log in first!");
      return;
    }

    const orderRes = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const order = await orderRes.json();

    const options = {
      key: enteryourrazpaykey,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,

      handler: async function (response) {
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          })
        });

        if (res.ok) {
          alert("Premium Activated 🎉");
        } else {
          alert("Payment Verification Failed!");
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  };
}

// ======================= GLOBAL FUNCTIONS =======================
window.login = login;
window.signup = signup;
window.logout = logout;
window.deleteAccount = deleteAccount;
window.toggleDark = toggleDark;
window.toggleProfileMenu = toggleProfileMenu;
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
window.editTodo = editTodo;
window.pinTodo = pinTodo;
