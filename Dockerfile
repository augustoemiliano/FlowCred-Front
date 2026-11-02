# --- build: gera os ficheiros estáticos (dist/) ---
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# A API é servida pelo próprio nginx em /api (proxy), por isso a base é relativa.
ARG VITE_API_URL=/api/v1
ARG VITE_SHOW_DEMO_LOGIN=true
ENV VITE_API_URL=$VITE_API_URL VITE_SHOW_DEMO_LOGIN=$VITE_SHOW_DEMO_LOGIN
RUN npm run build

# --- runtime: nginx serve o SPA e faz proxy de /api para o backend ---
FROM nginx:1.27-alpine

# URL do backend vista de dentro do container (substituída no arranque via envsubst).
ENV API_UPSTREAM=http://host.docker.internal:8001

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
