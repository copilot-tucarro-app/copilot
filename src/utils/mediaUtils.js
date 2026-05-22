export function getDirectImageUrl(url = "") {
  const cleanUrl = String(url || "").trim();
  if (!cleanUrl) return "";

  const driveFileId = getGoogleDriveFileId(cleanUrl);
  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveFileId)}&sz=w1600`;
  }

  return cleanUrl;
}

function getGoogleDriveFileId(url) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "");

    if (host !== "drive.google.com" && host !== "docs.google.com") {
      return "";
    }

    const pathMatch = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);
    if (pathMatch?.[1]) {
      return pathMatch[1];
    }

    const queryId = parsedUrl.searchParams.get("id");
    return queryId || "";
  } catch {
    return "";
  }
}
