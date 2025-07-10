# chat.py
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import List
from database import database
from models import conversations, messages
from auth import get_current_user  

router = APIRouter()

class MessageIn(BaseModel):
    conversation_id: int
    sender: str  # 'user' or 'assistant'
    content: str

@router.post("/conversations/")
async def create_conversation(user=Depends(get_current_user)):
    query = conversations.insert().values(user_id=user["id"])
    conversation_id = await database.execute(query)
    return {"conversation_id": conversation_id}

@router.get("/conversations/")
async def list_conversations(user=Depends(get_current_user)):
    query = conversations.select().where(conversations.c.user_id == user["id"])
    return await database.fetch_all(query)


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: int, user=Depends(get_current_user)):
    # ✅ Verify ownership
    check = conversations.select().where(
        (conversations.c.id == conversation_id) &
        (conversations.c.user_id == user["id"])
    )
    conv = await database.fetch_one(check)
    if not conv:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # ✅ Return messages
    query = messages.select().where(messages.c.conversation_id == conversation_id)
    return await database.fetch_all(query)


@router.put("/conversations/{conversation_id}")
async def update_chat_title(conversation_id: int, title: str = Body(embed=True), user: dict = Depends(get_current_user)):
    # Check conversation ownership
    query = conversations.select().where(
        conversations.c.id == conversation_id,
        conversations.c.user_id == user["id"]
    )
    chat = await database.fetch_one(query)
    if not chat:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Update title
    update_query = conversations.update().where(
        conversations.c.id == conversation_id
    ).values(title=title)
    await database.execute(update_query)

    return {"message": "Title updated successfully"}