# Use Node.js 20 version as base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

COPY . /app/

# Copy built TypeScript files
RUN yarn build

# Expose port 3000
EXPOSE 4000

# Command to run the server
CMD ["node", "./dist/index.js"]