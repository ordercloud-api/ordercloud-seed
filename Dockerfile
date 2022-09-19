# syntax=docker/dockerfile:1
FROM node:16.15.1
ENV NODE_ENV=development
WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install

COPY . .

RUN npm run build

ENTRYPOINT ["node", "./dist/cli.js"]