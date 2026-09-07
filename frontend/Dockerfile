# Build from the repository root: pnpm uses the root workspace lockfile.
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/package.json
COPY common common
RUN pnpm install --frozen-lockfile
COPY frontend frontend
ARG NEXT_PUBLIC_ASSET_BASE_URL=https://pixelmap.art
ENV NEXT_PUBLIC_ASSET_BASE_URL=$NEXT_PUBLIC_ASSET_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --dir frontend build

FROM nginx:1.28-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/out /usr/share/nginx/html
EXPOSE 80
