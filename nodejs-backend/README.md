# LearnMe Node.js Backend

Node.js backend for LearnMe application using Express.js and MongoDB.

## 📁 Project Structure

```
nodejs-backend/
├── src/
│   ├── models/          # MongoDB models (Mongoose schemas)
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── middlewares/     # Express middlewares
├── index.js             # Application entry point
├── package.json         # Dependencies and scripts
└── .env                 # Environment variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (running on localhost:27017)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health check

### Content Management
- `POST /api/content/extract-topics` - Extract topics from documentation URL (proxies to Python service)
- `GET /api/content` - List all content inputs
- `POST /api/content` - Create new content input
- `GET /api/content/:id` - Get content input by ID
- `PATCH /api/content/:id` - Update content input
- `DELETE /api/content/:id` - Delete content input

## 🗄️ Database

- **Database Name**: `learnme`
- **Connection**: MongoDB local server (default: `mongodb://localhost:27017/learnme`)

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/learnme` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `JWT_SECRET` | JWT secret key for token signing | (required) |
| `PYTHON_SERVICE_URL` | Python FastAPI service URL | `http://localhost:8000` |

## 🔧 Development

### Scripts

- `npm start` - Start server in production mode
- `npm run dev` - Start server in development mode with nodemon

## 🔗 Python Service Integration

The Node.js backend integrates with the Python FastAPI service for AI-powered operations:

- **Topic Extraction**: `POST /api/content/extract-topics` proxies to Python service
- **Quiz Generation**: Quiz generation endpoints proxy to Python service
- **Quiz Analysis**: Quiz analysis proxies to Python service

Make sure the Python service is running on `http://localhost:8000` (or configure `PYTHON_SERVICE_URL`).

## 🛠️ Technologies

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **dotenv** - Environment variables
- **cors** - CORS middleware

