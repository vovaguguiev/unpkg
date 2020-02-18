FROM node:10-alpine3.10

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

# Bundle app source
COPY . .

ARG CLOUDFLARE_EMAIL=example@example.com
ARG CLOUDFLARE_KEY=foo
ARG ORIGIN=https://esmcdn.com
ARG NODE_ENV=PRODUCTION
RUN yarn build

ENV DEBUG=false

CMD ["node", "server.js"]
