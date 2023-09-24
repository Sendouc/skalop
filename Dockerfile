FROM oven/bun
ARG REDIS_URL
ARG SKALOP_TOKEN
ARG PORT

WORKDIR /usr/src/app


COPY package*.json bun.lockb ./
RUN bun install
COPY . .

ENV NODE_ENV production

CMD [ "bun", "start" ]
