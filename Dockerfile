# --- Stage 1: Build Phase ---
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies for compilation)
RUN npm ci

# Copy the rest of the application source code
COPY src/ ./src/

# Compile TypeScript to native JavaScript in /dist
RUN npm run build

# Remove development dependencies to keep the final image light
RUN npm prune --production


# --- Stage 2: Production Phase ---
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and production node_modules from the builder stage
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create the data directory to ensure SQLite can persist its database file safely
RUN mkdir -p data

# Expose the standard Apollo Server port
EXPOSE 4000

# Execute the compiled JavaScript bundle directly
CMD ["node", "dist/index.js"]