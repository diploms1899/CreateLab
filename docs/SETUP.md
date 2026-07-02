# CreateLab Setup Guide

## Prerequisites

- Python 3.11+
- Node.js 20+
- Rust (latest stable)
- Arduino CLI (for Arduino features)

## Server Setup

```bash
cd server
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Set environment variables
export DEEPSEEK_API_KEY="sk-your-key-here"
export SECRET_KEY="$(openssl rand -base64 64)"

# Seed database
python scripts/seed.py

# Run
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Desktop Setup

```bash
cd desktop
npm install
npm run tauri dev
```

## Production Build

```bash
cd desktop
npm run tauri build
```

## Raspberry Pi Deployment

```bash
# On the Pi
cd server
pip install -r requirements.txt
sudo cp createlab-server.service /etc/systemd/system/
sudo systemctl enable createlab-server
sudo systemctl start createlab-server
```
