import os
import logging
import json
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from groq import AsyncGroq

router = APIRouter(prefix="/api/chat", tags=["Chat"])
logger = logging.getLogger(__name__)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    history: List[ChatMessage]
    context: Dict[str, Any]

class ChatResponse(BaseModel):
    reply: str

SYSTEM_PROMPT = """You are a helpful and knowledgeable travel assistant for 'Green & Inclusive Travel', a sustainable and accessible travel platform in India.
Your job is to answer user questions about their current travel options and their selected cart.

You have access to the current context (the user's transport options, selected choices, emissions data, costs, etc.). 
Use this data to give precise, actionable insights. Do not make up prices or times; only use the data provided in the context.
If asked to compare, highlight trade-offs (e.g., cheaper but more CO2, faster but less accessible).

CRITICAL FORMATTING INSTRUCTIONS:
1. DO NOT use markdown formatting (no asterisks, no bolding, no hashes). Use plain text only. 
2. Refer to options by their descriptive names (e.g., "Option 1 (Car)", "The flight option") rather than internal IDs like 'cand_0'.
3. Structure your response systematically:
   - Use double newlines to separate paragraphs.
   - Use hyphens (-) for list items if comparing multiple options.
   - Always include a final "Conclusion:" or "Summary:" paragraph at the end.
"""

@router.post("/transport", response_model=ChatResponse)
async def chat_transport(payload: ChatRequest) -> ChatResponse:
    """Answers questions based on the transport options currently on screen."""
    api_key = os.getenv("GROQ_API_KEY")
    model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    
    if not api_key:
        return ChatResponse(reply="I'm sorry, I cannot connect to my AI brain right now (Missing API Key).")
        
    client = AsyncGroq(api_key=api_key)
    
    # Compress context so we don't blow up the context window
    # In a real app we'd carefully strip out massive nested polylines.
    clean_context = {}
    if "results" in payload.context:
        # Just send high-level metrics for each result
        for idx, r in enumerate(payload.context["results"]):
            mode_name = r.get("mode", "route").capitalize()
            clean_context.setdefault("available_options", []).append({
                "name": f"Option {idx + 1} ({mode_name})",
                "cost_inr": r.get("cost_inr"),
                "duration_minutes": r.get("duration_minutes"),
                "emissions_kg_co2": r.get("emissions", {}).get("co2e_kg", 0),
                "transfer_count": r.get("transfer_count", 0),
                "accessibility": r.get("accessibility", {}).get("value"),
            })
    if "selectedOption" in payload.context and payload.context["selectedOption"]:
        r = payload.context["selectedOption"]
        mode_name = r.get("mode", "route").capitalize()
        clean_context["selected_option"] = {
            "name": f"Selected ({mode_name})",
            "cost_inr": r.get("cost_inr"),
            "duration_minutes": r.get("duration_minutes"),
            "emissions_kg_co2": r.get("emissions", {}).get("co2e_kg", 0),
            "transfer_count": r.get("transfer_count", 0),
        }
        
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + f"\n\nCURRENT CONTEXT:\n{json.dumps(clean_context, indent=2)}"}
    ]
    
    # Add history
    for msg in payload.history[-5:]: # Only keep last 5 for context limit
        messages.append({"role": msg.role, "content": msg.content})
        
    messages.append({"role": "user", "content": payload.query})

    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.3,
            max_tokens=500
        )
        reply = response.choices[0].message.content or "I couldn't process that right now."
        return ChatResponse(reply=reply)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return ChatResponse(reply="Sorry, I ran into an error while thinking about that.")
