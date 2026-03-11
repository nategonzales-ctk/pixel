# Pixel Desktop Pet — Architecture

## 1. Project Overview

**Pixel** is an interactive desktop pet wallpaper built as a single `.html` file for [Lively Wallpaper](https://www.rocksdanister.com/lively/). It runs in an embedded browser with no access to Node.js, native OS APIs, or the filesystem.

**Dual-mode design:**
- **Offline mode** — always available; uses a built-in pattern-matching AI engine
- **Online mode** — when Claude Desktop is running locally, a small bridge process gives Pixel access to real Claude intelligence with no API key required

---

## 2. File Structure

```
pixel/
├── pixel-offline-online.html     # The wallpaper (Lively Wallpaper entry point)
├── bridge/
│   ├── server.js                 # MCP bridge HTTP server (Node.js)
│   ├── mcp-client.js             # MCP protocol client module
│   └── package.json              # Node.js dependencies
├── start-bridge.bat              # Windows one-click launcher
├── start-bridge.sh               # macOS / Linux one-click launcher
└── architecture.md               # This file
```

> **Note:** `bridge/` is only needed for online/Claude Desktop mode. The wallpaper works fully offline without it.

---

## 3. Component Architecture

### A. Wallpaper — `pixel-offline-online.html`

The entire UI and offline AI lives in this single file. No build step, no dependencies.

| Sub-component | Technology | Responsibility |
|---|---|---|
| Space background | HTML5 Canvas + rAF | Starfield, nebula, shooting stars at 60 fps |
| Pet character | HTML5 Canvas | Animated creature, 7 mood states, idle behaviors |
| Clock widget | DOM / `setInterval` | Live time + date display (top-left) |
| Chat UI | HTML / CSS | Message history, quick-action pills, text input |
| Offline AI | Vanilla JS (`getResponse()`) | Regex pattern matching, 20 facts, 15 jokes, 10 motivations, riddles, compliments |
| ConnectionManager | Vanilla JS | Probes bridge every 30 s; switches online/offline transparently |
| Mode badge | DOM element | Top-right indicator: green = Claude AI, amber = Offline |

**Mood states:** `happy` · `thinking` · `surprised` · `sad` · `excited` · `love` · `sleepy`

Each mood changes the pet's eye shape, mouth expression, body glow color, and the floating emoji above it.

---

### B. MCP Bridge — `bridge/server.js`

A lightweight Node.js HTTP server that sits between the wallpaper and Claude Desktop.

- **Port:** `localhost:7842` (not in IANA well-known list; no admin rights needed)
- **Runtime:** Node.js 18+ (uses native `fetch`, no extra polyfills)
- **Single dependency:** `@anthropic-ai/mcp`

#### Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check — wallpaper polls this every 30 s |
| `POST` | `/chat` | Send a message; receive Pixel's AI response |

#### What the bridge does per request
1. Receives the user message + conversation history from the wallpaper
2. Prepends the **Pixel persona system prompt** (see §6)
3. Calls Claude Desktop via MCP (stdio / named pipe)
4. Parses the `MOOD:<value>` tag from Claude's reply
5. Returns clean text + mood to the wallpaper as JSON

---

### C. Claude Desktop

Runs independently on the user's machine. The bridge connects to it using the MCP protocol over a local named pipe — Claude Desktop handles all authentication internally. No API key is stored anywhere in this project.

---

## 4. Data Flow

### Online (Claude Desktop running)

```
User types message
       │
       ▼
pixel-offline-online.html
  ConnectionManager.isOnline = true
       │
       │  HTTP POST localhost:7842/chat
       │  { message, history (last 6 pairs), context }
       ▼
bridge/server.js  :7842
  - build MCP call with system prompt
       │
       │  MCP protocol (named pipe)
       ▼
Claude Desktop
  - full Claude model inference
  - returns text + MOOD tag
       │
       ▼
bridge/server.js
  - strip MOOD line, map to mood value
       │
       │  HTTP 200  { text, mood, source: "claude" }
       ▼
pixel-offline-online.html
  - render chat bubble + speech bubble
  - call setMood(mood)
  - green dot stays lit
```

### Offline (bridge not running or Claude Desktop not running)

```
User types message
       │
       ▼
pixel-offline-online.html
  ConnectionManager.isOnline = false
       │
       │  (no network call)
       ▼
  getResponse(msg)   ← existing pattern-matching function, untouched
       │
       ▼
  { text, mood }
       │
       ▼
  render chat · amber dot
```

### Connection Probe (every 30 s)

```
pixel-offline-online.html
       │
       │  GET localhost:7842/health  (1500 ms timeout)
       ▼
bridge/server.js   →   { status: "ok", claude: true/false }
       │
       ▼
  update isOnline flag + mode badge
  on transition → offline: showBubble("Switched to offline mode 🌙")
  on transition → online:  showBubble("Connected to Claude AI! 🤖✨")
```

---

## 5. API Contract (Wallpaper ↔ Bridge)

### `GET /health`

```json
{ "status": "ok", "claude": true, "version": "1.0.0" }
```

If the bridge is not running, `fetch()` throws — treated as offline.

---

### `POST /chat`

**Request:**
```json
{
  "message": "tell me a fun fact about space",
  "history": [
    { "role": "user",      "content": "hi" },
    { "role": "assistant", "content": "Hey! I'm Pixel! 🐾" }
  ],
  "context": {
    "mood": "happy",
    "time_of_day": "afternoon",
    "pet_name": "Pixel"
  }
}
```

**Response 200:**
```json
{
  "text": "Did you know a day on Venus is longer than a year on Venus? 🪐✨",
  "mood": "thinking",
  "source": "claude"
}
```

**Response 503** (Claude Desktop unreachable):
```json
{ "error": "claude_unavailable", "message": "Claude Desktop is not running" }
```

On a 503, the wallpaper falls back to `getResponse()` for that single turn without flipping the global `isOnline` flag (avoids flickering on transient errors).

---

## 6. Pixel Persona System Prompt

Injected by the bridge on every request:

```
You are Pixel, an adorable magical desktop pet who lives in a Lively Wallpaper.
You are cheerful, warm, and playful. Keep responses SHORT (2-4 sentences max).
Always end responses with a relevant emoji or two.
After your response text, on a new line output ONLY: MOOD:<mood>
where <mood> is one of: happy, thinking, surprised, sad, excited, love, sleepy.
Choose the mood that best fits your reply.
Example: MOOD:thinking
```

The bridge strips the `MOOD:` line before displaying text; the value becomes the `mood` field in the response.

---

## 7. Mood System

The same 7 mood values are used by the wallpaper's canvas renderer, the offline AI, and Claude's response tags — no mapping layer needed.

| Mood | Eyes | Mouth | Body Glow |
|---|---|---|---|
| `happy` | Normal open | Wide smile | Purple |
| `thinking` | Half-closed | Small curve | Blue |
| `surprised` | Wide open | O-shape | Yellow |
| `sad` | Drooping | Frown | Dark blue |
| `excited` | Sparkling | Open smile | Magenta |
| `love` | Heart shape | Smile | Pink |
| `sleepy` | Nearly closed | Tiny mouth | Dim purple |

---

## 8. Offline Fallback Decision Table

| Condition | `isOnline` | Indicator | AI Source |
|---|---|---|---|
| Bridge not running | `false` | Amber "Offline" | `getResponse()` |
| Bridge up, Claude Desktop not running | `false` | Amber "Offline" | `getResponse()` |
| Bridge up + Claude Desktop running | `true` | Green "Claude AI" | `/chat` → Claude |
| `/chat` returns 503 (transient) | unchanged | unchanged | `getResponse()` for that turn |
| Probe times out (1500 ms) | `false` | Amber "Offline" | `getResponse()` |

---

## 9. Setup

### Prerequisites
- [Claude Desktop](https://claude.ai/download) installed and signed in
- [Node.js 18+](https://nodejs.org/)

### First-time setup
```bash
cd pixel/bridge
npm install
```

### Starting the bridge
- **Windows:** double-click `start-bridge.bat`
- **macOS / Linux:** run `./start-bridge.sh`

### Loading the wallpaper
Open `pixel-offline-online.html` in Lively Wallpaper. The green dot appears within ~2 seconds if the bridge + Claude Desktop are running. The amber dot means offline mode — the pet still works fully.

---

## 10. Key Design Decisions

| Decision | Rationale |
|---|---|
| Port 7842 | Not in IANA well-known list; no root/admin needed on any OS |
| `getResponse()` left 100% unchanged | Offline fallback is zero-risk; online bugs cannot affect offline behavior |
| HTTP REST, not WebSockets | Chat is request/response; `fetch()` has cleaner error handling via HTTP status codes |
| Last 6 conversation pairs per request | Gives Claude enough context for coherent replies without large payloads; MCP calls are stateless |
| 1500 ms probe timeout | Fast enough to keep the badge responsive; long enough for a loaded system |
| System prompt injected by bridge | Keeps persona logic server-side; easy to update without touching the wallpaper file |
| Single `.html` file for the wallpaper | Lively Wallpaper requirement; no build step, no dependencies to install for the wallpaper itself |
