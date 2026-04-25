import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tsconfigPaths()],
  build: {
    outDir: "dist/client",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("@tanstack")) return "vendor-tanstack";
            if (id.includes("react") || id.includes("scheduler")) return "vendor-react";
            if (id.includes("lucide-react")) return "vendor-icons";
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },
});
