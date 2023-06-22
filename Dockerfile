FROM ubuntu:20.04 as base

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update -y && apt-get install -y \
    software-properties-common \
    apt-transport-https \
    curl \
    build-essential \
    git 
# libzmq3-dev libsodium-dev pkg-config libssl-dev

#nodejs 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

# install depdencies
RUN apt-get update -y && apt-get install -y --allow-unauthenticated \
    nodejs

# Install yarn seperately due to `no-install-recommends` to skip nodejs install 
RUN apt-get install -y --no-install-recommends yarn

LABEL maintainer="m.akmal@regovtech.com"
WORKDIR /app
COPY tsconfig*.json ./
COPY package*.json ./
COPY nest-cli.json ./
COPY README.md ./
COPY src/ src/
COPY test/ test/
RUN yarn install
RUN yarn build
CMD ["yarn", "start:dev"]
# CMD [ "sh", "-c", "echo 'HELLO' && echo 'WORLD!'"]
# ENTRYPOINT ["tail", "-f", "/dev/null"]
