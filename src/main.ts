import { connect } from "amqp";
import { setupJoin } from "./join/mod.ts";
import { setupEdit } from "./edit/mod.ts";
import { setupSave } from "./save/mod.ts";
import { setupView } from "./view/mod.ts";
import { bold } from "std/fmt/colors";

const rmqConn = await connect(Deno.env.get("RABBITMQ_URI")!);
export const rmqChan = await rmqConn.openChannel();

await setupView();
await setupJoin();
await setupEdit();
await setupSave();

console.log(bold(`Starting`));

/*
rmqConn.closed()
  .then(() => {
    console.log("Closed peacefully");
  })
  .catch((error) => {
    console.error("Connection closed with error");
    console.error(error.message);
  });
  */
