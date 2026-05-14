# PollPulse — Full-stack Poll Platform

PollPulse is a hackathon-ready full-stack platform for creating single-choice polls, sharing public links, collecting feedback, viewing live analytics and publishing final results.

## Features

- **Authentication**: creators can register, log in and manage protected poll dashboards.
- **Poll builder**: logged-in users can create polls with multiple single-choice questions.
- **Mandatory or optional questions**: each question can be marked required or optional, with validation on both the browser and server.
- **Anonymous or authenticated response modes**: creators decide whether the public poll accepts anonymous submissions or requires respondents to log in.
- **Shareable public links**: each poll has a public `#/poll/:id` link for respondents.
- **Expiry enforcement**: every poll has an expiry timestamp; expired polls no longer accept submissions.
- **Response collection**: respondents can open the shared link, answer questions and submit feedback smoothly.
- **Analytics dashboard**: creators can view total responses, anonymous/authenticated participation, question summaries, option counts and percentages.
- **Published final results**: creators can publish final outcomes so anyone visiting the same poll link can view summaries.
- **Live updates**: native WebSocket updates refresh response counts and analytics without reloading.
- **Single repository**: backend, frontend and documentation live in this repository.

## Tech Stack

- **Backend**: Node.js HTTP server, REST-style JSON APIs, file-backed JSON database, HMAC-signed JWT-compatible tokens, PBKDF2 password hashing and native WebSocket broadcasting.
- **Frontend**: React 18 loaded in the browser, dynamic form builder, protected route handling, public poll pages and live analytics views.
- **Storage**: `data/db.json` is created automatically on first run for users, polls, questions, options and responses.

> The implementation avoids external runtime dependencies so it can run in restricted hackathon environments where package registries are unavailable.

## Getting Started

### Prerequisites

- Node.js 18 or newer

### Run locally

```bash
npm start
```

Open <http://localhost:3000>.

### Optional syntax check

```bash
npm run check
```

## Usage Flow

1. Register or log in.
2. Create a poll from the dashboard.
3. Add one or more questions and at least two options per question.
4. Mark each question mandatory or optional.
5. Choose anonymous responses or authenticated-only responses.
6. Set an expiry date/time in the future.
7. Share the generated public poll link.
8. Watch the analytics dashboard update live as responses arrive.
9. Publish final results when complete; the same public link will show the outcome.

## API Overview

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create a user account |
| `POST` | `/api/auth/login` | Public | Log in and receive a token |
| `GET` | `/api/me` | Authenticated | Resolve current user |
| `POST` | `/api/polls` | Authenticated | Create a poll with questions/options |
| `GET` | `/api/polls` | Authenticated | List creator's polls |
| `GET` | `/api/polls/:id` | Public | Load a public poll; includes results after publish |
| `POST` | `/api/polls/:id/responses` | Public or authenticated depending on poll mode | Submit feedback |
| `GET` | `/api/polls/:id/analytics` | Poll creator | View analytics dashboard data |
| `POST` | `/api/polls/:id/publish` | Poll creator | Publish final public results |

## Database Shape

`data/db.json` contains:

```json
{
  "users": [
    { "id": "...", "name": "...", "email": "...", "passwordHash": "...", "createdAt": "..." }
  ],
  "polls": [
    {
      "id": "...",
      "creatorId": "...",
      "title": "...",
      "description": "...",
      "responseMode": "anonymous",
      "expiresAt": "...",
      "published": false,
      "questions": [
        { "id": "...", "text": "...", "required": true, "options": [{ "id": "...", "text": "..." }] }
      ],
      "responses": [
        { "id": "...", "userId": null, "createdAt": "...", "answers": [{ "questionId": "...", "optionId": "..." }] }
      ]
    }
  ]
}
```

## Deployment

Deploy the repository to any Node-compatible host such as Render, Railway, Fly.io or a VPS.

- Start command: `npm start`
- Port: set by the platform via `PORT`, defaults to `3000`
- Recommended environment variable: `JWT_SECRET=<strong-random-secret>`

## Submission Links

- **Public GitHub repository**: add your GitHub repository URL here.
- **Deployed project link**: add your deployed URL here.
