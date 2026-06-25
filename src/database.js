import sequelize from "./sequelize.js";
import Potion from "./models/Potion.js";

const initialPotions = [
  {
    name: "Poção Blue Sky",
    description:
      "Provê um surto de inspiração por 24 horas. Uma escolha clássica para artistas, inventores e estudantes em busca de boas ideias.",
    image: "https://i.ibb.co/ZzS7xb2/rsz-sky.png",
    price: 300,
  },
  {
    name: "Poção do Perfume Misterioso",
    description:
      "Faz com que você fique cheirando a lilás e groselha por 24 dias. Uma essência muito admirada entre bruxos elegantes.",
    image: "https://i.ibb.co/pyhZJXf/rsz-lilas.png",
    price: 200,
  },
  {
    name: "Poção de Pinus",
    description:
      "Pode fazer você ficar até 10 cm mais alto. Observação: os efeitos colaterais permanecem desconhecidos.",
    image: "https://i.ibb.co/DkzdL1q/rsz-pinus.png",
    price: 3000,
  },
  {
    name: "Poção da Beleza Eterna",
    description:
      "Uma fórmula histórica, extremamente perigosa e vendida apenas como item de coleção. Não deve ser consumida.",
    image: "https://i.ibb.co/9p872NK/rsz-1beleza.png",
    price: 100,
  },
  {
    name: "Poção do Arco-Íris",
    description:
      "Traz uma sensação passageira de felicidade. A duração pode variar de dez minutos a dois dias.",
    image: "https://i.ibb.co/PrC09MP/rsz-2unicornio.png",
    price: 120,
  },
  {
    name: "Caldeirão das Verdades Secretas",
    description:
      "Uma mistura rara que faz as pessoas dizerem apenas a verdade por uma hora. Produto demonstrativo de 5 litros.",
    image: "https://i.ibb.co/s9Lyvj8/rsz-verdades.png",
    price: 150,
  },
];

export async function initializeDatabase() {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
  await Potion.bulkCreate(initialPotions);
}
