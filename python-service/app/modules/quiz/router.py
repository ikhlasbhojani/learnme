from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    """Quiz module health check"""
    return {"status": "ok", "module": "quiz"}

