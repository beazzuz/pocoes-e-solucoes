import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const Potion = sequelize.define(
  "Potion",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: { msg: "O nome é obrigatório." },
        len: { args: [2, 120], msg: "O nome deve ter entre 2 e 120 caracteres." },
      },
    },
    description: {
      type: DataTypes.STRING(600),
      allowNull: false,
      validate: {
        notEmpty: { msg: "A descrição é obrigatória." },
        len: { args: [10, 600], msg: "A descrição deve ter entre 10 e 600 caracteres." },
      },
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: { msg: "A imagem é obrigatória." },
        isImagePath(value) {
          const isUpload = /^\/uploads\/[a-zA-Z0-9._-]+$/.test(value);
          const isExternalUrl = /^https?:\/\//i.test(value);
          if (!isUpload && !isExternalUrl) {
            throw new Error("Informe uma imagem válida.");
          }
        },
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: "O preço deve ser numérico." },
        min: { args: [0.01], msg: "O preço deve ser maior que zero." },
      },
    },
  },
  {
    tableName: "potions",
    timestamps: true,
  },
);

export default Potion;
