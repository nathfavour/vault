import type { Models } from "appwrite";
import type {
  Credentials,
  TotpSecrets,
  Folders,
  SecurityLogs,
  User,
  Keychain,
} from "@/types/appwrite";

export type {
  Credentials,
  TotpSecrets,
  Folders,
  SecurityLogs,
  User,
  Keychain,
};

type CreateInput<T extends Models.Row> = Partial<Omit<T, keyof Models.Row>>;

export type CredentialsCreate = CreateInput<Credentials>;
export type TotpSecretsCreate = CreateInput<TotpSecrets>;
export type FoldersCreate = CreateInput<Folders>;
export type SecurityLogsCreate = CreateInput<SecurityLogs>;
export type KeychainCreate = CreateInput<Keychain>;
