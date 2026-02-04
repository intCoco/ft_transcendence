This project has been created as part of the 42 curriculum by bboussad, chuchard, nihamdan and aldalmas.


# Team Information:
    chuchard (Tech Game Designer)
        Responsible for the game logic, gameplay mechanics, level design and Pong implementation (1v1 and 1v1v1v1 versions). Added an AI Opponent and some game settings for more fun and difficulty.

    bboussad (Project Manager, Fullstack developer, Q & A tester)
        Responsible for the UI, UX, client-side interactions and handle some connection with the back. Set deadlines, meetings and somes quality tests.

    aldalmas (Project Owner, Backend and Infrastructure Developer, Q & A tester)
        Responsible for authentication, database, WebSockets, Docker infrastructure and Readme update. Realized a lot of quality tests and design proposition.

    nihamdan (Fullstack Developer)
        Reponsive of the user experience outside the game, achievement, xp, leaderboard and handled the app traduction in italian, english and french.
    

# Description from the subject
    Transcendence is a group project (4-5 people), which is intended to boost your creativity, self-confidence, adaptability to new technologies, and teamwork skills. You’ll create a real-world web application as a team that can move in many directions, depending on the modules you choose and the choices you make. Make sure to think things through together as a team before you start.
    The project is divided into two parts:
    • The mandatory part, which is the fixed core of the project to which every team member must contribute.
    • A set of modules, which you can choose and which count toward the final grade.


# Resources
    


# Instructions for run this project (only Team can do it)
1. Past the .env in app/backend/
2. Past certs/ in app/backend/
3. make

If it dosent work, you may need to try this:

4. Past keys: sudo cp cert.pem /usr/local/share/ca-certificates/localhost.crt
5. Install node_modules/: cd /app/backend/ && npm install 
6. Same here: cd /app/frontend/ && npm install
7. Allow certs: sudo update-ca-certificates

# General requirements
    - The project must be a web application, and requires a frontend, backend, and a database.
    - Git must be used with clear and meaningful commit messages. The repository must show:
        ◦ Commits from all team members.
        ◦ Clear commit messages describing the changes.
        ◦ Proper work distribution across the team.
    - Deployment must use a containerization solution (Docker, Podman, or equivalent) and run with a single command.
    - Your website must be compatible with the latest stable version of Google Chrome.
    - No warnings or errors should appear in the browser console.
    - The project must include accessible Privacy Policy and Terms of Service pages with relevant content.
    - Privacy policy and Terms of Service: easily accessible, contain relevent and appropriate content for your project, not be placeholder or empty page.
    - Multi-user Support: must support multiple users simultaneously. They should be able to interact with the application at the same time without conflicts or performances issues, that includes:
        • Multiple users can be logged in and active at the same time.
        • Concurrent actions by different users are handled properly.
        • Real-time updates are reflected across all connected users when applicable.
        • No data corruption or race conditions occur with simultaneous user actions.

# Technical requirement
    This section, like the previous one, is mandatory. You will then be able to choose the modules you want to use in the next chapter.
        • A frontend that is clear, responsive, and accessible across all devices.
        • Use a CSS framework or styling solution of your choice (e.g., Tailwind CSS, Bootstrap, Material-UI, Styled Components, etc.).
        • Store credentials (API keys, environment variables, etc.) in a local .env file that is ignored by Git, and provide an .env.example file.
        • The database must have a clear schema and well-defined relations.
        • Your application must have a basic user management system. Users must be able to sign up and log in securely:
            ◦ At minimum: email and password authentication with proper security (hashed passwords, salted, etc.).
            ◦ Additional authentication methods (OAuth, 2FA, etc.) can be implemented via modules.
        • All forms and user inputs must be properly validated in both the frontend and backend.
        • For the backend, HTTPS must be used everywhere.

# Features list (Major = 2 points, Minor = 1 point)
    - WEB 
        Major = Framework front (React, Tailwind) + back (Fastify)
        Major = Websocket
        Major = Allow users to interact with others users
        Minor = Use an ORM (object-relational mapping) (Prisma)

    - Accessibility and Internationalization
        Minor = Support for multiple language (italian, french and english)

    - User management
        Major = Standard user management and authentication
        Minor = Game statistics and match history

    - Artificial Intelligence
        Major = Introduce an AI Opponent for games
        
    - Gaming and user experience
        Major = Implement a complete web-based game where users can play against each other (Pong Game)
        Major = Multiplayer game (Pong can be playing up to 4 players)
        Minor = Advanced chat features (invit to play, block, view profile)
        Minor = Game customization (choose some settings before launching the game)
        

AUTH
    password hashed by bcrypt and salted. For see it, go to "SEE THE DATABASE" bellow in this file.

# Backend informations
-> ORM (object-relational mapping): prisma. Why ? Clear errors, good with SQLite, and easy to use. Intermediary between code and a simulated POO database. 
-> -> schema.prisma : used for create the database structure. 'prisma migrate dev' cmd read the 'schema.prisma' file, generate 'migration.sql' file and apply it in a real base (dev.db file).

if need to change something in the db (in app/backend/prisma/schema.prisma), you must do this to update changes in app/backend/:
    > rm prisma/dev.db (if present)
    > rm -rf prisma/migrations
    > npx prisma@6 migrate dev --name choose_a_migration_name

if pb with db after that (e.g. impossible to register or login), reboot and update the db in container:
    > make re
    > docker exec -it back sh
    > npx prisma@6 migrate dev


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

