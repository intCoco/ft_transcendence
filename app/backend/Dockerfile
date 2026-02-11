FROM node:22

WORKDIR /app/backend

# first cpy this for opti
COPY package.json .
COPY package-lock.json .
COPY prisma ./prisma

RUN npm install
RUN npx prisma@6 generate

# copy the others files / repos
COPY . .

# used for access db into the container back
RUN apt-get update && apt-get install -y sqlite3 

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
