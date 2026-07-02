# CreateLab Architecture

## System Overview

CreateLab is a distributed educational development platform for the CoreV2 Summer Camp. Three cooperating systems form the platform:

### 1. Desktop Client (Tauri 2 + React)
- User interface with per-project visual themes
- Monaco editor for code
- Arduino integration (compile, upload, serial)
- Offline-first with local cache
- All AI requests proxied through the server

### 2. Classroom Server (FastAPI + SQLite)
- Trusted authority for all sensitive data
- Authentication via JWT (access + refresh tokens)
- Project template management
- Workspace synchronization (delta sync)
- Device registry with trust levels
- DeepSeek AI proxy (API keys never leave the server)

### 3. DeepSeek AI Backend
- Reasoning and code generation only
- Never stores project state
- Accessible only through the server proxy

## Security Model

- Desktop clients are ALWAYS untrusted
- All authentication validated server-side
- DeepSeek API keys stored ONLY on the server
- JWT tokens with short-lived access + long-lived refresh
- Role-based access: administrator, instructor, student
- HTTPS/TLS for all server communication

## Data Flow

1. Student opens desktop app → logs in via server
2. Chooses project template → server creates workspace
3. Workspace synced to desktop → student edits locally
4. Student asks AI → desktop sends to server
5. Server builds complete AI context → proxies to DeepSeek
6. DeepSeek responds → server records conversation → desktop receives
7. All changes tracked → diff preview → apply → history

## Workspace Sync

- Delta-based: only changed files synced
- Version vector for conflict detection
- Offline edits queued locally
- Auto-sync on reconnect
