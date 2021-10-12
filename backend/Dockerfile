# Builder Image
FROM node:16 AS build-env
COPY package.json /app/package.json
COPY /utils /app/utils
COPY /abi /app/abi

WORKDIR /app
RUN yarn install --frozen-lockfile

FROM node:slim

# Variables
ARG WEB3_URL
ARG CONTRACT_ADDRESS
ARG CONTRACT_WRAPPER_ADDRESS
ENV WEB3_URL ${WEB3_URL}}
ENV CONTRACT_ADDRESS ${CONTRACT_ADDRESS}}
ENV CONTRACT_WRAPPER_ADDRESS ${CONTRACT_WRAPPER_ADDRESS}}

COPY --from=build-env /app /app
COPY server.js /app/server.js
RUN mkdir -p /app/cache
WORKDIR /app
EXPOSE 3001
CMD ["server.js"]
