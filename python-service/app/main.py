from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.modules.quiz.router import router as quiz_router
from app.modules.quiz_generation.router import router as quiz_generation_router
from app.modules.quiz_analysis.router import router as quiz_analysis_router
from app.modules.book.router import router as book_router

app = FastAPI(
    title="LearnMe Python Service",
    description="AI agents and quiz management service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health():
    return {"status": "ok", "service": "python-service"}

# Register routers
app.include_router(quiz_router, prefix="/api/quiz", tags=["quiz"])
app.include_router(quiz_generation_router, prefix="/api/quiz/generation", tags=["quiz-generation"])
app.include_router(quiz_analysis_router, prefix="/api/quiz/analysis", tags=["quiz-analysis"])
app.include_router(book_router, prefix="/api/books", tags=["books"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.port)

