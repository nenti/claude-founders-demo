import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(join(__dirname, "public")));

app.get("/healthz", (_req, res) => res.json({ status: "ok", greeting: "hello" }));

app.listen(port, "0.0.0.0", () => {
  console.log(`👋 Hello World app listening on port ${port}`);
});
