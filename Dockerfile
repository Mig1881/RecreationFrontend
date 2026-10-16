# ==========================================
# Etapa 1: Construcción (Build Stage)
# ==========================================
FROM node:20-alpine AS build
WORKDIR /app

# Copiar configuración de dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente y compilar
COPY . .
RUN npx vite build

# ==========================================
# Etapa 2: Servidor Web (Production Stage)
# ==========================================
FROM nginx:alpine

# Copiar los archivos compilados de Vite (carpeta dist) al servidor Nginx
COPY --from=build /app/dist /usr/share/nginx/html
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://app:8081; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Arrancar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]