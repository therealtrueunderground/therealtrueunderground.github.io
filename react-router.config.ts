import { readdirSync } from "node:fs";
import type { Config } from "@react-router/dev/config";

const projectPaths = readdirSync("Projects")
  .filter((file) => file.endsWith(".md") && file !== "README.md")
  .map((file) => `/projects/${file.slice(0, -3)}`);

export default {
  ssr: false,
  prerender: ["/", "/about", "/projects", ...projectPaths, "/experience", "/education", "/skills"],
} satisfies Config;
