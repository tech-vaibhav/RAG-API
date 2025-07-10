# main.py

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from auth import router as auth_router, get_current_user
from fastapi.responses import JSONResponse
import os
from fastapi.middleware.cors import CORSMiddleware

from utils import load_and_split
from vectorstore import build_vector_store, search
from llm_wrapper import ask_llm
from database import database
from chat import router as chat_router
from models import messages, conversations

app = FastAPI()

app.include_router(chat_router)
app.include_router(auth_router)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    os.makedirs("documents", exist_ok=True)
    file_path = f"documents/{file.filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    docs = load_and_split(file_path)
    build_vector_store(docs)

    return {"status": "success", "message": "File uploaded and indexed."}

@app.post("/ask/")
async def ask_question(
    question: str = Form(...),
    conversation_id: int = Form(...),
    user=Depends(get_current_user)
):
    # ✅ Verify user owns this conversation
    check_query = conversations.select().where(
        (conversations.c.id == conversation_id) &
        (conversations.c.user_id == user["id"])
    )
    conv = await database.fetch_one(check_query)
    if not conv:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # ✅ Insert user message
    await database.execute(messages.insert().values(
        conversation_id=conversation_id,
        sender="user",
        content=question
    ))

    # ✅ Generate response
    results = search(question)
    context = "\n".join(results)
    full_prompt = f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
    answer = ask_llm(full_prompt)

    # ✅ Insert assistant message
    await database.execute(messages.insert().values(
        conversation_id=conversation_id,
        sender="assistant",
        content=answer
    ))

    return JSONResponse(content={"answer": answer})


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
