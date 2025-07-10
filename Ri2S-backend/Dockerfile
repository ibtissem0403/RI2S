
FROM node:18

WORKDIR /app


COPY package*.json ./
RUN npm install
RUN  echo MONGO_URI=mongodb://mongodb:27017/ibt > .env
COPY . .


EXPOSE 5000
CMD ["npm", "start"]
