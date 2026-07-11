# ---- Build ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/client/package.json packages/client/package.json
RUN npm ci --workspace=packages/shared --workspace=packages/client --include-workspace-root

COPY packages/shared packages/shared
COPY packages/client packages/client

ARG VITE_API_URL=/api/v1
ARG VITE_SOCKET_URL=/
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/client

# ---- Runtime ----
FROM nginx:1.27-alpine AS runtime
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/client/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
