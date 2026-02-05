*This project has been created as part of the 42 curriculum by bboussad, chuchard, nihamdan, aldalmas.*


# Team Information:
    chuchard - Game Director & Solo Game Developer, Gameplay Programmer, QA Tester
        Responsible for designing and developing the entire Pong game, including gameplay mechanics, rules, AI opponent, 1v1 and 1v1v1v1 multiplayer modes, and defining the visual design and overall player experience.


    bboussad - Project Manager, Fullstack developer, QA Tester
        Responsible for the UI, UX, client-side interactions and handle some connection with the back. Set deadlines, meetings and some quality tests.

    aldalmas - Project Owner, Backend and Infrastructure Developer, QA Tester
        Responsible for authentication, database, WebSockets, Docker infrastructure and Readme update. Realized design proposition and a lot of quality tests.

    nihamdan - Fullstack Developer
        Responsible for the user experience outside the game, achievements, XP, leaderboard and handled the app translation in Italian, English and French.
    

# Description of ft_transcendence project
    ft_transcendence is a real-time web application centered around a multiplayer Pong game.
    Users can register, manage their profile, add friends, and interact through a live chat system.
    The platform supports local matches in 1v1 and multiplayer modes (up to 4 players), as well as games against an AI opponent.
    The application includes matchmaking through chat invitations, game customization options,
    a progression system with XP, achievements, and leaderboards, and real-time synchronization
    using WebSockets.
    The project is designed to run locally using Docker containers and is not deployed online.
    All services are accessible through localhost and secured with HTTPS.
     



# Resources
    - HTML doc: https://developer.mozilla.org/fr/docs/Web/HTML
    - CSS doc: https://developer.mozilla.org/fr/docs/Web/CSS
    - JavaScript doc: https://devdocs.io/javascript/ and https://developer.mozilla.org/fr/docs/Web/JavaScript
    - Fastify doc: https://fastify.dev/
    - React doc: https://react.dev/learn
    - Prisma doc: https://www.prisma.io/docs
    - Tailwind CSS doc: https://tailwindcss.com/docs
    - bcrypt doc: https://www.npmjs.com/package/bcryptjs
    - Websocket doc: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
    - Previous 42 project "Inception" for Docker, Nginx, and containerization concepts
    - Stack Overflow (for specific technical issues)
    - YouTube tutorials (for general understanding of some technologies)

    - AI usage:
        - documentation
        - clarification of the project requirements
        - structuring the README
        - translation
        - help understand and debug certain code-related issues


# Instructions to run this project
1. Paste the .env in app/backend/
2. Paste certs/ in app/backend/
3. make
4. Go to https://127.0.0.1:8443/ on any browser

If it doesn't work, you may need to try this:

5. Paste keys: sudo cp cert.pem /usr/local/share/ca-certificates/localhost.crt
6. Install node_modules/: cd /app/backend/ && npm install 
7. Same here: cd /app/frontend/ && npm install
8. Allow certs: sudo update-ca-certificates
    

# Project Management
Each member indicated which module they were interested in and then began working semi-independently, providing regular updates and sharing current issues that we resolved together. We all used GitHub, Trello and Discord for communication.


# Technical Stack
    Frontend
    - React: builds a component-based user interface and manages application state.
    - React Router DOM: handles client-side routing, navigation, and protected routes.
    - Tailwind CSS: utility-first CSS framework used for responsive and consistent styling.
    - i18next / react-i18next: manages internationalization and dynamic language switching.
    - HTML5 Canvas API: renders the Pong game directly in the browser.
    - WebSocket API: enables real-time communication with the backend.
    - Fetch API: performs HTTP requests to the backend REST API.
    - LocalStorage API: stores authentication tokens and user session data on the client.
    
    Backend
    - Node.js: JavaScript runtime environment used to run the backend server.
    - Fastify: web framework used to handle HTTP requests, routing, and middleware.
    - @fastify/websocket: adds WebSocket support to Fastify for real-time features.
    - @fastify/cors: manages Cross-Origin Resource Sharing configuration.
    - Prisma ORM: defines the database schema and provides structured database access.
    - bcrypt: hashes and verifies user passwords securely.
    - REST API (JSON): exposes backend endpoints for authentication, users, game results, and social features.
    - WebSockets: handles real-time events such as chat, user presence, and game interactions.
    
    Database
    - SQLite: lightweight relational database used for data persistence during development.
    - Prisma Client: generates type-safe database queries based on the Prisma schema.
    
    Infrastructure
    - Docker & Docker Compose: containerizes frontend, backend, and services to run the project with a single command.
    - Nginx: acts as a reverse proxy and HTTPS entry point.
    - HTTPS: ensures secure communication between client and server.


# Database Schema
    The database is managed using Prisma ORM with an SQLite backend.
    
    Main entities:
        - User: authentication, profile and game statistics.
        - Friendship: friend requests and relationships between users.
        - Block: blocked user relationships.
        - Message: private messages exchanged between users.
        - UserSettings: user interface preferences.
    
    Relations:
        - Users can have multiple friends, blocks and private messages.
        - Each user has at most one settings entry.

    Note:
        After add a model or modifying existing model, use "npx prisma@6 migrate dev"


# Features list
    Core
        User registration and authentication
        User profile pages
        Friends system (add / remove / online status)

    Real-time & social
        Real-time chat between users (direct message)
        Game invitations in chat
        User blocking
    
    Game
        Web-based Pong game
        1v1 and multiplayer (1v1v1v1)
        AI opponent
        Game customization before match
    
    Progression
        Leaderboard and ranking
        Achievements / XP system
    
    Accessibility
        Multi-language support (EN / FR / IT)


# Modules (total of 19 points, Major = 2 points, Minor = 1 point)
    - WEB 
        Major = Framework front (React, Tailwind) + back (Fastify) (bbousaad, chuchard, nihamdan, aldalmas) 
        Major = Websocket (bbousaad, aldalmas)
        Major = Allow users to interact with other users (bbousaad, aldalmas)
        Minor = Use an ORM (object-relational mapping) (Prisma) (aldalmas)

    - Accessibility and Internationalization
        Minor = Support for multiple language: italian, french and english (nihamdan)

    - User management
        Major = Standard user management and authentication (bbousaad, aldalmas)
        Minor = Game statistics and match history (chuchard, nihamdan)

    - Artificial Intelligence
        Major = Introduce an AI Opponent for games (chuchard)
        
    - Gaming and user experience
        Major = Implement a complete web-based game where users can play against each other: Pong Game (chuchard)
        Major = Multiplayer game: Pong can be playing up to 4 players (chuchard)
        Minor = Advanced chat features: invite to play, block, view profile (bbousaad, aldalmas)
        Minor = Game customization: choose some settings before launching the game (chuchard)


# SEE THE DATABASE (2 ways):
1. From inside the container: 
    - "docker exec -it back sqlite3 /app/backend/prisma/dev.db".
    - If it works, you'll see "sqlite>" prompt.
    - ".quit" to get out of the container.

2. With the prisma UI (Prisma Studio):
    -  Into the back's service, in the docker compose: add "ports: "5555:5555".
    -  Enter into the back container: "docker exec -it back sh".
    -  In the container, start the prisma server: "cd /app/backend && HOST=0.0.0.0 ./node_modules/.bin/prisma studio".
    -  Go to "http://localhost:5555".
    -  You must see the database without error.
    -  Ctrl^D to close the prisma server.

