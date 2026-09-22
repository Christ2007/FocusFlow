# FocusFlow 🧠🎯

FocusFlow is an ADHD-friendly, self-hosted personal productivity hub designed to turn chaos into calm. It combines gamified task management, visual progress tracking, milestone achievements, and Pomodoro-style focus timers into a distraction-free web application.

FocusFlow is distributed as a **self-hosted, single-container application** with **zero configuration, no user accounts, and zero cloud lock-in**. Everything is persisted locally to an embedded SQLite database backed by Docker volumes.

---

## ✨ Features

- 🎯 **ADHD-Friendly Task Flow**:
  - Quick task capture with smart time defaults.
  - Energy & brain-state categories: **Focus**, **Energy**, **Creative**, and **Rest**.
  - Priority levels, start/end scheduling, and custom iconography.
  - Interactive checklists with instant visual feedback.

- ⏱️ **Focus Timer (Pomodoro)**:
  - 25-minute focus intervals and 5-minute restorative breaks.
  - Smooth animated progress ring with audio cue notifications.
  - One-click mode switching between focus sessions and breaks.

- 🏆 **Gamification & Habit Building**:
  - Daily progress completion percentage with visual progress bars.
  - Streak tracking to encourage daily consistency.
  - Reward points earned for completing tasks.
  - Unlockable achievement badges (Getting Started, Daily Achiever, etc.).

- 🌓 **Distraction-Free Editorial UI**:
  - Clean, high-contrast, modern interface with zero clutter.
  - Seamless Light and Dark mode toggle (persisted per browser).
  - Fully responsive across desktop, tablet, and mobile devices.

- 💾 **Reliable Server-Side Persistence**:
  - Powered by **SQLite** (`/data/focusflow.db`) with Write-Ahead Logging (`WAL` mode) for maximum durability and speed.
  - Persistent Docker volume storage survives container restarts and upgrades.
  - Automatic, conservative one-time migration from legacy browser `localStorage`.

---

## 🏗️ Self-Hosted Architecture

FocusFlow is built for simplicity and sovereignty:

```
Browser A ──┐
Browser B ──┼──> FocusFlow Container (:80) ──> Express API ──> SQLite (/data/focusflow.db)
Browser C ──┘                                                          │
                                                                 Docker Volume
                                                             (focusflow-data:/data)
```

- **Shared Instance Model**: There are no logins, passwords, or multi-user silos. Everyone accessing the same FocusFlow container shares the same workspace and tasks.
- **Data Isolation**: Running a separate Docker container with its own volume provides an isolated, independent FocusFlow instance.

---

## 🚀 Quick Start with Docker

### Option 1: Docker CLI (Recommended)

Run FocusFlow with a single command:

```bash
docker run -d \
  --name focusflow \
  -p 8080:80 \
  -v focusflow-data:/data \
  --restart unless-stopped \
  christo0000/focusflow:latest
```

Open your browser at [http://localhost:8080](http://localhost:8080).

> **Note**: The persistent volume `focusflow-data` will store `/data/focusflow.db`. When updating to new versions, stopping or removing the container will **never** lose your tasks or streaks.

---

### Option 2: Docker Compose

Create a `docker-compose.yml` file (or use the one in this repository):

```yaml
services:
  focusflow:
    image: christo0000/focusflow:latest
    container_name: focusflow
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
      - PORT=80
      - DATABASE_PATH=/data/focusflow.db
    volumes:
      - focusflow-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://127.0.0.1:80/api/health"]
      interval: 30s
      timeout: 3s
      start_period: 5s
      retries: 3

volumes:
  focusflow-data:
    name: focusflow-data
```

Start the container:

```bash
docker compose up -d
```

To stop:

```bash
docker compose down
```

---

## 🔄 Updating to a Newer Version

To update FocusFlow without losing your data:

```bash
# Pull the latest image
docker pull christo0000/focusflow:latest

# Recreate the container (volume keeps all your data safe!)
docker compose up -d --force-recreate
```

---

## 🛠️ Building from Source

If you prefer building your own Docker image directly from this repository:

```bash
# 1. Clone the repository
git clone https://github.com/christo0000/focusflow.git
cd focusflow

# 2. Build the Docker image
docker build -t focusflow:latest .

# 3. Run your custom build
docker run -d \
  --name focusflow \
  -p 8080:80 \
  -v focusflow-data:/data \
  focusflow:latest
```

### Local Development (Without Docker)

FocusFlow can also be run locally for development:

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Start the backend server (runs on port 5000)
npm run server

# In another terminal, start the Vite development server (runs on port 8080 with API proxy)
npm run dev
```

---

## 📁 Backup and Restore

Your entire database is a single file: `/data/focusflow.db` (and temporary WAL files while running).

### Backup:
```bash
docker cp focusflow:/data/focusflow.db ./focusflow-backup.db
```

### Restore:
```bash
docker cp ./focusflow-backup.db focusflow:/data/focusflow.db
```

---

## 🔌 API Reference

For custom integrations, scripts, or home automation (Home Assistant, Raycast, etc.), FocusFlow exposes a minimal JSON REST API:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service and SQLite healthcheck |
| `GET` | `/api/state` | Returns full state (all tasks + progress) |
| `GET` | `/api/tasks` | Get all tasks (supports `?completed=true/false&category=...`) |
| `POST` | `/api/tasks` | Create a new task |
| `PUT` | `/api/tasks/:id` | Update task details |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `POST` | `/api/tasks/:id/complete` | Mark task completed (awards points & checks milestones) |
| `POST` | `/api/tasks/:id/uncomplete` | Revert completion |
| `GET` | `/api/progress` | Get current streak, points, and badge milestones |
| `GET` | `/api/milestones` | List earned milestones and badges |

---

## 📜 License

MIT License. Feel free to use, modify, and self-host!
