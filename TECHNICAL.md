# Viscura Technical Documentation

> Comprehensive technical guide for developers, researchers, and contributors

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Documentation](#component-documentation)
3. [Technology Stack](#technology-stack)
4. [Deployment Guide](#deployment-guide)
5. [API Documentation](#api-documentation)

---

## Architecture Overview

Viscura consists of:

- **Supervisor Agent (LangGraph)** — Orchestrates the full journey and routes conversations to the right clinical agent
- **Skin & Oral Specialist Agents** — Run structured clinical interviews and collect medically relevant metadata
- **Vision Agent + CV Models** — Validate images, route them to the correct CV model, and produce disease predictions
- **Reporting Agent** — Combines chat, metadata, and image predictions into a patient-friendly clinical report
- **React Native App** — Mobile interface for patients: chat, image upload, report viewing, and doctor finder
- **GCP + Firebase** — Cloud Run for agents, Firestore/Firebase Storage for chat and images, Vertex AI Gemini & Vision

---

## Component Documentation

### Supervisor Agent

**The Orchestration Brain**

The Supervisor Agent is the central intelligence that manages the entire patient journey through the multi-agent system.

**Responsibilities**

Route patient queries to appropriate specialty agents (Skin/Oral), maintain conversation state across multiple agents, coordinate information flow between agents, trigger image upload and validation workflows, initiate reporting and care navigation, and handle error recovery and fallback scenarios.

**Technology**

Framework: LangGraph state machine  
API: Flask REST API  
Deployment: Google Cloud Run  
State Management: Firestore for persistence  
Authentication: Firebase Auth integration

**Core Functions**

```python
def supervisor_workflow(user_input, thread_id):
    # Determine which agent to invoke
    agent_type = classify_symptom_type(user_input)
    
    # Route to appropriate agent
    if agent_type == "skin":
        response = invoke_skin_agent(user_input, thread_id)
    elif agent_type == "oral":
        response = invoke_oral_agent(user_input, thread_id)
    
    # Check if image is needed
    if response.ready_for_image:
        trigger_image_upload_flow()
    
    # Store state and return
    save_state(thread_id, response)
    return response
```

---

### Skin Specialist Agent

**Dermatology Consultation Expert**

LangGraph-based agent specialized in comprehensive skin condition assessment.

**Required Information Collection**

Demographics: Age and gender  
Location: Body region affected  
Symptoms: Does it itch? Does it hurt? Is it growing? Has it changed recently? Does it bleed?  
History: Duration of condition, previous skin conditions, family history of skin cancer, sun exposure patterns

**Deployment**

```bash
cd skin-specialist-agent
chmod +x deploy.sh
./deploy.sh
```

**API Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/start` | POST | Initialize consultation |
| `/chat` | POST | Send patient message |
| `/state/<thread_id>` | GET | Retrieve conversation state |

**Testing Example**

```bash
# Start a new consultation
curl -X POST https://skin-specialist-agent.run.app/start \
  -H "Content-Type: application/json" \
  -d '{}'

# Send patient information
curl -X POST https://skin-specialist-agent.run.app/chat \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "consultation_20250111_123456",
    "message": "I am 45 years old, male. I have a rash on my arm that itches."
  }'
```

---

### Oral Health Agent

**Dental and Oral Cavity Specialist**

Similar architecture to Skin Specialist Agent, optimized for oral health conditions and dental assessments.

**Assessment Areas**

Tooth Issues: Pain and sensitivity, discoloration or staining, chips or cracks, loose teeth  
Gum Conditions: Bleeding during brushing/flossing, swelling or inflammation, recession, color changes  
Oral Lesions: Sores or ulcers, white or red patches, lumps or bumps, persistent irritation  
Functional Problems: Bite alignment issues, jaw pain or TMJ symptoms, difficulty chewing, bad breath

Deployment and API specifications mirror the Skin Specialist Agent with oral health-specific prompts and logic.

---

### Vision Agent

**Image Validation and CV Model Router**

LangGraph-based agent that validates medical images and intelligently routes them to appropriate disease classification models.

**Architecture Flow**

```
Image URL → URL Validation → Content Validation (Gemini Vision) → Route to CV Model → Return Prediction
```

**Deployment**

```bash
cd vision-agent
./deploy.sh
```

**API Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/process` | POST | Complete validation + prediction pipeline |
| `/validate-only` | POST | Image validation only (no prediction) |

**Request Example**

```bash
curl -X POST https://vision-agent.run.app/process \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "9vEu1qRQ1lgphdnpN5mO",
    "chat_type": "skin"
  }'
```

**Response Example**

```json
{
  "chat_id": "9vEu1qRQ1lgphdnpN5mO",
  "chat_type": "skin",
  "is_valid": true,
  "validation_reason": "Image shows human skin with visible dermatological features suitable for analysis",
  "prediction_result": {
    "predicted_disease": "Acne and Rosacea",
    "confidence": 0.92,
    "top_predictions": [
      {"disease": "Acne and Rosacea", "probability": 0.92},
      {"disease": "Eczema", "probability": 0.05}
    ]
  }
}
```

**CV Model Integration**

Skin Disease Model: `https://skin-disease-cv-model.us-central1.run.app/predict`  
Oral Disease Model: `https://oral-disease-cv-model.us-central1.run.app/predict`  
Method: POST with multipart/form-data  
Input: JPEG/PNG image file  
Output: Disease classification with confidence scores

---

### Reporting Agent

**Medical Summary Generation**

AI-powered service that compiles comprehensive, empathetic diagnostic reports from chat history, metadata, image analysis, and CV model predictions.

**Architecture & Workflow**

1. Fetch Data: Retrieve latest chat history and metadata from Firestore
2. Retrieve Image: Get most recent patient image from Firebase Storage/GCS
3. Image Analysis: Run Gemini Vision analysis on the image for additional context
4. Generate Report: Use Gemini LLM to synthesize all information into structured JSON
5. Return Response: Deliver complete diagnostic summary to frontend

**Report Structure**

```json
{
  "chat_id": "9vEu1qRQ1lgphdnpN5mO",
  "diagnosis": {
    "condition": "Acne and Rosacea",
    "confidence": 0.92,
    "severity": "Moderate",
    "specialty": "Dermatology"
  },
  "clinical_summary": "Patient presents with persistent facial redness...",
  "recommendations": [
    {
      "priority": "immediate",
      "action": "Avoid triggers such as spicy foods..."
    }
  ],
  "when_to_seek_care": "Seek immediate care if...",
  "specialist_type": "Dermatologist"
}
```

**Deployment**

```bash
cd reporting-agent
chmod +x deploy.sh
./deploy.sh
```

---

### Frontend Application

**React Native Mobile App**

Cross-platform mobile application providing the patient-facing interface.

**Tech Stack**

Framework: React Native  
Platform: Expo  
Navigation: Expo Router  
State Management: React Hooks  
Authentication: Firebase Auth  
Database: Firestore  
APIs: Google Gemini, Google Maps  
Language: TypeScript

**Installation**

```bash
cd DiagnosisAI/frontend
npm install
cp .env.example .env
# Edit .env with your API keys
npx expo start
```

**Project Structure**

```
frontend/
├── app/                    # Main application screens
│   ├── (tabs)/            # Tab navigation
│   ├── chat/              # Chat screens
│   ├── auth/              # Authentication
│   └── doctors/           # Doctor finder
├── components/            # Reusable UI components
├── utils/                 # Utility functions
├── types/                 # TypeScript definitions
├── hooks/                 # Custom React hooks
└── firebaseConfig.ts      # Firebase initialization
```

---

## Technology Stack

### Backend Services

| Component | Technology |
|-----------|------------|
| **Orchestration** | LangGraph |
| **API Framework** | Flask / FastAPI |
| **Cloud Platform** | Google Cloud Run |
| **AI - LLM** | Vertex AI Gemini 2.0 Flash |
| **AI - Vision** | Gemini Vision |
| **CV Models** | Custom TensorFlow/PyTorch (EfficientNet-B4) |
| **Database** | Firestore |
| **Storage** | Firebase Storage / GCS |
| **Authentication** | Firebase Auth |
| **Language** | Python 3.10+ |

### Frontend

| Component | Technology |
|-----------|------------|
| **Framework** | React Native |
| **Platform** | Expo |
| **Navigation** | Expo Router |
| **State** | React Hooks |
| **Language** | TypeScript |

---

## Deployment Guide

### Prerequisites

1. Google Cloud Project with billing enabled
2. Required APIs Enabled:

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  storage-api.googleapis.com
```

3. Firebase Project Setup with Authentication, Firestore, and Storage enabled

### Backend Deployment

Each agent includes a `deploy.sh` script for automated deployment.

```bash
# Set your GCP project
gcloud config set project <project-id>

# Deploy all agents
cd supervisor-agent && ./deploy.sh
cd ../skin-specialist-agent && ./deploy.sh
cd ../oral-health-agent && ./deploy.sh
cd ../vision-agent && ./deploy.sh
cd ../reporting-agent && ./deploy.sh
```

### Manual Deployment Example

```bash
# Build Docker image
docker build -t gcr.io/project-id/supervisor-agent .

# Push to Container Registry
docker push gcr.io/project-id/supervisor-agent

# Deploy to Cloud Run
gcloud run deploy supervisor-agent \
  --image gcr.io/project-id/supervisor-agent \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars "GCP_PROJECT_ID=project-id"
```

### Environment Configuration

**Backend Services**

```bash
GCP_PROJECT_ID=project-id
GCP_LOCATION=us-central1
SKIN_CV_ENDPOINT=https://skin-disease-cv-model.run.app/predict
ORAL_CV_ENDPOINT=https://oral-disease-cv-model.run.app/predict
```

**Frontend Application**

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=viscura.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=viscura-prod
EXPO_PUBLIC_SUPERVISOR_AGENT_URL=https://supervisor-agent.run.app
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

### Verification

```bash
# Health checks
curl https://supervisor-agent.run.app/health
curl https://skin-specialist-agent.run.app/health
curl https://vision-agent.run.app/health

# End-to-end test
THREAD_ID=$(curl -X POST https://supervisor-agent.run.app/start | jq -r '.thread_id')
curl -X POST https://supervisor-agent.run.app/chat \
  -H "Content-Type: application/json" \
  -d "{\"thread_id\": \"$THREAD_ID\", \"message\": \"I have a rash on my arm\"}"
```

---

## API Documentation

### Unified Request Flow

```
1. Patient opens app
2. Frontend calls /start on Supervisor Agent
3. Supervisor creates thread and routes to Skin/Oral Agent
4. Agent collects metadata through conversational questions
5. Patient provides answers, Agent updates state
6. When information is complete, Agent signals ready for image
7. Patient uploads image, Supervisor calls Vision Agent
8. Vision Agent validates image and routes to CV model
9. CV model returns disease prediction
10. Supervisor calls Reporting Agent with all collected data
11. Reporting Agent generates comprehensive medical summary
12. Frontend displays diagnosis, recommendations, and doctor finder
13. Patient views nearby specialists via Google Maps integration
```

### Key Endpoints Summary

| Service | Endpoint | Method | Purpose |
|---------|----------|--------|---------|
| Supervisor | `/start` | POST | Initialize consultation |
| Supervisor | `/chat` | POST | Send message |
| Skin Agent | `/chat` | POST | Dermatology consultation |
| Oral Agent | `/chat` | POST | Oral health consultation |
| Vision Agent | `/process` | POST | Image validation + prediction |
| Reporting | `/generate-report` | POST | Generate diagnosis summary |

---

<div align="center">

For questions or contributions, see the main [README](./README.md) or contact the development team.

</div>
