# Student Productivity Suite

A full-stack, collaborative productivity and peer-accountability platform engineered for **United International University (UIU)** students and faculty to combat academic procrastination and streamline course project collaboration.

Built with **React**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL & Realtime)**, and **Capacitor (Android APK)**.

---

## 🌟 Key Features

### 1. Peer Accountability & Kanban Boards
- **Live Kanban Deliverables**: Drag-and-drop or status-click task tracking (`To Do`, `In Progress`, `Done`).
- **Dynamic Task Assignment**: Real UIU registered student assignees with automated contribution scoring.
- **Activity Feed & Comments**: Real-time project updates and discussion threads per task deliverable.

### 2. Group Authenticity & Access Protection
- **Passcode Protection**: Team leaders can assign a secret join passcode/password to their project group.
- **Join Request Approvals**: Students without passcodes can submit join requests that creators can **Accept** or **Decline**.
- **1-Click Shareable Invite Links**: Generate and copy quick-join links or short alphanumeric join codes (e.g., `UIU-4821`).
- **Live Student Directory Search**: Zero hardcoded mock users; search registered peers dynamically from Supabase.

### 3. Deep Focus Timer
- **Pomodoro & Focus Tracking**: Customizable focus mode (deep, medium, light), white noise, and distraction blockers.
- **Live Analytics**: Computes real-time weekly focus hours and syncs session history with PostgreSQL.

### 4. Faculty Supervision Portal
- **Academic Oversight**: Faculty view with course filters (`Human-Computer Interaction`, `Computer Science`, `Web Dev`, etc.).
- **Progress Tracking & Feedback**: Milestone completion rates, individual student contribution scores, and direct faculty feedback messaging.

### 5. Multi-Platform Deployment
- **Web App**: Responsive edge-to-edge layout for desktops, laptops, and tablets.
- **Standalone Android APK**: Packaged via Capacitor, connected to the same live Supabase cloud database in real time.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### 1. Clone & Install
```bash
git clone https://github.com/abusayedrabbi327/Student_Productivity_Suite.git
cd Student_Productivity_Suite
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase project credentials:
```bash
cp .env.example .env
```

Inside `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Android Build (Capacitor)

To compile the Android APK:
```bash
# 1. Build web production bundle
npm run build

# 2. Sync web assets with Capacitor Android native container
npx cap sync android

# 3. Assemble Debug APK using Gradle
cd android
./gradlew assembleDebug
```
The compiled APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🔒 Security & Privacy Notice
All sensitive database connection strings, server service-role keys, and local environment files (`.env`) are strictly excluded from version control via `.gitignore`.