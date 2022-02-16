import { DeleteCommitPayload, Line, Result } from "../types.ts";

export const processDelete = (payload: DeleteCommitPayload, previousLines: Line[]): Result<{}, { lines: Line[] }> => {
  const index = previousLines.findIndex(({ id }) => (id === payload.lineId));
  if (index === -1) return { status: "bad" };

  previousLines.splice(index, 1);

  return { status: "ok", lines: previousLines };
};
