# 🐳 Guide de Dockerisation - Application De Pilotage des Expérimentations de projet RI2S

Ce guide détaille les étapes complètes pour containeriser et déployer l'application de gestion d'expérimentations médicales en utilisant Docker, Docker Compose et Portainer.

## 📋 Architecture de Déploiement

Notre application est déployée selon une architecture hybride :
- **Machine virtuelle** sur infrastructure cloud
- **3 conteneurs Docker** à l'intérieur de la VM :
  - Frontend (React/Vue.js)
  - Backend (API)
  - Base de données (MongoDB)

## 🛠️ Prérequis

- Machine virtuelle Ubuntu/Debian configurée
- Accès SSH à la machine virtuelle
- Domaine ou IP publique configuré
- Ports ouverts : 80, 443, 3000, 8000, 27017, 9000

## 🚀 Étapes de Dockerisation

### 1. Préparation de la Machine Virtuelle

#### 1.1 Connexion à la VM
```bash
ssh user@your-vm-ip
```

#### 1.2 Mise à jour du système
```bash
sudo apt update && sudo apt upgrade -y
```

#### 1.3 Installation des dépendances
```bash
sudo apt install -y curl wget git unzip
```

### 2. Installation de Docker Engine

#### 2.1 Suppression des anciennes versions
```bash
sudo apt remove docker docker-engine docker.io containerd runc
```

#### 2.2 Installation des certificats
```bash
sudo apt update
sudo apt install ca-certificates curl gnupg lsb-release
```

#### 2.3 Ajout de la clé GPG officielle de Docker
```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

#### 2.4 Configuration du repository
```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

#### 2.5 Installation de Docker Engine
```bash
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

#### 2.6 Vérification de l'installation
```bash
sudo docker --version
sudo docker run hello-world
```

#### 2.7 Configuration des permissions utilisateur
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Installation de Docker Compose

#### 3.1 Téléchargement de Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```

#### 3.2 Attribution des permissions
```bash
sudo chmod +x /usr/local/bin/docker-compose
```

#### 3.3 Vérification
```bash
docker-compose --version
```

### 4. Installation de Portainer

#### 4.1 Création du volume Portainer
```bash
docker volume create portainer_data
```

#### 4.2 Déploiement de Portainer
```bash
docker run -d -p 9000:9000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:latest
```

#### 4.3 Accès à Portainer
- URL : `http://your-vm-ip:9000`
- Créer un compte administrateur lors de la première connexion

### 5. Configuration des Conteneurs

#### 5.1 Structure des fichiers
```
project/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
└── mongodb/
    └── init-scripts/
```

#### 5.2 Création du fichier docker-compose.yml
```yaml
version: '3.8'

services:
  # Base de données MongoDB
  mongodb:
    image: mongo:latest
    container_name: medical_experiments_db
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: your_secure_password
      MONGO_INITDB_DATABASE: medical_experiments
    volumes:
      - mongodb_data:/data/db
      - ./mongodb/init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "27017:27017"
    networks:
      - medical_experiments_network

  # Backend API
  backend:
    build: ./backend
    container_name: medical_experiments_backend
    restart: unless-stopped
    depends_on:
      - mongodb
    environment:
      NODE_ENV: production
      MONGO_URI: mongodb://admin:your_secure_password@mongodb:27017/medical_experiments
      JWT_SECRET: your_jwt_secret
      PORT: 8000
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - medical_experiments_network

  # Frontend
  frontend:
    build: ./frontend
    container_name: medical_experiments_frontend
    restart: unless-stopped
    depends_on:
      - backend
    environment:
      REACT_APP_API_URL: http://your-vm-ip:8000
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - medical_experiments_network

volumes:
  mongodb_data:

networks:
  medical_experiments_network:
    driver: bridge
```

#### 5.3 Dockerfile pour le Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### 5.4 Dockerfile pour le Backend
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
```

### 6. Déploiement des Conteneurs

#### 6.1 Clonage du projet
```bash
git clone https://github.com/your-username/medical-experiments-app.git
cd medical-experiments-app
```

#### 6.2 Configuration des variables d'environnement
```bash
# Créer un fichier .env
cp .env.example .env
# Modifier les variables selon votre configuration
nano .env
```

#### 6.3 Construction et démarrage des conteneurs
```bash
# Construction des images
docker-compose build

# Démarrage des services
docker-compose up -d
```

#### 6.4 Vérification du déploiement
```bash
# Vérifier le statut des conteneurs
docker-compose ps

# Voir les logs
docker-compose logs -f
```

### 7. Gestion via Portainer

#### 7.1 Accès à l'interface Portainer
1. Ouvrir `http://your-vm-ip:9000`
2. Se connecter avec les identifiants administrateur

#### 7.2 Gestion des conteneurs
- **Surveiller les ressources** : CPU, mémoire, réseau
- **Gérer les conteneurs** : démarrer, arrêter, redémarrer
- **Consulter les logs** en temps réel
- **Gérer les volumes et réseaux**

#### 7.3 Surveillance des performances
- Utiliser le dashboard Portainer pour surveiller :
  - Utilisation des ressources
  - Statut des conteneurs
  - Logs d'application
  - Métriques de performance

### 8. Configuration HTTPS (Optionnel)

#### 8.1 Installation de Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

#### 8.2 Configuration du reverse proxy
```bash
# Installer nginx
sudo apt install nginx

# Configurer nginx pour le reverse proxy
sudo nano /etc/nginx/sites-available/medical-experiments
```

#### 8.3 Obtention du certificat SSL
```bash
sudo certbot --nginx -d your-domain.com
```

### 9. Commandes Utiles

#### 9.1 Gestion des conteneurs
```bash
# Redémarrer tous les services
docker-compose restart

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v

# Voir les logs d'un service spécifique
docker-compose logs -f backend

# Accéder au shell d'un conteneur
docker-compose exec backend sh
```

#### 9.2 Maintenance
```bash
# Nettoyer les images inutilisées
docker image prune -a

# Nettoyer les volumes inutilisés
docker volume prune

# Nettoyer le système complet
docker system prune -a --volumes
```

### 10. Sauvegarde et Restauration

#### 10.1 Sauvegarde de la base de données
```bash
# Créer une sauvegarde
docker-compose exec mongodb mongodump --host localhost --port 27017 --username admin --password your_secure_password --out /backup

# Copier la sauvegarde vers l'hôte
docker cp medical_experiments_db:/backup ./mongodb-backup-$(date +%Y%m%d)
```

#### 10.2 Restauration
```bash
# Restaurer depuis une sauvegarde
docker-compose exec mongodb mongorestore --host localhost --port 27017 --username admin --password your_secure_password /backup
```

## 🔧 Dépannage

### Problèmes courants

1. **Conteneur qui ne démarre pas**
   ```bash
   docker-compose logs service_name
   ```

2. **Problème de permissions**
   ```bash
   sudo chown -R $USER:$USER ./project
   ```

3. **Port déjà utilisé**
   ```bash
   sudo netstat -tulpn | grep :port_number
   sudo kill -9 PID
   ```

### Vérification de la santé des services

```bash
# Vérifier les services
curl http://localhost:3000  # Frontend
curl http://localhost:8000/health  # Backend
docker-compose exec mongodb mongo --eval "db.runCommand('ping')"  # MongoDB
```

## 📊 Monitoring

### Métriques importantes à surveiller
- Utilisation CPU/RAM des conteneurs
- Espace disque disponible
- Logs d'erreurs applicatives
- Temps de réponse des API
- Connexions à la base de données

### Portainer Dashboard
Utilisez Portainer pour surveiller :
- État des conteneurs en temps réel
- Utilisation des ressources
- Logs centralisés
- Alertes de santé
## 📞 Support

En cas de problème, consultez :
- Documentation officielle Docker
- Logs des conteneurs
- Interface Portainer
- Issues GitHub du projet

---

**Auteur** : [Ibtissem DORAI]  
**Date** : [08/07/2025]  
**Version** : 1.0.0
