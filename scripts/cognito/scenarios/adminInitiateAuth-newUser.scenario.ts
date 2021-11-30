import assert from "assert";
import { Scenario } from "./scenario";
import { cognitoAdminInitiateAuth, createUserPoolClient } from "../utils";

const scenario: Scenario = {
  name: "AdminInitiateAuth.NewUser",
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

    return { clientId };
  },
  async exec({ userPoolId, clientId }) {
    assert.ok(clientId);

    const username = `doesNotExist${new Date().getTime()}`;
    const password = "signUpTest1234!";

    await cognitoAdminInitiateAuth(userPoolId, clientId, username, password);

    return { user: { username, password } };
  },
};

export default scenario;
