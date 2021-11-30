import { cognitoAdminCreateUser, createUserPoolClient } from "../utils";
import { Scenario } from "./scenario";

const scenario: Scenario = {
  name: "AdminCreateUser",
  stubs: {
    PreSignUp_AdminCreateUser: {},
    CustomMessage_AdminCreateUser: {}
  },
  async setup(userPoolId) {
    const clientId = await createUserPoolClient(userPoolId);

    return { clientId };
  },
  async exec(args) {
    const [username, password] = await cognitoAdminCreateUser(
      args.userPoolId,
      "AdminCreateUser"
    );

    return { user: { username, password } };
  },
};

export default scenario;
