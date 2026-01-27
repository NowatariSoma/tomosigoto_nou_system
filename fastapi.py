import os
from datetime import datetime
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/todo")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class Task(Base):
    __tablename__ = "Task"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Pydantic schemas
class TaskCreateRequest(BaseModel):
    title: str

class TaskUpdateRequest(BaseModel):
    title: str
    completed: bool

class TaskResponse(BaseModel):
    id: int
    title: str
    completed: bool

# App
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# タスク一覧を取得
@app.get("/api/tasks")
async def get_tasks():
    db = SessionLocal()
    try:
        tasks = db.query(Task).order_by(Task.id).all()
        return [{"id": t.id, "title": t.title, "completed": t.completed} for t in tasks]
    finally:
        db.close()

# 特定のタスクを取得
@app.get("/api/tasks/{task_id}")
async def get_task(task_id: int):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()

        if not task:
            return JSONResponse(
                status_code=404,
                content={"message": "指定されたタスクが見つかりません"}
            )

        return {"id": task.id, "title": task.title, "completed": task.completed}
    finally:
        db.close()

# 新しいタスクを作成
@app.post("/api/tasks", status_code=201)
async def create_task(request: TaskCreateRequest):
    db = SessionLocal()
    try:
        task = Task(title=request.title)
        db.add(task)
        db.commit()
        db.refresh(task)

        return {"id": task.id, "title": task.title, "completed": task.completed}
    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={"message": "タスクの作成に失敗しました"}
        )
    finally:
        db.close()

# タスクを削除
@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: int):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()

        if not task:
            return JSONResponse(
                status_code=404,
                content={"message": "指定されたタスクが見つかりません"}
            )

        db.delete(task)
        db.commit()

        return {"message": "削除しました"}
    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={"message": "タスクの削除に失敗しました"}
        )
    finally:
        db.close()

# TODO: 先輩からの引き継ぎメモ
# PUT /api/tasks/{task_id} を実装してください
# フロントエンドは { title: string, completed: boolean } を送ります

@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
