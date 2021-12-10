FROM node:17
RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

# pnpm fetch does require only lockfile
COPY pnpm-lock.yaml ./
RUN pnpm fetch --prod

ADD . ./
RUN pnpm install

RUN pnpm run build
RUN mkdir -p /cache/metadata && mkdir -p /cache/fullmap
#
# If you need to compile your source, do it here.
#
CMD [ "node", "dist/src/main.js" ]

EXPOSE 3001



