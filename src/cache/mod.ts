import { Doc, Result } from "../types.ts";
import { Bson } from "mongo";
import { MongoClient } from "mongo";
import { connect, parseURL } from "redis";
import { generateLineId } from "./generate_line_id.ts";

const mongoClient = new MongoClient();
await mongoClient.connect(Deno.env.get("MONGO_URI")!);

const redisClient = await connect(parseURL(Deno.env.get("REDIS_URI")!));

const calcKey = (documentId: string) => "edit." + documentId;
export const loadCache = async (documentId: string): Promise<Result> => {
  const redisKey = calcKey(documentId);

  const cached = await redisClient.get(redisKey);
  if (cached) return { status: "ok" };

  const stored = await mongoClient
    .database()
    .collection("documents")
    .findOne({ _id: new Bson.ObjectId(documentId) });

  if (!stored) {
    const lines = [{ id: generateLineId(), text: "" }];
    await mongoClient
      .database()
      .collection("documents")
      .insertOne({ _id: new Bson.ObjectId(documentId), lines });

    const doc: Doc = { lines: lines };
    await redisClient.set(redisKey, JSON.stringify(doc));
    return { status: "ok" };
  } else {
    const { lines } = stored;
    const doc: Doc = { lines };
    await redisClient.set(redisKey, JSON.stringify(doc));
    return { status: "ok" };
  }
};

export const storeCache = async (documentId: string): Promise<Result> => {
  const redisKey = calcKey(documentId);

  const cached = await redisClient.get(redisKey);
  if (!cached) return { status: "bad" };

  const doc: Doc = JSON.parse(cached);
  await mongoClient.database().collection("documents").updateOne(
    { _id: new Bson.ObjectId(documentId) },
    { $set: { lines: doc.lines } },
    { upsert: true },
  );
  await redisClient.del(redisKey);
  return { status: "ok" };
};

export const fetchCache = async (documentId: string): Promise<Result<{}, { doc: Doc }>> => {
  const redisKey = calcKey(documentId);

  const cached = await redisClient.get(redisKey);
  if (!cached) return { status: "bad" };

  const doc: Doc = JSON.parse(cached);
  return { status: "ok", doc: doc };
};

export const overrideCache = async (documentId: string, doc: Doc): Promise<Result> => {
  try {
    const redisKey = calcKey(documentId);

    await redisClient.set(redisKey, JSON.stringify(doc));
    return { status: "ok" };
  } catch (e) {
    console.dir(e);
    return { status: "bad" };
  }
};
