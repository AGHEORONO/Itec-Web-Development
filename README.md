# iTECify – Collaborative Code Editor

A real-time collaborative code editor with code execution and AI assistance.

## Quick Start

### 1. Start the backend
```bash
cd server
npm install
npm run dev
```

### 2. Start the frontend (new terminal)
```bash
cd client
npm install
npm run dev
```

### 3. Open in browser
Visit `http://localhost:5173` — you'll be prompted to enter a name, then you're in!

## Features
- **Real-time collaboration** — Multiple users edit the same code simultaneously via Yjs CRDT
- **Multi-cursor support** — See other users' cursors with name labels and colors
- **Code execution** — Run Python, JavaScript, or C++ code via the Piston API
- **AI Assistant** — Generate code snippets from natural language prompts
- **Room-based sessions** — Each unique URL is a separate collaborative session

## Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | React + Vite |
| Editor | Monaco Editor |
| Collaboration | Yjs + y-websocket + y-monaco |
| Styling | Tailwind CSS |
| Backend | Node.js + Express + ws |
| Code Execution | Piston API |
