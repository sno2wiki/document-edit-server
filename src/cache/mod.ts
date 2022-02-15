import { Doc, Result } from "../types.ts";
import { Bson } from "mongo";
import { MongoClient } from "mongo";

export const mongoClient = new MongoClient();
await mongoClient.connect(Deno.env.get("MONGO_URI")!);

export const cache = new Map<string, Doc>();

export const loadCache = async (documentId: string): Promise<Result> => {
  if (cache.has(documentId)) return { status: "ok" };

  const stored = await mongoClient
    .database()
    .collection("documents")
    .findOne({ _id: new Bson.ObjectId(documentId) });

  if (!stored) return { status: "bad" };

  const { lines } = stored;
  const doc: Doc = { lines };
  cache.set(documentId, doc);
  return { status: "ok" };
};

export const storeCache = async (documentId: string): Promise<Result> => {
  const cached = await cache.get(documentId);
  if (!cached) return { status: "bad" };
  await mongoClient.database().collection("documents").updateOne({ _id: new Bson.ObjectId(documentId) }, cached);
  return { status: "ok" };
};

export const fetchCache = async (documentId: string): Promise<Result<{}, { doc: Doc }>> => {
  const cached = await cache.get(documentId);
  if (!cached) return { status: "bad" };
  else return { status: "ok", doc: cached };
};

export const overrideCache = async (documentId: string, doc: Doc): Promise<Result> => {
  await cache.set(documentId, doc);
  return { status: "ok" };
};
