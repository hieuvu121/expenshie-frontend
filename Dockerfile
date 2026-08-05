FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV NODE_OPTIONS=--max-old-space-size=2048

# No API URL is baked in: the app calls a same-origin /app/v1 which nginx
# proxies to the gateway (see nginx.conf), so this image runs unchanged on any
# host or port. Must stay a production build — --mode development previously
# loaded .env.development and applied the dev-only /TailAdmin/ base path.
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
