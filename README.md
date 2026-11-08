# Stockroom

Inventory dashboard with full CRUD.

- **Backend:** Express.js (`server.js`)
- **Database:** TinyDB-style JSON document store (`db.js`), saved to `data/db.json`
- **Frontend:** plain HTML/CSS/JS in `public/index.html` (no build step)

## Run it

```bash
npm install
npm start
```

Open http://localhost:3000. For auto-restart while editing, use `npm run dev`.

## API

| Method | Route            | What it does                                   |
|--------|------------------|------------------------------------------------|
| GET    | /api/items       | List items (`?q=`, `?category=`, `?status=`)   |
| GET    | /api/items/:id   | Get one item                                   |
| POST   | /api/items       | Create an item                                 |
| PUT    | /api/items/:id   | Update an item                                 |
| DELETE | /api/items/:id   | Delete an item                                 |
| GET    | /api/stats       | Dashboard totals and value by category         |

## Note on TinyDB

TinyDB is a Python library, so it can't run inside an Express app. `db.js` is a small
Node.js version with the same idea (tables of documents in one JSON file). To reset the
data, stop the server and delete `data/db.json`.
