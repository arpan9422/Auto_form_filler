import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { promises as fs } from "fs";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-manifest-and-fix-structure",
      writeBundle: async () => {
        try {
          const distPath = "dist";

          // Ensure dist directory exists
          await fs.mkdir(distPath, { recursive: true });

          // Copy manifest to dist
          const manifestContent = await fs.readFile("public/manifest.json", "utf-8");
          await fs.writeFile(path.join(distPath, "manifest.json"), manifestContent);
          console.log("✓ manifest.json copied");

          // Copy content.css from src/content to dist
          const cssContent = await fs.readFile("src/content/content.css", "utf-8");
          await fs.writeFile(path.join(distPath, "content.css"), cssContent);
          console.log("✓ content.css copied");

          // Copy popup.html from dist/src/popup/index.html to dist/popup.html
          const srcPath = path.join(distPath, "src/popup/index.html");
          const destPath = path.join(distPath, "popup.html");
          const htmlContent = await fs.readFile(srcPath, "utf-8");
          await fs.writeFile(destPath, htmlContent);
          console.log("✓ popup.html moved to dist/");

          // Copy icons folder and create placeholders
          await fs.mkdir(path.join(distPath, "icons"), { recursive: true });
          
          // Base64 encoded 1x1 transparent PNG
          const placeholderPNG = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "base64"
          );

          // Create placeholder icons for all sizes
          const sizes = [16, 32, 48, 128];
          for (const size of sizes) {
            const iconPath = path.join(distPath, "icons", `icon${size}.png`);
            await fs.writeFile(iconPath, placeholderPNG);
          }
          console.log("✓ placeholder icons created");

          // Try to copy real icons if they exist
          try {
            const iconsDir = await fs.readdir("public/icons");
            for (const file of iconsDir) {
              if (file !== ".gitkeep" && file.endsWith(".png")) {
                const src = path.join("public/icons", file);
                const dest = path.join(distPath, "icons", file);
                await fs.copyFile(src, dest);
              }
            }
          } catch (e) {
            // Placeholder icons are already in place
          }
        } catch (e) {
          console.warn("⚠ Build hook error:", e);
        }
      },
    },
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        content: resolve(__dirname, "src/content/content.ts"),
        background: resolve(__dirname, "src/background/background.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
