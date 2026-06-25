import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeDatabase } from "./src/database.js";
import potionRoutes from "./src/routes/potions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/potions", potionRoutes);

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Rota da API não encontrada." });
});

app.use((error, _req, res, _next) => {
  console.error(error);

  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "A imagem deve ter no máximo 5 MB."
      : "Não foi possível receber a imagem.";
    return res.status(400).json({ error: message });
  }

  if (error.message?.includes("JPG, PNG ou WEBP")) {
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({ error: "Ocorreu um erro interno no servidor." });
});

try {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`🧪 Poções e Soluções disponível em http://localhost:${PORT}`);
    console.log(`🛠️  Administração em http://localhost:${PORT}/admin`);
  });
} catch (error) {
  console.error("Não foi possível iniciar o projeto:", error);
  process.exit(1);
}
