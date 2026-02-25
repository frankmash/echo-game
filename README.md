# Echo 🔤

> The word chain game that starts debates

A real-time multiplayer word game built with React + Vite (frontend) and Node.js + Express + Socket.io (backend).

---

## How to Play

1. One player creates a room and shares the code
2. Friends join using the code
3. Players take turns submitting a word connected to the previous one
4. Everyone votes — does the connection make sense?
5. Defend your logic. Sway your friends.
6. Win points for every accepted connection
7. After 3 rounds, highest score wins

---

## Setup

### 1. Start the Server

```bash
cd server
npm install
npm start          # production
npm run dev        # with auto-reload (nodemon)
```

Server runs on `http://localhost:3001`

### 2. Start the Client

```bash
cd client
npm install
npm run dev        # development server on http://localhost:5173
npm run build      # production build → dist/
```

### 3. Environment Variables (optional)

In `client/`, create a `.env` file:

```
VITE_SERVER_URL=http://localhost:3001
```

For production deployment, point this to your deployed server URL.

---

## Project Structure

```
echo-game/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.jsx          # Create/join room screen
│   │   │   ├── Lobby.jsx         # Waiting room
│   │   │   ├── GameRoom.jsx      # Main gameplay screen
│   │   │   ├── WordChain.jsx     # Visual word chain display
│   │   │   ├── VotingPanel.jsx   # Vote yes/no UI
│   │   │   └── Results.jsx       # Final scores + replay
│   │   ├── socket.js             # Socket.io client instance
│   │   ├── App.jsx               # Screen router
│   │   └── main.jsx
│   └── vite.config.js
│
└── server/
    ├── game/
    │   ├── roomManager.js        # Room creation, joining, player tracking
    │   └── gameLogic.js          # Voting, scoring, turn management
    └── server.js                 # Express + Socket.io entry point
```

---

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `create_room` | Client → Server | Create a new room |
| `join_room` | Client → Server | Join existing room |
| `start_game` | Client → Server | Host starts the game |
| `submit_word` | Client → Server | Player submits a word |
| `cast_vote` | Client → Server | Player votes yes/no |
| `end_game` | Client → Server | Host ends game early |
| `play_again` | Client → Server | Host restarts the game |
| `room_updated` | Server → Client | Player joined/left |
| `game_started` | Server → Client | Game has begun |
| `voting_started` | Server → Client | New word submitted, vote begins |
| `vote_updated` | Server → Client | Someone cast a vote |
| `vote_resolved` | Server → Client | Voting finished, word accepted/rejected |
| `game_over` | Server → Client | Game ended, show results |
