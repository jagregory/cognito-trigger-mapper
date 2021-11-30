import assert from "assert";
import AWS from "aws-sdk";
import {
  createUserPoolClient,
  randomUsername,
} from "../utils";
import { Scenario } from "./scenario";

const cognito = new AWS.CognitoIdentityServiceProvider();

const scenario: Scenario = {
  name: "AdminResetUserPassword",
  stubs: {
    CustomMessage_ForgotPassword: {},
    CustomMessage_AdminCreateUser: {},
    PreSignUp_AdminCreateUser: {}
  },
  async setup(userPoolId) {
    const clientId = await createUserPoolClient(userPoolId);

    const username = randomUsername();
    const password = "Password1234!";
    await cognito
      .adminCreateUser({
        UserPoolId: userPoolId,
        Username: username,
        TemporaryPassword: password,
        UserAttributes: [
          { Name: "email", Value: "example@example.com" },
          { Name: "email_verified", Value: "true" },
        ],
      })
      .promise();

    await cognito
      .adminSetUserPassword({
        UserPoolId: userPoolId,
        Username: username,
        Password: password,
        Permanent: true,
      })
      .promise();

    return { clientId, user: { username, password } };
  },
  async exec(args) {
    assert.ok(args.user);

    await cognito
      .adminResetUserPassword({
        UserPoolId: args.userPoolId,
        Username: args.user.username,
      })
      .promise();
  },
};

export default scenario;
