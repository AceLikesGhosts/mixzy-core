FROM node:18.16.0-alpine

WORKDIR /usr/src/api

RUN apk add --no-cache build-base python3

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]