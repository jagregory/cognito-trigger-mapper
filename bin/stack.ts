#!/usr/bin/env -S node -r ts-node/register

import * as cdk from "@aws-cdk/core";

import { CognitoMapStack } from "../infra/cognitoMapStack";

const app = new cdk.App();

new CognitoMapStack(app, "CognitoMap", {
  tags: {
    App: "CognitoMap",
  },
});
