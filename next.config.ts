import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Contrôle « instant navigation » (développement seulement) limité aux pages qui le demandent :
    // RoleGate attend de connaître le type de compte avant d'afficher la page, qu'il signalait à tort.
    instantInsights: { validationLevel: "manual-warning" },
  },
  turbopack: {
    // Un package-lock.json parasite dans le dossier parent (hors du repo) fait sinon
    // choisir la mauvaise racine à Turbopack et casse la résolution des modules.
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
