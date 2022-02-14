import { Doc } from "../types.ts";
import { Bson } from "mongo";
import { MongoClient } from "mongo";
export const cache = new Map<string, Doc>();
