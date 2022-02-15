import { Doc, Result } from "../types.ts";
import { Bson } from "mongo";
import { MongoClient } from "mongo";
import { connect, parseURL } from "redis";

const mongoClient = new MongoClient();
await mongoClient.connect(Deno.env.get("MONGO_URI")!);

const redis = await connect(parseURL(Deno.env.get("REDIS_URI")!));
export const loadCache = async (documentId: string): Promise<Result> => {
  const cached = await redis.get(documentId);
  if (cached) return { status: "ok" };

  const stored = await mongoClient
    .database()
    .collection("documents")
    .findOne({ _id: new Bson.ObjectId(documentId) });

  if (!stored) return { status: "bad" };

  const { lines } = stored;
  const doc: Doc = { lines };
  await redis.set(documentId, JSON.stringify(doc));
  return { status: "ok" };
};

export const storeCache = async (documentId: string): Promise<Result> => {
  const cached = await redis.get(documentId);
  if (!cached) return { status: "bad" };

  const doc: Doc = JSON.parse(cached);
  await mongoClient.database().collection("documents").updateOne(
    { _id: new Bson.ObjectId(documentId) },
    { $set: { lines: doc.lines } },
    { upsert: true },
  );
  return { status: "ok" };
};

export const fetchCache = async (documentId: string): Promise<Result<{}, { doc: Doc }>> => {
  const cached = await redis.get(documentId);
  if (!cached) return { status: "bad" };

  const doc: Doc = JSON.parse(cached);
  return { status: "ok", doc: doc };
};

export const overrideCache = async (documentId: string, doc: Doc): Promise<Result> => {
  try {
    await redis.set(documentId, JSON.stringify(doc));
    return { status: "ok" };
  } catch (e) {
    console.dir(e);
    return { status: "bad" };
  }
};
