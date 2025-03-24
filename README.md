# **RESTful API with JWT Authentication and SQLite Integration**

## **1. API Development** 

### **Overview**
This project is a simple RESTful API built with **Node.js (Express.js)** for a **Product Catalog System**. The API provides CRUD functionality for products.

### **Routes and Endpoints**
| Method | Endpoint           | Description                      |
|--------|-------------------|----------------------------------|
| GET    | /products         | Retrieve all products           |
| GET    | /products/:id     | Retrieve a product by ID        |
| POST   | /products         | Create a new product (Protected) |
| PUT    | /products/:id     | Update a product (Protected)    |
| DELETE | /products/:id     | Delete a product (Protected)    |

### **Product Schema**
Each product has the following fields:
- `id` (integer) - Unique product identifier.
- `name` (string) - Product name.
- `description` (string) - Product details.
- `price` (float) - Product price.
- `imageUrl` (string) - Image URL.

### **Validation**
All fields are required when creating or updating a product. The API returns appropriate error messages for missing or invalid fields.

---

## **2. Authentication** (10 Points)

### **JWT-Based Authentication**
To protect sensitive routes, JWT authentication is implemented.

### **Steps to Get a JWT Token**
1. **Login Route (`POST /login`)**
   - Accepts **hardcoded credentials**:
     ```json
     {
       "username": "admin",
       "password": "password123"
     }
     ```
   - If valid, returns a **JWT token**:
     ```json
     {
       "token": "your_generated_jwt_token"
     }
     ```

2. **Using JWT for Protected Routes**
   - For `POST`, `PUT`, and `DELETE` routes, include the **JWT token** in the request header:
     ```
     Authorization: Bearer your_generated_jwt_token
     ```
   - Requests without a valid JWT will be denied.

### **Middleware for Authentication**
A middleware function verifies JWT tokens before granting access to protected routes:
```javascript
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Access denied" });
    
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        req.user = user;
        next();
    });
};
```

---

## **3. Database Integration** 

### **SQLite Database Setup**
SQLite is used as a lightweight database to store product data.

### **Steps to Integrate SQLite**
1. **Install SQLite package**:
   ```sh
   npm install sqlite3
   ```
2. **Create the database schema** (`database.js`):
   ```javascript
   const sqlite3 = require('sqlite3').verbose();
   const db = new sqlite3.Database('./products.db');
   
   db.serialize(() => {
       db.run(`CREATE TABLE IF NOT EXISTS products (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           name TEXT NOT NULL,
           description TEXT NOT NULL,
           price REAL NOT NULL,
           imageUrl TEXT NOT NULL
       )`);
   });
   module.exports = db;
   ```

### **CRUD Operations Using SQL Queries**

#### **Retrieve All Products**
```javascript
app.get('/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
```

#### **Create a Product** (Protected)
```javascript
app.post('/products', authenticateToken, (req, res) => {
    const { name, description, price, imageUrl } = req.body;
    db.run("INSERT INTO products (name, description, price, imageUrl) VALUES (?, ?, ?, ?)",
        [name, description, price, imageUrl],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, name, description, price, imageUrl });
        });
});
```

### **Database Persistence**
- Products are stored in `products.db` and persist between server restarts.
- New products are correctly retrieved from the database.

---

## **4. Secret Key Management**

### **What is a Secret Key?**
The **secret key** is used to **sign and verify JWT tokens**.

### **How to Generate a Secure Secret Key?**
Run the following command in a terminal:
```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Example output:
```
5f2d64c8a3b8f6e47e9a3210f7a66d832cfa624bfa15ebd7dc842ad89f1b5c47
```

### **How to Store and Change the Secret Key?**
#### **1. Using `.env` (Recommended)**
Create a `.env` file:
```
SECRET_KEY=5f2d64c8a3b8f6e47e9a3210f7a66d832cfa624bfa15ebd7dc842ad89f1b5c47
```
Install `dotenv`:
```sh
npm install dotenv
```
Load it in `server.js`:
```javascript
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
```
#### **2. Hardcoding (Not Recommended)**
```javascript
const SECRET_KEY = "my_hardcoded_secret";
```
👉 **If the secret key changes, all existing JWTs become invalid.**

---

## **5. Testing with Postman**
1. **Start the server**:
   ```sh
   node server.js
   ```
2. **Login to get a JWT token**:
   - POST to `/login` with:
     ```json
     { "username": "admin", "password": "password123" }
     ```
   - Copy the received `token`.
3. **Use the token for protected routes**:
   - Add `Authorization: Bearer <token>` in the request header.
4. **Test CRUD operations**:
   - `GET /products`
   - `POST /products` (Requires token)
   - `PUT /products/:id` (Requires token)
   - `DELETE /products/:id` (Requires token)

---

## **Conclusion**
- The API provides **secure authentication and database persistence**.
- JWT ensures only **authorized users** can modify products.
- **SQLite** stores product data with SQL-based CRUD operations.
- The **secret key** ensures JWT security and must be stored securely.

✅ **Project successfully implemented with authentication and database integration!**

