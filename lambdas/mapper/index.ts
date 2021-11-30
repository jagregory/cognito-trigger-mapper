import assert from "assert";
import {
  CreateAuthChallengeTriggerEvent,
  CustomEmailSenderTriggerEvent,
  CustomMessageTriggerEvent,
  DefineAuthChallengeTriggerEvent,
  PostAuthenticationTriggerEvent,
  PostConfirmationTriggerEvent,
  PreAuthenticationTriggerEvent,
  PreSignUpTriggerEvent,
  PreTokenGenerationTriggerEvent,
  UserMigrationTriggerEvent,
  VerifyAuthChallengeResponseTriggerEvent,
} from "aws-lambda";
import AWS from "aws-sdk";

const lambda = async (
  event:
    | CreateAuthChallengeTriggerEvent
    | CustomEmailSenderTriggerEvent
    | CustomMessageTriggerEvent
    | DefineAuthChallengeTriggerEvent
    | PostAuthenticationTriggerEvent
    | PostConfirmationTriggerEvent
    | PreAuthenticationTriggerEvent
    | PreSignUpTriggerEvent
    | PreTokenGenerationTriggerEvent
    | UserMigrationTriggerEvent
    | VerifyAuthChallengeResponseTriggerEvent
) => {
  const eventsTableName = process.env.EVENTS_TABLE_NAME;
  const stubsTableName = process.env.STUBS_TABLE_NAME;
  assert.ok(eventsTableName, "Missing EVENTS_TABLE_NAME environment variable");
  assert.ok(stubsTableName, "Missing STUBS_TABLE_NAME environment variable");

  const dynamodb = new AWS.DynamoDB.DocumentClient();

  await dynamodb
    .put({
      TableName: eventsTableName,
      Item: {
        UserPoolId: event.userPoolId,
        Timestamp: new Date().toISOString(),
        TriggerSource: event.triggerSource,
        Event: event,
      },
    })
    .promise();

  const stubResponse = await dynamodb
    .get({
      TableName: stubsTableName,
      Key: {
        TriggerSource: event.triggerSource,
      },
    })
    .promise();
  if (!stubResponse?.Item?.Response) {
    throw new Error(`Missing stub response for ${event.triggerSource}`);
  }

  return {
    ...event,
    response: stubResponse.Item?.Response,
  };
};

module.exports = { lambda };
