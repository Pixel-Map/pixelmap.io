# Builder Image
FROM node:17-alpine AS build-env
COPY package.json /app/package.json
COPY /utils /app/utils
COPY /abi /app/abi

# Variables
ARG WEB3_URL
ARG CONTRACT_ADDRESS
ARG CONTRACT_WRAPPER_ADDRESS
ENV WEB3_URL ${WEB3_URL}}
ENV CONTRACT_ADDRESS ${CONTRACT_ADDRESS}}
ENV CONTRACT_WRAPPER_ADDRESS ${CONTRACT_WRAPPER_ADDRESS}}

#  add libraries needed to build canvas
RUN apk add --no-cache \
    build-base \
    g++ \
    libpng \
    libpng-dev \
    jpeg-dev \
    pango-dev \
    cairo-dev \
    giflib-dev \
    python3

WORKDIR /app
RUN mkdir -p /app/cache
RUN npm install canvas
RUN yarn install --frozen-lockfile

COPY server.js /app/server.js

EXPOSE 3001
CMD ["server.js"]



