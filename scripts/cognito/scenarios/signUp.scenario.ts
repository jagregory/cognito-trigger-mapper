import assert from "assert";
import { cognitoSignUp, createUserPoolClient } from "../utils";
import { Scenario } from "./scenario";

const scenario: Scenario = {
  name: "SignUp",
  stubs: {
    PreSignUp_SignUp: {
      autoConfirmUser: true,
    },
    PostConfirmation_ConfirmSignUp: {},
  },
  async setup(userPoolId) {
    const clientId = await createUserPoolClient(userPoolId);

    return { clientId };
  },
  async exec(args) {
    assert.ok(args.clientId);

    const [username, password] = await cognitoSignUp(args.clientId, "SignUp");

    return { user: { username, password } };
  },
};

export default scenario;
