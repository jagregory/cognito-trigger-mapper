import assert from "assert";
import AWS from "aws-sdk";
import { Scenario } from "./scenario";
import { cognitoSignUp, createUserPoolClient } from "../utils";

const cognito = new AWS.CognitoIdentityServiceProvider();

const scenario: Scenario = {
  name: "InitiateAuth.Custom",
  stubs: {
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
    PreSignUp_SignUp: {
      autoConfirmUser: true,
    },
    PostConfirmation_ConfirmSignUp: {},
    PostAuthentication_Authentication: {},
    TokenGeneration_Authentication: {},
  },
  async setup(userPoolId) {
    const clientId = await createUserPoolClient(userPoolId);
    const [username, password] = await cognitoSignUp(
      clientId,
      "InitAuthCustom"
    );

    return { clientId, user: { username, password } };
  },
  async exec({ clientId, user }) {
    assert.ok(clientId);
    assert.ok(user);

    await cognito
      .initiateAuth({
        ClientId: clientId,
        AuthFlow: "CUSTOM_AUTH",
        AuthParameters: {
          USERNAME: user.username,
          PASSWORD: user.password,
        },
      })
      .promise();
  },
};

export default scenario;
