import assert from "assert";
import AWS from "aws-sdk";
import { createUserPoolClient, randomUsername } from "../utils";
import { Scenario } from "./scenario";

const cognito = new AWS.CognitoIdentityServiceProvider();

const scenario: Scenario = {
  name: "AdminRespondToAuthChallenge.Custom",
  stubs: {
    PreSignUp_AdminCreateUser: {
      autoConfirmUser: true,
    },
    CustomMessage_AdminCreateUser: {},
    CreateAuthChallenge_Authentication: {
      challengeMetadata: "MY_CHALLENGE",
      publicChallengeParameters: {
        public: "yes",
      },
      privateChallengeParameters: {
        private: "yes",
      },
    },
    DefineAuthChallenge_Authentication: {
      challengeName: "CUSTOM_CHALLENGE",
    },
    VerifyAuthChallengeResponse_Authentication: {
      answerCorrect: true
    }
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

    const resp = await cognito
      .adminInitiateAuth({
        AuthFlow: "CUSTOM_AUTH",
        ClientId: clientId,
        UserPoolId: userPoolId,
        AuthParameters: {
          USERNAME: username
        }
      })
      .promise();

    return { clientId, user: { username, password }, session: resp.Session };
  },
  async exec(args) {
    assert.ok(args.clientId);
    assert.ok(args.user);

    await cognito
      .adminRespondToAuthChallenge({
        UserPoolId: args.userPoolId,
        ChallengeName: "CUSTOM_CHALLENGE",
        ClientId: args.clientId,
        ChallengeResponses: {
          USERNAME: args.user.username,
          ANSWER: "something",
        },
        Session: args["session"] as string,
      })
      .promise();
  },
};

export default scenario;
