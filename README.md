This project has been created as part of the 42 curriculum by bboussad, chuchard, nihamdan and aldalmas.


# Team Information:
    chuchard (Tech Game Designer)
        Responsible for the game logic, gameplay mechanics, level design and Pong implementation (1v1 and 1v1v1v1 versions). Added an AI Opponent and some game settings for more fun and difficulty.

    bboussad (Project Manager, Fullstack developer, Q & A tester)
        Responsible for the UI, UX, client-side interactions and handle some connection with the back. Set deadlines, meetings and somes quality tests.

    aldalmas (Project Owner, Backend and Infrastructure Developer, Q & A tester)
        Responsible for authentication, database, WebSockets, Docker infrastructure and Readme update. Realized design proposition and a lot of quality tests.

    nihamdan (Fullstack Developer)
        Reponsive of the user experience outside the game, achievement, xp, leaderboard and handled the app traduction in italian, english and french.
    

# Description of ft_transcendence project
    Transcendence is a group project (4-5 people), which is intended to boost your creativity, self-confidence, adaptability to new technologies, and teamwork skills. You’ll create a real-world web application as a team that can move in many directions, depending on the modules you choose and the choices you make. Make sure to think things through together as a team before you start.
    The project is divided into two parts:
    • The mandatory part, which is the fixed core of the project to which every team member must contribute.
    • A set of modules, which you can choose and which count toward the final grade.


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
        - used for documentation
        - clarification of the project requirements
        - structuring the README
        - help understand and debug certain code-related issues


# Instructions for run this project
1. Past the .env in app/backend/
2. Past certs/ in app/backend/
3. make

If it dosent work, you may need to try this:

4. Past keys: sudo cp cert.pem /usr/local/share/ca-certificates/localhost.crt
5. Install node_modules/: cd /app/backend/ && npm install 
6. Same here: cd /app/frontend/ && npm install
7. Allow certs: sudo update-ca-certificates
    

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
        1v1 and multiplayer (up to 4 players)
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
        Major = Allow users to interact with others users (bbousaad, aldalmas)
        Minor = Use an ORM (object-relational mapping) (Prisma) (aldalmas)

    - Accessibility and Internationalization
        Minor = Support for multiple language: italian, french and english (nihamdan)

    - User management
        Major = Standard user management and authentication (bbousaad, aldamas)
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

