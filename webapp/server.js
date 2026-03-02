const path = require('path');
const express = require('express');
const { engine } = require('express-handlebars');
const db = require('./db-connector');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

/* ---------------- HOME PAGE ---------------- */

app.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

/* ---------------- SIMPLE SELECT PAGES (generic table.hbs) ---------------- */

function dbFail(res, err, routeName = 'route') {
  console.error(`Error on ${routeName}:`, err);
  res.status(500).send('An error occurred while executing the database queries.');
}

app.get('/customers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Customers;');
    res.render('table', { title: 'Customers', rows });
  } catch (err) { dbFail(res, err, '/customers'); }
});

app.get('/ingredients', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Ingredients;');
    res.render('table', { title: 'Ingredients', rows });
  } catch (err) { dbFail(res, err, '/ingredients'); }
});

app.get('/invoicedetails', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM InvoiceDetails;');
    res.render('table', { title: 'InvoiceDetails', rows });
  } catch (err) { dbFail(res, err, '/invoicedetails'); }
});

app.get('/invoices', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Invoices;');
    res.render('table', { title: 'Invoices', rows });
  } catch (err) { dbFail(res, err, '/invoices'); }
});

app.get('/menuitems', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM MenuItems;');
    res.render('table', { title: 'MenuItems', rows });
  } catch (err) { dbFail(res, err, '/menuitems'); }
});

app.get('/orders', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Orders;');
    res.render('table', { title: 'Orders', rows });
  } catch (err) { dbFail(res, err, '/orders'); }
});

app.get('/termscode', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM TermsCode;');
    res.render('table', { title: 'TermsCode', rows });
  } catch (err) { dbFail(res, err, '/termscode'); }
});

/* ---------------- PRODUCTS (non-M:M CRUD demo) ---------------- */

app.get('/products', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Products ORDER BY ProductName;');

    const [productRows] = await db.query(
      'SELECT ProductNumber, ProductName FROM Products ORDER BY ProductName;'
    );

    const productOptions = productRows.map(r => ({
      value: r.ProductNumber,
      label: `${r.ProductName || '(No name)'} — ${r.ProductNumber}`
    }));

    res.render('products', { title: 'Products', rows, productOptions });
  } catch (err) { dbFail(res, err, '/products'); }
});

app.post('/products/insert', async (req, res) => {
  try {
    const {
      ProductNumber, ProductName,
      SafetyStockLevel, ReorderPoint,
      StandardCost, ListPrice,
      DaysToManufacture
    } = req.body;

    await db.query(
      `INSERT INTO Products
       (ProductNumber, ProductName, SafetyStockLevel, ReorderPoint, StandardCost, ListPrice, DaysToManufacture)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        ProductNumber,
        ProductName || null,
        SafetyStockLevel === '' ? null : Number(SafetyStockLevel),
        ReorderPoint === '' ? null : Number(ReorderPoint),
        StandardCost === '' ? null : Number(StandardCost),
        ListPrice === '' ? null : Number(ListPrice),
        DaysToManufacture === '' ? null : Number(DaysToManufacture)
      ]
    );

    res.redirect('/products');
  } catch (err) { dbFail(res, err, '/products/insert'); }
});

app.post('/products/update', async (req, res) => {
  try {
    const {
      ProductNumber, ProductName,
      SafetyStockLevel, ReorderPoint,
      StandardCost, ListPrice,
      DaysToManufacture
    } = req.body;

    const fields = [];
    const params = [];

    if (ProductName && ProductName.trim() !== '') { fields.push('ProductName = ?'); params.push(ProductName.trim()); }
    if (SafetyStockLevel !== '' && SafetyStockLevel !== undefined) { fields.push('SafetyStockLevel = ?'); params.push(Number(SafetyStockLevel)); }
    if (ReorderPoint !== '' && ReorderPoint !== undefined) { fields.push('ReorderPoint = ?'); params.push(Number(ReorderPoint)); }
    if (StandardCost !== '' && StandardCost !== undefined) { fields.push('StandardCost = ?'); params.push(Number(StandardCost)); }
    if (ListPrice !== '' && ListPrice !== undefined) { fields.push('ListPrice = ?'); params.push(Number(ListPrice)); }
    if (DaysToManufacture !== '' && DaysToManufacture !== undefined) { fields.push('DaysToManufacture = ?'); params.push(Number(DaysToManufacture)); }

    if (fields.length === 0) return res.redirect('/products');

    params.push(ProductNumber);

    await db.query(`UPDATE Products SET ${fields.join(', ')} WHERE ProductNumber = ?;`, params);
    res.redirect('/products');
  } catch (err) { dbFail(res, err, '/products/update'); }
});

app.post('/products/delete', async (req, res) => {
  try {
    const { ProductNumber } = req.body;
    await db.query('DELETE FROM Products WHERE ProductNumber = ?;', [ProductNumber]);
    res.redirect('/products');
  } catch (err) { dbFail(res, err, '/products/delete'); }
});

/* ---------------- ORDERITEMS (M:M CRUD via stored procedures) ---------------- */

app.get('/orderitems', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        oi.orderItemID,
        o.orderID,
        o.orderDateTime,
        mi.menuItemID,
        mi.itemName,
        oi.quantity
      FROM OrderItems oi
      JOIN Orders o      ON oi.orderID = o.orderID
      JOIN MenuItems mi  ON oi.menuItemID = mi.menuItemID
      ORDER BY o.orderDateTime DESC, oi.orderItemID;
    `);

    const [orders] = await db.query(`
      SELECT orderID, orderDateTime
      FROM Orders
      ORDER BY orderDateTime DESC;
    `);

    const [menuItems] = await db.query(`
      SELECT menuItemID, itemName
      FROM MenuItems
      ORDER BY itemName;
    `);

    const [orderItemIds] = await db.query(`
      SELECT orderItemID
      FROM OrderItems
      ORDER BY orderItemID DESC;
    `);

    const orderOptions = orders.map(o => ({
      value: o.orderID,
      label: `Order ${o.orderID} — ${o.orderDateTime}`
    }));

    const menuItemOptions = menuItems.map(m => ({
      value: m.menuItemID,
      label: `${m.itemName} (ID: ${m.menuItemID})`
    }));

    const orderItemOptions = orderItemIds.map(oi => ({
      value: oi.orderItemID,
      label: `OrderItem ${oi.orderItemID}`
    }));

    res.render('orderitems', {
      title: 'OrderItems',
      rows,
      orderOptions,
      menuItemOptions,
      orderItemOptions
    });
  } catch (err) { dbFail(res, err, '/orderitems'); }
});

app.post('/orderitems/insert', async (req, res) => {
  try {
    const { OrderID, MenuItemID, Quantity } = req.body;
    await db.query('CALL sp_addOrderItem(?, ?, ?);', [
      Number(OrderID),
      Number(MenuItemID),
      Number(Quantity)
    ]);
    res.redirect('/orderitems');
  } catch (err) { dbFail(res, err, '/orderitems/insert'); }
});

app.post('/orderitems/update', async (req, res) => {
  try {
    const { OrderItemID, OrderID, MenuItemID, Quantity } = req.body;
    await db.query('CALL sp_updateOrderItem(?, ?, ?, ?);', [
      Number(OrderItemID),
      Number(OrderID),
      Number(MenuItemID),
      Number(Quantity)
    ]);
    res.redirect('/orderitems');
  } catch (err) { dbFail(res, err, '/orderitems/update'); }
});

app.post('/orderitems/delete', async (req, res) => {
  try {
    const { OrderItemID } = req.body;
    await db.query('CALL sp_deleteOrderItem(?);', [Number(OrderItemID)]);
    res.redirect('/orderitems');
  } catch (err) { dbFail(res, err, '/orderitems/delete'); }
});

/* ---------------- MENUITEMINGREDIENTS (M:M CRUD via stored procedures) ---------------- */

app.get('/menuitemingredients', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        mii.menuItemIngredientID,
        mi.menuItemID,
        mi.itemName,
        i.ingredientID,
        i.ingredientName,
        mii.quantityRequired,
        i.unit
      FROM MenuItemIngredients mii
      JOIN MenuItems mi   ON mii.menuItemID = mi.menuItemID
      JOIN Ingredients i  ON mii.ingredientID = i.ingredientID
      ORDER BY mi.itemName, i.ingredientName;
    `);

    const [menuItems] = await db.query(`
      SELECT menuItemID, itemName
      FROM MenuItems
      ORDER BY itemName;
    `);

    const [ingredients] = await db.query(`
      SELECT ingredientID, ingredientName
      FROM Ingredients
      ORDER BY ingredientName;
    `);

    const [miiIds] = await db.query(`
      SELECT menuItemIngredientID
      FROM MenuItemIngredients
      ORDER BY menuItemIngredientID DESC;
    `);

    const menuItemOptions = menuItems.map(m => ({
      value: m.menuItemID,
      label: `${m.itemName} (ID: ${m.menuItemID})`
    }));

    const ingredientOptions = ingredients.map(i => ({
      value: i.ingredientID,
      label: `${i.ingredientName} (ID: ${i.ingredientID})`
    }));

    const miiOptions = miiIds.map(x => ({
      value: x.menuItemIngredientID,
      label: `Entry ${x.menuItemIngredientID}`
    }));

    res.render('menuitemingredients', {
      title: 'MenuItemIngredients',
      rows,
      menuItemOptions,
      ingredientOptions,
      miiOptions
    });
  } catch (err) { dbFail(res, err, '/menuitemingredients'); }
});

app.post('/menuitemingredients/insert', async (req, res) => {
  try {
    const { MenuItemID, IngredientID, QuantityRequired } = req.body;
    await db.query('CALL sp_addMenuItemIngredient(?, ?, ?);', [
      Number(MenuItemID),
      Number(IngredientID),
      Number(QuantityRequired)
    ]);
    res.redirect('/menuitemingredients');
  } catch (err) { dbFail(res, err, '/menuitemingredients/insert'); }
});

app.post('/menuitemingredients/update', async (req, res) => {
  try {
    const { MenuItemIngredientID, MenuItemID, IngredientID, QuantityRequired } = req.body;
    await db.query('CALL sp_updateMenuItemIngredient(?, ?, ?, ?);', [
      Number(MenuItemIngredientID),
      Number(MenuItemID),
      Number(IngredientID),
      Number(QuantityRequired)
    ]);
    res.redirect('/menuitemingredients');
  } catch (err) { dbFail(res, err, '/menuitemingredients/update'); }
});

app.post('/menuitemingredients/delete', async (req, res) => {
  try {
    const { MenuItemIngredientID } = req.body;
    await db.query('CALL sp_deleteMenuItemIngredient(?);', [Number(MenuItemIngredientID)]);
    res.redirect('/menuitemingredients');
  } catch (err) { dbFail(res, err, '/menuitemingredients/delete'); }
});

/* ---------------- OPTIONAL: RESET DATABASE (stored procedure) ---------------- */

app.post('/reset', async (req, res) => {
  try {
    await db.query('CALL sp_resetDatabase();');
    res.redirect('/');
  } catch (err) { dbFail(res, err, '/reset'); }
});

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});