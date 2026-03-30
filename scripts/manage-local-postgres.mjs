import process from "node:process";

import {
  formatContainerStatus,
  getLocalPostgresConfig,
  runCommand,
} from "./local-postgres-shared.mjs";

const action = process.argv[2];

const usage = `Usage: node ./scripts/manage-local-postgres.mjs <start|stop|status|logs|remove>`;

if (!action) {
  console.error(usage);
  process.exit(1);
}

const supportedActions = new Set(["start", "stop", "status", "logs", "remove"]);
if (!supportedActions.has(action)) {
  console.error(usage);
  process.exit(1);
}

try {
  const { runtime, containerName } = getLocalPostgresConfig();

  if (action === "status") {
    const status = formatContainerStatus(runtime, containerName);
    if (!status) {
      console.log(`Container ${containerName} does not exist.`);
      process.exit(0);
    }

    console.log(status);
    process.exit(0);
  }

  const argsByAction = {
    logs: ["logs", containerName],
    remove: ["rm", "-f", containerName],
    start: ["start", containerName],
    stop: ["stop", containerName],
  };

  const result = runCommand(runtime, argsByAction[action]);
  process.exit(result.status ?? 0);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
  process.exit(1);
}
