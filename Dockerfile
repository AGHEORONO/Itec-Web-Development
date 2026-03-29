FROM node:20-alpine

# Install build dependencies for native modules and code execution (C++/Python) + Docker CLI for Sandbox spawning
RUN apk add --no-cache python3 py3-pip python3-dev g++ make bash docker-cli

WORKDIR /app

# Copy package files strictly first for caching
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies for both backend and frontend
RUN cd server && npm install
RUN cd client && npm install

# Copy all source code
COPY server ./server
COPY client ./client

# Build the Vite frontend
RUN cd client && npm run build

# Set the working directory to the server directory for runtime
WORKDIR /app/server

# Expose the application port
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

# Start the Node.js server
CMD ["node", "index.js"]
