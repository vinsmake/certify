# Imagen de DESARROLLO: el repo completo se monta en /app (ver docker-compose.yml).
# Las dependencias se instalan con `npm run setup` y quedan en /app/node_modules.
FROM node:24-alpine

# Chromium del sistema para Puppeteer (generacion de PDFs) + fuentes
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont font-noto openssl

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app/backend
EXPOSE 3000 5555
CMD ["npm", "run", "dev"]
