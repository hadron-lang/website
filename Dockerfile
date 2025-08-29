FROM node:22-alpine AS node-runtime

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 3333
CMD ["yarn", "start"]

