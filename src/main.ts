import { connect } from "amqp";
import { setupJoin } from "./join/mod.ts";
import { setupEdit } from "./edit/mod.ts";
import { setupView } from "./view/mod.ts";

export const connection = await connect(Deno.env.get("RABBITMQ_URI")!);
export const channel = await connection.openChannel();

await setupView();
await setupJoin();
await setupEdit();

connection.closed().then(() => {
  console.log("Closed peacefully");
}).catch((error) => {
  console.error("Connection closed with error");
  console.error(error.message);
});
