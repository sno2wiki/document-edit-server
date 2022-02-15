export type Line = { id: string; text: string };
export type Doc = { lines: Line[] };
export type CommitUnion = (
  & { id: string }
  & (
    | { type: "UPDATE"; payload: { lineId: string; text: string } }
    | { type: "INSERT"; payload: { prevLineId: string; newLineId: string; text: string } }
    | { type: "DELETE"; payload: { lineId: string } }
  )
);

export type Result<
  TBad extends Record<string, unknown> = Record<string, unknown>,
  TOk extends Record<string, unknown> = Record<string, unknown>,
> =
  | ({ status: "ok" } & TOk)
  | ({ status: "bad" } & TBad);
