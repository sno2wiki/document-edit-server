FROM denoland/deno:1.18.0 AS BUILDER

WORKDIR /app

COPY deno.jsonc import_map.json ./
COPY src ./src

CMD ["deno", "run", "--allow-net", "--allow-env=RABBITMQ_URI,MONGO_URI,REDIS_URI", "--importmap=./import_map.json", "./src/main.ts"]
