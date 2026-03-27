FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV SQLITE_PATH=/app/data/kyberbus.sqlite
ENV UPLOADS_DIR=/app/uploads

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/server/db/migrations ./server/db/migrations

RUN mkdir -p /app/data /app/uploads

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
