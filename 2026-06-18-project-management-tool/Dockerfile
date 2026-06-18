# AlignHQ — zero-dependency Node app on the official slim runtime.
FROM node:20-slim

WORKDIR /app

# Install deps (none at runtime, but keeps the layer honest if any are added).
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

EXPOSE 3000
USER node
CMD ["node", "server.js"]
