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

    bboussad -> Frontend developer, responsible for the UI, UX, and client-side interactions.

    aldalmas: Backend & Infrastructure Developer, responsible for authentication, database, API, WebSockets, and Docker infrastructure.

    nihamdan: N/A



Features list:


AUTH
    password hashed by bcrypt and salted

BDD
-> ORM (object-relational mapping): prisma. Why ? Clear errors, good with SQLite, and easy to use. Intermediary between code and a simulated POO database. 
-> -> schema.prisma : used for create the database structure. 'prisma migrate dev' cmd read the 'schema.prisma' file, generate 'migration.sql' file and apply it in a real base (dev.db file).

if need to change something in the db (in app/backend/prisma/schema.prisma), you must do this to update changes in app/backend/:
    > rm prisma/dev.db
    > rm -rf prisma/migrations
    > npx prisma@6 migrate dev --name init

if pb with db after that (e.g. impossible to register or login), reboot and update the db in container:
    > make re
    > docker exec -it back sh
    > npx prisma@6 migrate dev


Apres avoir git clone : 

ETAPE 1 :

    For WORK on this project:
    -> cd /app/backend/
    -> npm install
    -> cd /app/frontend/
    -> npm install

    For RUN this project: 
    -> make

ETAPE 2 :

    .env:
    ->copier/coller le .env dans /backend/

    init la DB 
    -> npx prisma@6 migrate dev --name init


ETAPE 3 :

    copier/coller les key :
    -> sudo cp cert.pem /usr/local/share/ca-certificates/localhost.crt

ETAPE 4 (facultatif) :

    autoriser les certs :
    -> sudo update-ca-certificates


SEE THE DATABASE (2 ways):
1. From inside the container: "docker exec -it back sqlite3 /app/backend/prisma/dev.db". If it works, you'll see "sqlite>" prompt.

2. With the prisma UI (Prisma Studio):
    - a. Into the back's service, in the docker compose: add "ports: "5555:5555".
    - b. Enter into the back container: "docker exec -it back sh".
    - c. In the container, start the prisma server: "cd /app/backend && HOST=0.0.0.0 ./node_modules/.bin/prisma studio".
    - d. Go to "http://localhost:5555".
    - e. You must see the database without error.
    - f. Ctrl^D to close the prisma server.

