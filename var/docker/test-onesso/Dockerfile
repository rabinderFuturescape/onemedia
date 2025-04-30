FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY test-onesso-integration.js ./

# Start the application
CMD ["node", "test-onesso-integration.js"]
