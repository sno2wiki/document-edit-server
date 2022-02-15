import { InsertCommitPayload, Line, Result } from "../types.ts";

export const processInsert = (payload: InsertCommitPayload, previousLines: Line[]): Result<{}, { lines: Line[] }> => {
  return { status: "ok", lines: previousLines };
};
