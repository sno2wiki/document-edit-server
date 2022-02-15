import { rmqChan } from "../main.ts";
import { updateView } from "../view/mod.ts";
import { CommitUnion, Line } from "../types.ts";
import { overrideCache } from "../cache/mod.ts";

export const setupEdit = async () => {
  await rmqChan.declareExchange({ exchange: "edit", type: "topic", durable: true });
  await rmqChan.declareQueue({ queue: "edit", durable: true });
  await rmqChan.bindQueue({ exchange: "edit", queue: "edit", routingKey: "edit.*" });

  await rmqChan.consume(
    { queue: "edit" },
    async (args, props, data) => {
      const { documentId, lines: previousLines, commits } = JSON.parse(new TextDecoder().decode(data));
      const { lines: nextLines } = build(previousLines, commits);
      await overrideCache(documentId, { lines: nextLines });
      await updateView(documentId);
      await rmqChan.ack({ deliveryTag: args.deliveryTag });
    },
  );
};

const build = (previousLines: Line[], commits: CommitUnion[]) => {
  let nextLines = previousLines;
  let head: string | undefined = undefined;
  for (const commit of commits) {
    switch (commit.type) {
      case "UPDATE": {
        const { payload } = commit;
        nextLines = nextLines.map((line) => line.id === payload.lineId ? { ...line, text: payload.text } : line);
        head = commit.id;
        break;
      }
      case "INSERT": {
        const { payload } = commit;
        const index = nextLines.findIndex((line) => line.id === payload.prevLineId);
        if (index !== -1) {
          nextLines = [
            ...nextLines.slice(0, index + 1),
            { id: payload.newLineId, text: payload.text },
            ...nextLines.slice(index + 1),
          ];
          head = commit.id;
        }
        break;
      }
      case "DELETE": {
        nextLines = nextLines;
        break;
      }
    }
  }
  return { lines: nextLines };
};
