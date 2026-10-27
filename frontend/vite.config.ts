import { createLogger, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const viteLogger = createLogger();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  customLogger: {
    ...viteLogger,
    error(message, options) {
      if (message.includes("http proxy error")) return;
      viteLogger.error(message, options);
    },
  },
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("error", (_error, _request, response) => {
            if ("headersSent" in response && "writeHead" in response && "end" in response && !response.headersSent) {
              response.writeHead(503, { "content-type": "application/json" });
              response.end(JSON.stringify({
                error: {
                  code: "BACKEND_UNAVAILABLE",
                  message: "Start the backend server on port 3000 to load live data.",
                },
              }));
            }
          });
        },
      },
      "/socket.io": { target: "http://127.0.0.1:3000", ws: true },
    },
    fs: {
      allow: ["./client", "./shared", "index.html"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./client"),
      "@shared": path.resolve(import.meta.dirname, "./shared"),
    },
  },
}));
