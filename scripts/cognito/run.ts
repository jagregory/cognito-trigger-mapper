#!/usr/bin/env -S node -r ts-node/register

import scenarios from "./scenarios";
import { Scenario } from "./scenarios/scenario";
import { runScenario } from "./utils";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const {
  eventsTableName,
  stubsTableName,
  userPoolId,
  scenario: scenarioName,
} = yargs(hideBin(process.argv))
  .strict()
  .string(["eventsTableName", "stubsTableName", "userPoolId"])
  .option("scenario", {
    choices: ["all", ...Object.keys(scenarios).sort()],
    required: true,
    description: "Scenario to run against Cognito",
  })
  .demandOption(["eventsTableName", "stubsTableName", "userPoolId"])
  .parseSync();

const main = async () => {
  const scenariosToRun: Scenario[] = [];

  if (scenarioName === "all") {
    scenariosToRun.push(...Object.values(scenarios));
  } else {
    const scenario = scenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Invalid scenario: ${scenarioName}`);
    }
    scenariosToRun.push(scenario);
  }

  for (const scenario of scenariosToRun) {
    await runScenario(scenario, eventsTableName, stubsTableName, userPoolId);
  }
};

main().then(
  () => {
    process.exit(0);
  },
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
