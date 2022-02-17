import { rmqChan } from "../main.ts";
import { updateView } from "../view/mod.ts";
import { loadCache } from "../cache/mod.ts";
import { Bson } from "mongo";

export const setupJoin = async () => {
  await rmqChan.declareExchange({ exchange: "join", type: "topic", durable: true });
  await rmqChan.declareQueue({ queue: "join", durable: true });
  await rmqChan.bindQueue({ exchange: "join", queue: "join", routingKey: "join.*" });

  await rmqChan.consume(
    { queue: "join" },
    async (args, props, data) => {
      const { documentId } = JSON.parse(new TextDecoder().decode(data));

      const cacheResult = await loadCache(documentId);
      if (cacheResult.status === "ok") await updateView(documentId);

      await rmqChan.ack({ deliveryTag: args.deliveryTag });
    },
  );
};
