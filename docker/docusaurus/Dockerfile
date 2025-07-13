FROM node:20-alpine

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++ git

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Docusaurus
RUN npm install

# Expose port
EXPOSE 3005

# Start Docusaurus in development mode
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "3005"]