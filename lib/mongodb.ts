import { MongoClient, type Db } from "mongodb";

const defaultDatabaseName = "ktravel";

type MongoGlobal = typeof globalThis & {
  __kairosethMongoClientPromise?: Promise<MongoClient>;
};

export type MongoConnectionDiagnostic = {
  code:
    | "authentication"
    | "authorization"
    | "network"
    | "dns"
    | "tls"
    | "connection-string"
    | "unknown";
  title: string;
  detail: string;
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

export function diagnoseMongoConnectionError(error: unknown): MongoConnectionDiagnostic {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error ?? "");
  const signal = `${name} ${message}`;

  if (/AuthenticationFailed|authentication failed|bad auth|code\s*18/i.test(signal)) {
    return {
      code: "authentication",
      title: "MongoDB authentication failed.",
      detail:
        "The cluster is reachable, but Atlas rejected the database username/password. Verify the Database Access user and regenerate the connection string if needed."
    };
  }

  if (/not authorized|unauthorized|code\s*13/i.test(signal)) {
    return {
      code: "authorization",
      title: "MongoDB user lacks permission for this database.",
      detail:
        "The credentials were accepted, but the Atlas database user does not have enough access to ktravel. Grant the application user readWrite access to the ktravel database."
    };
  }

  if (/querySrv|queryTxt|ENOTFOUND|EAI_AGAIN|DNS/i.test(signal)) {
    return {
      code: "dns",
      title: "MongoDB SRV/DNS lookup failed.",
      detail:
        "The mongodb+srv hostname could not be resolved from the application runtime. Re-copy the Atlas Drivers connection string and verify that the cluster hostname is complete."
    };
  }

  if (/certificate|TLS|SSL|tlsv1|handshake/i.test(signal)) {
    return {
      code: "tls",
      title: "MongoDB TLS connection failed.",
      detail:
        "The encrypted connection to Atlas could not be established. Use the current Atlas Drivers connection string and do not disable TLS verification."
    };
  }

  if (/MongoParseError|Invalid scheme|URI malformed|connection string/i.test(signal)) {
    return {
      code: "connection-string",
      title: "MongoDB connection string is invalid.",
      detail:
        "Re-copy the Node.js Drivers URI from Atlas. If the password contains reserved characters such as @, :, /, ? or #, URL-encode the password before saving MONGODB_URI."
    };
  }

  if (
    /MongoServerSelectionError|server selection|timed out|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|no primary/i.test(
      signal
    )
  ) {
    return {
      code: "network",
      title: "MongoDB cluster is not reachable from Hostinger.",
      detail:
        "The most common cause is the Atlas Network Access IP allowlist. Allow the Hostinger application's outbound IP, or temporarily allow 0.0.0.0/0 only to confirm connectivity, then restrict it again."
    };
  }

  return {
    code: "unknown",
    title: "MongoDB connection failed.",
    detail:
      "The application detected MONGODB_URI but could not complete the Atlas request. Check Hostinger runtime logs together with Atlas Network Access and Database Access settings."
  };
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
