# PollPulse — Full-stack Poll Platform

PollPulse is a full-stack poll platform where authenticated creators can build single-choice polls, share public links, collect anonymous or authenticated feedback, watch live analytics and publish final results for anyone visiting the same link.

## Scoring Checklist Coverage

- **Authentication & protected access**: JWT auth, hashed passwords, protected creator dashboard and poll creation routes.
- **Poll creation & question management**: dynamic React poll builder with multiple questions, required/optional toggles and single-choice options.
- **Response collection flow**: public poll pages support anonymous or authenticated submissions with smooth client and server validation.
- **Analytics dashboard**: total responses, anonymous/authenticated participation, question summaries, option counts, percentages and recent participation.
- **Backend architecture & API design**: Express API, route/controller/service layers, Mongoose schemas and MongoDB indexes.
- **Real-time updates**: Socket.io rooms push live analytics updates to the creator dashboard after each response or publish action.
- **Project structure**: frontend and backend live in separate folders inside one repository with separate `.env` templates.

## Project Structure

```text
backend/
  .env.example
  package.json
  src/
    app.js                  Express app, middleware and routes
    server.js               HTTP + Socket.io bootstrap
    config/                 Environment and MongoDB connection
    controllers/            Auth and poll request handlers
    middleware/             Auth and error handling
    models/                 Mongoose User/Poll schemas
    routes/                 Express route modules
    services/               Analytics serialization logic
    socket/                 Socket.io room setup and emit helpers
frontend/
  .env.example
  package.json
  index.html
  src/
    api/                    API client and token helpers
    components/             Layout, protected routes, analytics UI
    context/                Auth context
    pages/                  Login, dashboard, create poll, public poll
    styles.css              Responsive app styling
```

## Tech Stack

- **Frontend**: React 18, Vite, React Router and Socket.io Client.
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.io, JWT, bcryptjs, CORS and dotenv.
- **Database**: MongoDB with Mongoose schemas for users, polls, embedded questions/options and embedded responses.

## Environment Setup

Create separate environment files from the templates:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`backend/.env`

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/pollpulse
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

`frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Run Locally

Install dependencies for each app:

```bash
npm run install:all
```

Start the backend and frontend in two terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Open <http://localhost:5173>.

For production-style hosting, build the frontend and start the backend:

```bash
npm run build
npm start
```

## API Overview

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create a creator/respondent account |
| `POST` | `/api/auth/login` | Public | Log in and receive a JWT |
| `GET` | `/api/auth/me` | Authenticated | Resolve current user |
| `GET` | `/api/polls` | Creator | List polls created by the logged-in user |
| `POST` | `/api/polls` | Creator | Create a poll with questions/options |
| `GET` | `/api/polls/:pollId` | Public | Open a public poll link; includes results after publish |
| `POST` | `/api/polls/:pollId/responses` | Public or authenticated based on poll mode | Submit feedback |
| `GET` | `/api/polls/:pollId/analytics` | Poll creator | View analytics dashboard data |
| `POST` | `/api/polls/:pollId/publish` | Poll creator | Publish final public results |

## MongoDB Schema Design

### User

```js
{
  name: String,
  email: { type: String, unique: true, lowercase: true },
  passwordHash: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Poll

```js
{
  publicId: { type: String, unique: true },
  creator: ObjectId,
  title: String,
  description: String,
  responseMode: 'anonymous' | 'authenticated',
  expiresAt: Date,
  published: Boolean,
  publishedAt: Date | null,
  questions: [
    {
      text: String,
      required: Boolean,
      options: [{ text: String }]
    }
  ],
  responses: [
    {
      respondent: ObjectId | null,
      submittedAt: Date,
      answers: [{ questionId: ObjectId, optionId: ObjectId }]
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

Indexes are defined for `email`, `publicId`, creator dashboards and expiry queries in the Mongoose models.

## Validation Rules

- Backend and frontend both require a poll title, future expiry time and at least one question.
- Each question must have meaningful text and at least two options.
- Required questions must be answered before submission.
- Responses are rejected after expiry or after results are published.
- Authenticated-only polls require a logged-in respondent.
- Authenticated users can submit only once per poll.

## Deployment Notes

- Deploy backend to a Node host such as Render, Railway, Fly.io or a VPS.
- Set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` and optionally `JWT_EXPIRES_IN`.
- Deploy frontend to Vercel/Netlify or build it with `npm run build` and let Express serve `frontend/dist`.
- Update `VITE_API_URL` and `VITE_SOCKET_URL` to the deployed backend URL.

## Submission Links

- **Public GitHub repository**: add your GitHub repository URL here.
- **Deployed project link**: add your deployed URL here.
