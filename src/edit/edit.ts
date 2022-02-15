import { rmqChan } from "../main.ts";
import { updateView } from "../view/mod.ts";
import { CommitUnion, Line, Result } from "../types.ts";
import { overrideCache } from "../cache/mod.ts";
import { processUpdate } from "./process_update.ts";
import { processDelete } from "./process_delete.ts";
import { processInsert } from "./process_insert.ts";

export const setupEdit = async () => {
  await rmqChan.declareExchange({ exchange: "edit", type: "topic", durable: true });
  await rmqChan.declareQueue({ queue: "edit", durable: true });
  await rmqChan.bindQueue({ exchange: "edit", queue: "edit", routingKey: "edit.*" });

  await rmqChan.consume(
    { queue: "edit" },
    async (args, props, data) => {
      const { documentId, lines: previousLines, commits } = JSON.parse(new TextDecoder().decode(data));
      const { lines: nextLines } = processCommits({ previousLines, commits });
      await overrideCache(documentId, { lines: nextLines });
      await updateView(documentId);
      await rmqChan.ack({ deliveryTag: args.deliveryTag });
    },
  );
};

const processCommits = (
  { previousLines, commits }: { commits: CommitUnion[]; previousLines: Line[] },
) => {
  let nextLines = previousLines;
  let head: string | undefined = undefined;

  for (const commit of commits) {
    const result = processor(commit, nextLines);

    if (result.status === "bad") break;

    head = commit.id;

    nextLines = result.lines;
  }

  return { lines: nextLines, head };
};

export const processor = (commit: CommitUnion, previousLines: Line[]): Result<{}, { lines: Line[] }> => {
  switch (commit.type) {
    case "UPDATE":
      return processUpdate(commit.payload, previousLines);
    case "INSERT":
      return processInsert(commit.payload, previousLines);
    case "DELETE":
      return processDelete(commit.payload, previousLines);
  }
};
