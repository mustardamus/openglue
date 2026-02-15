FROM docker.io/library/ubuntu:latest

ENV DEBIAN_FRONTEND=noninteractive

# System packages required by:
#   - Node.js: libatomic1
#   - General toolchain: ca-certificates, curl, git
#   - Chromium + runtime deps
RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends \
        libatomic1 ca-certificates curl git \
        chromium-browser \
    && rm -rf /var/lib/apt/lists/*

ENV CHROMIUM_BIN=/usr/bin/chromium-browser
