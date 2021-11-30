import { UserPool } from "@aws-cdk/aws-cognito";
import { AttributeType, BillingMode, Table } from "@aws-cdk/aws-dynamodb";
import { Runtime } from "@aws-cdk/aws-lambda";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { CfnOutput, Construct, Stack, StackProps } from "@aws-cdk/core";

export class CognitoMapStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const events = new Table(this, "CognitoMapTriggerEvents", {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        type: AttributeType.STRING,
        name: "UserPoolId",
      },
      sortKey: {
        type: AttributeType.STRING,
        name: "Timestamp",
      },
    });

    const stubs = new Table(this, "CognitoMapStubResponses", {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        type: AttributeType.STRING,
        name: "TriggerSource",
      },
    });

    const fn = new NodejsFunction(this, "Mapper", {
      entry: "lambdas/mapper/index.ts",
      handler: "lambda",
      bundling: {
        target: "es2017",
      },
      environment: {
        EVENTS_TABLE_NAME: events.tableName,
        STUBS_TABLE_NAME: stubs.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    });
    events.grantReadWriteData(fn);
    stubs.grantReadData(fn);

    const userPool = new UserPool(this, "CognitoMapPool", {
      selfSignUpEnabled: true,
      lambdaTriggers: {
        createAuthChallenge: fn,
        customMessage: fn,
        defineAuthChallenge: fn,
        postAuthentication: fn,
        postConfirmation: fn,
        preAuthentication: fn,
        preSignUp: fn,
        preTokenGeneration: fn,
        userMigration: fn,
        verifyAuthChallengeResponse: fn,
      },
    });

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });

    new CfnOutput(this, "EventsTableName", {
      value: events.tableName,
    });

    new CfnOutput(this, "StubsTableName", {
      value: stubs.tableName,
    });
  }
}
