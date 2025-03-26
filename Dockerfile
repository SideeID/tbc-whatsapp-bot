FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p sessions data

EXPOSE 3000

VOLUME ["/usr/src/app/sessions", "/usr/src/app/data"]

CMD ["npm", "start"]