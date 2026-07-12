# CreateLab — Engineering Roadmap

> **Living document** — single source of truth. Every task, bug, and architectural
> decision originates here. Updated: 2026-07-07.

---

## Executive Summary

CreateLab is an **educational development platform** for the CoreV2 Summer Camp
where students build Arduino/ESP32 games and systems with an AI mentor. It is a
Tauri 2 + React desktop app connected to a FastAPI server that proxies DeepSeek
AI calls.

| Metric | Status |
|---|---|
| **Current maturity** | Early Alpha — core workflows functional, many stubs and dead code |
| **Biggest strength** | AI chat with code-apply pipeline works end-to-end |
| **Biggest weakness** | ~30% dead code, no starter firmware files, no real Arduino compilation, streaming AI broken |
| **Estimated production readiness** | **25%** |
| **Major blockers** | No starter firmware for any template, serial monitor stub, AI streaming broken, no rate limiting, secrets in repo |

---

## Product Vision

CreateLab should become an **AI-first embedded development IDE** where students
never need to leave the application. The AI acts as a complete embedded engineering
assistant — not just generating code, but compiling, flashing to hardware, reading
serial output, debugging runtime failures, and iterating autonomously.

- **Students**: pick a project, chat with an AI mentor, see code compile and run on hardware without Arduino IDE
- **Teachers**: monitor student progress, approve devices, see what the AI is teaching
- **AI**: sees full codebase, build output, and serial monitor; plans changes, applies them, compiles, fixes errors in a loop

---

## Current Architecture

```
Desktop (Tauri 2 + React 18 + Vite + Tailwind + Monaco + Zustand)
  │
  │  HTTP (axios, JWT)      Tauri IPC (invoke)
  ▼                          ▼
Server (FastAPI + SQLAlchemy async + SQLite)    Rust commands (Arduino CLI, FS, sync)
  │
  │  httpx proxy
  ▼
DeepSeek API (deepseek-v4-pro)
```

| Subsystem | Stack | Status |
|---|---|---|
| **Frontend** | React 18, TypeScript strict, Zustand (9 stores), react-resizable-panels, Monaco | Functional, 29% dead code |
| **Backend** | FastAPI, async SQLAlchemy, SQLite, JWT (HS256), bcrypt | Functional, all 25 endpoints respond |
| **AI** | DeepSeek proxy via httpx, system prompt assembly, conversation persistence | Works, streaming broken, model outdated |
| **Agent Runtime** | None — no tool calling, no planning loop, no autonomous iteration | Not implemented |
| **Database** | SQLite via aiosqlite, 8 tables, auto-created | Works, no Alembic migrations |
| **Workspace** | JSON `file_index` + `WorkspaceFile` table (redundant) | Works, dual storage |
| **Context** | Template info + full file contents + last 20 messages | Missing: learning objectives, firmware rules, cursor position, compiler errors (auto) |
| **Memory** | Conversation table (last 20 messages), no summarization | Basic |
| **Compilation** | Arduino CLI wrapper in Rust, server endpoint is a stub | Partial |
| **Hardware** | ESP32, SSD1306 OLED, MPU6050, buzzer, buttons | Defined in seed data but not validated |
| **Server** | FastAPI + uvicorn, JWT auth, CORS open | Functional but insecure |
| **Project System** | 4 templates (Platformer, Fishing, Robotics, Calculator) | No starter firmware files exist |

---

## Engineering Principles

1. **No duplicate logic** — every concept lives in exactly one place
2. **No placeholder UI** — every component must be complete before merging
3. **No hidden technical debt** — every shortcut is documented here
4. **Every feature tested** — 87 server tests exist; desktop tests must follow
5. **Every bug reproduced before fixing** — root cause analysis required
6. **Every change verified** — smoke test + automated tests
7. **Security by default** — no open CORS, no shell exec without allowlist, secrets never in repo
8. **Offline-first** — app must function without server; sync on reconnect
9. **AI sees everything** — full context: code, build output, serial, errors

---

## Milestones

### Milestone 1 — Critical Stability 🔴

**Goal**: Fix all security issues, remove dead code, make the app reliably runnable.

- [x] **Restrict CORS** from `["*"]` to `["http://localhost:1420", "http://localhost:5173", "tauri://localhost"]`
  - Priority: Critical | Effort: XS
  - Affected: `server/app/core/config.py`
  - Verification: Desktop connects, browser cross-origin requests blocked

- [x] **Enable CSP** in `tauri.conf.json`
  - Priority: Critical | Effort: XS
  - Affected: `desktop/src-tauri/tauri.conf.json`
  - Verification: App renders, no CSP violation errors

- [x] **Secure `run_shell_cmd`** — add command allowlist
  - Priority: Critical | Effort: S
  - Affected: `desktop/src-tauri/src/commands/repo.rs`
  - Verification: Arbitrary commands rejected, allowed commands work

- [x] **Fix `write_file` content** — JSON body instead of query param
  - Priority: High | Effort: S
  - Affected: `server/app/api/routes/workspaces.py`, `desktop/src-tauri/src/commands/workspace.rs`
  - Verification: Upload 10KB file; tests pass

- [x] **Add path traversal protection** — reject `..` in file paths
  - Priority: High | Effort: S
  - Affected: `server/app/api/routes/workspaces.py`
  - Verification: `../../../etc/passwd` returns 400/404

- [x] **Fix Rust server URL default** `8443` → `8000`
  - Priority: High | Effort: XS
  - Affected: `desktop/src-tauri/src/state.rs`

- [x] **Add `.gitignore`** entries for `.env`, `*.db`, `__pycache__/`, `node_modules/`, `target/`
  - Priority: Critical | Effort: XS

- [ ] **Rotate exposed API key** — `.env` was committed to repo
  - Priority: Critical | Effort: S | Deps: None
  - Affected: `server/.env`
  - Verification: `git log` shows no key in history after rewrite

- [ ] **Add rate limiting** via `slowapi` on `/ai/chat`, `/auth/login`, `/auth/register`
  - Priority: Critical | Effort: M | Deps: None
  - Affected: `server/app/main.py`, `server/pyproject.toml`
  - Verification: 10 rapid requests → 429 on 11th

- [ ] **Delete dead code** — 21 files (29% of codebase)
  - Priority: High | Effort: M | Deps: None
  - Affected: See Dead Code Inventory below
  - Verification: `tsc --noEmit` passes, `pytest` passes, app runs

- [ ] **Delete 6 dead service files** — `server/app/api/services/`
  - Priority: High | Effort: S | Deps: None

- [ ] **Delete 4 dead project definition files** — `desktop/src/projects/*.ts`
  - Priority: High | Effort: XS | Deps: None

- [ ] **Remove duplicate device registration** — keep `POST /devices/register`, drop `POST /auth/devices/register`
  - Priority: High | Effort: S | Deps: None
  - Affected: `server/app/api/routes/auth.py`

- [ ] **Sync `pyproject.toml` and `requirements.txt`**
  - Priority: High | Effort: S | Deps: None

- [ ] **Add proper Pydantic schema** for admin `update_device`
  - Priority: Medium | Effort: S | Deps: None
  - Affected: `server/app/api/routes/admin.py`

- [ ] **Generate Alembic initial migration**
  - Priority: Medium | Effort: M | Deps: None

- [ ] **Fix `onupdate` on all models** — remove callable (SQLAlchemy ignores it)
  - Priority: Low | Effort: XS | Deps: None

- [ ] **Close httpx client** in AIService — use shared client or context manager
  - Priority: Medium | Effort: S | Deps: None

### Milestone 2 — AI Runtime 🟡

**Goal**: Production-quality AI chat with streaming, proper context, error handling.

- [ ] **Fix streaming endpoint** — use real template data, load history, persist messages
  - Priority: High | Effort: M | Deps: M1 cleanup
  - Affected: `server/app/api/routes/ai.py`

- [ ] **Wire frontend to streaming endpoint**
  - Priority: High | Effort: M | Deps: Server streaming fix
  - Affected: `desktop/src/components/AIChatPanel.tsx`

- [ ] **Add `learning_objectives` and `firmware_rules` to system prompt**
  - Priority: Medium | Effort: XS

- [ ] **Add "current file" context** — active file path + cursor position
  - Priority: Medium | Effort: S

- [ ] **Add server-side error handling** for DeepSeek failures (401, 429, 503)
  - Priority: High | Effort: S

- [ ] **Add frontend error type distinction** — network vs auth vs rate limit
  - Priority: Medium | Effort: S

- [ ] **Add conversation history summarization** — when > 20 messages
  - Priority: Medium | Effort: M

- [ ] **Switch to diff-based editing** — AI outputs unified diffs, not full files
  - Priority: Medium | Effort: L

- [ ] **Add file size limit** — warn when total content > 50KB
  - Priority: Low | Effort: S

### Milestone 3 — Embedded Development System 🟠

**Goal**: AI can compile, read errors, and fix them autonomously. Automatic library management.

- [ ] **Implement agentic loop** — Plan → Edit → Compile → Read Errors → Fix → Repeat
  - Priority: High | Effort: XL
  - Affected: New `ai_agent.py` service, new frontend panel

- [ ] **Auto-feed compiler errors to AI** — after compile, send output to chat context
  - Priority: High | Effort: M

- [ ] **Auto-feed serial monitor output to AI**
  - Priority: Medium | Effort: L

- [ ] **Implement tool calling** — `read_file`, `write_file`, `compile`, `upload`, `read_serial`
  - Priority: Medium | Effort: XL

- [ ] **Automatic library management** — detect `#include` → find library → install via arduino-cli → verify
  - Priority: High | Effort: L
  - Affected: New Rust command, AI system prompt update

- [ ] **Implement `serial_monitor`** in Rust (currently a no-op stub)
  - Priority: High | Effort: M

- [ ] **Fix server Arduino compile** endpoint (currently always returns success)
  - Priority: High | Effort: M

### Milestone 4 — Student Experience 🟢

**Goal**: Complete, polished onboarding and project workflow.

- [ ] **Create starter firmware for all 4 templates** — buildable `.ino`/`.cpp`/`.h` files
  - Priority: Critical | Effort: XL
  - Affected: `templates/*/`, `server/scripts/seed.py`

- [ ] **Fix hardware config consistency** — README files must match seed data
  - Priority: High | Effort: M

- [ ] **Unify theme system** — single ThemeConfig, auto-applied from template slug
  - Priority: High | Effort: M
  - Affected: `desktop/src/stores/projectStore.ts`, `themeStore.ts`, `themes/projectThemes.ts`

- [ ] **Replace `window.prompt()` file creation** with inline input
  - Priority: Medium | Effort: S

- [ ] **Add file context menu** — rename, delete, duplicate
  - Priority: Medium | Effort: M

- [ ] **Add empty states** — "No files yet", "No messages", suggested prompts
  - Priority: Medium | Effort: S

- [ ] **Add project deletion** with confirmation dialog
  - Priority: Medium | Effort: S

- [ ] **Add persistent offline caching** — cache templates, workspaces, files
  - Priority: Medium | Effort: M

- [ ] **Add loading skeletons** — shimmer placeholders
  - Priority: Low | Effort: S

- [ ] **Add keyboard shortcuts panel** — `Ctrl+K` overlay
  - Priority: Low | Effort: S

### Milestone 5 — Teacher Experience 🔵

- [ ] **Student progress dashboard** — per-student progress, message count, compile count
  - Priority: Medium | Effort: L

- [ ] **Device approval workflow** — admin panel for pending/trusted/disabled devices
  - Priority: Medium | Effort: M

- [ ] **Template customization** — teachers can create/edit templates
  - Priority: Low | Effort: L

- [ ] **AI usage monitoring** — tokens per student, session count
  - Priority: Low | Effort: M

### Milestone 6 — Performance ⚡

- [ ] **Add request logging** — errors, auth failures, AI API calls
  - Priority: High | Effort: S

- [ ] **Add pagination** to all list endpoints
  - Priority: Medium | Effort: M

- [ ] **Optimize workspace file sync** — delta (only changed files)
  - Priority: Medium | Effort: M

- [ ] **Add React.lazy code splitting**
  - Priority: Low | Effort: S

### Milestone 7 — Polish ✨

- [ ] **Toast notification system** — save, sync, compile, upload events
- [ ] **Smooth transitions** — route changes, panel toggles (framer-motion)
- [ ] **Dark/light/system theme toggle** that actually works
- [ ] **Improve Settings UI** — validation on inputs, organized layout

### Milestone 8 — Production Release 🚀

- [ ] **Complete release checklist**
- [ ] **Build Windows installer** via Tauri bundler
- [ ] **Build macOS installer** via Tauri bundler
- [ ] **Deploy server to Raspberry Pi** — systemd service
- [ ] **Add CI/CD** — GitHub Actions: lint, test, build
- [ ] **Write user documentation** — student guide, teacher guide

---

## Dead Code Inventory

These 21 files exist but are never imported by any active component:

### Desktop components (14 files)
| File | What it does | Why dead |
|---|---|---|
| `components/CodeEditor.tsx` | Monaco wrapper with Arduino syntax | Duplicate of `EditorPanel` |
| `components/ChatPanel.tsx` | Simpler chat UI using `chatStore` | `WorkspaceView` uses `AIChatPanel` |
| `components/ArduinoPanel.tsx` | Simpler hardware panel | `WorkspaceView` uses `HardwarePanel` |
| `components/Sidebar.tsx` | Files + boards + libraries tabs | Duplicates `HardwarePanel` + `FileExplorer` |
| `components/ProjectCard.tsx` | Animated template card | `ProjectSelectView` inlines its own |
| `components/AIActivityPanel.tsx` | AI activity stream + edit queue | Not wired into any view |
| `components/AIChangeFeed.tsx` | Toast notifications for AI changes | Not wired in |
| `components/CodeStatsPanel.tsx` | Lines added/removed, session stats | Not wired in |
| `components/DiffPreview.tsx` | Side-by-side diff viewer | Not integrated into chat flow |
| `components/common/Button.tsx` | Generic button component | Not imported; CSS classes undefined |
| `components/common/Input.tsx` | Generic input with label/error | Not imported; CSS classes undefined |
| `components/common/Modal.tsx` | Modal with Escape handling | Not imported |
| `components/common/Spinner.tsx` | Loading spinner | Not imported |
| `arduino/BoardSelector.tsx` | Board dropdown | HardwarePanel has its own |
| `arduino/BuildOutput.tsx` | Build output display | Not imported |
| `arduino/SerialMonitor.tsx` | Serial output (stub) | Not imported, blocking invoke call |
| `ai/ContextPreview.tsx` | Project/file/history counts | Not imported |
| `ai/MessageBubble.tsx` | Chat message display | Not imported |

### Desktop hooks (3 files)
| File | Why dead |
|---|---|
| `hooks/useKeyboard.ts` | Multi-key handler; never imported |
| `hooks/useLocalStorage.ts` | Generic localStorage hook; never imported |
| `hooks/useTheme.ts` | Returns hardcoded theme; never imported |

### Desktop project defs (4 files)
| File | Why dead |
|---|---|
| `projects/calculator.ts` | Re-export from `projectThemes.ts`; never imported |
| `projects/fishing.ts` | Same |
| `projects/platformer.ts` | Same |
| `projects/robotics.ts` | Same |

### Server (6 files)
| File | Why dead |
|---|---|
| `app/core/events.py` | Logger never imported or used |
| `app/api/services/auth_service.py` | Routes re-implement logic inline |
| `app/api/services/device_service.py` | Same |
| `app/api/services/project_service.py` | Same |
| `app/api/services/sync_service.py` | Same |
| `app/api/services/workspace_service.py` | Same |

---

## Bugs

| ID | Severity | Description | Root Cause | Subsystem | Status |
|---|---|---|---|---|---|
| B1 | 🔴 Critical | `run_shell_cmd` allowed arbitrary commands | No allowlist | Rust/security | ✅ Fixed |
| B2 | 🔴 Critical | DeepSeek API key committed to repo | `.env` tracked by git | Server/security | Open |
| B3 | 🔴 Critical | CSP was disabled (`null`) | Default Tauri config | Desktop/security | ✅ Fixed |
| B4 | 🔴 Critical | No rate limiting on AI endpoint | Not implemented | Server/AI | Open |
| B5 | 🟠 High | AI streaming broken — hardcoded empty values, no history | Incomplete implementation | Server/AI | Open |
| B6 | 🟠 High | Frontend doesn't use streaming endpoint | `AIChatPanel` calls non-streaming route | Desktop/AI | Open |
| B7 | 🟠 High | `serial_monitor` is a no-op stub | Returns `Ok(())` | Rust/Arduino | Open |
| B8 | 🟠 High | Server Arduino compile is a stub | Always `success: true` | Server/Arduino | Open |
| B9 | 🟠 High | `write_file` sent content as query param | Route used `content: str = ""` | Server/workspace | ✅ Fixed |
| B10 | 🟠 High | No starter firmware for any template | `starter_files` = NULL in seed | Templates | Open |
| B11 | 🟡 Medium | Auth refresh endpoint skips `/api/v1` prefix | `api.ts` hardcoded URL | Desktop/API | Open |
| B12 | 🟡 Medium | `editorStore.dirtyFiles` uses Set (Zustand can't detect) | Mutable Set in immutable store | Desktop/editor | Open |
| B13 | 🟡 Medium | Hardware config mismatch README vs seed data | Independent authoring | Templates | Open |
| B14 | 🟡 Medium | `ThemeConfig` type collision (projectStore vs themeStore) | Duplicate interfaces | Desktop/theme | Open |
| B15 | 🟢 Low | `SettingsView` bypasses stores — reads/writes localStorage directly | Quick implementation | Desktop/settings | Open |
| B16 | 🟢 Low | `User.onupdate` lambda silently ignored by SQLAlchemy | API misunderstanding | Server/models | Open |
| B17 | 🟢 Low | Model style inconsistency — `Column()` vs `Mapped[]` | Two conventions | Server/models | Open |

---

## Technical Debt

| Item | Why | Impact | Plan |
|---|---|---|---|
| **29% dead code** | Components built speculatively | Bloated bundle, confusion | Delete in M1 |
| **Two ThemeConfig interfaces** | Organic growth | Type mismatch risk | Unify in M4 |
| **Dual file storage** (JSON + WorkspaceFile) | Incomplete migration | Data inconsistency | Choose one in M1 |
| **No Alembic migrations** | Used `create_all()` for speed | No versioned schema | Generate in M1 |
| **`onupdate` callables ignored** | SQLAlchemy API misunderstanding | `updated_at` never updates | Fix in M1 |
| **Rust auth commands vs HTTP auth** | Two parallel strategies | Dead Rust code | Delete Rust auth in M1 |
| **`requirements.txt` vs `pyproject.toml` drift** | Maintained separately | Install failures | Sync in M1 |
| **`promptBuilder.ts` dead code** | Server-side prompt replaced it | Confusion | Delete in M1 |
| **Hardcoded offline fallbacks** | Quick fix for demo | Stale data offline | Replace with cache in M4 |

---

## UX Improvements

| Area | Issue | Fix | Priority |
|---|---|---|---|
| Navigation | No breadcrumbs in workspace | Show project > file path | Low |
| Editor | No Arduino library autocomplete | Add C++ snippets or language server | Medium |
| Editor | No error squiggles | Integrate compiler output with Monaco markers | Medium |
| AI panel | No typing indicator during streaming | Animated dots | Low |
| AI panel | No suggested prompts | "What should I do?" suggestions | Medium |
| Project select | Cards don't show difficulty/time | Add badges | Low |
| Settings | No validation on API key format | Show "Invalid format" for non-`sk-` keys | Low |
| Hardware panel | Library manager no progress | Spinner during install/remove | Low |
| File explorer | No file type icons | Add `.cpp`, `.h`, `.ino`, `.md` icons | Low |
| Empty states | Blank when nothing loaded | Illustrated empty states with CTA | Medium |
| Loading | No skeleton screens | Shimmer placeholders | Low |

---

## AI Improvements

| Area | Current | Target |
|---|---|---|
| Model | `deepseek-coder` (deprecated) | `deepseek-v4-pro` ✅ Fixed |
| Streaming | Broken | Real-time word-by-word |
| Context | File contents + template info | + learning objectives, firmware rules, build output, serial, cursor position |
| Memory | Last 20 messages | Smart summarization for long sessions |
| Tool calling | None | `read_file`, `write_file`, `compile`, `upload`, `read_serial` |
| Agentic loop | None | Plan → Edit → Compile → Fix → Repeat |
| Error recovery | None | Retry with backoff, fallback model |
| Diff editing | Full file rewrites | Unified diff patches |
| Auto library mgmt | None | Detect `#include` → install via arduino-cli |
| Cost control | None | Token budget per student per session |

---

## Security Improvements

| Area | Issue | Fix | Status |
|---|---|---|---|
| CORS | `["*"]` | Restrict to Tauri origins | ✅ Fixed |
| CSP | `null` | Set restrictive policy | ✅ Fixed |
| Shell exec | Any command allowed | Add allowlist | ✅ Fixed |
| Secrets | API key in repo | Rotate key, `.env` in `.gitignore` | Open |
| Rate limiting | None | `slowapi` on auth + AI | Open |
| Path traversal | No validation | Reject `..` in paths | ✅ Fixed |
| `write_file` | Content in query param | JSON body | ✅ Fixed |
| JWT | HS256, weak secret | Rotate secret, add `aud`/`iss` | Open |
| Refresh tokens | No invalidation | Track sessions, revoke old | Open |
| Admin input | `body: dict` | Pydantic schema | Open |

---

## Performance Improvements

| Area | Issue | Fix |
|---|---|---|
| Bundle size | 29% dead code | Delete dead files |
| AI context | All files every request | Only changed files, cap at 50KB |
| Sync | Full cache push | Delta sync |
| List endpoints | No pagination | `page`/`size` params |

---

## Release Checklist

- [ ] All Critical bugs fixed (B1-B4) — B1/B3 fixed, B2/B4 open
- [ ] All High bugs fixed (B5-B10) — B9 fixed, B5-B8/B10 open
- [ ] 87 server tests passing ✅
- [ ] Desktop E2E tests passing (8 spec files exist, need verification)
- [ ] Desktop `tsc --noEmit` passes
- [ ] Rust `cargo build` passes (1 dead_code warning)
- [ ] `.env` not tracked by git
- [ ] API key rotated
- [ ] CSP enabled ✅
- [ ] CORS restricted ✅
- [ ] Rate limiting active
- [ ] All 4 templates have buildable starter firmware
- [ ] Hardware configs match READMEs
- [ ] Streaming AI works end-to-end
- [ ] Serial monitor streams real data
- [ ] Windows installer built and tested
- [ ] User documentation written
- [ ] Security audit completed

---

## Changelog

**2026-07-07** — Initial roadmap created after full subsystem audit. CORS restricted, CSP enabled, `run_shell_cmd` secured, `write_file` fixed, path traversal added, Rust URL default fixed.
