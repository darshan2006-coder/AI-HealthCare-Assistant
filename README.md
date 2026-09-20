# 🩺 HealthBot AI

> An AI-powered healthcare assistant that performs intelligent symptom assessment, evaluates patient risk, persists consultation logs in the cloud, and provides a secure, responsive healthcare experience.

---
# 🌐 Live Demo

🚀 Click here to explore the website: https://ai-healthcare-assistant-gmak.onrender.com

## 📌 Overview

HealthBot AI is a full-stack healthcare web application designed to assist users with preliminary symptom assessment through an AI-driven workflow. The application securely manages patient sessions, evaluates health risks, triggers automatic emergency hospital recommendations for severe conditions, maintains cloud-synced consultation history via MongoDB Atlas, and handles strict multi-lingual AI constraints. 

Built with a focus on usability, security, and responsive design, the project demonstrates modern full-stack engineering practices suitable for production environments.

---

## ✨ Key Features

* 🤖 **AI-Powered Symptom Assessment:** Strict JSON-schema guarded medical analysis using Gemini 2.5 Flash.
* 🚨 **Severe Risk Emergency Triage:** Automated severity detection that dynamically recommends immediate hospital visits and specialist consultations when severe conditions are detected.
* ☁️ **Cloud Database Persistence:** Real-time storing and retrieval of patient consultation history via MongoDB Atlas.
* 🌍 **Multi-Lingual Support:** Native AI responses in English, Hindi, Kannada, and Malayalam.
* 🛡️ **Safety Guardrails:** Automated severity scoring with strict OTC medication guardrails and zero prescription drug generation.
* 📄 **Automatic EHR PDF Generation:** Downloadable medical reports for patient record-keeping.
* 🌙 **Light & Dark Mode Support:** Clean, accessible UI design.
* 📱 **Fully Responsive Interface:** Optimized for desktop, tablet, and mobile.

---

## 🛠️ Tech Stack

| Category       | Technologies                                 |
| -------------- | -------------------------------------------- |
| Frontend       | HTML5, CSS3, JavaScript                      |
| Backend        | Node.js, Express.js                          |
| Database       | MongoDB Atlas, Mongoose (ODM)                |
| AI Integration | Google Generative AI (Gemini 2.5 Flash API)  |
| Deployment     | Render (CI/CD Automated Pipelines)           |
| UI Features    | Responsive Design, Dark Mode                 |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone [https://github.com/darshan2006-coder/AI-HealthCare-Assistant.git](https://github.com/darshan2006-coder/AI-HealthCare-Assistant.git)
cd AI-HealthCare-Assistant

```

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file in the project root.

```env
PORT=3000
SESSION_SECRET=your_session_secret
GEMINI_API_KEY=your_api_key
MONGODB_URI=your_mongodb_atlas_connection_string
```

### Run the application

```bash
node server.js
```

Visit:

```text
http://localhost:3000
```

---

## 📈 What This Project Demonstrates

* Full-Stack Architecture: Decoupled backend APIs (Express) and static frontend UI.
* Clinical Triage Logic: Rules-based and prompt-engineered risk assessment to escalate critical health cases to professional emergency care.
* NoSQL Database Modeling: Schema design and pagination indexing with Mongoose.
* GenAI Prompt Engineering: Structuring non-deterministic LLM outputs into predictable, type-safe JSON for downstream databases.
* Cloud DevOps: Managing environment secrets, cross-platform deployment issues, and CI/CD pipelines via Render.
* Security & Guardrails: Implementing safety constraints to prevent prescription drug recommendations.

---

## 🔮 Future Enhancements

* User Authentication (JWT / OAuth) for personalized history routing.
* API Rate Limiting to secure API endpoints against DDOS and quota draining.
* Automated Unit Testing (Jest/Supertest) for core endpoints.

---

## ⚠️ Disclaimer

HealthBot AI is intended for educational and demonstration purposes. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns.

---




