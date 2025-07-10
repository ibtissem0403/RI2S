# Exemple Dockerfile de prod
FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install

# Copie des fichiers de l'application
COPY . .




EXPOSE 3000
CMD ["npm","run", "dev"]
