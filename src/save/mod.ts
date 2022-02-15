import { rmqChan } from "../main.ts";
import { storeCache } from "../cache/mod.ts";

export const setupSave = async () => {
  await rmqChan.declareExchange({ exchange: "save", type: "topic", durable: true });
  await rmqChan.declareQueue({ queue: "save", durable: true });
  await rmqChan.bindQueue({ exchange: "save", queue: "save", routingKey: "save.*" });

  await rmqChan.consume(
    { queue: "save" },
    async (args, props, data) => {
      const { documentId } = JSON.parse(new TextDecoder().decode(data));

      const cacheResult = await storeCache(documentId);

      await rmqChan.ack({ deliveryTag: args.deliveryTag });
    },
  );
};
