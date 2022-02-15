import { Line, Result, UpdateCommitPayload } from "../types.ts";

export const processUpdate = (payload: UpdateCommitPayload, previousLines: Line[]): Result<{}, { lines: Line[] }> => {
  const index = previousLines.findIndex(({ id }) => (id === payload.lineId));
  if (index === -1) return { status: "bad" };

  previousLines[index] = { id: payload.lineId, text: payload.text };
  return { status: "ok", lines: previousLines };
};
