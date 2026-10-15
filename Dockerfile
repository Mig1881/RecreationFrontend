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
RUN npm run build

# ==========================================
# Etapa 2: Servidor Web (Production Stage)
# ==========================================
FROM nginx:alpine

# Copiar los archivos compilados de Vite (carpeta dist) al servidor Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# IMPORTANTE: Configuración para que funcione react-router-dom
# Nginx por defecto devuelve 404 si recargas una ruta que no sea la raíz (/).
# Esta regla redirige cualquier ruta no encontrada al index.html de React.
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Arrancar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]