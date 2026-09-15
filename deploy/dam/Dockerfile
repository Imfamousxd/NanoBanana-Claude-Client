# Content-engine DAM worker — hosted on Railway (or any Docker host).
# Watches Dropbox, probes/analyses/embeds every asset, keeps the dam.* index in Supabase current.
FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
# Only what the worker needs: the engine and the knowledge layer (brand roster + registries).
COPY engine ./engine
COPY knowledge ./knowledge
COPY schemas ./schemas
COPY docs ./docs
COPY ["Brand Context", "./Brand Context/"]
ENV NODE_ENV=production DAM_WORK_DIR=/data/dam
CMD ["node", "engine/cli.mjs", "dam", "watch"]
