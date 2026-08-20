import vinext from "vinext";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(async () => {
  const isVercel = process.env.VERCEL === "1" || process.env.NITRO_PRESET === "vercel";

  if (isVercel) {
    const { nitro } = await import("nitro/vite");
    return {
      publicDir: "./public",
      server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
      plugins: [tailwindcss(), vinext(), nitro()],
    };
  }

  const { cloudflare } = await import("@cloudflare/vite-plugin");
  return {
    publicDir: "./public",
    server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
    plugins: [vinext(), cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] }, inspectorPort: false, config: { main: "./worker/index.ts", compatibility_flags: ["nodejs_compat"] } })],
  };
});
