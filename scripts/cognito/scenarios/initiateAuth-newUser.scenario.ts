import assert from "assert";
import { Scenario } from "./scenario";
import { cognitoInitiateAuth, createUserPoolClient } from "../utils";

const scenario: Scenario = {
  name: "InitiateAuth.NewUser",
  stubs: {
    CustomMessage_AdminCreateUser: {},
    PreAuthentication_Authentication: {},
    PostAuthentication_Authentication: {},
    PreSignUp_AdminCreateUser: {},
    TokenGeneration_Authentication: {},
    UserMigration_Authentication: {
      userAttributes: {},
      finalUserStatus: "CONFIRMED",
    },
  },
  async setup(userPoolId: string) {
    const clientId = await createUserPoolClient(userPoolId);

    const username = `doesNotExist${new Date().getTime()}`;
    const password = "signUpTest1234!";

    return { clientId, user: { username, password } };
  },
  async exec({ clientId, user }) {
    assert.ok(clientId);
    assert.ok(user);

    await cognitoInitiateAuth(clientId, user.username, user.password);
  },
};

export default scenario;
