import * as fs from "fs";
import { Scenario } from "./scenario";

const scenarios = fs
  .readdirSync(__dirname, {
    withFileTypes: true,
  })
  .filter((x) => x.isFile() && x.name.match(/\.scenario\.ts$/))
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  .map((x) => require(`./${x.name}`).default as Scenario)
  .reduce((acc, scenario) => {
    acc[scenario.name] = scenario;
    return acc;
  }, {} as Record<string, Scenario>);

export default scenarios;
