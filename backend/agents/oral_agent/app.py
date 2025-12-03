# =============================================================================
# FILE: app.py - Flask API for Dental Specialist Agent (Optimized)
# =============================================================================

import os
import json
from flask import Flask, request, jsonify
from typing import TypedDict, Annotated, Literal
from datetime import datetime
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from vertexai.preview import generative_models
from vertexai import init

app = Flask(__name__)

# Initialize Vertex AI
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "adsp-34002-ip07-visionary-ai")
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
init(project=PROJECT_ID, location=LOCATION)

# =============================================================================
# STATE DEFINITION
# =============================================================================

class DentalState(TypedDict):
    """State for the dental consultation workflow"""
    chat_history: Annotated[list, "Chat history in standard format"]
    age: Annotated[str, "Patient's age"]
    gender: Annotated[str, "Patient's gender"]
    dental_history: Annotated[str, "Previous dental issues or treatments"]
    smoking_status: Annotated[str, "Smoking or tobacco use"]
    affected_area: Annotated[str, "Location of dental concern (tooth number, gums, etc)"]
    symptoms: Annotated[dict, "Symptoms (pain, sensitivity, swelling, bleeding, discoloration)"]
    duration: Annotated[str, "How long the condition has been present"]
    other_information: Annotated[str, "Any other relevant information"]
    information_complete: Annotated[bool, "Whether all required info is collected"]
    next_action: Annotated[str, "Next action to take"]
    current_response: Annotated[str, "Current agent response"]
    should_end: Annotated[bool, "Whether to end the conversation"]

# =============================================================================
# COMBINED AGENT FUNCTION (SINGLE API CALL)
# =============================================================================

def process_user_message_combined(state: DentalState, user_message: str) -> DentalState:
    """
    Process user message with a SINGLE Gemini API call that:
    1. Extracts information
    2. Assesses completeness
    3. Generates next question or image request
    """
    model = generative_models.GenerativeModel("gemini-2.0-flash-exp")
    
    # Format chat history for context
    chat_context = "\n".join([
        f"{msg['role']}: {msg['content']}" 
        for msg in state.get('chat_history', [])[-5:]
    ])
    
    combined_prompt = f"""
You are a dental AI assistant. Process the user's message in ONE response.

CURRENT PATIENT INFORMATION:
- Age: {state.get('age', 'Not provided')}
- Gender: {state.get('gender', 'Not provided')}
- Dental history: {state.get('dental_history', 'Not provided')}
- Smoking status: {state.get('smoking_status', 'Not provided')}
- Affected area: {state.get('affected_area', 'Not provided')}
- Symptoms: {json.dumps(state.get('symptoms', {}), indent=2)}
- Duration: {state.get('duration', 'Not provided')}
- Other info: {state.get('other_information', 'Not provided')}

RECENT CONVERSATION:
{chat_context}

USER'S LATEST MESSAGE: "{user_message}"

TASK: Return a JSON object with three sections:

1. EXTRACTED_INFO: Extract any new information from the user's message
2. ASSESSMENT: Determine if we have enough information
3. RESPONSE: Generate the appropriate response (question or image request)

REQUIRED INFORMATION:
- Age (must have)
- Gender (must have)
- Affected area (must have - e.g., upper left molar, front tooth, gums, jaw)
- At least one symptom: pain, sensitivity, swelling, bleeding, discoloration, looseness (must have at least one)

OPTIONAL INFORMATION:
- Dental history (previous treatments, cavities, gum disease, etc)
- Smoking status
- Duration

Return ONLY this JSON structure:
{{
    "extracted_info": {{
        "age": "<age if mentioned, else null>",
        "gender": "<gender if mentioned, else null>",
        "dental_history": "<previous dental issues if mentioned, else null>",
        "smoking_status": "<yes/no/quit if mentioned, else null>",
        "affected_area": "<specific tooth/area if mentioned, else null>",
        "symptoms": {{
            "pain": "<yes/no/severity if mentioned, else null>",
            "sensitivity": "<yes/no/to what (hot/cold/sweet) if mentioned, else null>",
            "swelling": "<yes/no if mentioned, else null>",
            "bleeding": "<yes/no if mentioned, else null>",
            "discoloration": "<yes/no/what color if mentioned, else null>",
            "looseness": "<yes/no if mentioned, else null>"
        }},
        "duration": "<duration if mentioned, else null>",
        "other_information": "<any other relevant info, else null>"
    }},
    "assessment": {{
        "information_complete": <true if all required fields present, else false>,
        "missing_required": ["<list of missing required fields>"],
        "has_symptoms": <true if at least one symptom answered, else false>
    }},
    "response": {{
        "type": "<'question' if more info needed, 'image_request' if complete>",
        "message": "<Either next question OR image upload request message>",
        "should_end": <true if image_request, else false>
    }}
}}

RESPONSE GUIDELINES:
- For questions: Ask about ONE missing field at a time, be empathetic and conversational
- For image request: Thank patient, summarize key concerns, ask for clear photo with tips (open mouth, good lighting, close-up of affected area)
- Keep all messages warm, professional, and reassuring
- Use dental terminology appropriately but explain when needed
"""
    
    try:
        response = model.generate_content(combined_prompt)
        result_text = response.text.strip()
        
        # Clean up markdown
        if result_text.startswith("```json"):
            result_text = result_text.replace("```json", "").replace("```", "").strip()
        elif result_text.startswith("```"):
            result_text = result_text.replace("```", "").strip()
        
        result = json.loads(result_text)
        
        # 1. Update extracted information
        extracted = result.get('extracted_info', {})
        if extracted.get('age'):
            state['age'] = extracted['age']
        if extracted.get('gender'):
            state['gender'] = extracted['gender']
        if extracted.get('dental_history'):
            state['dental_history'] = extracted['dental_history']
        if extracted.get('smoking_status'):
            state['smoking_status'] = extracted['smoking_status']
        if extracted.get('affected_area'):
            state['affected_area'] = extracted['affected_area']
        if extracted.get('duration'):
            state['duration'] = extracted['duration']
        if extracted.get('other_information'):
            current_other = state.get('other_information', '')
            state['other_information'] = f"{current_other}\n{extracted['other_information']}".strip()
        
        # Update symptoms
        if extracted.get('symptoms'):
            current_symptoms = state.get('symptoms', {})
            for symptom, value in extracted['symptoms'].items():
                if value is not None:
                    current_symptoms[symptom] = value
            state['symptoms'] = current_symptoms
        
        # 2. Update assessment
        assessment = result.get('assessment', {})
        state['information_complete'] = assessment.get('information_complete', False)
        
        # 3. Update response
        response_data = result.get('response', {})
        state['current_response'] = response_data.get('message', '')
        state['should_end'] = response_data.get('should_end', False)
        state['next_action'] = 'request_image' if state['should_end'] else 'ask_question'
        
        print(f"✓ Processed in single API call")
        print(f"  Information complete: {state['information_complete']}")
        print(f"  Should end: {state['should_end']}")
        
    except Exception as e:
        print(f"⚠️ Processing failed: {e}")
        # Fallback response
        state['current_response'] = "I'm here to help with your dental concern. Could you tell me more about what's bothering you?"
        state['information_complete'] = False
        state['should_end'] = False
    
    return state

# =============================================================================
# WORKFLOW NODES
# =============================================================================

def combined_processing_node(state: DentalState) -> DentalState:
    """Single node that does all processing in one API call"""
    chat_history = state.get('chat_history', [])
    
    if chat_history:
        # Get last user message
        last_user_message = next(
            (msg['content'] for msg in reversed(chat_history) if msg['role'] == 'user'),
            None
        )
        
        if last_user_message:
            state = process_user_message_combined(state, last_user_message)
    
    return state

def router(state: DentalState) -> Literal["end"]:
    """Router: Always end after processing (single turn per invoke)"""
    return "end"

# =============================================================================
# BUILD WORKFLOW
# =============================================================================

def create_dental_workflow():
    """Create the optimized LangGraph workflow"""
    
    workflow = StateGraph(DentalState)
    
    # Single processing node
    workflow.add_node("process", combined_processing_node)
    
    # Simple flow: process → end
    workflow.set_entry_point("process")
    workflow.add_edge("process", END)
    
    # Compile with memory
    memory = MemorySaver()
    app_workflow = workflow.compile(checkpointer=memory)
    
    return app_workflow

# Initialize workflow
workflow = create_dental_workflow()

# =============================================================================
# FLASK API ENDPOINTS
# =============================================================================

@app.route("/", methods=["GET"])
def root():
    """Root endpoint with API documentation"""
    return jsonify({
        "service": "Dental Specialist Agent (Optimized)",
        "version": "2.0",
        "description": "LangGraph-based dental consultation agent with single-call optimization",
        "endpoints": {
            "/start": "POST - Start a new consultation",
            "/chat": "POST - Send a message in an existing consultation",
            "/state": "GET - Get current state of a consultation",
            "/health": "GET - Health check"
        },
        "features": [
            "Standard chat_history format",
            "Optimized: Single API call per message",
            "Stateful conversations with thread management",
            "Intelligent question generation",
            "Automatic image request when ready"
        ],
        "optimization": "Combines extraction + assessment + generation in ONE Gemini call"
    })

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "dental-specialist-agent",
        "timestamp": datetime.utcnow().isoformat(),
        "project": PROJECT_ID,
        "location": LOCATION,
        "optimization": "single-call-mode"
    })

@app.route("/start", methods=["POST"])
def start_consultation():
    """
    Start a new consultation
    
    Expected JSON (optional):
    {
        "thread_id": "custom_thread_id",
        "chat_history": []  // Optional: provide existing chat history
    }
    
    Returns:
    {
        "thread_id": "...",
        "chat_history": [...],
        "response": "...",
        "collected_info": {...}
    }
    """
    try:
        data = request.get_json() or {}
        thread_id = data.get("thread_id") or f"consultation_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        
        # Check if chat_history is provided
        existing_chat_history = data.get("chat_history", [])
        
        initial_message = "Hello! I'm here to help you with your dental concern. To provide the best assistance, could you please tell me your age and gender?"
        
        # Initialize chat_history with first assistant message
        if not existing_chat_history:
            chat_history = [
                {
                    "role": "assistant",
                    "content": initial_message
                }
            ]
        else:
            chat_history = existing_chat_history
        
        return jsonify({
            "status": "success",
            "thread_id": thread_id,
            "chat_history": chat_history,
            "response": initial_message,
            "information_complete": False,
            "should_request_image": False,
            "collected_info": {
                "age": "",
                "gender": "",
                "affected_area": "",
                "symptoms": {},
                "dental_history": "",
                "smoking_status": "",
                "duration": "",
                "other_information": ""
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@app.route("/chat", methods=["POST"])
def chat():
    """
    Send a message in an existing consultation
    
    Expected JSON:
    {
        "thread_id": "...",
        "message": "I'm 45 years old, male",
        "chat_history": [...]  // Optional: provide current chat history
    }
    
    Returns:
    {
        "thread_id": "...",
        "chat_history": [...],  // Updated with new messages
        "response": "...",
        "information_complete": true/false,
        "should_request_image": true/false,
        "collected_info": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"status": "error", "error": "Request must be JSON"}), 400
        
        thread_id = data.get("thread_id")
        user_message = data.get("message")
        provided_chat_history = data.get("chat_history")
        
        if not thread_id or not user_message:
            return jsonify({
                "status": "error",
                "error": "Both 'thread_id' and 'message' are required"
            }), 400
        
        config = {"configurable": {"thread_id": thread_id}}
        
        # Get current state or initialize
        try:
            current_state = workflow.get_state(config).values
        except:
            current_state = {
                "chat_history": provided_chat_history if provided_chat_history else [],
                "age": "",
                "gender": "",
                "dental_history": "",
                "smoking_status": "",
                "affected_area": "",
                "symptoms": {},
                "duration": "",
                "other_information": "",
                "information_complete": False,
                "next_action": "ask_question",
                "current_response": "",
                "should_end": False
            }
        
        # If chat_history provided in request, use it (allows external state management)
        if provided_chat_history:
            current_state["chat_history"] = provided_chat_history
        
        # Add user message to chat_history
        current_state["chat_history"].append({
            "role": "user",
            "content": user_message
        })
        
        # Run the workflow (single API call happens here)
        result = workflow.invoke(current_state, config)
        
        # Get agent's response
        agent_response = result.get("current_response", "")
        
        # Add agent response to chat_history
        result["chat_history"].append({
            "role": "assistant",
            "content": agent_response
        })
        
        return jsonify({
            "status": "success",
            "thread_id": thread_id,
            "chat_history": result["chat_history"],
            "response": agent_response,
            "information_complete": result.get("information_complete", False),
            "should_request_image": result.get("should_end", False),
            "collected_info": {
                "age": result.get("age", ""),
                "gender": result.get("gender", ""),
                "affected_area": result.get("affected_area", ""),
                "symptoms": result.get("symptoms", {}),
                "dental_history": result.get("dental_history", ""),
                "smoking_status": result.get("smoking_status", ""),
                "duration": result.get("duration", ""),
                "other_information": result.get("other_information", "")
            },
            "api_calls": 1  # Always 1 call per message now!
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@app.route("/state/<thread_id>", methods=["GET"])
def get_state(thread_id):
    """
    Get current state of a consultation
    
    Returns the full state including chat_history and collected information
    """
    try:
        config = {"configurable": {"thread_id": thread_id}}
        
        try:
            state = workflow.get_state(config).values
            
            return jsonify({
                "status": "success",
                "thread_id": thread_id,
                "chat_history": state.get("chat_history", []),
                "information_complete": state.get("information_complete", False),
                "should_request_image": state.get("should_end", False),
                "collected_info": {
                    "age": state.get("age", ""),
                    "gender": state.get("gender", ""),
                    "affected_area": state.get("affected_area", ""),
                    "symptoms": state.get("symptoms", {}),
                    "dental_history": state.get("dental_history", ""),
                    "smoking_status": state.get("smoking_status", ""),
                    "duration": state.get("duration", ""),
                    "other_information": state.get("other_information", "")
                },
                "message_count": len(state.get("chat_history", []))
            })
        except:
            return jsonify({
                "status": "error",
                "error": f"No consultation found with thread_id: {thread_id}"
            }), 404
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

# =============================================================================
# START FLASK APP
# =============================================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"🚀 Starting Dental Specialist Agent (Optimized) on port {port}")
    print(f"🦷 Project: {PROJECT_ID}")
    print(f"📍 Location: {LOCATION}")
    print(f"⚡ Optimization: Single API call per message")
    app.run(host="0.0.0.0", port=port, debug=False)