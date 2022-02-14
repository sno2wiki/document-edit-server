import { Doc } from "../types.ts";
import { channel } from "../main.ts";

export const cache = new Map<string, Doc>();

export const setupView = async () => {
  await channel.declareExchange({ exchange: "view", type: "topic", durable: true });
  await channel.declareQueue({ queue: "view", durable: true });
  await channel.bindQueue({ exchange: "view", queue: "view", routingKey: "view.*" });
};

const publishView = (documentId: string, doc: Doc) => {
  return channel.publish(
    { exchange: "view", routingKey: "view." + documentId },
    { contentType: "application/json" },
    new TextEncoder().encode(JSON.stringify({ documentId, ...doc })),
  );
};

export const updateView = async (documentId: string, doc: Doc) => {
  await publishView(documentId, doc);
};
