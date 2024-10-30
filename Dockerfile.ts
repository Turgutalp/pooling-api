FROM node:20.18.0-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build && npm prune --production

FROM node:20.18.0-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
EXPOSE ${PORT}
CMD ["node", "dist/src/main.js" ]