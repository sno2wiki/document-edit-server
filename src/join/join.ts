import { Bson } from "mongo";
import { channel, mongoClient } from "../main.ts";
import { updateView } from "../view/mod.ts";
import { cache } from "../cache/mod.ts";
import { Doc } from "../types.ts";

export const setupJoin = async () => {
  await channel.declareExchange({ exchange: "join", type: "topic", durable: true });
  await channel.declareQueue({ queue: "join.*", durable: true });
  await channel.bindQueue({ exchange: "join", queue: "join", routingKey: "join.*" });

  await channel.consume(
    { queue: "join" },
    async (args, props, data) => {
      const { userId, documentId } = JSON.parse(new TextDecoder().decode(data));
      if (!cache.has(documentId)) {
        const stored = await mongoClient
          .database()
          .collection("documents")
          .findOne({ _id: new Bson.ObjectId(documentId) });
        if (stored) {
          const { lines } = stored;
          const doc: Doc = { lines };
          cache.set(documentId, doc);
        }
      }

      const cached = cache.get(documentId);
      if (cached) {
        await updateView(documentId, cached);
      }

      await channel.ack({ deliveryTag: args.deliveryTag });
    },
  );
};
