# Smart Todo App

A full-stack task management web application with secure authentication, premium subscription support, and modern task organization features.

---

## Features Implemented

### User Authentication
- User signup and login using email/password
- Secure JWT-based authentication
- Google OAuth login using Google authentication
- Account deletion support

---

### Task Management
- Create tasks
- Edit tasks
- Delete tasks
- Mark tasks as completed
- Pin important tasks
- Priority levels:
  - High
  - Medium
  - Low
- Due date scheduling
- Task filtering:
  - All
  - Active
  - Completed

---

### User Interface
- Responsive modern UI
- Dark mode toggle
- Profile dropdown menu
- Dynamic task rendering
- Loading states
- Empty-state handling

---

### Premium Subscription System
- Payment integration using Razorpay
- Premium account activation
- Order creation and verification flow

---

### Database Management
- Data storage using MongoDB
- User-specific task isolation
- Mongoose schema models for users and todos

---

### Backend Security
- Password hashing
- JWT authentication middleware
- Environment variable-based secret management
- User validation for premium/payment access

---

### Deployment & DevOps
- Containerized using Docker
- - Production-ready project structure
- `.dockerignore` configured
---

# Tech Stack Used

## Frontend
- HTML
- CSS
- JavaScript

## Backend
- Node.js
- Express.js

## Database
- MongoDB
- Mongoose

## Authentication
- JWT
- bcryptjs
- Google OAuth

## Payments
- Razorpay API
