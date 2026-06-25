# Poções e Soluções
Isabela Beatriz Sousa Nunes Farias 13823833

Loja virtual e painel administrativo para cadastrar, listar e remover poções. O projeto usa Express, Sequelize e SQLite em memória.

## Requisitos

- Node.js 18 ou superior
- npm

## Instalação

```bash
npm install
npm start
```

Acesse:

- Loja: `http://localhost:3000`
- Administração: `http://localhost:3000/admin`

## Upload de imagens

No painel administrativo, a imagem é escolhida diretamente no computador.

Formatos aceitos:

- JPG/JPEG
- PNG
- WEBP
- Tamanho máximo: 5 MB

Os arquivos enviados ficam em `public/uploads`. Ao excluir uma poção cadastrada pelo painel, sua imagem também é removida da pasta.

## API

- `GET /api/potions` — lista todas as poções
- `GET /api/potions/:id` — busca uma poção
- `POST /api/potions` — cadastra uma poção com `multipart/form-data`
- `DELETE /api/potions/:id` — remove uma poção

Campos do cadastro:

- `name`
- `description`
- `price`
- `image` (arquivo)

## Observação sobre o banco

O SQLite funciona em memória, conforme solicitado na atividade. Por isso, os registros retornam aos dados iniciais quando o servidor é reiniciado. Imagens enviadas permanecem em `public/uploads`, mas seus registros deixam de existir após reiniciar.
