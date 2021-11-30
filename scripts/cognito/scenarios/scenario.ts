export interface Metadata {
  [key: string]: unknown;
  clientId?: string;
  userPoolId: string;
  user?: { username: string; password: string };
}

export interface Scenario {
  name: string;
  stubs: Record<string, object>;
  setup: (userPoolId: string) => Promise<Partial<Metadata>>;
  exec: (args: Metadata) => Promise<Partial<Metadata> | void>;
}
