// ====================== IMPORTS ======================
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "./models/User.js";
import Todo from './models/Todo.js';

dotenv.config();

// ====================== CONFIG ======================
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Current Directory:", __dirname);
console.log("Looking for public folder at:", path.join(__dirname, 'public'));

const app = express();

// ====================== MIDDLEWARE ======================
app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.static(path.join(__dirname, 'public')));

// ====================== AUTH MIDDLEWARE ======================
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ====================== DATABASE ======================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ====================== AUTH ROUTES ======================
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Account already exists. Please login." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found. Please signup first." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

// ====================== TODO ROUTES ======================

// GET todos (only this user's)
app.get('/api/todos', authMiddleware, async (req, res) => {
  const todos = await Todo.find({ userId: req.userId })
    .sort({ pinned: -1, createdAt: -1 });

  res.json(todos);
});

// CREATE todo
app.post('/api/todos', authMiddleware, async (req, res) => {
  try {
    const { text, priority, dueDate } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Todo text is required" });
    }

    const newTodo = new Todo({
      text,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      userId: req.userId
    });

    const savedTodo = await newTodo.save();
    res.json(savedTodo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create todo" });
  }
});

// TOGGLE complete (only this user's todo)
app.put('/api/todos/:id', authMiddleware, async (req, res) => {
  const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });

  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  todo.completed = !todo.completed;
  await todo.save();
  res.json(todo);
});

// EDIT todo
app.put('/api/todos/:id/edit', authMiddleware, async (req, res) => {
  const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });

  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  if (!req.body.text) {
    return res.status(400).json({ message: "Text required" });
  }

  todo.text = req.body.text;
  await todo.save();
  res.json(todo);
});

// PIN todo
app.put('/api/todos/:id/pin', authMiddleware, async (req, res) => {
  const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });

  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  todo.pinned = !todo.pinned;
  await todo.save();
  res.json(todo);
});

// DELETE todo
app.delete('/api/todos/:id', authMiddleware, async (req, res) => {
  const todo = await Todo.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId
  });

  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  res.json({ message: 'Task deleted' });
});

app.delete("/api/auth/delete", authMiddleware, async (req, res) => {
  await User.findByIdAndDelete(req.userId);
  await Todo.deleteMany({ userId: req.userId });
  res.json({ message: "Account deleted" });
});


// ====================== FRONTEND FALLBACK ======================
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
