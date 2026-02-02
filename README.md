This project has been created as part of the 42 curriculum by bboussad, chuchard, nihamdan and aldalmas.

Description: 

Instructions:

    For WORK on this project:
    -> cd /app/backend/
    -> npm install

    -> cd /app/frontend/
    -> npm install

    For RUN this project: 
    -> make

Resources:


Team Information:

    chuchard -> Tech Game Designer, responsible for the game logic, gameplay mechanics, and Pong implementation.

    bboussad -> Project Manager & Fullstack developer, responsible for the UI, UX, and client-side interactions and handke some connection with the back.

    aldalmas: Project owner & Backend & Infrastructure Developer, responsible for authentication, database, WebSockets, and Docker infrastructure.

    nihamdan: N/A



Features list:


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


# How to run this project (only members can do it)
1. Past the .env in app/backend/
2. Past certs/ in app/backend/
3. make

If it dosent work, you may need to try this:
4. Past keys: sudo cp cert.pem /usr/local/share/ca-certificates/localhost.crt
5. Install node_modules/: cd /app/backend/ && npm install 
6. Same here: cd /app/frontend/ && npm install
7. Allow certs: sudo update-ca-certificates

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

