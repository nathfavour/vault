/**
 * Generate the auth/accounts IDM subdomain URL
 * Handles both http and https protocols
 */
export function getAuthURL(): string {
  const authSubdomain = process.env.AUTH_SUBDOMAIN || "accounts";
  const appSubdomain = process.env.APP_SUBDOMAIN || "whisperrnote.space";

  if (!appSubdomain) {
    throw new Error(
      "APP_SUBDOMAIN environment variable is required for auth URL generation",
    );
  }

  // Use http/https based on current protocol or default to https
  const protocol =
    typeof window !== "undefined" ? window.location.protocol : "https:";

  return `${protocol}//${authSubdomain}.${appSubdomain}`;
}

/**
 * Generate the source URL for IDM redirect (current hostname + /masterpass)
 */
export function getSourceURL(): string {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    return `${protocol}//${hostname}${port}/masterpass`;
  }

  // Server-side fallback
  const appSubdomain = process.env.APP_SUBDOMAIN || "whisperrnote.space";
  const protocol = process.env.NODE_ENV === "development" ? "http:" : "https:";
  return `${protocol}//${appSubdomain}/masterpass`;
}

/**
 * Open the IDM authentication popup
 */
export function openAuthPopup(): void {
  const authURL = getAuthURL();
  const sourceURL = getSourceURL();
  const popup = window.open(
    `${authURL}?source=${encodeURIComponent(sourceURL)}`,
    "auth_popup",
    "width=500,height=700,resizable=yes,scrollbars=yes",
  );

  if (!popup) {
    throw new Error("Failed to open authentication popup. Please check popup settings.");
  }

  // Optional: Listen for messages from popup when authentication is complete
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== getAuthURL()) {
      return; // Ignore messages from other origins
    }

    if (event.data?.type === "auth_complete") {
      // Handle successful authentication
      window.location.href = "/masterpass";
    }
  };

  window.addEventListener("message", handleMessage);

  // Cleanup listener after 10 minutes (reasonable timeout for auth flow)
  setTimeout(() => {
    window.removeEventListener("message", handleMessage);
  }, 10 * 60 * 1000);
}
