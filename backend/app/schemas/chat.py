from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User's question")
    conversation_history: Optional[List[ChatMessage]] = Field(
        default=[], description="Previous messages in the conversation"
    )


class ChatResponse(BaseModel):
    response: str = Field(..., description="AI assistant's response")
    context_used: bool = Field(
        default=True, description="Whether study data context was used"
    )
