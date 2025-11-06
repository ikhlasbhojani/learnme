# LearnMe - Modern Learning Application

A beautiful, modern learning application where students can easily learn any topic and become experts.

## Features

- 🔐 Authentication (Signup/Login)
- 🏠 Beautiful animated home page
- 📚 Multiple content input options (URL, File Upload, Manual Input)
- 🎯 Multiple learning modes (MCQs, Notes, Q&A, Mind Map)
- ⏱️ Timed MCQ quizzes with difficulty levels
- 📊 Assessment and performance tracking

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- Framer Motion (animations)
- Vitest (testing)
- ESLint & Prettier

## Getting Started

### Frontend (Vite + React)

All frontend tooling now lives in the `frontend/` directory. Run the commands below from that folder.

```bash
cd frontend
npm install
npm run dev
```

Other scripts:

- `npm run build`
- `npm test`
- `npm run lint`
- `npm run format`

### Backend (Express + MongoDB)

The backend lives in `backend/` and exposes REST APIs used by the frontend flows.

```bash
cd backend
npm install
copy env.example .env  # configure PORT, MONGODB_URI, JWT_SECRET if needed
npm run dev
```

Useful scripts:

- `npm run build`
- `npm start`

## Project Structure

```
learnme/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types/
│   │   ├── styles/
│   │   └── test/
│   ├── package.json
│   └── vite.config.ts
│
└── backend/
    ├── env.example
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── app.ts
        ├── server.ts
        ├── config/
        │   ├── database.ts
        │   └── env.ts
        ├── middlewares/
        ├── modules/
        │   ├── auth/
        │   ├── content/
        │   └── quiz/
        └── utils/
```
