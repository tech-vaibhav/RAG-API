# database.py or wherever you define your tables
from sqlalchemy import (
    Table,
    Column,
    String,
    TIMESTAMP,
    MetaData,
    func,
    Integer,
    Text,
    ForeignKey,
)
from datetime import datetime

metadata = MetaData()

# Users table
users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("username", String, unique=True, nullable=False),
    Column("full_name", String, nullable=False),
    Column("hashed_password", String, nullable=False),
    Column("created_at", TIMESTAMP, server_default=func.now()),
    Column("updated_at", TIMESTAMP, server_default=func.now(), onupdate=func.now()),
)

# Conversations table
conversations = Table(
    "conversations",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("created_at", TIMESTAMP, default=datetime.utcnow)
)

# Messages table
messages = Table(
    "messages",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),  # ✅ Add autoincrement
    Column("conversation_id", Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
    Column("sender", String, nullable=False),
    Column("content", Text, nullable=False),
    Column("created_at", TIMESTAMP, default=datetime.utcnow)
)
