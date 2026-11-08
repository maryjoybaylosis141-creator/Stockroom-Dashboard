const path = require('path');
const express = require('express');
const TinyDB = require('./db');

const PORT = process.env.PORT || 3000;
const app = express();
const db = new TinyDB(path.join(__dirname, 'data', 'db.json'));
const items = db.table('items');

const STATUSES = ['active', 'discontinued'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Seed a few rows on first run so the dashboard isn't empty.
if (items.all().length === 0) {
  [
    { name: 'Oak writing desk', category: 'Furniture', quantity: 12, price: 289.0, status: 'active' },
    { name: 'Ergonomic chair', category: 'Furniture', quantity: 4, price: 349.5, status: 'active' },
    { name: 'USB-C dock', category: 'Electronics', quantity: 31, price: 89.99, status: 'active' },
    { name: '27" monitor', category: 'Electronics', quantity: 3, price: 219.0, status: 'active' },
    { name: 'Dot-grid notebook', category: 'Stationery', quantity: 140, price: 6.5, status: 'active' },
    { name: 'Fountain pen', category: 'Stationery', quantity: 0, price: 24.0, status: 'discontinued' },
  ].forEach((i) => items.insert({ ...i, updatedAt: new Date().toISOString() }));
}

// Validate and normalise incoming item data. Returns { error } or { value }.
function parseItem(body) {
  const name = String(body.name ?? '').trim();
  const category = String(body.category ?? '').trim();
  const quantity = Number(body.quantity);
  const price = Number(body.price);
  const status = body.status ?? 'active';

  if (!name) return { error: 'Name is required.' };
  if (!category) return { error: 'Category is required.' };
  if (!Number.isInteger(quantity) || quantity < 0) return { error: 'Quantity must be a whole number, 0 or more.' };
  if (!Number.isFinite(price) || price < 0) return { error: 'Price must be a number, 0 or more.' };
  if (!STATUSES.includes(status)) return { error: 'Status must be active or discontinued.' };

  return { value: { name, category, quantity, price, status } };
}

// ---- Read ----
app.get('/api/items', (req, res) => {
  const { q, category, status } = req.query;
  const term = (q || '').toLowerCase();
  const list = items
    .search(
      (d) =>
        (!term || d.name.toLowerCase().includes(term) || d.category.toLowerCase().includes(term)) &&
        (!category || d.category === category) &&
        (!status || d.status === status)
    )
    .sort((a, b) => b.id - a.id);
  res.json(list);
});

app.get('/api/items/:id', (req, res) => {
  const item = items.get(Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  res.json(item);
});

// ---- Create ----
app.post('/api/items', (req, res) => {
  const { error, value } = parseItem(req.body);
  if (error) return res.status(400).json({ error });
  res.status(201).json(items.insert({ ...value, updatedAt: new Date().toISOString() }));
});

// ---- Update ----
app.put('/api/items/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!items.get(id)) return res.status(404).json({ error: 'Item not found.' });
  const { error, value } = parseItem(req.body);
  if (error) return res.status(400).json({ error });
  res.json(items.update({ ...value, updatedAt: new Date().toISOString() }, id));
});

// ---- Delete ----
app.delete('/api/items/:id', (req, res) => {
  if (!items.remove(Number(req.params.id))) return res.status(404).json({ error: 'Item not found.' });
  res.status(204).end();
});

// ---- Dashboard summary ----
app.get('/api/stats', (req, res) => {
  const all = items.all();
  const byCategory = {};
  let stockValue = 0;
  let lowStock = 0;
  let outOfStock = 0;

  for (const d of all) {
    const value = d.quantity * d.price;
    stockValue += value;
    byCategory[d.category] = (byCategory[d.category] || 0) + value;
    if (d.quantity === 0) outOfStock++;
    else if (d.quantity <= 5) lowStock++;
  }

  res.json({
    totalItems: all.length,
    stockValue,
    lowStock,
    outOfStock,
    byCategory: Object.entries(byCategory)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value),
    categories: [...new Set(all.map((d) => d.category))].sort(),
  });
});

app.listen(PORT, () => console.log(`Stockroom running at http://localhost:${PORT}`));
