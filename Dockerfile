FROM denoland/deno:1.18.0 AS BUILDER
WORKDIR /app

COPY deno.jsonc import_map.json velociraptor.yml ./
COPY src ./src

RUN deno run -qA https://deno.land/x/velociraptor@1.4.0/cli.ts compile

FROM debian:11-slim AS RUNNER
WORKDIR /app

COPY --from=BUILDER /app/dist ./dist

CMD ["./dist/main"]
