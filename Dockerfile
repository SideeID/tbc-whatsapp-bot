FROM node:23-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p data

EXPOSE 3001

VOLUME ["/usr/src/app/data"]

CMD ["npm", "start"]