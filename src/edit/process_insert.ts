import { InsertCommitPayload, Line, Result } from "../types.ts";

export const processInsert = (payload: InsertCommitPayload, previousLines: Line[]): Result<{}, { lines: Line[] }> => {
  const prevIndex = previousLines.findIndex((line) => line.id === payload.prevLineId);
  if (prevIndex === -1) return { status: "bad" };

  previousLines.splice(prevIndex + 1, 0, { id: payload.newLineId, text: payload.text });

  return {
    status: "ok",
    lines: previousLines,
  };
};
