# Voices 🚀  
### Full-Stack Poll Creation, Response Collection & Real-Time Analytics Platform

PollPulse is a production-ready full-stack application that allows users to create polls, share them through public links, collect responses, and monitor analytics in real time.

Users can choose whether responses should be anonymous or authenticated, set poll expiry dates, mark questions as required or optional, and publish final results that become publicly visible to anyone with the poll link.

---

## ✨ Features

### 🔐 Authentication & Authorization
- User registration and login
- JWT-based authentication
- Protected dashboard and poll management routes
- Password hashing using bcrypt

### 📝 Poll Creation
- Create polls with multiple questions
- Single-choice questions only
- Add multiple options per question
- Mark questions as required or optional
- Set response mode:
  - Anonymous
  - Authenticated
- Configure poll expiry date/time

### 🌐 Public Poll Links
- Share polls via unique public URLs
- Respondents can submit feedback without logging in (if allowed)
- Automatic validation for required questions
- Prevent submissions after poll expiry

### 📊 Analytics Dashboard
- Total responses
- Anonymous vs authenticated participation
- Question-wise option counts
- Percentage breakdowns
- Recent submissions

### 📢 Publish Results
- Poll creator can publish final results
- Published results become publicly visible on the same poll URL

### ⚡ Real-Time Updates
- Live analytics updates using Socket.IO
- Instant response count updates without page refresh

---

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- React Router DOM
- Socket.IO Client
- Tailwind CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Socket.IO
- CORS
- dotenv

---

## 📁 Project Structure

```text
PollPulse/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── styles.css
│   ├── index.html
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── data/
├── .gitignore
├── package.json
└── README.md