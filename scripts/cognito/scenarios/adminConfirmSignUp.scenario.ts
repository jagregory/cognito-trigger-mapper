import assert from "assert";
import {
  cognitoAdminConfirmSignUp,
  cognitoSignUp,
  createUserPoolClient,
} from "../utils";
import { Scenario } from "./scenario";

const scenario: Scenario = {
  name: "AdminConfirmSignUp",
  stubs: {
    PreSignUp_SignUp: {},
    PostConfirmation_ConfirmSignUp: {},
  },
  async setup(userPoolId) {
    const clientId = await createUserPoolClient(userPoolId);
    const [username, password] = await cognitoSignUp(
      clientId,
      "AdminConfirmSignUp"
    );

    return { clientId, user: { username, password } };
  },
  async exec({ userPoolId, user }) {
    assert.ok(user);

    await cognitoAdminConfirmSignUp(userPoolId, user.username);
  },
};

export default scenario;