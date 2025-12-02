<img width="4000" height="1308" alt="transparent-logo-2" src="https://github.com/user-attachments/assets/e70b8d96-1350-4d02-bdf3-2572a5281f4c" />

<div align="center">

# Viscura: Next-Gen Agentic AI for Dermatology and Dentistry

> **A multi-agent, AI-powered virtual triage system that helps users understand symptoms, analyze images, and find the right doctor instantly.**

</div>


## Table of Contents

1. [Project Motivation](#-project-motivation)
2. [Overview of Viscura](#overview-of-viscura)
3. [The Solution](#the-solution-viscura)
4. [Competitive Edge](#our-competitive-edge)
5. [Key Features](#key-features)
6. [Core Capabilities](#core-capabilities)
7. [Viscura’s Market Fit and Impact](#viscuras-market-fit-and-impact)
8. [For Developers](#for-developers)
9. [Component Documentation](#component-documentation)
10. [Technology Stack](#technology-stack)
11. [Deployment Guide](#deployment-guide)
12. [API Documentation](#api-documentation)
13. [Future Scope](#future-scope)
14. [About the Team](#about-the-team)


## 🔎 Project Motivation

Meet Alex, a grad student who woke up with a swollen eye and a painful rash on his hand.

- The campus wellness center had **no appointments for the entire week**
- He was **in extreme pain**, anxious and unable to focus on work
- As a student carefully watching every dollar, he hesitated to go to the **ER** and risk a huge bill
- He didn’t know:  
  - *How serious is this?*  
  - *Can I manage the pain safely at home?*  
  - *Do I need an ophthalmologist, a dermatologist, or urgent care?*

This experience exposed a painful gap: there was **no simple, affordable way** for someone like Alex to:
1. Get a **quick, trustworthy triage** based on symptoms and photos  
2. Understand **how serious** the issue is and what to do *right now*  
3. Know **which specialist** to see and **where to find them**  

Viscura was born to close this gap.

#### **The Scale of the Problem**

- **~4.7 Billion** people globally are affected by skin diseases
- **~3.7 Billion** people globally are affected by oral diseases

### **The Four Major Pain Points**

#### **a. Delayed Access: Too Long to Reach the Doctor**
- Specialist appointment wait times are often weeks or months
- Non-emergency ER visits waste time and strain the system
- Travel and multiple appointments reduce productivity
- Delays worsen conditions and increase anxiety
> For Alex, this meant spending days in pain waiting for a wellness center appointment that never came.

#### **b. Doctor Dilemma: Which Specialist Should I See?**
- Patients often don’t know which specialist to visit
- **Primary care physicians (PCPs)** referrals add extra wait time and cost
- Seeing the wrong specialist leads to delays
- Multiple referrals increase financial and time burden

#### **c. Uncertainty: Serious Problem or Home Remedy?**
- Hard to know what’s serious and what’s treatable at home
- Not knowing severity causes anxiety and stress
- Hesitation delays necessary care
- Fear of **overreacting** leads to undertreatment

#### **d. Costly Missteps: Financial Burden**
- Multiple visits before correct diagnosis increase cost
- Unnecessary ER trips add financial burden
- Taking time off work reduces income
- Inefficiencies drain both money and time


## Overview of Viscura

Viscura is an AI-powered virtual triage assistant for **dermatology and dentistry**.

From a single mobile app, users can:
- Describe their symptoms in natural language
- Upload images of skin or oral issues from their smartphone
- Receive an **AI-driven preliminary assessment** and severity estimate
- Get **clear, human-readable guidance** on what to do *right now*
- See **which type of doctor** they should see and **where to find them nearby**

Under the hood, Viscura combines:
- **Conversational clinical agents** that mimic real clinical interviews
- **Medical-grade computer vision models** that outperform general-purpose multimodal LLMs
- **Smart care navigation** that routes patients to the right specialist using location data (Maps)

## Who This Repository Is For

This repository is intended for:
- **Developers** building or extending multi-agent AI healthcare systems  
- **Health tech researchers** evaluating AI-driven triage designs  
- **Clinicians and domain experts** reviewing diagnostic workflows  
- **Students and builders** exploring medical CV + LLM agents  


## The Solution: Viscura

### **OUR SOLUTION - VISCURA**

Viscura revolutionizes healthcare delivery through AI-powered virtual triage and intelligent care navigation, addressing every pain point in the current system.

### **a. AI At-Home Diagnosis**
**Get accurate preliminary assessments without visiting a lab**

- **No lab visits required** for initial assessment
- Upload photos directly from your phone
- Get analysis within minutes
- Available anytime, anywhere

### **b. Right Doctor, Right Away**
**Get recommended with the correct specialist instantly**

- **Skip the PCP gatekeeping**
- AI identifies the exact specialist needed
- Integrated map search for nearby providers
- Eliminates guesswork and wasted referrals

### **c. Know What to Do Immediately**
**Understand your condition, immediate steps, or safe home remedies**

- **Immediate diagnosis** with detailed, patient-friendly explanations
- **Severity assessment** (mild, moderate, urgent)
- Smart home-care suggestions for mild cases
- Immediate steps to follow while waiting for care
- Alerts for when emergency care is required

### **d. Rapid, Cost-Effective Path**
**Efficient route to the right diagnosis**

- Save time with direct-to-specialist navigation
- Reduce costs by eliminating unnecessary visits
- Improve accuracy with AI-driven guidance
- Peace of mind through instant answers


## Our Competitive Edge

### **Viscura CV Models Outperform LLMs**

**Custom-trained Computer Vision models achieve >90% diagnostic accuracy, outperforming multimodal LLMs by 40%** for dermatology and oral health conditions.

#### Comparison Results

| Approach | Accuracy | Key Finding |
|----------|----------|-------------|
| **Commercial Multimodal LLMs** | ~45-55% | Only 45% accuracy across three skin cancer classes, highlighting limitations in detecting subtle visual cues |
| **Viscura Custom CV Models** | **88-89%** | EfficientNet fine-tuned models achieve superior performance with specialized training |

**Why Our Models Excel:**
- Trained on curated dermatology and oral health datasets
- Fine-tuned specifically for medical-grade diagnosis
- Captures subtle clinical features missed by LLMs
- Continuously improved with real-world data

## Key Features

- 🩺 **Instant Virtual Triage** – Get a fast, AI-powered assessment based on your symptoms and photos.
- 🧠 **Clinical-Style Q&A** – Agents ask medically relevant questions like a real clinician, not a generic chatbot.
- 📸 **Smart Image Analysis** – Upload images of rashes or oral issues from your smartphone, models detect likely conditions.
- 🚦 **Severity & Next Steps** – See if your issue looks mild, moderate, or urgent, with clear do/don’t guidance.
- 🧭 **Right Doctor, Right Away** – Skip the guesswork. Viscura tells you *which* specialist to see.
- 📍**Nearby Specialists** – Integrated Maps to find providers near you (current or planned).

## Core Capabilities

### **VISCURA - OUR CORE CAPABILITIES**

Viscura integrates three powerful capabilities to deliver comprehensive healthcare assistance:

### 1. Conversational Clinical Agents

**Multi-Agent System Designed to Mimic Clinical Interviews**

We built a multi-agent system designed to mimic clinical interviews. The AI agent asks context-aware, medically relevant questions to collect key symptoms, risk factors, and history, delivering **accurate triage and actionable care guidance** tailored to each user.

#### Features

- **Empathetic conversation** that feels human and builds trust
- **Structured data collection** (age, gender, symptoms, medical history)
- **Context-aware questioning** to gather relevant information
- **Stateful conversations** that remember previous interactions
- **Dynamic follow-up** based on patient responses

#### Supported Specialties

- **Dermatology**: Skin diseases, rashes, lesions, discoloration
- **Oral Health**: Gum disease, dental issues, mouth abnormalities

Each agent is trained on specialty-specific protocols to ensure accurate information gathering and appropriate medical guidance.

#### System Architecture

**Product Architecture: Multi-Agents Supervisor System**

Viscura employs a sophisticated **LangGraph-based supervisor-agent architecture** that orchestrates multiple specialized AI agents to deliver comprehensive healthcare assistance.

<img width="1861" height="803" alt="image" src="https://github.com/user-attachments/assets/a611df53-d1fe-4c9e-a59b-05c018c9b8e7" />

**Workflow Overview:**

1. **Supervisor Agent** interacts with users through the frontend
2. **Assigns specialized agent** (Skin Agent or Oral Agent) based on user symptoms
3. **Vision Agent** validates if the uploaded image is appropriate and routes to the correct CV model
4. **Skin/Oral CV Models** analyze the image and provide disease predictions
5. **Reporting Agent** generates comprehensive medical reports
6. All data is stored in **Firebase** (user information, chat history, media)

**Key Orchestration Features:**
- Thread-based conversation management
- Automatic agent selection based on patient symptoms
- Graceful error handling and fallback strategies
- Session management across distributed services
- Real-time state synchronization

---

### 2. Vision Intelligence

**Specialized Medical-Grade Vision Models**

We developed specialized medical-grade vision models trained on curated dermatology and oral health datasets. Our models achieve **>90% diagnostic accuracy**, enabling early detection of skin and oral conditions in real-time, directly from a smartphone camera.

#### Superior Performance

- **>90% accuracy** on test datasets (F1 Score: 89% for skin, 85% for oral)
- **40% higher accuracy** than general-purpose multimodal LLMs
- **Trained on clinical datasets** specific to dermatology and oral health
- **Multi-stage validation** using Gemini Vision for quality assurance

#### Process Flow

1. **Image Upload**: Patient captures image using smartphone
2. **Quality Validation**: Gemini Vision verifies image quality and relevance
3. **Content Matching**: Ensures image matches patient's reported condition type (skin vs. oral)
4. **Disease Classification**: Custom CV models predict specific conditions
5. **Confidence Scoring**: Provides reliability metrics for each diagnosis
6. **Expert Validation**: Results reviewed for accuracy

#### Supported Image Sources

- Direct smartphone camera capture
- Photo library uploads
- Google Cloud Storage (GCS) URLs
- Local file paths

#### Model Specifications

**Custom Efficient Net Finetuned Models**
- Architecture: EfficientNet-B4 with custom classification head
- Training: Transfer learning on medical image datasets
- Classes: 8 skin conditions, 8 oral conditions
- Validation: Cross-validated on diverse patient demographics

---

### 3. SMART Care Navigation (Maps)

**Location-Based Specialist Recommendations**

Our platform integrates real-time location to recommend **the right doctor or specialist** based on the user's symptoms and diagnosis. Users instantly receive curated referrals to qualified healthcare providers near them, **driving faster access to care and better outcomes**.

#### Features

- **Specialty-matched recommendations** based on AI diagnosis
- **Location-aware search** using Google Maps API integration
- **Real-time availability** and contact information
- **Direct navigation** to healthcare providers
- **Appointment booking** integration (future feature)

#### Benefits

- **Skip the PCP gatekeeping** process
- **Save time** by going directly to the right specialist
- **Save money** on unnecessary consultations
- **Reduce anxiety** with immediate, actionable guidance
- **Better outcomes** through faster access to appropriate care

**No more guessing which doctor to see** – Viscura routes you directly to specialists who can treat your specific condition.

## Viscura’s Market Fit and Impact

Viscura targets patients who:
- Experience **sudden skin or oral issues** (rashes, swelling, pain)
- Face **long wait times** for specialist appointments
- Are **cost-sensitive** and hesitant to go to the ER
- Are unsure **how serious** their condition is or **which doctor** to see
- Who has very low access to the hospitals and treatments

By providing instant triage, symptom clarification, and specialist routing, Viscura:
- Reduces unnecessary ER visits
- Helps patients seek care earlier for serious issues
- Gives students and working professionals peace of mind and actionable next steps
- Supports overloaded healthcare systems by better triaging non-emergent cases

# For Developers

## Architecture at a Glance

At a high level, Viscura consists of:

- 🧠 **Supervisor Agent (LangGraph)** – Orchestrates the full journey and routes conversations to the right clinical agent.
- 🩹 **Skin & Oral Specialist Agents** – Run structured clinical interviews and collect medically relevant metadata.
- 👁️ **Vision Agent + CV Models** – Validate images, route them to the correct CV model, and produce disease predictions.
- 📄 **Reporting Agent** – Combines chat, metadata, and image predictions into a patient-friendly clinical report.
- 📱 **React Native App** – Mobile interface for patients: chat, image upload, report viewing, and doctor finder.
- ☁️ **GCP + Firebase** – Cloud Run for agents, Firestore/Firebase Storage for chat and images, Vertex AI Gemini & Vision.

## Component Documentation

### Supervisor Agent

**The Orchestration Brain**

The Supervisor Agent is the central intelligence that manages the entire patient journey through the multi-agent system.

#### Responsibilities

- Route patient queries to appropriate specialty agents (Skin/Oral)
- Maintain conversation state across multiple agents
- Coordinate information flow between agents
- Trigger image upload and validation workflows
- Initiate reporting and care navigation
- Handle error recovery and fallback scenarios

#### Technology

- **Framework**: LangGraph state machine
- **API**: Flask REST API
- **Deployment**: Google Cloud Run
- **State Management**: Firestore for persistence
- **Authentication**: Firebase Auth integration

#### Key Features

- Thread-based conversation management with unique session IDs
- Automatic agent selection based on patient symptoms
- Graceful error handling and fallback strategies
- Session management across distributed services
- Real-time state synchronization with frontend
- Scalable architecture supporting concurrent users

#### Core Functions

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

#### Features

- **Structured information collection** for dermatological assessment
- **Dynamic questioning** based on patient responses
- **Symptom validation** (itch, hurt, grow, change, bleed)
- **Medical history tracking** (skin cancer, family history)
- **Risk factor assessment** (sun exposure, moles, skin type)
- **Image request workflow** when sufficient metadata is collected

#### Required Information Collection

The agent systematically collects:

- **Demographics**: Age and gender
- **Location**: Body region affected
- **Symptoms**: 
  - Does it itch?
  - Does it hurt?
  - Is it growing?
  - Has it changed recently?
  - Does it bleed?
- **History**: 
  - Duration of condition
  - Previous skin conditions
  - Family history of skin cancer
  - Sun exposure patterns
- **Other**: Additional relevant information

#### Deployment

```bash
# Quick deployment to Google Cloud Run
cd skin-specialist-agent
chmod +x deploy.sh
./deploy.sh
```

#### API Endpoints

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/health` | GET | Health check | None |
| `/start` | POST | Initialize consultation | `{}` |
| `/chat` | POST | Send patient message | `{"thread_id": "xxx", "message": "..."}` |
| `/state/<thread_id>` | GET | Retrieve conversation state | None |

#### Testing Example

```bash
# Start a new consultation
curl -X POST https://skin-specialist-agent.run.app/start \
  -H "Content-Type: application/json" \
  -d '{}'

# Response
{
  "status": "success",
  "thread_id": "consultation_20250111_123456",
  "response": "Hello! I'm here to help with your skin concern...",
  "information_complete": false,
  "should_request_image": false
}

# Send patient information
curl -X POST https://skin-specialist-agent.run.app/chat \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "consultation_20250111_123456",
    "message": "I am 45 years old, male. I have a rash on my arm that itches."
  }'

# Check state
curl https://skin-specialist-agent.run.app/state/consultation_20250111_123456
```

---

### Oral Health Agent

**Dental and Oral Cavity Specialist**

Similar architecture to Skin Specialist Agent, optimized for oral health conditions and dental assessments.

#### Features

- **Oral cavity-specific symptom collection**
- **Dental history assessment** (cavities, gum disease, procedures)
- **Pain and sensitivity tracking** (location, severity, triggers)
- **Oral hygiene habit analysis** (brushing, flossing frequency)
- **Dietary factor assessment** (sugar intake, acidic foods)
- **Smoking and alcohol history**

#### Assessment Areas

The agent evaluates:

- **Tooth Issues**:
  - Pain and sensitivity
  - Discoloration or staining
  - Chips or cracks
  - Loose teeth
- **Gum Conditions**:
  - Bleeding during brushing/flossing
  - Swelling or inflammation
  - Recession or pulling away
  - Color changes
- **Oral Lesions**:
  - Sores or ulcers
  - White or red patches
  - Lumps or bumps
  - Persistent irritation
- **Functional Problems**:
  - Bite alignment issues
  - Jaw pain or TMJ symptoms
  - Difficulty chewing
  - Bad breath (halitosis)

**Deployment and API specifications mirror the Skin Specialist Agent** with oral health-specific prompts and logic.

---

### Vision Agent

**Image Validation and CV Model Router**

LangGraph-based agent that validates medical images and intelligently routes them to appropriate disease classification models.

#### Architecture Flow

```
Image URL → URL Validation → Content Validation (Gemini Vision) → Route to CV Model → Return Prediction
```

#### Features

- **Multi-source support**: GCS URLs, Firebase Storage, local paths
- **Gemini Vision validation**: Ensures image relevance and quality
- **Automatic routing**: Directs to skin or oral CV models based on chat_type
- **Error resilience**: Comprehensive error handling and retry logic
- **Quality checks**: Validates image resolution, format, and content
- **Privacy protection**: Secure image handling and transmission

#### Deployment

```bash
# Automated deployment
cd vision-agent
./deploy.sh

# Manual deployment
gcloud run deploy vision-agent \
  --image=gcr.io/project-id/vision-agent:latest \
  --region=us-central1 \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300 \
  --set-env-vars="GCP_PROJECT_ID=project-id,GCP_LOCATION=us-central1"
```

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/process` | POST | Complete validation + prediction pipeline |
| `/validate-only` | POST | Image validation only (no prediction) |

#### Request Example

```bash
curl -X POST https://vision-agent.run.app/process \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "9vEu1qRQ1lgphdnpN5mO",
    "chat_type": "skin"
  }'
```

#### Response Example

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
      {"disease": "Eczema", "probability": 0.05},
      {"disease": "Psoriasis", "probability": 0.03}
    ]
  },
  "error": null
}
```

#### CV Model Integration

**Skin Disease Model:**
- **Endpoint**: `https://skin-disease-cv-model.us-central1.run.app/predict`
- **Method**: POST with multipart/form-data
- **Input**: JPEG/PNG image file
- **Output**: Disease classification with confidence scores
- **Classes**: 8 skin conditions

**Oral Disease Model:**
- **Endpoint**: `https://oral-disease-cv-model.us-central1.run.app/predict`
- **Interface**: Same as skin model
- **Classes**: 8 oral conditions

#### Validation Logic

The Vision Agent performs multi-stage validation:

1. **URL Validation**: Checks if image path exists and is accessible
2. **Format Validation**: Ensures JPEG, PNG, or WebP format
3. **Content Validation**: Uses Gemini Vision to verify:
   - Image shows actual skin/oral cavity (not random objects)
   - Image quality is sufficient for diagnosis
   - Image matches the declared chat_type
4. **Routing**: Sends validated image to appropriate CV model
5. **Result Processing**: Formats and returns prediction results

---

### Reporting Agent

**Medical Summary Generation**

AI-powered service that compiles comprehensive, empathetic diagnostic reports from chat history, metadata, image analysis, and CV model predictions.

#### Features

- **Vertex AI Gemini integration** for natural language generation
- **Multimodal analysis** combining text, metadata, and images
- **Structured JSON output** for easy frontend consumption
- **Empathetic, patient-friendly tone** suitable for end-users
- **Specialty-specific recommendations** tailored to condition type
- **Severity assessment** with clear action items
- **Follow-up guidance** and next steps

#### Architecture & Workflow

1. **Fetch Data**: Retrieve latest chat history and metadata from Firestore (via `chat_id`)
2. **Retrieve Image**: Get most recent patient image from Firebase Storage/GCS
3. **Image Analysis**: Run Gemini Vision analysis on the image for additional context
4. **Generate Report**: Use Gemini LLM to synthesize all information into structured JSON
5. **Return Response**: Deliver complete diagnostic summary to frontend

#### Report Structure

```json
{
  "chat_id": "9vEu1qRQ1lgphdnpN5mO",
  "diagnosis": {
    "condition": "Acne and Rosacea",
    "confidence": 0.92,
    "severity": "Moderate",
    "specialty": "Dermatology"
  },
  "patient_summary": {
    "age": 28,
    "gender": "Female",
    "affected_area": "Face (cheeks and forehead)",
    "duration": "3 months",
    "symptoms": ["redness", "inflammation", "pustules"]
  },
  "clinical_summary": "Patient presents with persistent facial redness and inflammatory lesions consistent with acne rosacea. Condition has been present for 3 months with gradual worsening...",
  "recommendations": [
    {
      "priority": "immediate",
      "action": "Avoid triggers such as spicy foods, hot beverages, and extreme temperatures"
    },
    {
      "priority": "short_term",
      "action": "Apply gentle, fragrance-free moisturizer twice daily"
    },
    {
      "priority": "medical",
      "action": "Consult a dermatologist for prescription topical treatments"
    }
  ],
  "home_care": [
    "Use gentle, non-comedogenic cleansers",
    "Apply sunscreen (SPF 30+) daily",
    "Keep a symptom diary to identify triggers"
  ],
  "when_to_seek_care": "Seek immediate care if you experience severe swelling, eye involvement, or signs of infection (increased warmth, pus, fever)",
  "follow_up_needed": true,
  "follow_up_timeframe": "2-4 weeks",
  "specialist_type": "Dermatologist",
  "generated_at": "2025-11-11T10:30:00Z"
}
```

#### Deployment

```bash
cd reporting-agent
chmod +x deploy.sh
./deploy.sh
```

#### Technology Stack

- **API Framework**: Flask REST API
- **AI Model**: Vertex AI Gemini 2.0 Flash
- **Database**: Firestore (chat history, metadata)
- **Storage**: Firebase Storage / Google Cloud Storage
- **Deployment**: Google Cloud Run (Docker containerized)
- **Language**: Python 3.10+

#### API Endpoint

```bash
# Generate report
curl -X POST https://reporting-agent.run.app/generate-report \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "9vEu1qRQ1lgphdnpN5mO",
    "chat_type": "skin"
  }'
```

#### Report Generation Process

The Reporting Agent uses a sophisticated prompt engineering approach:

1. **Context Building**: Assembles patient demographics, symptoms, and timeline
2. **Image Interpretation**: Incorporates Gemini Vision's analysis of uploaded images
3. **Medical Synthesis**: Combines CV model predictions with conversational data
4. **Empathy Optimization**: Ensures language is clear, supportive, and non-alarming
5. **Actionability Focus**: Provides specific, achievable next steps
6. **Specialty Mapping**: Determines appropriate medical specialty for referral

---

### Frontend Application

**React Native Mobile App**

Cross-platform mobile application providing the patient-facing interface for Viscura's AI healthcare assistant.

#### Features

- **AI-powered chat interface** for medical consultations
- **Speech-to-text input** for hands-free interaction
- **Image capture and upload** directly from smartphone camera
- **Doctor recommendations** with Google Maps integration
- **Secure authentication** via Firebase Auth
- **Medical profile management** with comprehensive health history
- **Real-time chat updates** with AI medical assistant
- **Report viewing** with clear, actionable information
- **Push notifications** for appointment reminders (future)

#### Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React Native |
| Platform | Expo |
| Navigation | Expo Router |
| State Management | React Hooks (useState, useContext) |
| Authentication | Firebase Auth |
| Database | Firestore |
| Storage | Firebase Storage |
| APIs | Google Gemini, Google Maps |
| Language | TypeScript |

#### Supported Platforms

- **iOS**: iPhone and iPad (iOS 13+)
- **Android**: Smartphones and tablets (Android 8+)
- **Testing**: iOS Simulator, Android Emulator, Physical devices via Expo Go

#### Installation

```bash
# Navigate to frontend directory
cd DiagnosisAI/frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npx expo start

# Run on specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
```

#### Environment Variables

Create a `.env` file with the following:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# API Endpoints
SUPERVISOR_AGENT_URL=https://supervisor-agent.run.app
```

#### Project Structure

```
frontend/
├── app/                          # Main application screens
│   ├── (tabs)/                  # Tab navigation screens
│   │   ├── index.tsx           # Home/Dashboard
│   │   ├── profile.tsx         # User profile
│   │   └── history.tsx         # Consultation history
│   ├── chat/                    # Chat-related screens
│   │   ├── [id].tsx            # Individual chat view
│   │   └── report.tsx          # Diagnosis report view
│   ├── auth/                    # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── doctors/                 # Doctor finder screens
│       └── [specialty].tsx
├── components/                   # Reusable UI components
│   ├── chat/
│   │   ├── MessageBubble.tsx
│   │   ├── InputBar.tsx
│   │   └── ImageUpload.tsx
│   ├── profile/
│   │   └── MedicalHistoryForm.tsx
│   └── common/
│       ├── Button.tsx
│       ├── Loading.tsx
│       └── ErrorBoundary.tsx
├── assets/                      # Images, fonts, static files
├── utils/                       # Utility functions
│   ├── api.ts                  # API client
│   ├── storage.ts              # AsyncStorage helpers
│   └── validation.ts           # Form validation
├── types/                       # TypeScript definitions
│   ├── chat.ts
│   ├── user.ts
│   └── diagnosis.ts
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts
│   ├── useChat.ts
│   └── useLocation.ts
├── constants/                   # App constants
│   ├── Colors.ts
│   └── Config.ts
├── firebaseConfig.ts           # Firebase initialization
├── app.json                    # Expo configuration
├── package.json
└── tsconfig.json
```

#### Key Screens & User Flow

1. **Authentication Flow**
   - `login.tsx`: Email/password login
   - `signup.tsx`: New user registration with medical history

2. **Main Dashboard**
   - `index.tsx`: Start new consultation or view history
   - Quick access to recent chats
   - Health tips and articles

3. **Consultation Flow**
   - `chat/[id].tsx`: Interactive chat with AI agent
   - Real-time message streaming
   - Image upload for diagnosis
   - Voice input option

4. **Diagnosis & Results**
   - `chat/report.tsx`: Comprehensive diagnosis report
   - Visual presentation of findings
   - Actionable recommendations
   - Share/export functionality

5. **Doctor Finder**
   - `doctors/[specialty].tsx`: Location-based doctor search
   - Google Maps integration
   - Filter by specialty, distance, ratings
   - Direct call/navigation buttons

6. **Profile & History**
   - `profile.tsx`: User medical profile management
   - `history.tsx`: Past consultation records
   - Settings and preferences

#### Security Features

- **Firebase Authentication**: Secure user login and session management
- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **Image Privacy**: Secure upload to Firebase Storage with access controls
- **HIPAA Considerations**: Architecture designed for healthcare compliance
- **Token Management**: Automatic refresh of authentication tokens

#### UI/UX Design Principles

- **Empathetic Design**: Calming colors and supportive language
- **Accessibility**: WCAG 2.1 AA compliance, screen reader support
- **Intuitive Navigation**: Clear information hierarchy
- **Progressive Disclosure**: Show complexity only when needed
- **Feedback**: Loading states, success/error messages
- **Offline Support**: Basic functionality without internet (future)

---

## Technology Stack

### Backend Services

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Orchestration** | LangGraph | Multi-agent workflow management |
| **API Framework** | Flask / FastAPI | RESTful API endpoints |
| **Cloud Platform** | Google Cloud Run | Serverless deployment and scaling |
| **AI - LLM** | Vertex AI Gemini 2.0 Flash | Conversational agents, report generation |
| **AI - Vision** | Gemini Vision | Image validation and analysis |
| **CV Models** | Custom TensorFlow/PyTorch | Disease classification (EfficientNet-B4) |
| **Database** | Firestore | Chat history, user data, metadata |
| **Storage** | Firebase Storage / GCS | Image and media storage |
| **Authentication** | Firebase Auth | User authentication and authorization |
| **Containerization** | Docker | Application packaging |
| **Language** | Python 3.10+ | Backend development |

### Frontend

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | React Native | Cross-platform mobile development |
| **Platform** | Expo | Development tooling and services |
| **Navigation** | Expo Router | File-based routing |
| **State Management** | React Hooks | Application state management |
| **Authentication** | Firebase Auth | User login and sessions |
| **Database** | Firestore | Real-time data sync |
| **APIs** | Google Maps, Gemini | Location services, AI integration |
| **Language** | TypeScript | Type-safe development |
| **Styling** | React Native StyleSheet | Component styling |

### Infrastructure & DevOps

| Component | Technology | Purpose |
|-----------|------------|---------|
| **CI/CD** | Google Cloud Build | Automated build and deployment |
| **Deployment** | Google Cloud Run | Serverless container hosting |
| **Monitoring** | Cloud Logging & Monitoring | Application observability |
| **Scaling** | Auto-scaling (0-10 instances) | Automatic resource management |
| **Region** | us-central1 | Primary deployment region |
| **Container Registry** | Google Container Registry | Docker image storage |

---

## Deployment Guide

### Prerequisites

1. **Google Cloud Project** with billing enabled
   - Project ID: `project-id`

2. **Required APIs Enabled:**
   ```bash
   gcloud services enable \
     cloudbuild.googleapis.com \
     run.googleapis.com \
     containerregistry.googleapis.com \
     aiplatform.googleapis.com \
     firestore.googleapis.com \
     storage-api.googleapis.com
   ```

3. **Local Development Tools:**
   - Docker (latest version)
   - gcloud CLI (authenticated)
   - Node.js 16+ (for frontend)
   - Python 3.10+ (for backend testing)

4. **Firebase Project Setup:**
   - Create Firebase project
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Set up Firebase Storage

### Backend Deployment

Each agent includes a `deploy.sh` script for automated deployment to Google Cloud Run.

#### Deploy All Agents

```bash
# Set your GCP project
gcloud config set project <project-id>

# Deploy Supervisor Agent
cd supervisor-agent
chmod +x deploy.sh
./deploy.sh

# Deploy Skin Specialist Agent
cd ../skin-specialist-agent
chmod +x deploy.sh
./deploy.sh

# Deploy Oral Health Agent
cd ../oral-health-agent
chmod +x deploy.sh
./deploy.sh

# Deploy Vision Agent
cd ../vision-agent
chmod +x deploy.sh
./deploy.sh

# Deploy Reporting Agent
cd ../reporting-agent
chmod +x deploy.sh
./deploy.sh
```

#### Manual Deployment (Example for Supervisor Agent)

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
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "GCP_PROJECT_ID=project-id,GCP_LOCATION=us-central1"

# Get service URL
gcloud run services describe supervisor-agent \
  --region us-central1 \
  --format 'value(status.url)'
```

### Frontend Deployment

#### Development Setup

```bash
cd DiagnosisAI/frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Firebase and API keys

# Start development server
npx expo start

# Run on specific platform
npm run ios       # iOS simulator
npm run android   # Android emulator
```

#### Production Build

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Or use EAS Build (recommended)
eas build --platform ios
eas build --platform android
```

### Environment Configuration

#### Backend Services

Set these environment variables during deployment:

```bash
# Google Cloud Configuration
GCP_PROJECT_ID=project-id
GCP_LOCATION=us-central1

# API Endpoints
SKIN_CV_ENDPOINT=https://skin-disease-cv-model.run.app/predict
ORAL_CV_ENDPOINT=https://oral-disease-cv-model.run.app/predict

# Service Endpoints (for inter-service communication)
SUPERVISOR_AGENT_URL=https://supervisor-agent.run.app
VISION_AGENT_URL=https://vision-agent.run.app
REPORTING_AGENT_URL=https://reporting-agent.run.app
```

#### Frontend Application

Configure `.env` file:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=viscura.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=viscura-prod
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=viscura-prod.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Backend API Endpoints
EXPO_PUBLIC_SUPERVISOR_AGENT_URL=https://supervisor-agent.run.app

# Google Services
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
EXPO_PUBLIC_GEMINI_API_KEY=AIza...
```

### Verification & Testing

#### Health Checks

```bash
# Check all services
curl https://supervisor-agent.run.app/health
curl https://skin-specialist-agent.run.app/health
curl https://oral-health-agent.run.app/health
curl https://vision-agent.run.app/health
curl https://reporting-agent.run.app/health
```

#### End-to-End Test

```bash
# Start consultation
THREAD_ID=$(curl -X POST https://supervisor-agent.run.app/start | jq -r '.thread_id')

# Send message
curl -X POST https://supervisor-agent.run.app/chat \
  -H "Content-Type: application/json" \
  -d "{\"thread_id\": \"$THREAD_ID\", \"message\": \"I have a rash on my arm\"}"
```

---

## API Documentation

### Unified Request Flow

The complete patient journey through Viscura's multi-agent system:

```
1. Patient opens app
   ↓
2. Frontend calls /start on Supervisor Agent
   ↓
3. Supervisor creates new thread and routes to Skin/Oral Agent
   ↓
4. Agent collects metadata through conversational questions
   ↓
5. Patient provides answers → Agent updates state
   ↓
6. When information is complete → Agent signals ready for image
   ↓
7. Patient uploads image → Supervisor calls Vision Agent
   ↓
8. Vision Agent validates image and routes to appropriate CV model
   ↓
9. CV model returns disease prediction
   ↓
10. Supervisor calls Reporting Agent with all collected data
   ↓
11. Reporting Agent generates comprehensive medical summary
   ↓
12. Frontend displays diagnosis, recommendations, and doctor finder
   ↓
13. Patient views nearby specialists via Google Maps integration
```


## Future Scope

Viscura is continuously evolving to expand healthcare accessibility and improve diagnostic capabilities.

### **Expansion to Ophthalmology**

**Extend CV models and conversational workflows to detect and diagnose common eye diseases such as cataracts and glaucoma.**

- Train specialized computer vision models on ophthalmology datasets
- Develop eye disease-specific conversation flows
- Enable retinal image analysis from smartphone cameras
- Integrate with optometry and ophthalmology provider networks
- **Target**: Q1 2026

### **Expansion of Disease Coverage**

**Extend CV models to cover more skin and oral diseases, including rare and chronic conditions.**

- Expand skin disease classification to 50+ conditions
- Include rare dermatological conditions (vitiligo, lupus rashes, etc.)
- Add oral cancer screening capabilities
- Incorporate pediatric-specific disease models
- **Target**: Q1 2026

### **Lab Reports Focused Portal**

**Develop a secure portal for healthcare professionals to upload lab reports, radiology scans, retinal fundus images, and other diagnostics.**

- Secure HIPAA-compliant file upload system
- Integration with existing EHR systems
- AI-powered analysis of lab results and imaging
- Automated report generation for physicians
- Patient-provider collaboration features
- **Target**: Q2 2026

### **Continuous Learning AI**

**Implement self-improving AI models that learn from new patient cases and doctor feedback in real-time.**

- Active learning pipeline for model improvement
- Physician feedback integration loop
- Automated retraining on validated cases
- Performance monitoring and drift detection
- Privacy-preserving federated learning
- **Target**: Q3 2026

### **Additional Planned Features**

- **Multi-language Support**: Support for Spanish, Mandarin, Hindi, and 10+ languages
- **Telemedicine Integration**: Direct video consultation booking
- **Insurance Verification**: Real-time insurance coverage checks
- **Prescription Management**: E-prescription integration with pharmacies
- **Wearable Integration**: Connect with Apple Health, Google Fit for comprehensive health tracking
- **Mental Health Module**: Expand to mental health screening and resources
- **Chronic Disease Management**: Long-term monitoring for conditions like eczema, psoriasis
- **Family Health Profiles**: Manage health for multiple family members


## **Viscura** - *Empowering patients with intelligent healthcare navigation*

**Making healthcare accessible, affordable, and immediate for everyone.**

## About the Team

- 👨‍💻 [Katy Koo](https://github.com/koobcbc)
- 👩‍⚕️ [Mahender Reddy Pokala](https://github.com/Mahenderreddyp)
- 👨‍💻 [Rohit Kumar](https://github.com/rohitch13)
- 👩‍💻 [Ulka Khobragade](https://github.com/ulka98)
