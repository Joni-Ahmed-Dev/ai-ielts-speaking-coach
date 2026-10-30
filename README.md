# AI IELTS Speaking Coach 🎙️

A personal, mobile-first AI tutor for IELTS Speaking practice and Free Talk, powered by **Gemini Live API** for real-time speech conversation, strict non-interruption turn taking, and detailed grammatical feedback explained in simple Bengali.

![IELTS Coach](https://ais-pre-3ecnopy53lnirf5x6gvug7-800112478369.asia-east1.run.app/icon.svg)

---

## ✨ Features

- **Gemini Live Speech-to-Speech**: Streams microphone audio at 16kHz PCM and delivers real-time examiner voice replies via low-latency 24kHz Web Audio.
- **The Golden Rule**: The examiner **never interrupts** while you speak. Analyzes your response only when you tap "I'm Done" or when 2.0 seconds of continuous silence is detected.
- **Official IELTS Rubric**: Assesses Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, and Pronunciation with accurate .25/.75 IELTS half-band rounding.
- **Bengali Grammar Explanations**:
  - *You said:* "I am living here since childhood."
  - *Better:* "I have lived here since childhood."
  - *বাংলায় ব্যাখ্যা:* কেন Present Perfect tense প্রয়োজন তা সহজ বাংলায় পরিষ্কারভাবে ব্যাখ্যা।
- **Three Practice Modes**:
  1. **IELTS Practice**: Part 1 (personal), Part 2 (cue card with 60s prep countdown + 2m speech), Part 3 (abstract discussion).
  2. **Free Talk**: Friendly conversational partner observing your English quietly in the background.
  3. **Full Mock Test**: Authentic 15-minute exam simulation with end-of-test scorecard.
- **Progress Tracking & Memory**: Stores recurring weaknesses, band history, and daily focus recommendations in `localStorage`.
- **Installable Android PWA & APK Support**: Install directly from Chrome on any Android phone as a native app with app icon and full-screen experience.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Motion
- **Backend / Real-time**: Express, Node.js 22, `ws` (WebSocket Server)
- **AI Models**:
  - `gemini-3.8-live` (Real-time Speech-to-Speech WebSocket)
  - `gemini-3.8-flash` (IELTS Rubric & Bengali Grammar Evaluation)
  - `gemini-3.8-flash-lite-tts` (Examiner Spoken Voice synthesis)

---

## 🚀 How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or 22 recommended)
- A free Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Steps

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/ai-ielts-speaking-coach.git
cd ai-ielts-speaking-coach

# 2. Install dependencies
npm install

# 3. Create .env file (optional, users can also paste key directly in UI)
cp .env.example .env
# Set GEMINI_API_KEY="your_api_key_here" in .env

# 4. Start local development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📦 How to Push to GitHub

If you are initializing a new GitHub repository:

```bash
# 1. Initialize git
git init

# 2. Add files and commit
git add .
git commit -m "feat: initial release of AI IELTS Speaking Coach"

# 3. Rename branch to main
git branch -M main

# 4. Link your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/ai-ielts-speaking-coach.git

# 5. Push code to GitHub
git push -u origin main
```

---

## ☁️ 1-Click Deployment from GitHub

You can deploy this full-stack application to any cloud platform directly from your GitHub repository for free:

### Option A: Deploy on Render (Recommended & Free)
1. Sign up at [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Select your GitHub repository (`ai-ielts-speaking-coach`).
4. Configure settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add `GEMINI_API_KEY` (optional; users can also paste their own key in the UI).
5. Click **Deploy Web Service**!

### Option B: Deploy on Railway
1. Go to [Railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select this repo. Railway will automatically detect the `Dockerfile` or `package.json` and deploy.

### Option C: Deploy on Google Cloud Run
```bash
gcloud run deploy ai-ielts-coach --source . --port 3000 --allow-unauthenticated
```

---

## 📱 Android App & APK Installation

1. Open the deployed website in **Google Chrome** on your Android phone.
2. Tap the **three dots (⋮)** menu in Chrome.
3. Select **"Install app"** (or **"Add to Home screen"**).
4. The app will install directly with its official golden icon and run full-screen like a native Android app!
5. To package into a signed `.apk` file, enter the live URL into [PWABuilder](https://www.pwabuilder.com).

---

## 📄 License
MIT License. Built with Google AI Studio & Gemini API.
