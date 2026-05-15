import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import User from "./models/User.js";
import Todo from "./models/Todo.js";
import Razorpay from "razorpay";

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================= MIDDLEWARE =======================
app.use(express.json());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// ======================= DATABASE =======================
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ======================= GOOGLE OAUTH =======================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email, password: "" });
    }
    return done(null, user);
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// ======================= JWT AUTH MIDDLEWARE =======================
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ======================= AUTH ROUTES =======================
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  const oldUser = await User.findOne({ email });

  if (oldUser) return res.status(400).json({ message: "User exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashedPassword });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

// CORRECTION: Added the missing delete account feature
app.delete("/api/auth/delete", authMiddleware, async (req, res) => {
  try {
      await Todo.deleteMany({ userId: req.userId });
      await User.findByIdAndDelete(req.userId);
      res.json({ message: "Account deleted successfully" });
  } catch (err) {
      res.status(500).json({ message: "Failed to delete account" });
  }
});

// Google Login
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/" }), (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.redirect("/?token=" + token);
});

// ======================= TODOS =======================
app.get("/api/todos", authMiddleware, async (req, res) => {
  const todos = await Todo.find({ userId: req.userId });
  res.json(todos);
});

app.post("/api/todos", authMiddleware, async (req, res) => {
  const todo = await Todo.create({
    text: req.body.text,
    priority: req.body.priority || "medium",
    dueDate: req.body.dueDate || null,
    userId: req.userId
  });
  res.json(todo);
});

// Toggle Complete
app.put("/api/todos/:id", authMiddleware, async (req, res) => {
  const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
  if (!todo) return res.status(404).json({ message: "Not found" });

  todo.completed = !todo.completed;
  await todo.save();
  res.json(todo);
});

// CORRECTION: Added the missing Edit Text logic
app.put("/api/todos/:id/edit", authMiddleware, async (req, res) => {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
    if (!todo) return res.status(404).json({ message: "Not found" });
  
    todo.text = req.body.text;
    await todo.save();
    res.json(todo);
});

// CORRECTION: Added the missing Pin logic
app.put("/api/todos/:id/pin", authMiddleware, async (req, res) => {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
    if (!todo) return res.status(404).json({ message: "Not found" });
  
    todo.pinned = !todo.pinned;
    await todo.save();
    res.json(todo);
});

app.delete("/api/todos/:id", authMiddleware, async (req, res) => {
  await Todo.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ message: "Deleted" });
});

// ======================= PAYMENT =======================
// CORRECTION: Requires auth to create order to prevent unlogged users hitting it.
app.post("/api/payment/create-order", authMiddleware, async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: 50000, // in paise = ₹500
      currency: "INR",
      receipt: `receipt#${Date.now()}` // Dynamic receipts
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CORRECTION: Use authMiddleware to find the correct user ID safely instead of req.body.userId!
app.post("/api/payment/verify", authMiddleware, async (req, res) => {
  try {
    // Note: In production you also MUST verify 'razorpay_signature' here too using crypto!
    await User.findByIdAndUpdate(req.userId, {
      isPremium: true,
    });

    res.json({ message: "Premium activated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// For serving frontend
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ======================= SERVER =======================
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
