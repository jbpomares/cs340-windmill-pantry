-- Windmill Pantry Restaurant Order / Inventory Management
-- Group 91
-- Step 4

-- Orders page
SELECT orderID, orderDateTime, orderTotal, orderStatus
FROM Orders
ORDER BY orderDateTime DESC;

-- MenuItems page
SELECT menuItemID, itemName, price, category, isAvailable
FROM MenuItems
ORDER BY itemName;

-- Ingredients page
SELECT ingredientID, ingredientName, unit, quantityInStock, reorderLevel
FROM Ingredients
ORDER BY ingredientName;

-- OrderItems page (M:M Orders ↔ MenuItems)
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

-- MenuItemIngredients page (M:M MenuItems ↔ Ingredients)
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

-- Dropdown population queries 
SELECT orderID, orderDateTime
FROM Orders
ORDER BY orderDateTime DESC;

SELECT menuItemID, itemName
FROM MenuItems
ORDER BY itemName;

SELECT ingredientID, ingredientName
FROM Ingredients
ORDER BY ingredientName;
