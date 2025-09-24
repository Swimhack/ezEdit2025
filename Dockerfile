# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.11.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Change to ezedit directory
WORKDIR /app

# Install node modules including dev dependencies for build
COPY ezedit/package*.json ./
RUN npm ci

# Copy application code
COPY ezedit/ ./

# Build the Next.js application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Final stage for app image
FROM base

# Install DNS resolution utilities to fix Supabase connectivity
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y ca-certificates curl dnsutils && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy built application
COPY --from=build /app /app

# Start the server using standalone mode as recommended by Next.js
EXPOSE 3000
CMD [ "node", ".next/standalone/server.js" ]
