import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPO_ROOT = path.resolve(__dirname, "..");
export const ENV_LOCAL_PATH = path.join(REPO_ROOT, ".env.local");
export const DEFAULT_POSTGRES_IMAGE = "postgres:17-alpine";
export const DEFAULT_POSTGRES_USER = "postgres";
export const DEFAULT_POSTGRES_SCHEMA = "public";
export const DEFAULT_POSTGRES_PORT = "5432";

export const isCommandAvailable = (command) => {
  const result = spawnSync(command, ["--version"], {
    stdio: "ignore",
  });

  return result.status === 0;
};

export const getAvailableRuntimes = () =>
  ["docker", "podman"].filter(isCommandAvailable);

export const sanitizeContainerName = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getDefaultContainerName = () =>
  `${sanitizeContainerName(path.basename(REPO_ROOT))}-postgres-local`;

export const quoteEnvValue = (value) => {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
};

export const buildDatabaseUrl = ({
  dbName,
  password,
  port,
  schema,
  user = DEFAULT_POSTGRES_USER,
}) => {
  const base = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@localhost:${port}/${encodeURIComponent(dbName)}`;
  const params = new URLSearchParams({ schema });
  return `${base}?${params.toString()}`;
};

export const runCommand = (command, args, options = {}) =>
  spawnSync(command, args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: options.stdio ?? "inherit",
  });

export const loadEnvLocal = () => {
  if (!existsSync(ENV_LOCAL_PATH)) {
    return null;
  }

  const raw = readFileSync(ENV_LOCAL_PATH, "utf8");
  const parsed = {};

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
};

export const getLocalPostgresConfig = () => {
  const env = loadEnvLocal();

  if (!env) {
    throw new Error(
      "Missing .env.local. Run `pnpm local:postgres:setup` first.",
    );
  }

  const runtime = env.LOCAL_POSTGRES_RUNTIME;
  const containerName = env.LOCAL_POSTGRES_CONTAINER_NAME;

  if (!runtime || !containerName) {
    throw new Error(
      "Missing LOCAL_POSTGRES_RUNTIME or LOCAL_POSTGRES_CONTAINER_NAME in .env.local.",
    );
  }

  return { env, runtime, containerName };
};

export const formatContainerStatus = (runtime, containerName) => {
  const result = runCommand(
    runtime,
    [
      "ps",
      "-a",
      "--filter",
      `name=^/${containerName}$`,
      "--format",
      "{{.Names}}\t{{.Status}}\t{{.Ports}}",
    ],
    { stdio: "pipe" },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || `Unable to inspect container ${containerName}.`);
  }

  return result.stdout.trim();
};
