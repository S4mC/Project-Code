import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { readdirSync } from "fs";

// Automatically find all HTML files in the root directory
const htmlFiles = readdirSync(".").filter((file) => file.endsWith(".html"));
const input = Object.fromEntries(
    htmlFiles.map((file) => [
        file.replace(".html", ""), // Use filename without extension as the key
        resolve(__dirname, file),
    ])
);

// https://vite.dev/config/
export default defineConfig({
    base: "./", // Use relative paths in build output
    build: {
        rollupOptions: {
            input,
        },
    },
    plugins: [react()],
});
