import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),

  // Database
  pgHost: process.env.PGHOST || "localhost",
  pgPort: parseInt(process.env.PGPORT || "5432", 10),
  pgDatabase: process.env.PGDATABASE || "dictation",
  pgUser: process.env.PGUSER || "dictation",
  pgPassword: process.env.PGPASSWORD || "dictation",

  // Transcription
  mlBackendUrl: process.env.ML_BACKEND_URL || "",
  azureOpenaiApiKey: process.env.AZURE_OPENAI_API_KEY || "",
  azureOpenaiEndpoint: process.env.AZURE_OPENAI_ENDPOINT || "",
  azureOpenaiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT || "whisper",

  // Admin
  adminApiKey: process.env.ADMIN_API_KEY || "dev-admin-key",
};
