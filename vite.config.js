import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
      ],

      manifest: {
        id: "/",

        name: "Odikart",
        short_name: "Odikart",

        description:
          "Odikart - Online Shopping Platform",

        /*
         * Fallback theme color for the installed PWA.
         *
         * The dynamic Light/Dark theme colors are handled
         * through the theme-color meta tags in index.html.
         */
        theme_color: "#4F46E5",

        /*
         * Keep the PWA background LIGHT.
         * We are NOT implementing dark mode for the UI.
         */
        background_color: "#ffffff",

        display: "standalone",

        start_url: "/",

        scope: "/",

        icons: [
          {
            src: "web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },

          {
            src: "web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },

          {
            src: "web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});