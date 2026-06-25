import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import multer from "multer";
import { ValidationError } from "sequelize";
import Potion from "../models/Potion.js";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDirectory = path.resolve(__dirname, "../../public/uploads");

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return callback(new Error("Envie uma imagem JPG, PNG ou WEBP."));
    }
    callback(null, true);
  },
});

async function removeUploadedImage(imagePath) {
  if (!imagePath?.startsWith("/uploads/")) return;
  const filename = path.basename(imagePath);
  try {
    await fs.unlink(path.join(uploadsDirectory, filename));
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Falha ao remover imagem:", error);
  }
}

router.get("/", async (_req, res, next) => {
  try {
    const potions = await Potion.findAll({ order: [["createdAt", "DESC"]] });
    res.json(potions);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const potion = await Potion.findByPk(req.params.id);
    if (!potion) return res.status(404).json({ error: "Poção não encontrada." });
    res.json(potion);
  } catch (error) {
    next(error);
  }
});

router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Selecione uma imagem para a poção." });
    }

    const potion = await Potion.create({
      name: String(req.body.name ?? "").trim(),
      description: String(req.body.description ?? "").trim(),
      image: `/uploads/${req.file.filename}`,
      price: Number(req.body.price),
    });

    res.status(201).json(potion);
  } catch (error) {
    if (req.file) await removeUploadedImage(`/uploads/${req.file.filename}`);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: "Não foi possível cadastrar a poção.",
        details: error.errors.map((item) => item.message),
      });
    }
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const potion = await Potion.findByPk(req.params.id);
    if (!potion) return res.status(404).json({ error: "Poção não encontrada." });

    const imagePath = potion.image;
    await potion.destroy();
    await removeUploadedImage(imagePath);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
