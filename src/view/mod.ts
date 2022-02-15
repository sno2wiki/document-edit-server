import { rmqChan } from "../main.ts";
import { fetchCache } from "../cache/mod.ts";

export const setupView = async () => {
  await rmqChan.declareExchange({ exchange: "view", type: "topic", durable: true });
  await rmqChan.declareQueue({ queue: "view", durable: true });
  await rmqChan.bindQueue({ exchange: "view", queue: "view", routingKey: "view.*" });
};

export const updateView = async (documentId: string) => {
  const cache = await fetchCache(documentId);
  if (cache.status === "bad") return { status: "bad" };

  await rmqChan.publish(
    { exchange: "view", routingKey: "view." + documentId },
    { contentType: "application/json" },
    new TextEncoder().encode(JSON.stringify({ documentId, ...cache.doc })),
  );
  return { status: "ok" };
};
