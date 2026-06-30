export interface Credentials {
  token: string;
  organization: string;
  userId: string;
  email: string;
}

export interface Recording {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export type AppScreen =
  | "pairing"
  | "dictation"
  | "settings"
  | "recordings"
  | "recording-detail";
