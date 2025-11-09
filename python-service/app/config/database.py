from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from typing import Optional

_client: Optional[AsyncIOMotorClient] = None
_database = None


async def connect_database():
    """Connect to MongoDB"""
    global _client, _database
    _client = AsyncIOMotorClient(settings.mongodb_uri)
    _database = _client.get_database()
    print(f"Connected to MongoDB: {settings.mongodb_uri}")


async def close_database():
    """Close MongoDB connection"""
    global _client
    if _client:
        _client.close()
        print("Disconnected from MongoDB")


def get_database():
    """Get database instance"""
    return _database

