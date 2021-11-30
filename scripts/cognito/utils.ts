import AWS from "aws-sdk";
import { Metadata, Scenario } from "./scenarios/scenario";

export async function clearEventsTable(eventsTableName: string) {
  const dynamodb = new AWS.DynamoDB.DocumentClient();

  const records = await dynamodb
    .scan({
      TableName: eventsTableName,
    })
    .promise();
  for (const item of records.Items ?? []) {
    await dynamodb
      .delete({
        TableName: eventsTableName,
        Key: {
          UserPoolId: item.UserPoolId,
          Timestamp: item.Timestamp,
        },
      })
      .promise();
  }
}

export async function clearStubsTable(stubsTableName: string) {
  const dynamodb = new AWS.DynamoDB.DocumentClient();

  const records = await dynamodb
    .scan({
      TableName: stubsTableName,
    })
    .promise();
  for (const item of records.Items ?? []) {
    await dynamodb
      .delete({
        TableName: stubsTableName,
        Key: {
          TriggerSource: item.TriggerSource,
        },
      })
      .promise();
  }
}

export async function setStubs(
  stubsTableName: string,
  stubs: Record<string, object>
) {
  const dynamodb = new AWS.DynamoDB.DocumentClient();

  await clearStubsTable(stubsTableName);

  await dynamodb
    .batchWrite({
      RequestItems: {
        [stubsTableName]: Object.entries(stubs).map(([k, v]) => ({
          PutRequest: {
            Item: {
              TriggerSource: k,
              Response: v,
            },
          },
        })),
      },
    })
    .promise();
}

export async function getLogEvents(eventsTableName: string) {
  const dynamodb = new AWS.DynamoDB.DocumentClient();

  const response = await dynamodb
    .scan({
      TableName: eventsTableName,
    })
    .promise();

  return (
    response.Items?.map((x) => ({
      TriggerSource: x.TriggerSource,
      Event: JSON.stringify(x.Event),
    })) ?? []
  );
}

export async function logEvents(eventsTableName: string) {
  const records = await getLogEvents(eventsTableName);

  console.table(records);
}

export async function createUserPoolClient(userPoolId: string) {
  const cognito = new AWS.CognitoIdentityServiceProvider();

  const client = await cognito
    .createUserPoolClient({
      ExplicitAuthFlows: [
        "ALLOW_ADMIN_USER_PASSWORD_AUTH",
        "ALLOW_CUSTOM_AUTH",
        "ALLOW_REFRESH_TOKEN_AUTH",
        "ALLOW_USER_PASSWORD_AUTH",
      ],
      UserPoolId: userPoolId,
      ClientName: "SignUpMap",
    })
    .promise();

  if (!client.UserPoolClient?.ClientId) {
    throw new Error("User Pool creation Error");
  }

  return client.UserPoolClient.ClientId;
}

export async function cognitoSignUp(
  clientId: string,
  usernamePrefix: string,
  password = "signUpTest1234!"
) {
  const cognito = new AWS.CognitoIdentityServiceProvider();

  const username = `${usernamePrefix}${new Date().getTime()}`;
  await cognito
    .signUp({
      ClientId: clientId,
      Username: username,
      Password: password,
    })
    .promise();

  return [username, password] as const;
}

export async function cognitoAdminCreateUser(
  userPoolId: string,
  usernamePrefix: string,
  password = "signUpTest1234!"
) {
  const cognito = new AWS.CognitoIdentityServiceProvider();

  const username = `${usernamePrefix}${new Date().getTime()}`;
  await cognito
    .adminCreateUser({
      UserPoolId: userPoolId,
      Username: username,
      TemporaryPassword: password,
    })
    .promise();

  return [username, password] as const;
}

export async function cognitoAdminConfirmSignUp(
  userPoolId: string,
  username: string
) {
  const cognito = new AWS.CognitoIdentityServiceProvider();

  await cognito
    .adminConfirmSignUp({
      UserPoolId: userPoolId,
      Username: username,
    })
    .promise();

  return username;
}

export async function cognitoInitiateAuth(
  clientId: string,
  username: string,
  password: string
) {
  const cognito = new AWS.CognitoIdentityServiceProvider();

  await cognito
    .initiateAuth({
      ClientId: clientId,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    })
    .promise();

  return username;
}

export async function cognitoAdminInitiateAuth(
  userPoolId: string,
  clientId: string,
  username: string,
  password: string
) {
  const cognito = new AWS.CognitoIdentityServiceProvider();

  await cognito
    .adminInitiateAuth({
      UserPoolId: userPoolId,
      AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
      ClientId: clientId,
    })
    .promise();

  return username;
}

export function printMermaidDiagram(
  trigger: string,
  events: readonly { TriggerSource: string; Event: string }[]
) {
  let diagram = `graph TD\nA([${trigger}])`;

  let i = 0;
  for (const event of events) {
    diagram += ` --> N${i}[[${event.TriggerSource}]]`;
    i++;
  }

  console.log(diagram);
}

export async function cleanUp(metadata: Metadata | undefined) {
  const cognito = new AWS.CognitoIdentityServiceProvider();

  if (metadata?.clientId) {
    await cognito
      .deleteUserPoolClient({
        ClientId: metadata.clientId,
        UserPoolId: metadata.userPoolId,
      })
      .promise();
  }

  if (metadata?.user) {
    await cognito
      .adminDeleteUser({
        UserPoolId: metadata.userPoolId,
        Username: metadata.user.username,
      })
      .promise();
  }
}

export async function runScenario(
  scenario: Scenario,
  eventsTableName: string,
  stubsTableName: string,
  userPoolId: string
) {
  console.log(scenario.name);
  console.log();

  if (Object.keys(scenario.stubs).length) {
    await setStubs(stubsTableName, scenario.stubs);
  }

  let metadata: Metadata = {
    userPoolId,
  };
  try {
    const setupMetadata = await scenario.setup(userPoolId);
    metadata = {
      ...metadata,
      ...setupMetadata,
    };
    await clearEventsTable(eventsTableName);

    const execMetadata = await scenario.exec(metadata);
    metadata = {
      ...metadata,
      ...execMetadata,
    };
  } finally {
    await cleanUp(metadata);
  }

  const events = await getLogEvents(eventsTableName);

  console.log("Events:");

  let i = 1;
  for (const event of events) {
    console.log(`  ${i}. ${event.TriggerSource}`);
    i++;
  }

  console.log();
  console.log("Mermaid:");
  console.log();

  printMermaidDiagram(scenario.name, events);

  console.log();
  console.log("---");
  console.log();
}

export const randomUsername = () => `User${new Date().getTime()}`;
