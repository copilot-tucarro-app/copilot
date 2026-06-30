import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const host = "127.0.0.1";
const port = 5174;
const root = join(process.cwd(), "dist");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

function resolveFile(url = "/") {
  const cleanUrl = decodeURIComponent(url.split("?")[0] || "/");
  const relativePath = cleanUrl === "/" ? "index.html" : cleanUrl.replace(/^\/+/, "");
  const filePath = normalize(join(root, relativePath));
  return filePath.startsWith(root) && existsSync(filePath) ? filePath : join(root, "index.html");
}

createServer((request, response) => {
  const filePath = resolveFile(request.url);
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}).listen(port, host, () => {
  console.log(`copilot360 listo en http://${host}:${port}/`);
});
