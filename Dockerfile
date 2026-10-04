# ==============================================================================
# Multi-stage Dockerfile per Google Cloud Run / Vertex / Render / Railway
# ==============================================================================

# STAGE 1: Compilazione del Frontend React con Vite
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# STAGE 2: Ambiente di produzione Python FastAPI
FROM python:3.12-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PORT=8000

# Installa le dipendenze Python
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copia il codice backend
COPY backend/ ./backend/

# Copia i file compilati del frontend dal primo stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Espone la porta definita da Cloud Run / Vertex (default 8000)
EXPOSE 8000

# Avvia FastAPI con Uvicorn
WORKDIR /app/backend
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
