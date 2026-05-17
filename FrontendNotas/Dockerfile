# FrontendNotas — Next.js (npm workspace: frontend-notas)
# Build context: monorepo root
#
# Targets:
#   development — next dev with bind-mounted src/
#   production  — standalone output for smaller runtime image

# Debian slim (not Alpine): Tailwind v4 / lightningcss needs glibc native bindings
FROM node:22-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------------------------------------
# Dependencies (workspace-aware install at monorepo root)
# -----------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY BackendNotas/package.json ./BackendNotas/
COPY FrontendNotas/package.json ./FrontendNotas/
# Optional native bindings are hoisted to /app/node_modules; install explicitly for Linux targets
RUN npm ci \
  && case "$(uname -m)" in \
       aarch64|arm64) \
         npm install lightningcss-linux-arm64-gnu@1.32.0 @tailwindcss/oxide-linux-arm64-gnu@4.3.0 \
           -w frontend-notas --no-audit --no-fund ;; \
       x86_64|amd64) \
         npm install lightningcss-linux-x64-gnu@1.32.0 @tailwindcss/oxide-linux-x64-gnu@4.3.0 \
           -w frontend-notas --no-audit --no-fund ;; \
       *) echo "Unsupported architecture: $(uname -m)" && exit 1 ;; \
     esac

# -----------------------------------------------------------------------------
# Development — hot reload via volume mounts + polling env vars in compose
# -----------------------------------------------------------------------------
FROM deps AS development
COPY FrontendNotas ./FrontendNotas
# Hoisted native packages: symlink .node binaries where parent packages resolve them
RUN case "$(uname -m)" in \
      aarch64|arm64) \
        ln -sf ../../../node_modules/lightningcss-linux-arm64-gnu/lightningcss.linux-arm64-gnu.node \
          FrontendNotas/node_modules/lightningcss/lightningcss.linux-arm64-gnu.node && \
        ln -sf ../../../node_modules/@tailwindcss/oxide-linux-arm64-gnu/tailwindcss-oxide.linux-arm64-gnu.node \
          FrontendNotas/node_modules/@tailwindcss/oxide/tailwindcss-oxide.linux-arm64-gnu.node ;; \
      x86_64|amd64) \
        ln -sf ../../../node_modules/lightningcss-linux-x64-gnu/lightningcss.linux-x64-gnu.node \
          FrontendNotas/node_modules/lightningcss/lightningcss.linux-x64-gnu.node && \
        ln -sf ../../../node_modules/@tailwindcss/oxide-linux-x64-gnu/tailwindcss-oxide.linux-x64-gnu.node \
          FrontendNotas/node_modules/@tailwindcss/oxide/tailwindcss-oxide.linux-x64-gnu.node ;; \
    esac
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
WORKDIR /app
# -H 0.0.0.0 required so port mapping works inside Docker
CMD ["npm", "run", "dev:docker", "-w", "frontend-notas"]

# -----------------------------------------------------------------------------
# Production build
# -----------------------------------------------------------------------------
FROM deps AS builder
COPY FrontendNotas ./FrontendNotas
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w frontend-notas

# -----------------------------------------------------------------------------
# Production runner
# -----------------------------------------------------------------------------
FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/FrontendNotas/.next/standalone ./
COPY --from=builder /app/FrontendNotas/.next/static ./FrontendNotas/.next/static
COPY --from=builder /app/FrontendNotas/public ./FrontendNotas/public
WORKDIR /app
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "FrontendNotas/server.js"]
