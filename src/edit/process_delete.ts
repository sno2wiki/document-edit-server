import { DeleteCommitPayload, Line, Result } from "../types.ts";

export const processDelete = (payload: DeleteCommitPayload, previousLines: Line[]): Result<{}, { lines: Line[] }> => {
  return { status: "ok", lines: previousLines };
};
