
CREATE DATABASE IF NOT EXISTS PetManagementCRUDDB;

USE PetManagementCRUDDB;

CREATE TABLE Pets (
    PetID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Age INT NOT NULL,
    Street VARCHAR(150),
    City VARCHAR(100),
    ZipCode VARCHAR(10),
    State VARCHAR(50),
    TypeofPet VARCHAR(50) NOT NULL
);

CREATE TABLE Owners (
    OID INT AUTO_INCREMENT PRIMARY KEY,
    LastName VARCHAR(100) NOT NULL,
    Street VARCHAR(150),
    City VARCHAR(100),
    ZipCode VARCHAR(10),
    State VARCHAR(50),
    Age INT,
    AnnualIncome DECIMAL(12,2)
);

CREATE TABLE Owns (
    PetID INT NOT NULL,
    Year INT NOT NULL,
    OID INT NOT NULL,
    PetAgeatOwnership INT,
    PricePaid DECIMAL(10,2),

    PRIMARY KEY (PetID, Year, OID),

    FOREIGN KEY (PetID) REFERENCES Pets(PetID),
    FOREIGN KEY (OID) REFERENCES Owners(OID)
);

CREATE TABLE Likes (
    PetID INT NOT NULL,
    TypeofFood VARCHAR(50) NOT NULL,

    PRIMARY KEY (PetID, TypeofFood),

    FOREIGN KEY (PetID) REFERENCES Pets(PetID)
);

CREATE TABLE Foods (
    FoodID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Brand VARCHAR(100) NOT NULL,
    TypeofFood VARCHAR(50) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    ItemWeight DECIMAL(10,2),
    ClassofFood VARCHAR(50)
);

CREATE TABLE Purchases (
    OID INT NOT NULL,
    FoodID INT NOT NULL,
    PetID INT NOT NULL,
    Month INT NOT NULL,
    Year INT NOT NULL,
    Quantity INT NOT NULL,

    PRIMARY KEY (OID, FoodID, PetID, Month, Year),

    FOREIGN KEY (OID) REFERENCES Owners(OID),
    FOREIGN KEY (FoodID) REFERENCES Foods(FoodID),
    FOREIGN KEY (PetID) REFERENCES Pets(PetID),

    CHECK (Month BETWEEN 1 AND 12),
    CHECK (Quantity > 0)
);

INSERT INTO Pets
(Name, Age, Street, City, ZipCode, State, TypeofPet)
VALUES
('Ram', 3, '123 Main St', 'Moscow', '83843', 'Idaho', 'Dog'),
('Sita', 2, '456 Oak St', 'Pullman', '99163', 'Washington', 'Cat'),
('Krishna', 5, '789 Pine St', 'Boise', '83702', 'Idaho', 'Dog'),
('Hanuman', 4, '321 Elm St', 'Moscow', '83843', 'Idaho', 'Monkey'),
('Lakshman', 1, '654 Cedar St', 'Lewiston', '83501', 'Idaho', 'Bird');

INSERT INTO Owners
(LastName, Street, City, ZipCode, State, Age, AnnualIncome)
VALUES
('Sharma', '100 Main St', 'Moscow', '83843', 'Idaho', 30, 55000.00),
('Karki', '200 College Ave', 'Pullman', '99163', 'Washington', 28, 65000.00),
('Thapa', '300 University St', 'Boise', '83702', 'Idaho', 35, 75000.00);

INSERT INTO Owns
(PetID, Year, OID, PetAgeatOwnership, PricePaid)
VALUES
(1, 2024, 1, 1, 500.00),
(2, 2025, 2, 1, 250.00),
(3, 2023, 3, 2, 600.00);

INSERT INTO Likes (PetID, TypeofFood)
VALUES
(1, 'Dry Food'),
(2, 'Wet Food'),
(3, 'Dry Food'),
(4, 'Fruits'),
(5, 'Seeds');

INSERT INTO Foods
(Name, Brand, TypeofFood, Price, ItemWeight, ClassofFood)
VALUES
('Chicken Kibble', 'Purina', 'Dry Food', 25.99, 2.50, 'Standard'),
('Salmon Dinner', 'Fancy Feast', 'Wet Food', 12.50, 1.00, 'Premium'),
('Beef Bites', 'Pedigree', 'Dry Food', 18.99, 2.00, 'Standard'),
('Fruit Mix', 'Nature Best', 'Fruits', 9.99, 1.50, 'Natural'),
('Bird Seeds', 'Kaytee', 'Seeds', 8.99, 1.00, 'Standard');

INSERT INTO Purchases
(OID, FoodID, PetID, Month, Year, Quantity)
VALUES
(1, 1, 1, 10, 2026, 2),
(2, 2, 2, 11, 2026, 3),
(3, 3, 3, 9, 2026, 1),
(1, 4, 4, 8, 2026, 4),
(2, 5, 5, 7, 2026, 2);
