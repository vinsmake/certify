# Imagen de DESARROLLO: el repo completo se monta en /app (ver docker-compose.yml).
# Las dependencias se instalan con `npm run setup` y quedan en volumenes de Docker.
FROM node:24-alpine

WORKDIR /app/frontend
EXPOSE 5173
CMD ["npm", "run", "dev"]
