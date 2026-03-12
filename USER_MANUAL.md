# Pixel Desktop Pet — User Manual

## Table of Contents

1. [Getting Started](#getting-started)
2. [Pet Characters](#pet-characters)
3. [Controls & Commands](#controls--commands)
4. [Widgets](#widgets)
5. [Settings & Configuration](#settings--configuration)
6. [Layout & Customization](#layout--customization)
7. [Themes & Appearance](#themes--appearance)
8. [Chat & AI Features](#chat--ai-features)
9. [Bridge Server](#bridge-server)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js 18+** (for the bridge server)
- **Lively Wallpaper** (to run as desktop wallpaper)
- **Claude Desktop** (optional, for online AI chat mode)

### One-Click Setup (Windows)

1. **Double-click `SETUP.bat`** — it does everything automatically:
   - Checks Node.js is installed (opens download page if missing)
   - Installs bridge dependencies
   - Adds bridge to Windows startup (auto-starts on login)
   - Starts the bridge server in background

2. **Add wallpaper in Lively Wallpaper:**
   - Open Lively Wallpaper
   - Click "+" (Add Wallpaper)
   - Select `pixel-offline-online.html`
   - Done! Your pet appears on the desktop

That's it — two steps total. The bridge auto-starts every time you log in.

### Manual Installation

If you prefer manual setup:

1. **Install bridge dependencies:**
   ```
   cd pixel/bridge
   npm install
   ```

2. **Start the bridge server:**
   - Windows: Double-click `start-bridge.bat`
   - Or run: `node bridge/server.js`

3. **Load in Lively Wallpaper:**
   - Open Lively Wallpaper → Add Wallpaper → select `pixel-offline-online.html`

4. **(Optional) Auto-start bridge on login:**
   - Double-click `add-to-startup.bat`
   - To remove: double-click `remove-from-startup.bat`

### Connection Status

- Green dot in settings = Bridge connected, Claude AI online
- Amber dot = Bridge connected, offline AI mode
- Red dot = Bridge not running (wallpaper still works offline)

### No Bridge Mode

The wallpaper works 100% without the bridge server. You get:
- All widgets (except hardware monitor, network, processes, battery, now playing)
- Offline pattern-matching AI chat
- All pet behaviors except app watch
- Full layout and theme customization

---

## Pet Characters

Six selectable pets, each with unique pixel art and personality:

| Pet | Description |
|-----|-------------|
| **Pixel** | Fluffy magical cat (default) — purple/magenta with gradient fur |
| **Jellysey** | Bioluminescent jellyfish — translucent bell with flowing tentacles |
| **Sharkypup** | Shark-puppy hybrid — dorsal fin meets floppy ears |
| **Thanther** | Shadow panther — dark fur with rosette spots |
| **Fordolphin** | Cheerful dolphin — ocean-colored with snout and belly pattern |
| **Vonlion** | Majestic lion — golden with a full mane |

**To change pet:** Open Settings (Ctrl+,) → click the pet icon/selector at the top.

### Pet Moods (11 States)

Your pet expresses emotions through eye shapes, mouth, and body glow:

| Mood | Expression | Trigger |
|------|-----------|---------|
| Happy | Smile, purple glow | Default, positive interactions |
| Thinking | Half-closed eyes, blue glow | Processing chat |
| Surprised | Wide eyes, yellow glow | Unexpected events |
| Sad | Drooping eyes, dark glow | Sad topics in chat |
| Excited | Sparkling eyes, magenta glow | Rapid clicks, games detected |
| Love | Heart eyes, pink glow, floating hearts | Compliments, affection |
| Sleepy | Nearly closed eyes, dim glow, Zzz | Idle timeout |
| Angry | Angry brows, red glow | Too many rapid clicks |
| Scared | Wide fearful eyes, pale glow | Low battery, fast mouse during playdate |
| Silly | Crossed eyes, silly mouth | Fun interactions |
| Cry | Tears falling, sad glow | Very sad topics |

---

## Controls & Commands

### Mouse Controls

| Action | What Happens |
|--------|-------------|
| **Click pet (1x)** | Opens/closes the chat panel |
| **Click pet (3x rapidly)** | Pet gets angry, bolts to opposite side of screen |
| **Click pet (5x rapidly)** | Pet gets excited, does zigzag run across screen |
| **Click screen (3x in 1.5s)** | Pet runs to where you clicked |
| **Long-press widget (500ms)** | Grab and drag widget to any position |
| **Click widget controls** | Pet reacts with contextual messages |
| **Drag chat panel** | Scroll through chat history |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl + ,** (comma) | Toggle Settings panel open/closed |
| **Ctrl + D** | Toggle Debug panel (bottom-left diagnostic overlay) |
| **Escape** | Close any open panel (Settings, Appearance, Pet selector) |

### Chat Quick Actions (Pills)

Click these preset buttons below the chat input:

| Pill | What It Does |
|------|-------------|
| "Hello!" | Greeting — pet responds with a warm hello |
| "Tell me a joke" | Pet tells a random joke |
| "Show my PC stats" | Displays hardware info (CPU, RAM, GPU, Disk) |
| "What time is it?" | Pet tells the current time |
| "Find my files" | Search files on your PC by name (bridge required) |

### Chat File Search Commands

Type natural language file searches in chat:
- "find my resume"
- "where are my vacation photos"
- "search for documents named report"

The bridge searches Desktop, Documents, Downloads, Pictures, Videos, Music, and Home folders. Returns up to 20 matching files with full paths.

### Bridge Controls (in Settings Panel)

| Button | Action |
|--------|--------|
| **Restart Bridge** | Stops and restarts the bridge server process |
| **Stop Bridge** | Shuts down the bridge server |
| **Status Dot** | Green = online + Claude, Amber = online + offline AI, Red = disconnected |

### Widget-Specific Controls

**To-Do List:**
- Type task → press Enter or click Add
- Click checkbox to complete (strikes through)
- Click × to delete task

**Pomodoro Timer:**
- Click Start → 25-min focus session begins
- Auto-switches: Focus (25m) → Break (5m) → repeat 4x → Long Break (15m)
- Click Pause to pause, Reset to restart
- Session dots show progress (4 sessions per cycle)

**Timer / Stopwatch:**
- Toggle between countdown and stopwatch mode
- Countdown: Set hours/minutes, click Start
- Stopwatch: Click Start to begin counting up
- Pause and Reset available during run

**Habits Tracker:**
- Type habit name → click Add
- Click habit to toggle daily completion
- Click × to remove habit
- Resets daily

**Calendar:**
- ← → arrows to navigate months
- Click any date to add/view notes for that day
- Today is highlighted

**World Clock:**
- Select timezone from dropdown → added to display
- Click × to remove a timezone
- Times update every second
- Max 5 timezone clocks

**Weather:**
- Auto-detects location (browser geolocation → IP lookup → wttr.in)
- Manual override: Type city name in Settings → Weather section
- Click "Clear" to return to auto-detect

**Sticky Note:**
- Type freely in the text area (auto-saves)
- Click colored dots to change note color (Yellow, Pink, Mint, Lavender)

**Quick Links:**
- Click + to add a new bookmark (name + URL)
- Click a link to open it
- Click × to remove

**Countdown:**
- Click + to create a new countdown
- Set name and target date
- Shows days/hours/minutes/seconds remaining
- Click × to delete

**Now Playing:**
- Automatically detects music/video playing on your PC
- Supports: Spotify, iTunes, VLC, Windows Media Player, browser players
- Shows artist and track title

**Hardware Monitor:**
- Displays real-time: CPU %, RAM %, GPU %, Disk %
- Color bars: Green (OK) → Yellow (moderate) → Red (high)
- Pet alerts at: CPU >85%, RAM >90%, GPU temp >85°C

**Network:**
- Shows upload/download speeds in real-time
- Displays per-interface data

**Battery:**
- Shows battery percentage and charging status
- Time remaining estimate (when discharging)
- Pet reacts: Warning at 20%, Critical at 10%, Happy when charging starts

**Processes:**
- Top 5 processes by CPU usage
- Updates in real-time

---

## Settings & Configuration

Open settings with **Ctrl + ,** or click the gear icon.

### Behavior Settings

Each behavior can be enabled/disabled independently:

| Behavior | Default | Options |
|----------|---------|---------|
| **Sleep** | On | Idle delay: 30 seconds (adjustable) |
| **Click Reactions** | On | — |
| **Hide (Peek-a-boo)** | On | Interval: 5 min, Duration: 8 sec (adjustable) |
| **Playdate** | On | Interval between visits (adjustable) |
| **App Watch** | On | Monitors active window for contextual reactions |

### Widget Toggles

Every widget can be shown/hidden:

Clock, Hardware Panel, Chat, Chat Bubble, Bubble Pills, Weather, Calendar, To-Do, Pomodoro, Timer, Habits, World Clock, Quote, Countdown, Sticky, Quick Links, Network, Processes, Battery, Now Playing

### Display Settings

| Setting | Description |
|---------|-------------|
| Width Override | Manual screen width (800–7680px) |
| Height Override | Manual screen height (400–4320px) |
| Auto-Detect | Button to read current window size |
| Reset Defaults | Restore factory display settings |

### Factory Reset

**Reset Layout** button in Settings:
- Clears all widget positions
- Resets all widget data (todos, habits, notes, etc.)
- Resets pet to Pixel
- Resets theme to Midnight
- Clears all localStorage

---

## Layout & Customization

### Layout Edit Mode

1. Open Settings (Ctrl+,)
2. Click "Edit Layout" button
3. A 20px grid overlay appears
4. Drag any widget to reposition (snaps to grid)
5. Use 8 resize handles (corners + edges) to resize
6. Click "Done" to save and exit

### Long-Press Drag (Quick Move)

- **Hold any widget for 500ms** → it becomes draggable
- Move it anywhere on screen
- Release to drop in new position
- No need to enter Layout Edit mode
- Does NOT activate on interactive elements (buttons, inputs, textareas, links, selects)

### Widget Sizing

- **Scale widgets** (most): Resizing scales the entire widget proportionally
- **Reflow widgets** (Chat, To-Do, Sticky, Habits, Quick Links, Countdown, World Clock): Resizing changes actual dimensions, content reflows

### Default Layout

Widgets are arranged in a 4-column grid by default. All positions are saved automatically and persist across sessions.

---

## Themes & Appearance

Open Appearance panel from Settings.

### Available Themes

| Theme | Colors | Mood |
|-------|--------|------|
| **Midnight** (default) | Purple/cyan neon | Dark space |
| **Ocean** | Blue gradients | Underwater calm |
| **Forest** | Green tones | Natural, earthy |
| **Sunset** | Orange/red warmth | Golden hour |
| **Mono** | Grayscale | Minimalist |
| **Cherry** | Pink/red | Romantic |

Each theme changes: background colors, widget surfaces, accent colors, star colors, nebula animation, glow effects.

### Appearance Options

| Option | Description |
|--------|-------------|
| Theme | Select from 6 themes |
| Font | Nunito (default), Orbitron, Poppins, Inter, Comic Neue |
| Chat Opacity | Transparency of chat panel (0.85–1.0) |
| Custom Accent | Override theme accent with any color |
| Day/Night Mode | Manual toggle or auto (6am–6pm = day) |

### Background Effects

- **Starfield**: 200+ parallax stars in 5 theme-matched colors
- **Nebula**: 3-color animated radial gradients with pulsing
- **Shooting Stars**: 3–5 visible at a time with trails
- **Day/Night Crossfade**: Smooth 1-second transition

---

## Chat & AI Features

### Online Mode (Claude AI)

**Requirements:** Bridge server running + Claude Desktop installed and signed in.

- Full Claude AI conversation
- Pet responds in character with personality
- Automatic mood detection from responses
- Hardware stats context (pet can comment on your PC health)
- Last 12 conversation pairs maintained for context

### Offline Mode (Pattern-Matching AI)

Always available, no requirements:
- 200+ built-in responses
- Jokes, facts, motivational quotes, riddles, compliments
- Time-aware responses (morning/afternoon/night greetings)
- Pet personality maintained

### Chat Features

- **Unread indicator**: Red dot appears when pet sends a message while chat is closed
- **Auto-scroll**: Chat scrolls to newest message
- **Drag to scroll**: Touch/click-drag to scroll through history

---

## Bridge Server

The bridge runs at `http://localhost:7842` and provides system integration.

### Starting the Bridge

```
cd pixel/bridge
node server.js
```
Or use `start-bridge.bat` (Windows) / `start-bridge.sh` (Mac/Linux).

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Check bridge status and Claude availability |
| `/chat` | POST | Send message to Claude AI |
| `/hardware` | GET | CPU, RAM, GPU, Disk stats |
| `/weather` | GET | Weather via wttr.in (cached 15 min) |
| `/location` | GET | IP-based geolocation (cached 1 hour) |
| `/geocode?city=` | GET | City name to coordinates |
| `/network` | GET | Network interface speeds |
| `/battery` | GET | Battery status |
| `/processes` | GET | Top 5 CPU processes |
| `/nowplaying` | GET | Current media playback info |
| `/activewindow` | GET | Foreground window (persistent polling) |
| `/files` | POST | File search across user directories |
| `/state` | GET/POST | Save/load widget state to disk |
| `/shutdown` | POST | Stop bridge server |
| `/restart` | POST | Restart bridge server |

### Bridge Controls from UI

In the Settings panel:
- **Status dot** shows connection state
- **Restart** button restarts the bridge process
- **Stop** button shuts down the bridge

---

## Troubleshooting

### Debug Panel

Press **Ctrl + D** to open the debug panel (bottom-left corner). It shows:
- Bridge connection status
- App watch state (current window, last reaction)
- Pet state (mood, position, active behaviors)
- Playdate info
- Registered behaviors list
- Live `/activewindow` fetch results

### Common Issues

**Pet not visible:**
- Check if Lively Wallpaper is running
- Try clicking anywhere on the desktop
- Check Settings → display width/height matches your screen

**Settings button not appearing:**
- Press Ctrl+, to open settings directly
- The button may be off-screen if display size is wrong
- In Settings → Display, click "Auto-Detect" to fix

**Widgets not showing:**
- Open Settings (Ctrl+,) → scroll to Widget Toggles
- Make sure the widget is enabled (toggled on)

**Bridge not connecting (red dot):**
- Make sure Node.js is installed: `node --version`
- Run `cd bridge && npm install` to install dependencies
- Start bridge: `node bridge/server.js`
- Check if port 7842 is already in use

**Chat says "Offline mode":**
- Bridge must be running (green/amber dot)
- For Claude AI: Install Claude Desktop and sign in
- Offline mode still works with pattern-matching responses

**Hardware monitor shows no data:**
- Bridge server must be running
- First reading may take 3–5 seconds to appear
- GPU stats require a discrete GPU (integrated may not report)

**Weather shows "--°C":**
- Allow location access when browser prompts
- Or set your city manually in Settings → Weather
- Bridge must be running for IP-based location fallback

**App watch not reacting:**
- Bridge must be running
- Only works on Windows (uses PowerShell for window detection)
- Check debug panel (Ctrl+D) to see if active window is detected
- Bridge's own PowerShell process is filtered out automatically

**Pet stuck or not moving:**
- Click the pet to wake it up
- Check if sleep behavior triggered (idle too long)
- Try clicking the desktop 3 times quickly — pet should run to you

**PowerShell window flashing (Windows):**
- Update to latest bridge/server.js (uses `windowsHide: true`)
- Restart the bridge after updating

**High RAM usage:**
- Update to latest bridge/server.js (uses persistent PowerShell process)
- Old versions spawned new PowerShell every 3 seconds
- Restart bridge after updating

**Widget won't move:**
- Long-press (hold 500ms) on the widget background, then drag
- Won't activate if you press on buttons, inputs, or links
- Or use Layout Edit mode: Settings → Edit Layout

### Data Storage

All data is saved in two places:
1. **Browser localStorage** — immediate, works offline
2. **Bridge state file** (`~/.pixel-pet/state.json`) — persists across wallpaper reloads

If data is lost, check if the bridge state file exists and is readable.

---

## Quick Reference Card

| What | How |
|------|-----|
| Open Settings | Ctrl + , |
| Open Debug Panel | Ctrl + D |
| Close any panel | Escape |
| Move a widget | Long-press 500ms + drag |
| Talk to pet | Click pet → type in chat |
| Change pet | Settings → Pet selector |
| Change theme | Settings → Appearance |
| Start bridge | `node bridge/server.js` or `start-bridge.bat` |
| Restart bridge | Settings → Restart button |
| Reset everything | Settings → Factory Reset |
