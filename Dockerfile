# Base image — must match the playwright version in package.json
FROM mcr.microsoft.com/playwright:v1.52.0-jammy

# Set working directory
WORKDIR /app

# Force production environment for the build
ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci --include=dev

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy project files
COPY . .

# Build Next.js application
RUN npm run build

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Expose Next.js port
EXPOSE 3000

# Start app using entrypoint to run both web and worker
CMD ["./entrypoint.sh"]
