FROM node:22 AS build
WORKDIR /app/frontend

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm install
RUN npm run build

FROM node:22
WORKDIR /app/frontend

RUN npm i -g serve
COPY --from=build /app/frontend/dist ./dist

EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
