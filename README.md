# CreateLab — CoreV2 Summer Camp Platform

A distributed educational development platform for the CoreV2 Summer Camp. Students build Arduino/ESP32 games and systems with an AI mentor guiding them through every step.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Desktop Client  │◄───►│  Classroom Server │◄───►│   DeepSeek   │
│  (Tauri 2+React) │     │  (FastAPI+SQLite) │     │  AI Backend  │
│                  │     │                   │     │              │
│  • Monaco Editor │     │  • Auth/JWT       │     │  • Reasoning │
│  • AI Chat       │     │  • Project Mgmt   │     │  • Code Gen  │
│  • Arduino Build  │     │  • Device Registry│     │  • Debugging │
│  • Theme Engine  │     │  • Delta Sync     │     │  • Docs      │
│  • Offline-First │     │  • Role-Based ACL │     │              │
└─────────────────┘     └──────────────────┘     └──────────────┘
```

## Project Templates

| Project     | Theme        | AI Personality              |
|------------|-------------|-----------------------------|
| Platformer  | Dark retro   | Veteran game dev            |
| Fishing     | Ocean blue   | Calm fishing guide          |
| Robotics    | Industrial   | Embedded systems engineer   |
| Calculator  | Scientific   | Engineering professor       |

## Getting Started

### Prerequisites

- Node.js 20+
- Rust toolchain (for Tauri)
- Python 3.11+
- Arduino CLI (for firmware compilation)

### Server Setup

```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m scripts.seed
python main.py
```

### Desktop Setup

```bash
cd desktop
npm install
npm run tauri dev
```

## Tech Stack

- **Desktop:** Tauri 2, Rust, React 18, TypeScript, Vite, TailwindCSS, Monaco Editor, Zustand
- **Server:** FastAPI, SQLAlchemy (async), SQLite, JWT, WebSockets
- **Hardware:** ESP32, SSD1306 OLED (128x64), MPU6050, passive buzzer, buttons
