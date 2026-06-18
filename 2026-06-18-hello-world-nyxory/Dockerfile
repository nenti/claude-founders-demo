FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY . .
ENV HOST=0.0.0.0 PORT=8080
EXPOSE 8080
USER node
CMD ["node", "server.js"]
