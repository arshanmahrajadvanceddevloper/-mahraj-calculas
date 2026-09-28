# 🧮 Mahraj Calculas — Scientific Intelligence Suite

Mahraj Calculas is a high-precision, production-grade scientific computing and AI-powered calculation suite designed for students, educators, researchers, and engineers.

![App Preview](public/app-logo.png)

---

## ✨ Key Features

- **⚡ Butter-Smooth High-Precision Calculator:** Instant actuation, mechanical haptic vibrations, scientific notation (`SCI`), trigonometric functions in `DEG`/`RAD`, and complete memory operations (`MC`, `MR`, `M+`, `M-`, `MS`).
- **🎙️ Mahraj AI Companion (Voice & Vision):** Interactive voice conversations, equation solver, OCR camera formula scanning, and scientific problem-solving with real-time text-to-speech.
- **🔬 Physics & Chemistry Formula Solvers:** Interactive variable calculation with automatic unit conversions across Mechanics, Thermodynamics, Electromagnetism, Quantum Physics, Gas Laws, Molarity, and Electrochemistry.
- **📈 Real-Time Dynamic Graph Plotter:** 2D interactive function graphing (linear, quadratic, sinusoidal) with pan/zoom and statistics analysis.
- **💱 Real-Time Currency & Forex Converter:** Live exchange rate conversions across major global currencies.
- **🔒 Cryptographic SHA Generator:** High-speed SHA-256, SHA-1, and SHA-512 hashing for strings and local files.
- **📜 Calculation History & PDF Export:** Auto-synced calculation history with one-click print and PDF export.
- **📲 Progressive Web App (PWA):** Installable directly on Android, iOS, and Desktop with offline caching.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide React, Framer Motion
- **Backend:** Express, Node.js (Full-stack TypeScript via `tsx`)
- **AI Engine:** Google Gemini API (`@google/genai`)
- **Database & Auth:** Firebase Firestore, Firebase Authentication
- **Build Tool:** Vite

---

## 🚀 Getting Started Locally

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/mahraj-calculas.git
cd mahraj-calculas
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your `GEMINI_API_KEY` (get one from [Google AI Studio](https://aistudio.google.com/)).

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📄 License
This project is licensed under the Apache-2.0 License.
