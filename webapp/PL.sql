-- Windmill Pantry Restaurant Order / Inventory Management
-- Group 91

/*
Citation / Originality:
This file was developed by Group 91 for the CS340 final project.
Any external guidance or AI-assisted drafting was reviewed, modified, and integrated by the team.

Citations:
OpenAI. "ChatGPT (GPT-5.3)". https://chat.openai.com/
Retrieved: Febraury - March, 2026
Type: AI-assisted development tool (stored procedures / PL-SQL)
Author: OpenAI
Notes: Used for guidance on writing stored procedures for CRUD operations and implementing a database reset procedure using DDL statements and foreign key handling.
*/

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_resetDatabaseDDL $$
CREATE PROCEDURE sp_resetDatabaseDDL()
BEGIN
  -- Disable FK checks to allow drops in any order
  SET FOREIGN_KEY_CHECKS = 0;

  -- Drop tables (dependency order)
  DROP TABLE IF EXISTS MenuItemIngredients;
  DROP TABLE IF EXISTS OrderItems;
  DROP TABLE IF EXISTS Ingredients;
  DROP TABLE IF EXISTS MenuItems;
  DROP TABLE IF EXISTS Orders;

  -- Recreate tables
  CREATE TABLE Orders (
      orderID INT AUTO_INCREMENT PRIMARY KEY,
      orderDateTime DATETIME NOT NULL,
      orderTotal DECIMAL(8,2) NOT NULL,
      orderStatus VARCHAR(20) NOT NULL
  ) ENGINE=InnoDB;

  CREATE TABLE MenuItems (
      menuItemID INT AUTO_INCREMENT PRIMARY KEY,
      itemName VARCHAR(100) NOT NULL,
      price DECIMAL(8,2) NOT NULL,
      category VARCHAR(50) NOT NULL,
      isAvailable BOOLEAN NOT NULL
  ) ENGINE=InnoDB;

  CREATE TABLE Ingredients (
      ingredientID INT AUTO_INCREMENT PRIMARY KEY,
      ingredientName VARCHAR(100) NOT NULL,
      unit VARCHAR(20) NOT NULL,
      quantityInStock DECIMAL(8,2) NOT NULL,
      reorderLevel DECIMAL(8,2) NOT NULL
  ) ENGINE=InnoDB;

  CREATE TABLE OrderItems (
      orderItemID INT AUTO_INCREMENT PRIMARY KEY,
      orderID INT NOT NULL,
      menuItemID INT NOT NULL,
      quantity INT NOT NULL,
      CONSTRAINT fk_orderitems_orders
          FOREIGN KEY (orderID)
          REFERENCES Orders(orderID)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
      CONSTRAINT fk_orderitems_menuitems
          FOREIGN KEY (menuItemID)
          REFERENCES MenuItems(menuItemID)
          ON DELETE CASCADE
          ON UPDATE CASCADE
  ) ENGINE=InnoDB;

  CREATE TABLE MenuItemIngredients (
      menuItemIngredientID INT AUTO_INCREMENT PRIMARY KEY,
      menuItemID INT NOT NULL,
      ingredientID INT NOT NULL,
      quantityRequired DECIMAL(8,2) NOT NULL,
      CONSTRAINT fk_menuitemingredients_menuitems
          FOREIGN KEY (menuItemID)
          REFERENCES MenuItems(menuItemID)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
      CONSTRAINT fk_menuitemingredients_ingredients
          FOREIGN KEY (ingredientID)
          REFERENCES Ingredients(ingredientID)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
      CONSTRAINT uq_menuitem_ingredient UNIQUE (menuItemID, ingredientID)
  ) ENGINE=InnoDB;

  -- Reinsert sample data
  INSERT INTO Orders (orderDateTime, orderTotal, orderStatus) VALUES
  ('2026-01-10 08:15:00', 18.50, 'Completed'),
  ('2026-01-10 09:02:00', 12.00, 'Completed'),
  ('2026-01-10 10:30:00', 9.75, 'Canceled');

  INSERT INTO MenuItems (itemName, price, category, isAvailable) VALUES
  ('Breakfast Sandwich', 7.50, 'Breakfast', TRUE),
  ('Avocado Toast', 6.25, 'Breakfast', TRUE),
  ('Iced Latte', 4.75, 'Beverage', TRUE),
  ('Tomato Soup', 5.50, 'Lunch', FALSE);

  INSERT INTO Ingredients (ingredientName, unit, quantityInStock, reorderLevel) VALUES
  ('Bread', 'slices', 200.00, 50.00),
  ('Eggs', 'units', 120.00, 30.00),
  ('Avocado', 'grams', 5000.00, 1000.00),
  ('Milk', 'liters', 25.00, 5.00),
  ('Coffee Beans', 'grams', 3000.00, 500.00);

  INSERT INTO OrderItems (orderID, menuItemID, quantity) VALUES
  (1, 1, 1),
  (1, 3, 1),
  (2, 2, 1),
  (2, 3, 1);

  INSERT INTO MenuItemIngredients (menuItemID, ingredientID, quantityRequired) VALUES
  (1, 1, 2.00),
  (1, 2, 1.00),
  (2, 1, 1.00),
  (2, 3, 75.00),
  (3, 4, 0.25),
  (3, 5, 18.00);

  -- Re-enable FK checks
  SET FOREIGN_KEY_CHECKS = 1;
END $$

-- ---------- MenuItems (non-M:M) CRUD ----------
DROP PROCEDURE IF EXISTS sp_addMenuItem $$
CREATE PROCEDURE sp_addMenuItem(
    IN p_itemName VARCHAR(100),
    IN p_price DECIMAL(8,2),
    IN p_category VARCHAR(50),
    IN p_isAvailable BOOLEAN
)
BEGIN
    INSERT INTO MenuItems (itemName, price, category, isAvailable)
    VALUES (p_itemName, p_price, p_category, p_isAvailable);
END $$

DROP PROCEDURE IF EXISTS sp_updateMenuItem $$
CREATE PROCEDURE sp_updateMenuItem(
    IN p_menuItemID INT,
    IN p_itemName VARCHAR(100),
    IN p_price DECIMAL(8,2),
    IN p_category VARCHAR(50),
    IN p_isAvailable BOOLEAN
)
BEGIN
    UPDATE MenuItems
    SET itemName = p_itemName,
        price = p_price,
        category = p_category,
        isAvailable = p_isAvailable
    WHERE menuItemID = p_menuItemID;
END $$

DROP PROCEDURE IF EXISTS sp_deleteMenuItem $$
CREATE PROCEDURE sp_deleteMenuItem(
    IN p_menuItemID INT
)
BEGIN
    DELETE FROM MenuItems
    WHERE menuItemID = p_menuItemID;
END $$

-- ---------- OrderItems (M:M) CRUD ----------
DROP PROCEDURE IF EXISTS sp_addOrderItem $$
CREATE PROCEDURE sp_addOrderItem(
    IN p_orderID INT,
    IN p_menuItemID INT,
    IN p_quantity INT
)
BEGIN
    INSERT INTO OrderItems (orderID, menuItemID, quantity)
    VALUES (p_orderID, p_menuItemID, p_quantity);
END $$

DROP PROCEDURE IF EXISTS sp_updateOrderItem $$
CREATE PROCEDURE sp_updateOrderItem(
    IN p_orderItemID INT,
    IN p_orderID INT,
    IN p_menuItemID INT,
    IN p_quantity INT
)
BEGIN
    UPDATE OrderItems
    SET orderID = p_orderID,
        menuItemID = p_menuItemID,
        quantity = p_quantity
    WHERE orderItemID = p_orderItemID;
END $$

DROP PROCEDURE IF EXISTS sp_deleteOrderItem $$
CREATE PROCEDURE sp_deleteOrderItem(
    IN p_orderItemID INT
)
BEGIN
    DELETE FROM OrderItems
    WHERE orderItemID = p_orderItemID;
END $$

-- ---------- MenuItemIngredients (M:M) CRUD ----------
DROP PROCEDURE IF EXISTS sp_addMenuItemIngredient $$
CREATE PROCEDURE sp_addMenuItemIngredient(
    IN p_menuItemID INT,
    IN p_ingredientID INT,
    IN p_quantityRequired DECIMAL(8,2)
)
BEGIN
    INSERT INTO MenuItemIngredients (menuItemID, ingredientID, quantityRequired)
    VALUES (p_menuItemID, p_ingredientID, p_quantityRequired);
END $$

DROP PROCEDURE IF EXISTS sp_updateMenuItemIngredient $$
CREATE PROCEDURE sp_updateMenuItemIngredient(
    IN p_menuItemIngredientID INT,
    IN p_menuItemID INT,
    IN p_ingredientID INT,
    IN p_quantityRequired DECIMAL(8,2)
)
BEGIN
    UPDATE MenuItemIngredients
    SET menuItemID = p_menuItemID,
        ingredientID = p_ingredientID,
        quantityRequired = p_quantityRequired
    WHERE menuItemIngredientID = p_menuItemIngredientID;
END $$

DROP PROCEDURE IF EXISTS sp_deleteMenuItemIngredient $$
CREATE PROCEDURE sp_deleteMenuItemIngredient(
    IN p_menuItemIngredientID INT
)
BEGIN
    DELETE FROM MenuItemIngredients
    WHERE menuItemIngredientID = p_menuItemIngredientID;
END $$

DELIMITER ;