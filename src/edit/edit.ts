import { channel } from "../main.ts";
import { updateView } from "../view/mod.ts";

export const setupEdit = async () => {
  await channel.declareExchange({ exchange: "edit", type: "topic", durable: true });
  await channel.declareQueue({ queue: "edit", durable: true });
  await channel.bindQueue({ exchange: "edit", queue: "edit", routingKey: "edit.*" });

  await channel.consume(
    { queue: "edit" },
    async (args, props, data) => {
      const { documentId, lines, commits } = JSON.parse(new TextDecoder().decode(data));
      const { lines: newLines } = build({ documentId, lines, commits });
      await updateView(documentId, { lines: newLines });
      await channel.ack({ deliveryTag: args.deliveryTag });
    },
  );
};

const build = ({ documentId, lines, commits }: {
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
  return { lines };
};
