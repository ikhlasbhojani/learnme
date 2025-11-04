# LearnMe Backend

Express + MongoDB API serving the LearnMe frontend. The backend is organised module-wise so each feature keeps its model, validation, service, controller, and routes together.

## Folder Structure

```
src/
├── app.ts             # Express application factory
├── server.ts          # Bootstrap (DB + HTTP server)
├── config/            # Environment + database helpers
├── middlewares/       # Shared Express middlewares
├── modules/           # Feature modules
│   ├── auth/          # Signup/login/profile APIs
│   ├── content/       # Learning content ingestion APIs
│   └── quiz/          # Quiz lifecycle + assessment APIs
└── utils/             # Cross-cutting helpers (e.g., AppError)
```

Each module typically bundles:

- `*.model.ts` – Mongoose schemas/models
- `*.validation.ts` – Zod request validators
- `*.service.ts` – Business logic
- `*.controller.ts` – Express handlers
- `*.routes.ts` – Route definitions mounted under `/api/<module>`

## Getting Started

```bash
cd backend
npm install
copy env.example .env          # PowerShell / CMD
# or: cp env.example .env      # macOS / Linux
npm run dev
```

Environment variables available in `env.example`:

- `PORT` – HTTP port (default 5000)
- `MONGODB_URI` – Mongo connection string (local dev uses `mongodb://127.0.0.1:27017/learnme`)
- `JWT_SECRET` – Token signing secret
- `CORS_ORIGIN` – Allowed frontend origin (default `http://localhost:5173`)

## Available Scripts

- `npm run dev` – Start in watch mode with `tsx`
- `npm run build` – Type-check and emit compiled JS to `dist`
- `npm start` – Run compiled build (requires `npm run build` first)

## REST Endpoints (Summary)

- `POST /api/auth/signup` – Create account, set auth cookie
- `POST /api/auth/login` – Login and receive auth cookie
- `POST /api/auth/logout` – Clear auth session
- `GET /api/auth/me` – Fetch current user profile
- `PATCH /api/auth/me` – Update theme preferences
- `GET /api/content-inputs` – List learning content sources
- `POST /api/content-inputs` – Create content (manual/url/file metadata)
- `GET /api/content-inputs/:id` – Fetch single content item
- `PATCH /api/content-inputs/:id` – Update content metadata
- `DELETE /api/content-inputs/:id` – Remove content
- `POST /api/quizzes` – Create quiz with configuration + optional content
- `POST /api/quizzes/:id/start` – Start quiz session
- `POST /api/quizzes/:id/answer` – Submit answer for a question
- `POST /api/quizzes/:id/pause` / `resume` – Manage pause lifecycle
- `POST /api/quizzes/:id/finish` – Complete quiz and compute score
- `POST /api/quizzes/:id/expire` – Mark quiz expired (timer)
- `GET /api/quizzes/:id/assessment` – View generated assessment
- `GET /api/quizzes/:id` / `GET /api/quizzes` – Fetch quiz details/list

All protected routes expect a valid JWT token (stored in an HTTP-only cookie by default, or supplied as a `Bearer` header).

