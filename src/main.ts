import { connect } from "amqp";

const connection = await connect(Deno.env.get("RABBITMQ_URI")!);

const channel = await connection.openChannel();

await channel.declareExchange({ exchange: "join", type: "topic", durable: true });
await channel.declareQueue({ queue: "join.*", durable: true });
await channel.bindQueue({ exchange: "join", queue: "join", routingKey: "join.*" });

await channel.declareExchange({ exchange: "view", type: "topic", durable: true });
await channel.declareQueue({ queue: "view", durable: true });
await channel.bindQueue({ exchange: "view", queue: "view", routingKey: "view.*" });

await channel.declareExchange({ exchange: "edit", type: "topic", durable: true });
await channel.declareQueue({ queue: "edit", durable: true });
await channel.bindQueue({ exchange: "edit", queue: "edit", routingKey: "edit.*" });

await channel.consume(
  { queue: "join" },
  async (args, props, data) => {
    await channel.ack({ deliveryTag: args.deliveryTag });
  },
);

await channel.consume(
  { queue: "edit" },
  async (args, props, data) => {
    const { documentId, lines, commits } = JSON.parse(new TextDecoder().decode(data));
    await build({ documentId, lines, commits });
    await channel.ack({ deliveryTag: args.deliveryTag });
  },
);

const build = async ({ documentId, lines, commits }: {
  documentId: string;
  lines: { id: string; text: string }[];
  commits: (
    & { id: string }
    & (
      | { type: "UPDATE"; payload: { lineId: string; text: string } }
      | { type: "INSERT"; payload: { prevLineId: string; newLineId: string; text: string } }
      | { type: "DELETE"; payload: { lineId: string } }
    )
  )[];
}) => {
  let parsed = lines;
  let head: string | undefined = undefined;
  for (const commit of commits) {
    switch (commit.type) {
      case "UPDATE": {
        const { payload } = commit;
        parsed = parsed.map((line) => line.id === payload.lineId ? { ...line, text: payload.text } : line);
        head = commit.id;
        break;
      }
      case "INSERT": {
        const { payload } = commit;
        const index = parsed.findIndex((line) => line.id === payload.prevLineId);
        if (index !== -1) {
          parsed = [
            ...parsed.slice(0, index + 1),
            { id: payload.newLineId, text: payload.text },
            ...parsed.slice(index + 1),
          ];
          head = commit.id;
        }
        break;
      }
      case "DELETE": {
        parsed = parsed;
        break;
      }
    }
  }
  await channel.publish(
    { exchange: "view", routingKey: "view." + documentId },
    { contentType: "application/json" },
    new TextEncoder().encode(JSON.stringify(
      {
        documentId,
        lines: parsed,
        head: head,
      },
    )),
  );
};

connection.closed().then(() => {
  console.log("Closed peacefully");
}).catch((error) => {
  console.error("Connection closed with error");
  console.error(error.message);
});
