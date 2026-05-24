import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
// Type declarations for this plugin are not bundled; ignore type check here.
// @ts-ignore
import tsconfigPaths from "vite-tsconfig-paths";
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const basePath = env.VITE_BASE_PATH || env.BASE_URL || "/";
    return {
        plugins: [react(), tsconfigPaths()],
        base: basePath,
        server: {
            port: 5173,
            strictPort: true,
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
    };
});
