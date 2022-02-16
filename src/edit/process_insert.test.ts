import { processInsert } from "./process_insert.ts";
import { assertEquals } from "std/testing/asserts";
import { Line } from "../types.ts";

Deno.test("prev line exists", () => {
  const actual = processInsert(
    { prevLineId: "line1", newLineId: "line2", text: "B" },
    [
      { id: "line1", text: "A" },
    ],
  );
  assertEquals(actual.status, "ok");
  assertEquals(
    (actual as { status: "ok"; lines: Line[] }).lines,
    [
      { id: "line1", text: "A" },
      { id: "line2", text: "B" },
    ],
  );
});

Deno.test("prev line does not exist", () => {
  const actual = processInsert(
    { prevLineId: "line2", newLineId: "line3", text: "B" },
    [
      { id: "line1", text: "A" },
    ],
  );
  assertEquals(actual.status, "bad");
});
