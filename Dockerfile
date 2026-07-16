# --- frontend build ---
FROM node:22-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig*.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# --- backend build ---
FROM golang:1.25 AS backend
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -o /out/server ./cmd/server

# --- runtime ---
FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=backend /out/server ./server
COPY --from=frontend /app/dist ./dist

ENV PORT=8080
ENV DIST_DIR=/app/dist
EXPOSE 8080

ENTRYPOINT ["/app/server"]
