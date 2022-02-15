import { channel } from "../main.ts";
import { storeCache } from "../cache/mod.ts";

export const setupSave = async () => {
  await channel.declareExchange({ exchange: "save", type: "topic", durable: true });
  await channel.declareQueue({ queue: "save", durable: true });
  await channel.bindQueue({ exchange: "save", queue: "save", routingKey: "save.*" });

  await channel.consume(
    { queue: "save" },
    async (args, props, data) => {
      const { documentId } = JSON.parse(new TextDecoder().decode(data));

      const cacheResult = await storeCache(documentId);

      await channel.ack({ deliveryTag: args.deliveryTag });
    },
  );
};
