/*
Citation / Originality:
This file was developed by Group 91 for the CS340 final project.
Any external guidance or AI-assisted drafting was reviewed, modified, and integrated by the team.
Citation:
OpenAI. "ChatGPT (GPT-5.3)". https://chat.openai.com/
Retrieved: Feb. 25th, 2026
Type: AI-assisted code guidance (Node.js / Express server structure)
Author: OpenAI
Notes: Used for guidance on structuring Express routes and debugging database integration.
*/

const path = require('path');
const express = require('express');
const { engine } = require('express-handlebars');
const db = require('./db-connector');

const app = express();

app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

/* ---------------- HELPERS ---------------- */

function dbFail(res, err, routeName = 'route') {
  console.error(`Error on ${routeName}:`, err);
  res.status(500).send('An error occurred while executing the database queries.');
}

/* ---------------- HOME PAGE ---------------- */

app.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

/* ---------------- ORDERS (SELECT) ---------------- */

app.get('/orders', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Orders ORDER BY orderDateTime DESC;');
    res.render('table', { title: 'Orders', rows });
  } catch (err) { dbFail(res, err, '/orders'); }
});

/* ---------------- INGREDIENTS (SELECT) ---------------- */

app.get('/ingredients', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Ingredients ORDER BY ingredientName;');
    res.render('table', { title: 'Ingredients', rows });
  } catch (err) { dbFail(res, err, '/ingredients'); }
});

/* ---------------- MENUITEMS (CRUD - non M:M) ----------------
   IMPORTANT: These POST routes assume you add stored procedures:
   - sp_addMenuItem
   - sp_updateMenuItem
   - sp_deleteMenuItem
*/

app.get('/menuitems', async (req, res) => {
  try {
    // Display
    const [rows] = await db.query(`
      SELECT menuItemID, itemName, price, category, isAvailable
      FROM MenuItems
      ORDER BY itemName;
    `);

    // Dropdowns
    const [menuItemRows] = await db.query(`
      SELECT menuItemID, itemName
      FROM MenuItems
      ORDER BY itemName;
    `);

    const menuItemOptions = menuItemRows.map(m => ({
      value: m.menuItemID,
      label: `${m.itemName} (ID: ${m.menuItemID})`
    }));

    res.render('menuitems', { title: 'MenuItems', rows, menuItemOptions });
  } catch (err) { dbFail(res, err, '/menuitems'); }
});

app.post('/menuitems/insert', async (req, res) => {
  try {
    const { itemName, price, category, isAvailable } = req.body;

    // Convert checkbox/select to boolean-ish value for SQL
    const isAvail = (isAvailable === 'true' || isAvailable === '1' || isAvailable === 'on') ? 1 : 0;

    await db.query('CALL sp_addMenuItem(?, ?, ?, ?);', [
      itemName,
      Number(price),
      category,
      isAvail
    ]);

    res.redirect('/menuitems');
  } catch (err) { dbFail(res, err, '/menuitems/insert'); }
});

app.post('/menuitems/update', async (req, res) => {
  try {
    const { menuItemID, itemName, price, category, isAvailable } = req.body;

    const isAvail = (isAvailable === 'true' || isAvailable === '1' || isAvailable === 'on') ? 1 : 0;

    await db.query('CALL sp_updateMenuItem(?, ?, ?, ?, ?);', [
      Number(menuItemID),
      itemName,
      Number(price),
      category,
      isAvail
    ]);

    res.redirect('/menuitems');
  } catch (err) { dbFail(res, err, '/menuitems/update'); }
});

app.post('/menuitems/delete', async (req, res) => {
  try {
    const { menuItemID } = req.body;
    await db.query('CALL sp_deleteMenuItem(?);', [Number(menuItemID)]);
    res.redirect('/menuitems');
  } catch (err) { dbFail(res, err, '/menuitems/delete'); }
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

/* ---------------- RESET DATABASE (stored procedure) ---------------- */

app.post('/reset', async (req, res) => {
  try {
    await db.query('CALL sp_resetDatabaseDDL();');
    res.redirect('/');
  } catch (err) { dbFail(res, err, '/reset'); }
});

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});