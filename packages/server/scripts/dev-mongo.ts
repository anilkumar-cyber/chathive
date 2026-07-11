import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27017, dbName: "nexuschat" },
  });
  const uri = mongod.getUri("nexuschat");
  // eslint-disable-next-line no-console
  console.log(`MONGO_READY ${uri}`);

  process.on("SIGINT", async () => {
    await mongod.stop();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await mongod.stop();
    process.exit(0);
  });
}

main();
