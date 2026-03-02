Absolutely — here’s a clean, professional, portfolio-quality README you can paste directly into your GitHub repo.

You can create it with:

```bash
nano README.md
```

Then paste everything below.

---

# Windmill Pantry — Restaurant Order & Inventory Management System

**CS340: Introduction to Databases — Oregon State University**

A full-stack web application and relational database system designed to support restaurant order processing and inventory management for Windmill Pantry.

This project demonstrates database design, normalization, CRUD operations, many-to-many relationship management, stored procedures, and deployment on a Linux server environment.

---

## 📌 Project Overview

Windmill Pantry processes approximately **150–250 orders per day** and manages over **100+ inventory ingredients and products**. This system was designed to:

* Track customer orders
* Manage menu items and their ingredient requirements
* Maintain inventory levels
* Support invoice tracking
* Demonstrate proper relational database design

The primary users of this system are **administrators**, not customers.

---

## 🗄️ Database Design

The database includes:

### Core Entities

* Customers
* Orders
* MenuItems
* Ingredients
* Products
* Invoices
* TermsCode

### Intersection Tables (Many-to-Many Relationships)

* OrderItems (Orders ↔ MenuItems)
* MenuItemIngredients (MenuItems ↔ Ingredients)
* InvoiceDetails

The schema implements:

* Primary keys
* Foreign key constraints
* Cascading relationships
* Composite uniqueness constraints
* Proper normalization (3NF)

---

## ⚙️ Tech Stack

* Node.js
* Express.js
* Express Handlebars (HBS)
* MySQL / MariaDB
* Stored Procedures
* Linux (ENGR server deployment)
* Git & GitHub

---

## 🖥️ Features Implemented

### ✅ SELECT (All Tables)

Each table in the schema has its own dedicated SELECT query and UI page.

### ✅ INSERT

Implemented for:

* Products (entity)
* OrderItems (M:M)
* MenuItemIngredients (M:M)

### ✅ UPDATE

Implemented for:

* Products
* OrderItems (M:M)
* MenuItemIngredients (M:M)

### ✅ DELETE

Implemented for:

* Products
* OrderItems (M:M)
* MenuItemIngredients (M:M)

All CUD operations:

* Use parameterized queries or stored procedures
* Prevent SQL injection
* Utilize dropdowns for foreign key selection
* Do not require manual ID entry

### ✅ Database Reset

A stored procedure resets:

* All data
* Auto-increment counters
* Sample data

---

## 🚀 Deployment

The application is deployed on the OSU ENGR server.

Server configuration:

* Binds to `0.0.0.0`
* Runs on assigned student port
* Persisted using `screen`

Example deployment command:

```bash
PORT=51235 npm run production
```

---

## 🛠️ Local Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/YOURUSERNAME/cs340-windmill-pantry.git
cd cs340-windmill-pantry
```

### 2️⃣ Install dependencies

```bash
cd webapp
npm install
```

### 3️⃣ Configure environment variables

Create a `.env` file:

```
DB_HOST=your_mysql_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
DB_PORT=3306
```

### 4️⃣ Create database

Run:

```bash
mysql -u username -p database_name < DDL.sql
mysql -u username -p database_name < DML.sql
```

### 5️⃣ Start server

```bash
npm start
```

Or for production:

```bash
PORT=3000 npm run production
```

---

## 📊 Normalization

The schema adheres to:

* 1NF: Atomic attributes
* 2NF: No partial dependencies
* 3NF: No transitive dependencies

Many-to-many relationships are resolved via intersection tables.

---

## 🔐 Security Considerations

* Stored procedures used for M:M CUD operations
* Parameterized queries prevent SQL injection
* Foreign keys enforce referential integrity
* Cascading rules prevent data anomalies

---

## 📁 Project Structure

```
cs340-step3/
│
├── DDL.sql
├── DML.sql
├── README.md
└── webapp/
    ├── server.js
    ├── db-connector.js
    ├── package.json
    └── views/
        ├── index.hbs
        ├── products.hbs
        ├── orderitems.hbs
        ├── menuitemingredients.hbs
        ├── table.hbs
        └── layouts/
            └── main.hbs
```

---

## 🎓 Academic Context

This project was developed for:

**CS340 – Introduction to Databases**
Oregon State University

The goal was to design, implement, and deploy a relational database-backed web application demonstrating CRUD functionality and proper schema design.

