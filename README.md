<h1 align="center">ft_transcendence</h1>

<p align="center">
	<b>🏓 <i>The final boss of the 42 common core: a real-time multiplayer Pong with full-stack architecture.</i></b><br>
</p>

<p align="center">
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-React-blue"/>
  <img alt="Backend" src="https://img.shields.io/badge/Backend-Fastify-blue"/>
  <img alt="Containerized" src="https://img.shields.io/badge/Infrastructure-Docker-blue"/>
  <img alt="Game" src="https://img.shields.io/badge/Game-TypeScript-blue"/>
</p>
<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Completed-success"/>
  <img src="https://img.shields.io/badge/Grade-125%2F100-success"/>
  <img alt="42" src="https://img.shields.io/badge/School-42-black"/>
</p>

---

## 📑 Table of Contents

* [📖 Description](#-description)
* [🚀 Features](#-features)
* [🛠 Technical Stack](#-technical-stack)
* [🗄 Database Schema](#-database-schema)
* [▶️ Usage & Installation](#-usage--installation)
* [👥 Team](#-team)
* [🧠 Modules & Points](#-modules--points)
* [🏆 Conclusion](#-conclusion)
* [📚 Resources](#-resources)
* [👤 Authors](#-authors)

---

## 📖 Description

**ft_transcendence** is a real-time web application centered around a multiplayer [Pong game](https://www.ponggame.org/).  

Users can register, manage their profile, add friends and interact through a live chat system.  
The platform supports local matches in 1v1 and multiplayer modes (up to 4 players), as well as games against an AI opponent.  
The application includes matchmaking through chat invitations, game customization options, a progression system with XP, achievements, leaderboards and real-time synchronization using WebSockets.  

The project is designed to run locally using Docker containers and is not deployed online.  
All services are accessible through localhost and secured with HTTPS.

---

## 🚀 Features

### Core

* User registration & authentication
* Profile management
* Friends system (add/remove, online status)
* Secure HTTPS communication

### Real-Time & Social

* Live chat system
* Game invitations via chat
* User blocking
* WebSocket-based synchronization

### Game

* Browser-based Pong game
* 1v1 and multiplayer (up to 4 players)
* AI opponent
* Game customization
* Match history and statistics

### Progression & UX

* Leaderboards and ranking
* Achievements & XP system
* Multi-language support (EN/FR/IT)

---

## 🛠 Technical Stack

### Frontend

* React, React Router DOM
* Tailwind CSS
* HTML5 Canvas API
* WebSocket API, Fetch API, LocalStorage API
* i18next / react-i18next for internationalization

### Backend

* Node.js, Fastify
* @fastify/websocket, @fastify/cors
* Prisma ORM with SQLite
* REST API endpoints
* bcrypt authentication

### Infrastructure

* Docker & Docker Compose
* Nginx as reverse proxy
* HTTPS

---

## 🗄 Database Schema

* Managed with Prisma ORM and SQLite
* Main entities:

  * User: authentication, profile, stats
  * Friendship: friend requests and relationships
  * Block: blocked user relationships
  * Message: private messages
  * UserSettings: interface preferences
  * Match: game data
* Relations:

  * Users can have multiple friends, blocks, messages
  * Each user has one settings entry

---

## ▶️ Usage & Installation

### Requirements:

1. An Unix-based system (Linux / macOS)

2. Install and setup [Docker](https://docs.docker.com/desktop/).

3. Clone the [repository](https://github.com/intCoco/ft_transcendence) from GitHub:
   ```bash
   git clone https://github.com/intCoco/ft_transcendence.git
   ```

### Quick Start (Automated Setup):

1. Execute `setup.sh`:
    ```bash
    chmod +x setup.sh
    ./setup.sh
    ```

2. Run the project:
    ```bash
    make
    ```
    
3. Then navigate to https://127.0.0.1:8443/ in your browser.

> [!IMPORTANT]
> If you prefer to set up manually or if the script doesn't work, run the [Manual Setup](#manual-setup).

### <a name="manual-setup">Manual Setup</a>:

1. Configure Environment Variables:
    ```bash
    cp app/backend/.env.example app/backend/.env
    ```

2. Generate SSL/TLS Certificates:
    ```bash
    mkdir -p app/certs
    openssl req -x509 -newkey rsa:2048 -keyout app/certs/key.pem -out app/certs/cert.pem -days 365 -nodes -subj "/CN=localhost"
    ```

3. Install Dependencies:
    ```bash
    cd app/backend && npm install
    cd ../frontend && npm install
    cd ../..
    ```

4. Run the project:
    ```bash
    make
    ```

5. Then navigate to https://127.0.0.1:8443/ in your browser.

> [!IMPORTANT]
> If it still doesn't work, you can try:
> ```bash
> sudo cp app/certs/cert.pem /usr/local/share/ca-certificates/localhost.crt
> sudo update-ca-certificates
> ```

### Useful commands:

- **Start the app**:
  ```sh
  make up
  ```

- **Stop the app**:
  ```sh
  make down
  ```

- **Clean the app**:
  ```sh
  make fclean
  ```

---

## 👥 Team

| Dev | Roles | Description |
| --- | ----- | ----------- |
| **chuchard** | Game Director & Solo Game Developer, QA Tester | Responsible for designing and developing the entire game (including menus, gameplay mechanics, rules, 2 & 4 players modes, AI opponent, etc...) and defining the visual design & overall player experience. |
| **bboussad** | Fullstack Developer, QA Tester | Responsible for the UI, UX, client-side interactions and handle some connection with the back. Set deadlines, meetings and some quality tests. |
| **aldalmas** | Backend & Infrastructure Developer, QA Tester | Responsible for authentication, database, WebSockets, Docker infrastructure and Readme update. Realized design proposition and a lot of quality tests. |
| **nihamdan** | Fullstack Developer | Responsible for the user experience outside the game, achievements, XP, match history, leaderboard. |

---

## 🧠 Modules & Points

### **🌐 WEB**
* [Major] Use a framework for both the frontend and backend.
* [Major] Implement real-time features using WebSockets or similar technology.
* [Major] Allow users to interact with other users (chat, profiles, friends system).
* [Major] Use an ORM for database management.

### **🌍 ACCESSIBILITY & INTERNATIONALIZATION**
* [Major] Support multiple languages (English, French, Italian).

### **👤 USER MANAGEMENT**
* [Major] Implement standard user management and authentication.
* [Major] Provide game statistics and match history.

### **🤖 ARTIFICIAL INTELLIGENCE**
* [Major] Introduce an AI opponent for gameplay.

### **🎮 GAMING & USER EXPERIENCE**
* [Major] Implement a complete web-based multiplayer game.
* [Major] Support multiplayer modes with more than two players.
* [Major] Implement advanced chat features (invitations, blocking, interactions).
* [Major] Provide game customization options.
* [Major] Implement a gamification system (XP, achievements, leaderboard).

> [!NOTE]
> Major = 2 points.  
> Minor = 1 point.  
> **Total**: 20 points

---

## 🏆 Conclusion

**ft_transcendence** represents the culmination of the [42 common core](https://42.fr/en/the-program/software-engineer-degree/), combining full-stack development, real-time systems, and containerized infrastructure into a single cohesive platform. It demonstrates collaborative development, technical mastery, and creative game design.

---

## 📚 Resources

* [HTML](https://developer.mozilla.org/fr/docs/Web/HTML)
* [CSS](https://developer.mozilla.org/fr/docs/Web/CSS)
* [JavaScript](https://developer.mozilla.org/fr/docs/Web/JavaScript)
* [React](https://react.dev/learn)
* [Fastify](https://www.fastify.dev/)
* [Prisma](https://www.prisma.io/docs)
* [Tailwind CSS](https://tailwindcss.com/docs)
* [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
* AI usage: structuring README, translations, debugging assistance

---

## 👤 Authors

*This project has been created as part of the 42 curriculum by bboussad, chuchard, nihamdan, aldalmas.*
