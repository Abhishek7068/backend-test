const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'f753c8af510eb62118856566dba6231ffb3532dff21f5205b0d11b046f352048';

app.use(bodyParser.json());

// Initialize SQLite Database
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database');
        db.run(`CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            price REAL NOT NULL,
            imageUrl TEXT NOT NULL
        )`);
    }
});

// Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password123') {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// CRUD Routes for Products
app.get('/products', (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/products/:id', (req, res) => {
    db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: 'Product not found' });
        res.json(row);
    });
});

app.post('/products', authenticateJWT, (req, res) => {
    const { name, description, price, imageUrl } = req.body;
    if (!name || !description || !price || !imageUrl) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    db.run('INSERT INTO products (name, description, price, imageUrl) VALUES (?, ?, ?, ?)', 
        [name, description, price, imageUrl], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, name, description, price, imageUrl });
    });
});

app.put('/products/:id', authenticateJWT, (req, res) => {
    const { name, description, price, imageUrl } = req.body;
    if (!name || !description || !price || !imageUrl) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    db.run('UPDATE products SET name = ?, description = ?, price = ?, imageUrl = ? WHERE id = ?', 
        [name, description, price, imageUrl, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'Product not found' });
            res.json({ message: 'Product updated successfully' });
    });
});

app.delete('/products/:id', authenticateJWT, (req, res) => {
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted successfully' });
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
