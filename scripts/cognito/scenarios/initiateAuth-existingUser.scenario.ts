import assert from "assert";
import { Scenario } from "./scenario";
import {
  cognitoInitiateAuth,
  cognitoSignUp,
  createUserPoolClient,
} from "../utils";

const scenario: Scenario = {
  name: "InitiateAuth.ExistingUser",
  stubs: {
    PreSignUp_SignUp: {
      autoConfirmUser: true,
    },
    PostConfirmation_ConfirmSignUp: {},
    PreAuthentication_Authentication: {},
    PostAuthentication_Authentication: {},
    TokenGeneration_Authentication: {},
  },
  async setup(userPoolId) {
    const clientId = await createUserPoolClient(userPoolId);
    const [username, password] = await cognitoSignUp(
      clientId,
      "InitAuthExistingUser"
    );

    return { clientId, user: { username, password } };
  },
  async exec({ clientId, user }) {
    assert.ok(clientId);
    assert.ok(user);

    await cognitoInitiateAuth(clientId, user.username, user.password);
  },
};

export default scenario;
