export interface Credentials {
  token: string;
  organization: string;
  userId: string;
  email: string;
}

export type AppScreen = "pairing" | "dictation" | "settings";
