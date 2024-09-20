const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// 连接到 SQLite 数据库
const db = new sqlite3.Database('./inventory.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the inventory database.');
});

// 创建物品表
db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    purchaseDate TEXT NOT NULL,
    expiryDate TEXT NOT NULL,
    status TEXT NOT NULL,
    dailyConsumption REAL
)`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 获取所有物品
app.get('/api/items', (req, res) => {
    db.all("SELECT * FROM items", [], (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// 添加新物品
app.post('/api/items', (req, res) => {
    const { name, category, quantity, unit, purchaseDate, expiryDate, status, dailyConsumption } = req.body;
    db.run(`INSERT INTO items (name, category, quantity, unit, purchaseDate, expiryDate, status, dailyConsumption) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
        [name, category, quantity, unit, purchaseDate, expiryDate, status, dailyConsumption], 
        function(err) {
            if (err) {
                res.status(400).json({"error": err.message});
                return;
            }
            res.json({
                "message": "success",
                "data": { id: this.lastID },
                "id" : this.lastID
            });
        });
});

// 更新物品
app.put('/api/items/:id', (req, res) => {
    const { name, category, quantity, unit, purchaseDate, expiryDate, status, dailyConsumption } = req.body;
    db.run(`UPDATE items SET name = ?, category = ?, quantity = ?, unit = ?, purchaseDate = ?, expiryDate = ?, status = ?, dailyConsumption = ? 
            WHERE id = ?`,
        [name, category, quantity, unit, purchaseDate, expiryDate, status, dailyConsumption, req.params.id],
        function(err) {
            if (err) {
                res.status(400).json({"error": err.message});
                return;
            }
            res.json({
                message: "success",
                data: { changes: this.changes },
                id: this.lastID
            });
    });
});

// 删除物品
app.delete('/api/items/:id', (req, res) => {
    db.run(`DELETE FROM items WHERE id = ?`, req.params.id, function(err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({"message":"deleted", changes: this.changes});
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});