import { connect } from "amqp";
import { MongoClient } from "mongo";
import { setupJoin } from "./join/mod.ts";
import { setupEdit } from "./edit/mod.ts";
import { setupView } from "./view/mod.ts";

export const mongoClient = new MongoClient();
await mongoClient.connect(Deno.env.get("MONGO_URI")!);

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
