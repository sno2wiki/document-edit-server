import { channel } from "../main.ts";
import { updateView } from "../view/mod.ts";
import { loadCache } from "../cache/mod.ts";

export const setupJoin = async () => {
  await channel.declareExchange({ exchange: "join", type: "topic", durable: true });
  await channel.declareQueue({ queue: "join", durable: true });
  await channel.bindQueue({ exchange: "join", queue: "join", routingKey: "join.*" });

  await channel.consume(
    { queue: "join" },
    async (args, props, data) => {
      const { userId, documentId } = JSON.parse(new TextDecoder().decode(data));

      const cacheResult = await loadCache(documentId);
      if (cacheResult.status === "ok") await updateView(documentId);

      await channel.ack({ deliveryTag: args.deliveryTag });
    },
  );
};
