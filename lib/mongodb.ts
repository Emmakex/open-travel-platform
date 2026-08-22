import { MongoClient, type Db } from "mongodb";

const defaultDatabaseName = "kairoseth_travel";

type MongoGlobal = typeof globalThis & {
  __kairosethMongoClientPromise?: Promise<MongoClient>;
};

const mongoGlobal = globalThis as MongoGlobal;

function resolveMongoUri() {
  const candidates = [
    process.env.MONGODB_URI,
    process.env.MONGO_URL,
    process.env.DATABASE_URL
  ];

  return candidates
    .map((value) => value?.trim())
    .find((value) => value && /^mongodb(?:\+srv)?:\/\//i.test(value));
}

export function isMongoConfigured() {
  return Boolean(resolveMongoUri());
}

export function getMongoDatabaseName() {
  return process.env.MONGODB_DB_NAME?.trim() || defaultDatabaseName;
}

async function createMongoClient() {
  const uri = resolveMongoUri();

  if (!uri) {
    throw new Error(
      "MongoDB is not configured. Set the server-only MONGODB_URI environment variable."
    );
  }

  const client = new MongoClient(uri, {
    appName: "kairoseth-travel",
    serverSelectionTimeoutMS: 7000
  });

  return client.connect();
}

export function getMongoClient() {
  if (!mongoGlobal.__kairosethMongoClientPromise) {
    mongoGlobal.__kairosethMongoClientPromise = createMongoClient().catch((error) => {
      delete mongoGlobal.__kairosethMongoClientPromise;
      throw error;
    });
  }

  return mongoGlobal.__kairosethMongoClientPromise;
}

export async function getMongoDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(getMongoDatabaseName());
}
