export type Line = { id: string; text: string };
export type Doc = { lines: Line[]; head: string };

export type UpdateCommitPayload = { lineId: string; text: string };
export type InsertCommitPayload = { prevLineId: string; newLineId: string; text: string };
export type DeleteCommitPayload = { lineId: string };
export type CommitUnion = (
  & { id: string }
  & (
    | { type: "UPDATE"; payload: UpdateCommitPayload }
    | { type: "INSERT"; payload: InsertCommitPayload }
    | { type: "DELETE"; payload: DeleteCommitPayload }
  )
);

export type Result<
  TBad extends Record<string, unknown> = Record<string, unknown>,
  TOk extends Record<string, unknown> = Record<string, unknown>,
> =
  | ({ status: "ok" } & TOk)
  | ({ status: "bad" } & TBad);
