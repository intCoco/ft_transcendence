import fs from "fs";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => {
  if (command === "serve") {
    return {
      server: {
        https: {
          key: fs.readFileSync("certs/key.pem"),
          cert: fs.readFileSync("certs/cert.pem"),
        },
      },
    };
  }

  // build (Docker)
  return {};
});
