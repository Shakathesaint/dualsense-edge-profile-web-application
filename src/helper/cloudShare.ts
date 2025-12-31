export interface ShareResult {
  success: boolean;
  url?: string;
  error?: string;
}

const CONNECTION_TIMEOUT = 5000;
const UPLOAD_TIMEOUT = 30000;
const LITTERBOX_API_URL = "https://litterbox.catbox.moe/resources/internals/api.php";

export async function checkInternetConnection(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);

  try {
    const response = await fetch("https://catbox.moe", {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return true;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

export async function createShareableLink(
  zipBlob: Blob,
  filename: string
): Promise<ShareResult> {
  const isOnline = await checkInternetConnection();
  if (!isOnline) {
    return {
      success: false,
      error: "No internet connection. The backup was saved locally.",
    };
  }

  try {
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("time", "72h");
    formData.append("fileToUpload", zipBlob, filename.replace(".txt", ".zip"));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT);

    const response = await fetch(LITTERBOX_API_URL, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `Upload failed: HTTP ${response.status}`,
      };
    }

    const url = await response.text();

    if (!url || !url.startsWith("https://")) {
      return {
        success: false,
        error: `Upload failed: ${url || "empty response"}`,
      };
    }

    return {
      success: true,
      url: url.trim(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        error: "Upload timeout. Please try again.",
      };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to create shareable link: ${message}`,
    };
  }
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    });
}
