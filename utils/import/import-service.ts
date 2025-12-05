import { createCredential, createFolder, createTotpSecret } from "@/lib/appwrite";
import type { Credentials, TotpSecrets, Folders } from "@/types/appwrite.d";
import type { BitwardenExport } from "./bitwarden-types";
import {
  analyzeBitwardenExport,
  validateBitwardenExport,
  type MappedImportData,
} from "./bitwarden-mapper";
import { extractTotpFromBitwardenLogin } from "./totp-parser";
import { processCustomFields } from "./custom-fields";

export interface ImportProgress {
  stage: "parsing" | "folders" | "credentials" | "totp" | "completed" | "error";
  currentStep: number;
  totalSteps: number;
  message: string;
  itemsProcessed: number;
  itemsTotal: number;
  errors: string[];
}

export interface ImportResult {
  success: boolean;
  summary: {
    foldersCreated: number;
    credentialsCreated: number;
    totpSecretsCreated: number;
    errors: number;
    skipped: number;
  };
  errors: string[];
  folderMapping: Map<string, string>;
}

export class ImportService {
  private progressCallback?: (progress: ImportProgress) => void;

  constructor(progressCallback?: (progress: ImportProgress) => void) {
    this.progressCallback = progressCallback;
  }

  async importBitwardenData(
    jsonData: string,
    userId: string,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      summary: {
        foldersCreated: 0,
        credentialsCreated: 0,
        totpSecretsCreated: 0,
        errors: 0,
        skipped: 0,
      },
      errors: [],
      folderMapping: new Map(),
    };

    try {
      // Stage 1: Parse and validate JSON
      this.updateProgress({
        stage: "parsing",
        currentStep: 1,
        totalSteps: 4,
        message: "Parsing JSON data...",
        itemsProcessed: 0,
        itemsTotal: 0,
        errors: [],
      });

      const parsedData = JSON.parse(jsonData);

      if (!validateBitwardenExport(parsedData)) {
        throw new Error("Invalid Bitwarden export format");
      }

      const bitwardenData: BitwardenExport = parsedData;
      const mappedData = analyzeBitwardenExport(bitwardenData, userId);

      // Enhanced error handling for empty or skipped credentials
      if (mappedData.credentials.length === 0) {
        let errorMsg =
          "No login credentials found in file. Make sure you exported your vault as JSON and that it contains login items.";
        if (mappedData.mapping.statistics.skippedItems > 0) {
          errorMsg += ` ${mappedData.mapping.statistics.skippedItems} item(s) were skipped. Only items of type 'login' with valid login data are imported.`;
        }
        throw new Error(errorMsg);
      }

      const totalItems =
        mappedData.folders.length +
        mappedData.credentials.length +
        mappedData.totpSecrets.length;

      // Stage 2: Import folders
      this.updateProgress({
        stage: "folders",
        currentStep: 2,
        totalSteps: 4,
        message: "Creating folders...",
        itemsProcessed: 0,
        itemsTotal: totalItems,
        errors: [],
      });

      const folderIdMapping = await this.importFolders(
        mappedData.folders,
        mappedData,
      );
      result.folderMapping = folderIdMapping;
      result.summary.foldersCreated = folderIdMapping.size;

      // Stage 3: Import credentials
      this.updateProgress({
        stage: "credentials",
        currentStep: 3,
        totalSteps: 4,
        message: "Importing credentials...",
        itemsProcessed: result.summary.foldersCreated,
        itemsTotal: totalItems,
        errors: result.errors,
      });

      const credentialsResult = await this.importCredentials(
        mappedData.credentials,
        folderIdMapping,
      );
      result.summary.credentialsCreated = credentialsResult.created;
      result.summary.errors += credentialsResult.errors;
      result.errors.push(...credentialsResult.errorMessages);

      // Stage 4: Import TOTP secrets
      this.updateProgress({
        stage: "totp",
        currentStep: 4,
        totalSteps: 4,
        message: "Importing TOTP secrets...",
        itemsProcessed:
          result.summary.foldersCreated + result.summary.credentialsCreated,
        itemsTotal: totalItems,
        errors: result.errors,
      });

      const totpResult = await this.importTotpSecrets(
        mappedData.totpSecrets,
        folderIdMapping,
      );
      result.summary.totpSecretsCreated = totpResult.created;
      result.summary.errors += totpResult.errors;
      result.errors.push(...totpResult.errorMessages);

      // Completed
      result.success =
        result.summary.errors === 0 ||
        result.summary.credentialsCreated + result.summary.totpSecretsCreated >
          0;
      result.summary.skipped = mappedData.mapping.statistics.skippedItems;

      this.updateProgress({
        stage: "completed",
        currentStep: 4,
        totalSteps: 4,
        message: `Import completed: ${result.summary.credentialsCreated} credentials, ${result.summary.totpSecretsCreated} TOTP secrets`,
        itemsProcessed: totalItems,
        itemsTotal: totalItems,
        errors: result.errors,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      result.errors.push(errorMessage);

      this.updateProgress({
        stage: "error",
        currentStep: 0,
        totalSteps: 4,
        message: `Import failed: ${errorMessage}`,
        itemsProcessed: 0,
        itemsTotal: 0,
        errors: result.errors,
      });

      return result;
    }
  }

  async importWhisperrKeepData(
    jsonData: string,
    userId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      summary: {
        foldersCreated: 0,
        credentialsCreated: 0,
        totpSecretsCreated: 0,
        errors: 0,
        skipped: 0,
      },
      errors: [],
      folderMapping: new Map(),
    };

    try {
      // Stage 1: Parse
      this.updateProgress({
        stage: "parsing",
        currentStep: 1,
        totalSteps: 4,
        message: "Parsing WhisperrKeep data...",
        itemsProcessed: 0,
        itemsTotal: 0,
        errors: [],
      });

      const parsedData = JSON.parse(jsonData);
      
      // Basic validation
      if (!parsedData.version && (!parsedData.credentials && !parsedData.folders && !parsedData.totpSecrets)) {
         throw new Error("Invalid WhisperrKeep export format");
      }

      const folders = parsedData.folders || [];
      const credentials = parsedData.credentials || [];
      const totpSecrets = parsedData.totpSecrets || [];

      console.log("[ImportService] Parsed WhisperrKeep data:", {
          foldersCount: folders.length,
          credentialsCount: credentials.length,
          totpSecretsCount: totpSecrets.length,
          firstCredential: credentials[0] ? JSON.stringify(credentials[0]).substring(0, 200) : "NONE"
      });

      const totalItems = folders.length + credentials.length + totpSecrets.length;

      // Stage 2: Import folders
      this.updateProgress({
        stage: "folders",
        currentStep: 2,
        totalSteps: 4,
        message: "Restoring folders...",
        itemsProcessed: 0,
        itemsTotal: totalItems,
        errors: [],
      });

      const folderIdMapping = new Map<string, string>();
      
      for (const folder of folders) {
        await this.throttle();
        try {
            // Clean folder object for creation
            const cleanFolder = {
                name: folder.name,
                // userId is handled by createFolder using current user
            };
            const created = await createFolder({
                ...cleanFolder,
                userId
            } as any);
            
            // Map old ID to new ID
            if (folder.$id) {
                folderIdMapping.set(folder.$id, created.$id);
            }
            result.summary.foldersCreated++;
        } catch (e) {
            console.error("Failed to restore folder", e);
        }
      }
      result.folderMapping = folderIdMapping;

      // Stage 3: Import credentials
      this.updateProgress({
        stage: "credentials",
        currentStep: 3,
        totalSteps: 4,
        message: "Restoring credentials...",
        itemsProcessed: result.summary.foldersCreated,
        itemsTotal: totalItems,
        errors: result.errors,
      });

      for (const cred of credentials) {
        await this.throttle();
        try {
            console.log("[ImportService] Processing credential:", cred.name);
            
            // Map folder ID
            let folderId = cred.folderId;
            if (folderId && folderIdMapping.has(folderId)) {
                folderId = folderIdMapping.get(folderId);
            } else {
                folderId = null; // Reset if folder not found/imported
            }

            // STRICT VALIDATION: Ensure required fields are present
            if (!cred.name) {
                throw new Error("Credential name is missing");
            }
            if (!cred.username) {
                throw new Error("Credential username is missing");
            }

            const cleanCred = {
                name: cred.name,
                url: cred.url || null,
                username: cred.username,
                password: (cred.password || "").trim(),
                // Ensure itemType is present, default to 'login' for backward compatibility
                itemType: cred.itemType || "login", 
                notes: cred.notes || null,
                totpId: null, // Clear TOTP link initially
                cardNumber: cred.cardNumber || null,
                cardholderName: cred.cardholderName || null,
                cardExpiry: cred.cardExpiry || null,
                cardCVV: cred.cardCVV || null,
                cardPIN: cred.cardPIN || null,
                cardType: cred.cardType || null,
                folderId: folderId,
                tags: cred.tags || null,
                customFields: typeof cred.customFields === 'object' ? JSON.stringify(cred.customFields) : (cred.customFields || null),
                faviconUrl: cred.faviconUrl || null,
                isFavorite: cred.isFavorite || false,
                isDeleted: cred.isDeleted || false,
                userId, // Force current user ID
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (!cleanCred.password) {
                 throw new Error("Password is empty");
            }

            console.log("[ImportService] cleanCred prepared:", { 
                name: cleanCred.name, 
                username: cleanCred.username, 
                hasPassword: !!cleanCred.password,
                userId: cleanCred.userId 
            });

            await createCredential(cleanCred as any);
            result.summary.credentialsCreated++;
            console.log("[ImportService] Credential created successfully! Total:", result.summary.credentialsCreated);
            
            this.updateProgress({
                stage: "credentials",
                currentStep: 3,
                totalSteps: 4,
                message: `Restoring credentials... (${result.summary.credentialsCreated}/${credentials.length})`,
                itemsProcessed: result.summary.foldersCreated + result.summary.credentialsCreated,
                itemsTotal: totalItems,
                errors: result.errors,
            });
        } catch (e) {
             const error = e as Error;
             result.summary.errors++;
             const errorMsg = `Failed to restore credential ${cred.name || 'Unknown'}: ${error.message}`;
             result.errors.push(errorMsg);
             console.error(`Import Error [Credential]: ${errorMsg}`, e);
        }
      }

      // Stage 4: TOTP Secrets
      this.updateProgress({
        stage: "totp",
        currentStep: 4,
        totalSteps: 4,
        message: "Restoring TOTP secrets...",
        itemsProcessed: result.summary.foldersCreated + result.summary.credentialsCreated,
        itemsTotal: totalItems,
        errors: result.errors,
      });

      for (const totp of totpSecrets) {
         await this.throttle();
         try {
             // Map folder ID
            let folderId = totp.folderId;
            if (folderId && folderIdMapping.has(folderId)) {
                folderId = folderIdMapping.get(folderId);
            } else {
                folderId = null;
            }

            const cleanTotp = {
                issuer: totp.issuer,
                accountName: totp.accountName,
                secretKey: totp.secretKey,
                algorithm: totp.algorithm,
                digits: totp.digits,
                period: totp.period,
                url: totp.url,
                folderId: folderId,
                tags: totp.tags,
                isFavorite: totp.isFavorite || false,
                isDeleted: totp.isDeleted || false,
                userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await createTotpSecret(cleanTotp as any);
            result.summary.totpSecretsCreated++;
         } catch (e) {
             result.summary.errors++;
             result.errors.push(`Failed to restore TOTP ${totp.issuer}`);
         }
      }

      result.success = true;
      
      this.updateProgress({
        stage: "completed",
        currentStep: 4,
        totalSteps: 4,
        message: "Import completed successfully",
        itemsProcessed: totalItems,
        itemsTotal: totalItems,
        errors: result.errors,
      });

      return result;

    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      result.errors.push(errorMessage);

      this.updateProgress({
        stage: "error",
        currentStep: 0,
        totalSteps: 4,
        message: `Import failed: ${errorMessage}`,
        itemsProcessed: 0,
        itemsTotal: 0,
        errors: result.errors,
      });

      return result;
    }
  }

  private async throttle() {
    // Basic throttling: 50ms delay between operations
    // This prevents flooding Appwrite with requests in a tight loop
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async importFolders(
    folders: Omit<Folders, "$id" | "$createdAt" | "$updatedAt">[],
    mappedData: MappedImportData,
  ): Promise<Map<string, string>> {
    const folderIdMapping = new Map<string, string>();

    for (let i = 0; i < folders.length; i++) {
      await this.throttle(); // Throttle
      try {
        const folder = folders[i];
        const createdFolder = await createFolder(folder);

        // Map the original placeholder ID to the real ID
        const placeholderId = `folder_${i}`;
        folderIdMapping.set(placeholderId, createdFolder.$id);

        // Also map by name for convenience
        folderIdMapping.set(folder.name, createdFolder.$id);
      } catch (error) {
        console.error("Failed to create folder:", folders[i].name, error);
        // Continue with other folders
      }
    }

    return folderIdMapping;
  }

  private async importCredentials(
    credentials: Omit<Credentials, "$id" | "$createdAt" | "$updatedAt">[],
    folderIdMapping: Map<string, string>,
  ): Promise<{ created: number; errors: number; errorMessages: string[] }> {
    let created = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (let i = 0; i < credentials.length; i++) {
      await this.throttle(); // Throttle
      try {
        const credential = { ...credentials[i] };

        // Map folder ID if present
        if (credential.folderId && folderIdMapping.has(credential.folderId)) {
          credential.folderId = folderIdMapping.get(credential.folderId)!;
        } else {
          credential.folderId = null;
        }

        await createCredential(credential);
        created++;

        // Update progress for each credential
        this.updateProgress({
          stage: "credentials",
          currentStep: 3,
          totalSteps: 4,
          message: `Importing credentials... (${created}/${credentials.length})`,
          itemsProcessed: folderIdMapping.size + created,
          itemsTotal: folderIdMapping.size + credentials.length,
          errors: errorMessages,
        });
      } catch (error) {
        errors++;
        const errorMsg = `Failed to import credential "${credentials[i].name}": ${error instanceof Error ? error.message : "Unknown error"}`;
        errorMessages.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return { created, errors, errorMessages };
  }

  private async importTotpSecrets(
    totpSecrets: Omit<TotpSecrets, "$id" | "$createdAt" | "$updatedAt">[],
    folderIdMapping: Map<string, string>,
  ): Promise<{ created: number; errors: number; errorMessages: string[] }> {
    let created = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (let i = 0; i < totpSecrets.length; i++) {
      await this.throttle(); // Throttle
      try {
        const totpSecret = { ...totpSecrets[i] };

        // Map folder ID if present
        if (totpSecret.folderId && folderIdMapping.has(totpSecret.folderId)) {
          totpSecret.folderId = folderIdMapping.get(totpSecret.folderId)!;
        } else {
          totpSecret.folderId = null;
        }

        await createTotpSecret(totpSecret);
        created++;

        // Update progress for each TOTP secret
        this.updateProgress({
          stage: "totp",
          currentStep: 4,
          totalSteps: 4,
          message: `Importing TOTP secrets... (${created}/${totpSecrets.length})`,
          itemsProcessed: folderIdMapping.size + created,
          itemsTotal: folderIdMapping.size + totpSecrets.length,
          errors: errorMessages,
        });
      } catch (error) {
        errors++;
        const errorMsg = `Failed to import TOTP secret "${totpSecrets[i].issuer}": ${error instanceof Error ? error.message : "Unknown error"}`;
        errorMessages.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return { created, errors, errorMessages };
  }

  private updateProgress(progress: ImportProgress) {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}

// Security logging for imports
export async function logImportEvent(
  userId: string,
  importType: string,
  summary: ImportResult["summary"],
  ipAddress?: string,
  userAgent?: string,
) {
  try {
    await AppwriteService.logSecurityEvent(
      userId,
      "DATA_IMPORT",
      {
        importType,
        summary,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    );
  } catch (error) {
    console.error("Failed to log import event:", error);
  }
}
