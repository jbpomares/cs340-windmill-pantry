-- Windmill Pantry Restaurant Order / Inventory Management
-- Group 91
-- Team Members: Trisha Rajesh, James Pomares, Leonardo Reyes
-- Project Step 2 Draft SQL File

-- Disable foreign key checks and start transaction
SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- Drop tables if they already exist (dependency order)
DROP TABLE IF EXISTS MenuItemIngredients;
DROP TABLE IF EXISTS OrderItems;
DROP TABLE IF EXISTS Ingredients;
DROP TABLE IF EXISTS MenuItems;
DROP TABLE IF EXISTS Orders;

-- Orders Table
CREATE TABLE Orders (
    orderID INT AUTO_INCREMENT PRIMARY KEY,
    orderDateTime DATETIME NOT NULL,
    orderTotal DECIMAL(8,2) NOT NULL,
    orderStatus VARCHAR(20) NOT NULL
) ENGINE=InnoDB;

-- MenuItems Table
CREATE TABLE MenuItems (
    menuItemID INT AUTO_INCREMENT PRIMARY KEY,
    itemName VARCHAR(100) NOT NULL,
    price DECIMAL(8,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    isAvailable BOOLEAN NOT NULL
) ENGINE=InnoDB;

-- Ingredients Table
CREATE TABLE Ingredients (
    ingredientID INT AUTO_INCREMENT PRIMARY KEY,
    ingredientName VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quantityInStock DECIMAL(8,2) NOT NULL,
    reorderLevel DECIMAL(8,2) NOT NULL
) ENGINE=InnoDB;

-- OrderItems Table (Orders ↔ MenuItems M:M)
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

-- MenuItemIngredients Table (MenuItems ↔ Ingredients M:M)
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

    -- Composite unique constraint prevents duplicate ingredient entries
    CONSTRAINT uq_menuitem_ingredient UNIQUE (menuItemID, ingredientID)

) ENGINE=InnoDB;

-- Sample Data Inserts

-- Orders
INSERT INTO Orders (orderDateTime, orderTotal, orderStatus) VALUES
('2026-01-10 08:15:00', 18.50, 'Completed'),
('2026-01-10 09:02:00', 12.00, 'Completed'),
('2026-01-10 10:30:00', 9.75, 'Canceled');

-- MenuItems
INSERT INTO MenuItems (itemName, price, category, isAvailable) VALUES
('Breakfast Sandwich', 7.50, 'Breakfast', TRUE),
('Avocado Toast', 6.25, 'Breakfast', TRUE),
('Iced Latte', 4.75, 'Beverage', TRUE),
('Tomato Soup', 5.50, 'Lunch', FALSE);

-- Ingredients
INSERT INTO Ingredients (ingredientName, unit, quantityInStock, reorderLevel) VALUES
('Bread', 'slices', 200.00, 50.00),
('Eggs', 'units', 120.00, 30.00),
('Avocado', 'grams', 5000.00, 1000.00),
('Milk', 'liters', 25.00, 5.00),
('Coffee Beans', 'grams', 3000.00, 500.00);

-- OrderItems
INSERT INTO OrderItems (orderID, menuItemID, quantity) VALUES
(1, 1, 1), -- Breakfast Sandwich
(1, 3, 1), -- Iced Latte
(2, 2, 1), -- Avocado Toast
(2, 3, 1); -- Iced Latte

-- MenuItemIngredients
INSERT INTO MenuItemIngredients (menuItemID, ingredientID, quantityRequired) VALUES
(1, 1, 2.00),   -- Breakfast Sandwich uses Bread
(1, 2, 1.00),   -- Breakfast Sandwich uses Eggs
(2, 1, 1.00),   -- Avocado Toast uses Bread
(2, 3, 75.00),  -- Avocado Toast uses Avocado
(3, 4, 0.25),   -- Iced Latte uses Milk
(3, 5, 18.00);  -- Iced Latte uses Coffee Beans

-- Commit and Restore Settings
SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
SET AUTOCOMMIT = 1;
