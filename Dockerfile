# Base image
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

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
