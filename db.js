/**
 * tinydb.js-style document store.
 *
 * TinyDB itself is a Python library, so this is a small Node.js port of its
 * idea: documents live in named tables and are persisted to one JSON file.
 *
 *   const db = new TinyDB('data/db.json');
 *   const items = db.table('items');
 *   items.insert({ name: 'Desk' });         // -> { id: 1, name: 'Desk' }
 *   items.all();
 *   items.get(1);
 *   items.search(doc => doc.quantity < 5);
 *   items.update({ quantity: 9 }, 1);
 *   items.remove(1);
 */
const fs = require('fs');
const path = require('path');

class Table {
  constructor(db, name) {
    this.db = db;
    this.name = name;
  }

  get _data() {
    if (!this.db.data[this.name]) {
      this.db.data[this.name] = { nextId: 1, docs: {} };
    }
    return this.db.data[this.name];
  }

  insert(doc) {
    const t = this._data;
    const id = t.nextId++;
    const record = { ...doc, id };
    t.docs[id] = record;
    this.db._save();
    return { ...record };
  }

  all() {
    return Object.values(this._data.docs).map((d) => ({ ...d }));
  }

  get(id) {
    const d = this._data.docs[id];
    return d ? { ...d } : null;
  }

  search(predicate) {
    return this.all().filter(predicate);
  }

  update(fields, id) {
    const d = this._data.docs[id];
    if (!d) return null;
    Object.assign(d, fields, { id: d.id });
    this.db._save();
    return { ...d };
  }

  remove(id) {
    if (!this._data.docs[id]) return false;
    delete this._data.docs[id];
    this.db._save();
    return true;
  }

  truncate() {
    this.db.data[this.name] = { nextId: 1, docs: {} };
    this.db._save();
  }
}

class TinyDB {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    this.data = this._load();
  }

  table(name) {
    return new Table(this, name);
  }

  _load() {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn('Could not read database, starting empty:', err.message);
      return {};
    }
  }

  // Write to a temp file, then rename, so a crash never leaves half a file.
  _save() {
    const tmp = this.filePath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmp, this.filePath);
  }
}

module.exports = TinyDB;
