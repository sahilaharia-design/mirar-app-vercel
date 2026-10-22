import path from "node:path";
export default {
  root: __dirname,
  publicDir: path.resolve(__dirname, "../../review/public"),
  esbuild: { jsx: "automatic" },
  server: {
    host: "127.0.0.1",
    port: 5192,
    fs: { allow: [path.resolve(__dirname, "../..")] },
  },
  build: { outDir: "../../dist-practice-lab", emptyOutDir: true },
};
