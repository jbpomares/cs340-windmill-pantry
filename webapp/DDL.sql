-- Windmill Pantry Restaurant Order / Inventory Management
-- Group 91

/*
Citation / Originality:
This file was developed by Group 91 for the CS340 final project.
Any external guidance or AI-assisted drafting was reviewed, modified, and integrated by the team.

Citations:
OpenAI. "ChatGPT (GPT-5.3)". https://chat.openai.com/
Retrieved: February - March, 2026
Type: AI-assisted development tool (SQL schema design)
Author: OpenAI
Notes: Used for guidance on structuring table definitions, primary/foreign key relationships, and applying constraints such as ON DELETE CASCADE and composite UNIQUE keys.


MariaDB Foundation. "MariaDB Server Documentation".  
https://mariadb.com/kb/en/documentation/  
Retrieved: February - March, 2026  
Type: Documentation  
Author: MariaDB Foundation  
Notes: Used for stored procedures, constraints, and SQL syntax.
*/

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_createSchema $$
CREATE PROCEDURE sp_createSchema()
BEGIN
    -- Disable foreign key checks
    SET FOREIGN_KEY_CHECKS = 0;

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

        CONSTRAINT uq_menuitem_ingredient UNIQUE (menuItemID, ingredientID)
    ) ENGINE=InnoDB;

    -- Sample Data Inserts
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

    -- Re-enable foreign key checks
    SET FOREIGN_KEY_CHECKS = 1;
END $$

DELIMITER ;

-- To (re)build the schema + sample data:
-- CALL sp_createSchema();
