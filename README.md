<img width="4000" height="1308" alt="transparent-logo-2" src="https://github.com/user-attachments/assets/e70b8d96-1350-4d02-bdf3-2572a5281f4c" />

<div align="center">

# Viscura: Next-Gen Agentic AI for Dermatology and Dentistry

> **A multi-agent, AI-powered virtual triage system that helps users understand symptoms, analyze images, and find the right doctor instantly.**

</div>


## Table of Contents

1. [Project Motivation](#project-motivation)
2. [Overview](#overview)
3. [The Solution](#the-solution)
4. [Competitive Edge](#competitive-edge)
5. [Core Capabilities](#core-capabilities)
6. [Viscura's Market Fit and Impact](#viscuras-market-fit-and-impact)
7. [Future Scope](#future-scope)
8. [About the Team](#about-the-team)
9. [Technical Documentation](#technical-documentation)

---

## Project Motivation

Meet Alex, a grad student who woke up with a swollen eye and painful rash. The campus wellness center had no appointments for a week. He was in extreme pain, anxious, and didn't know if he needed an ophthalmologist, dermatologist, or urgent care. As a student watching every dollar, he hesitated to go to the ER and risk a massive bill.

This experience exposed a painful gap: there was no simple, affordable way to get quick, trustworthy triage, understand severity, and know which specialist to see.

**The Scale of the Problem**

Approximately 4.7 billion people globally are affected by skin diseases and 3.7 billion by oral diseases.

**The Four Major Pain Points**

**Delayed Access** — Specialist appointment wait times are often weeks or months. Non-emergency ER visits waste time and strain the system.

**Doctor Dilemma** — Patients often don't know which specialist to visit. Primary care referrals add extra wait time and cost.

**Uncertainty** — Hard to know what's serious and what's treatable at home. Not knowing severity causes anxiety and delays necessary care.

**Costly Missteps** — Multiple visits before correct diagnosis increase cost. Unnecessary ER trips and time off work create financial burden.

---

## Overview

Viscura is an AI-powered virtual triage assistant for dermatology and dentistry. From a single mobile app, users can describe symptoms in natural language, upload images from their smartphone, receive an AI-driven preliminary assessment with severity estimate, get clear guidance on immediate next steps, and see which type of doctor to visit with nearby provider recommendations.

Under the hood, Viscura combines conversational clinical agents that mimic real clinical interviews, medical-grade computer vision models that outperform general-purpose multimodal LLMs, and smart care navigation that routes patients to the right specialist using location data.

---

## The Solution

Viscura revolutionizes healthcare delivery through AI-powered virtual triage and intelligent care navigation.

**AI At-Home Diagnosis** — Get accurate preliminary assessments without visiting a lab. Upload photos directly from your phone and receive analysis within minutes, available anytime, anywhere.

**Right Doctor, Right Away** — Skip the PCP gatekeeping. AI identifies the exact specialist needed with integrated map search for nearby providers, eliminating guesswork and wasted referrals.

**Know What to Do Immediately** — Immediate diagnosis with detailed, patient-friendly explanations. Severity assessment (mild, moderate, urgent) with smart home-care suggestions for mild cases and alerts for when emergency care is required.

**Rapid, Cost-Effective Path** — Save time with direct-to-specialist navigation. Reduce costs by eliminating unnecessary visits. Improve accuracy with AI-driven guidance and gain peace of mind through instant answers.

<div align="center">
<img width="200" height="400" alt="image" src="https://github.com/user-attachments/assets/87163fe4-7fb0-4eea-be53-33fcb40ed10e" />
</div>

---

## Competitive Edge

**Custom-trained Computer Vision models ~90% diagnostic accuracy, outperforming multimodal LLMs by 45%** for dermatology and oral health conditions.

| Approach | Accuracy | Key Finding |
|----------|----------|-------------|
| **Commercial Multimodal LLMs** | ~30-45% | Highlighting limitations in detecting subtle visual cues |
| **Viscura Custom CV Models** | **~90%** | EfficientNet fine-tuned models achieve superior performance with specialized training |

**Why Our Models Excel**

Trained on curated dermatology and oral health datasets, fine-tuned specifically for medical-grade diagnosis, captures subtle clinical features missed by LLMs, and continuously improved with real-world data.

---

## Core Capabilities

### 1. Conversational Clinical Agents

Multi-agent system designed to mimic clinical interviews. The AI agent asks context-aware, medically relevant questions to collect key symptoms, risk factors, and history, delivering accurate triage and actionable care guidance tailored to each user.

Empathetic conversation that feels human, structured data collection (age, gender, symptoms, medical history), context-aware questioning, stateful conversations that remember previous interactions, and dynamic follow-up based on patient responses. Supported specialties include dermatology and oral health.

**System Architecture**

Viscura employs a LangGraph-based supervisor-agent architecture that orchestrates multiple specialized AI agents. The Supervisor Agent interacts with users, assigns specialized agents (Skin or Oral) based on symptoms, the Vision Agent validates uploaded images and routes to the correct CV model, Skin/Oral CV Models analyze images and provide disease predictions, and the Reporting Agent generates comprehensive medical reports. All data is stored in Firebase.

<div align="center">
<img src="https://github.com/user-attachments/assets/a611df53-d1fe-4c9e-a59b-05c018c9b8e7" width="900" height="400" alt="Architecture" />
</div>

### 2. Vision Intelligence

Specialized medical-grade vision models trained on curated dermatology and oral health datasets. Our models achieve ~90% diagnostic accuracy, enabling early detection of skin and oral conditions in real-time, directly from a smartphone camera.

The process flow includes image upload from smartphone, quality validation using Gemini Vision, content matching to ensure image matches reported condition type, disease classification by custom CV models, confidence scoring, and expert validation.

<div align="center">
<img width="900" height="400" alt="image" src="https://github.com/user-attachments/assets/988fbc7c-ad3e-4e65-bee1-061182016dfd" />
</div>

### 3. Smart Care Navigation

Location-based specialist recommendations integrated with real-time mapping. Users instantly receive curated referrals to qualified healthcare providers near them based on AI diagnosis. Specialty-matched recommendations, location-aware search using Google Maps API, real-time availability and contact information, and direct navigation to healthcare providers.

No more guessing which doctor to see—Viscura routes you directly to specialists who can treat your specific condition.

<div align="center">
<img width="200" height="400" alt="image" src="https://github.com/user-attachments/assets/be10d351-0629-49e9-9de6-2ec77ba02aad" /> <img width="200" height="400" alt="image" src="https://github.com/user-attachments/assets/5ea6abd9-1b16-4f01-8171-17acc7b4f177" />
</div>

---

## Viscura's Market Fit and Impact

Viscura targets patients who experience sudden skin or oral issues, face long wait times for specialist appointments, are cost-sensitive and hesitant to go to the ER, are unsure how serious their condition is or which doctor to see, and have limited access to hospitals and treatments.

By providing instant triage, symptom clarification, and specialist routing, Viscura reduces unnecessary ER visits, helps patients seek care earlier for serious issues, gives students and working professionals peace of mind and actionable next steps, and supports overloaded healthcare systems by better triaging non-emergent cases.

---

## Future Scope

**Expansion to Ophthalmology** — Extend CV models and conversational workflows to detect and diagnose common eye diseases such as cataracts and glaucoma.

**Expansion of Disease Coverage** — Extend CV models to cover 50+ skin and oral diseases, including rare dermatological conditions and oral cancer screening.

**Lab Reports Focused Portal** — Develop a secure, HIPAA-compliant portal for healthcare professionals to upload lab reports, radiology scans, and other diagnostics with AI-powered analysis.

**Continuous Learning AI** — Implement self-improving AI models that learn from new patient cases and doctor feedback in real-time through active learning pipeline and physician feedback integration.

**Additional Planned Features** — Multi-language support (Spanish, Mandarin, Hindi, 10+ languages), telemedicine integration with direct video consultation booking, insurance verification with real-time coverage checks, prescription management with e-prescription integration, wearable integration with Apple Health and Google Fit, mental health module, chronic disease management, and family health profiles.

---

## About the Team

[Katy Koo](https://github.com/koobcbc) | [Mahender Reddy Pokala](https://github.com/Mahenderreddyp) | [Rohit Kumar](https://github.com/rohitch13) | [Ulka Khobragade](https://github.com/ulka98)

---

## Technical Documentation

For developers, researchers, and technical implementation details, see our comprehensive [Technical Documentation](./TECHNICAL.md).

Includes detailed component documentation, API specifications, deployment guides, technology stack details, and architecture deep-dives.

---

<div align="center">

**Viscura** — *Making healthcare accessible, affordable, and immediate for everyone.*

</div>
