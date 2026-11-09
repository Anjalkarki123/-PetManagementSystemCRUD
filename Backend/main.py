
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import get_connection

app = FastAPI(title="Pet Management CRUD API")



app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:517[0-9]+",
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)


@app.get("/")
def home():
    return {"message": "Pet Management CRUD API is running!"}


@app.get("/api/pets")
def get_pets():
    try:
        connection = get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM Pets")
                return cursor.fetchall()
        finally:
            connection.close()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve pets from the database"
        )
    
from pydantic import BaseModel, Field


class PetCreate(BaseModel):
    Name: str = Field(min_length=1, max_length=100)
    Age: int = Field(ge=0, le=100)
    Street: str = ""
    City: str = ""
    ZipCode: str = ""
    State: str = ""
    TypeofPet: str = Field(min_length=1, max_length=50)


@app.post("/api/pets", status_code=201)
def create_pet(pet: PetCreate):
    try:
        connection = get_connection()

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO Pets
                    (Name, Age, Street, City, ZipCode, State, TypeofPet)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        pet.Name,
                        pet.Age,
                        pet.Street,
                        pet.City,
                        pet.ZipCode,
                        pet.State,
                        pet.TypeofPet,
                    ),
                )
                new_id = cursor.lastrowid

            connection.commit()

            return {
                "message": "Pet created successfully",
                "PetID": new_id,
            }

        finally:
            connection.close()

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to create pet"
        )

@app.put("/api/pets/{pet_id}")
def update_pet(pet_id: int, pet: PetCreate):
    if pet_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="Invalid PetID"
        )

    try:
        connection = get_connection()

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE Pets
                    SET Name = %s,
                        Age = %s,
                        Street = %s,
                        City = %s,
                        ZipCode = %s,
                        State = %s,
                        TypeofPet = %s
                    WHERE PetID = %s
                    """,
                    (
                        pet.Name,
                        pet.Age,
                        pet.Street,
                        pet.City,
                        pet.ZipCode,
                        pet.State,
                        pet.TypeofPet,
                        pet_id
                    )
                )

                affected_rows = cursor.rowcount

            if affected_rows == 0:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT PetID FROM Pets WHERE PetID = %s",
                        (pet_id,)
                    )
                    if cursor.fetchone() is None:
                        raise HTTPException(
                            status_code=404,
                            detail="Pet not found"
                        )

            connection.commit()

            return {
                "message": "Pet updated successfully",
                "PetID": pet_id
            }

        finally:
            connection.close()

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to update pet"
        )

@app.delete("/api/pets/{pet_id}")
def delete_pet(pet_id: int):
    if pet_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="Invalid PetID"
        )

    try:
        connection = get_connection()

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM Pets WHERE PetID = %s",
                    (pet_id,)
                )
                deleted_rows = cursor.rowcount

            connection.commit()

            if deleted_rows == 0:
                raise HTTPException(
                    status_code=404,
                    detail="Pet not found"
                )

            return {
                "message": "Pet deleted successfully",
                "PetID": pet_id
            }

        finally:
            connection.close()

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to delete pet. It may be referenced by ownership, likes, or purchases."
        )

@app.get("/api/owners")
def get_owners():
    try:
        connection = get_connection()

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM Owners ORDER BY OID"
                )
                owners = cursor.fetchall()

                return owners

        finally:
            connection.close()

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve owners"
        )

from pydantic import BaseModel, Field


class OwnerCreate(BaseModel):
    LastName: str = Field(min_length=1, max_length=100)
    Street: str = Field(default="", max_length=150)
    City: str = Field(default="", max_length=100)
    ZipCode: str = Field(default="", max_length=10)
    State: str = Field(default="", max_length=50)
    Age: int = Field(ge=0, le=120)
    AnnualIncome: float = Field(ge=0)


@app.post("/api/owners", status_code=201)
def create_owner(owner: OwnerCreate):
    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO Owners
                (LastName, Street, City, ZipCode,
                 State, Age, AnnualIncome)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    owner.LastName,
                    owner.Street,
                    owner.City,
                    owner.ZipCode,
                    owner.State,
                    owner.Age,
                    owner.AnnualIncome,
                )
            )

            new_id = cursor.lastrowid

        connection.commit()

        return {
            "message": "Owner created successfully",
            "OID": new_id
        }

    except Exception:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to create owner"
        )

    finally:
        if connection:
            connection.close()

@app.put("/api/owners/{oid}")
def update_owner(oid: int, owner: OwnerCreate):
    if oid <= 0:
        raise HTTPException(
            status_code=422,
            detail="Invalid owner ID"
        )

    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE Owners
                SET LastName = %s,
                    Street = %s,
                    City = %s,
                    ZipCode = %s,
                    State = %s,
                    Age = %s,
                    AnnualIncome = %s
                WHERE OID = %s
                """,
                (
                    owner.LastName,
                    owner.Street,
                    owner.City,
                    owner.ZipCode,
                    owner.State,
                    owner.Age,
                    owner.AnnualIncome,
                    oid
                )
            )

            cursor.execute(
                "SELECT OID FROM Owners WHERE OID = %s",
                (oid,)
            )
            exists = cursor.fetchone()

        if not exists:
            connection.rollback()
            raise HTTPException(
                status_code=404,
                detail="Owner not found"
            )

        connection.commit()

        return {
            "message": "Owner updated successfully",
            "OID": oid
        }

    except HTTPException:
        raise

    except Exception:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update owner"
        )

    finally:
        if connection:
            connection.close()

from pymysql.err import IntegrityError


@app.delete("/api/owners/{oid}")
def delete_owner(oid: int):
    if oid <= 0:
        raise HTTPException(
            status_code=422,
            detail="Invalid owner ID"
        )

    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM Owners WHERE OID = %s",
                (oid,)
            )
            deleted_rows = cursor.rowcount

        if deleted_rows == 0:
            connection.rollback()
            raise HTTPException(
                status_code=404,
                detail="Owner not found"
            )

        connection.commit()

        return {
            "message": "Owner deleted successfully",
            "OID": oid
        }

    except IntegrityError:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Cannot delete this owner because "
                "related ownership or purchase records exist."
            )
        )

    except HTTPException:
        raise

    except Exception:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete owner"
        )

    finally:
        if connection:
            connection.close()

@app.get("/api/owns")
def get_ownerships():
    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    ow.PetID,
                    p.Name AS PetName,
                    ow.OID,
                    o.LastName AS OwnerName,
                    ow.Year,
                    ow.PetAgeatOwnership,
                    ow.PricePaid
                FROM Owns ow
                JOIN Pets p ON ow.PetID = p.PetID
                JOIN Owners o ON ow.OID = o.OID
                ORDER BY ow.Year DESC
                """
            )
            return cursor.fetchall()

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve ownership records"
        )

    finally:
        if connection:
            connection.close()

from pydantic import BaseModel, Field
from pymysql.err import IntegrityError


class OwnershipCreate(BaseModel):
    PetID: int = Field(gt=0)
    Year: int = Field(ge=1900, le=2100)
    OID: int = Field(gt=0)
    PetAgeatOwnership: int = Field(ge=0, le=100)
    PricePaid: float = Field(ge=0)


@app.post("/api/owns", status_code=201)
def create_ownership(ownership: OwnershipCreate):
    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO Owns
                (PetID, Year, OID, PetAgeatOwnership, PricePaid)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    ownership.PetID,
                    ownership.Year,
                    ownership.OID,
                    ownership.PetAgeatOwnership,
                    ownership.PricePaid
                )
            )

        connection.commit()

        return {
            "message": "Ownership created successfully",
            "PetID": ownership.PetID,
            "OID": ownership.OID,
            "Year": ownership.Year
        }

    except IntegrityError as exc:
        if connection:
            connection.rollback()

        error_code = exc.args[0]

        if error_code == 1062:
            raise HTTPException(
                status_code=409,
                detail="This ownership record already exists"
            )

        if error_code == 1452:
            raise HTTPException(
                status_code=400,
                detail="PetID or OID does not exist"
            )

        raise HTTPException(
            status_code=400,
            detail="Invalid ownership relationship"
        )

    except Exception:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to create ownership"
        )

    finally:
        if connection:
            connection.close()

@app.put("/api/owns/{pet_id}/{year}/{oid}")
def update_ownership(
    pet_id: int,
    year: int,
    oid: int,
    ownership: OwnershipCreate
):
    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT PetID
                FROM Owns
                WHERE PetID = %s AND Year = %s AND OID = %s
                """,
                (pet_id, year, oid)
            )

            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Ownership record not found"
                )

            cursor.execute(
                """
                UPDATE Owns
                SET PetID = %s,
                    Year = %s,
                    OID = %s,
                    PetAgeatOwnership = %s,
                    PricePaid = %s
                WHERE PetID = %s AND Year = %s AND OID = %s
                """,
                (
                    ownership.PetID,
                    ownership.Year,
                    ownership.OID,
                    ownership.PetAgeatOwnership,
                    ownership.PricePaid,
                    pet_id,
                    year,
                    oid
                )
            )

        connection.commit()

        return {
            "message": "Ownership updated successfully",
            "PetID": ownership.PetID,
            "OID": ownership.OID,
            "Year": ownership.Year
        }

    except HTTPException:
        raise

    except IntegrityError as exc:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=409,
            detail="Ownership update conflicts with existing database records"
        ) from exc

    except Exception:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to update ownership"
        )

    finally:
        if connection:
            connection.close()

@app.delete("/api/owns/{pet_id}/{year}/{oid}")
def delete_ownership(pet_id: int, year: int, oid: int):
    if pet_id <= 0 or oid <= 0 or year < 1900:
        raise HTTPException(
            status_code=422,
            detail="Invalid ownership identifiers"
        )

    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM Owns
                WHERE PetID = %s
                  AND Year = %s
                  AND OID = %s
                """,
                (pet_id, year, oid)
            )

            deleted_rows = cursor.rowcount

        if deleted_rows == 0:
            connection.rollback()
            raise HTTPException(
                status_code=404,
                detail="Ownership record not found"
            )

        connection.commit()

        return {
            "message": "Ownership deleted successfully",
            "PetID": pet_id,
            "Year": year,
            "OID": oid
        }

    except HTTPException:
        raise

    except IntegrityError:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=409,
            detail="Ownership record cannot be deleted due to a database constraint"
        )

    except Exception:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to delete ownership"
        )

    finally:
        if connection:
            connection.close()

@app.get("/api/foods")
def get_foods():
    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM Foods ORDER BY FoodID"
            )
            foods = cursor.fetchall()

        return foods

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve food products"
        )

    finally:
        if connection:
            connection.close()

class FoodCreate(BaseModel):
    Name: str = Field(min_length=1, max_length=100)
    Brand: str = Field(min_length=1, max_length=100)
    TypeofFood: str = Field(min_length=1, max_length=50)
    Price: float = Field(ge=0)
    ItemWeight: float = Field(ge=0)
    ClassofFood: str = Field(default="", max_length=50)


@app.post("/api/foods", status_code=201)
def create_food(food: FoodCreate):
    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO Foods
                (Name, Brand, TypeofFood, Price,
                 ItemWeight, ClassofFood)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    food.Name,
                    food.Brand,
                    food.TypeofFood,
                    food.Price,
                    food.ItemWeight,
                    food.ClassofFood
                )
            )
            new_id = cursor.lastrowid

        connection.commit()

        return {
            "message": "Food created successfully",
            "FoodID": new_id
        }

    except Exception:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create food product"
        )

    finally:
        if connection:
            connection.close()

@app.put("/api/foods/{food_id}")
def update_food(food_id: int, food: FoodCreate):
    if food_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="Invalid FoodID"
        )

    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT FoodID FROM Foods WHERE FoodID = %s",
                (food_id,)
            )

            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Food product not found"
                )

            cursor.execute(
                """
                UPDATE Foods
                SET Name = %s,
                    Brand = %s,
                    TypeofFood = %s,
                    Price = %s,
                    ItemWeight = %s,
                    ClassofFood = %s
                WHERE FoodID = %s
                """,
                (
                    food.Name,
                    food.Brand,
                    food.TypeofFood,
                    food.Price,
                    food.ItemWeight,
                    food.ClassofFood,
                    food_id
                )
            )

        connection.commit()

        return {
            "message": "Food updated successfully",
            "FoodID": food_id
        }

    except HTTPException:
        raise

    except Exception:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to update food product"
        )

    finally:
        if connection:
            connection.close()

@app.delete("/api/foods/{food_id}")
def delete_food(food_id: int):
    if food_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="Invalid FoodID"
        )

    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM Foods WHERE FoodID = %s",
                (food_id,)
            )
            deleted_rows = cursor.rowcount

        if deleted_rows == 0:
            connection.rollback()
            raise HTTPException(
                status_code=404,
                detail="Food product not found"
            )

        connection.commit()

        return {
            "message": "Food deleted successfully",
            "FoodID": food_id
        }

    except IntegrityError:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Cannot delete this food because "
                "it is referenced by purchase records."
            )
        )

    except HTTPException:
        raise

    except Exception:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete food product"
        )

    finally:
        if connection:
            connection.close()

@app.get("/api/purchases")
def get_purchases():
    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    pu.OID,
                    o.LastName AS OwnerName,
                    pu.FoodID,
                    f.Name AS FoodName,
                    pu.PetID,
                    p.Name AS PetName,
                    pu.Month,
                    pu.Year,
                    pu.Quantity,
                    f.Price,
                    (pu.Quantity * f.Price) AS TotalPrice
                FROM Purchases pu
                JOIN Owners o ON pu.OID = o.OID
                JOIN Foods f ON pu.FoodID = f.FoodID
                JOIN Pets p ON pu.PetID = p.PetID
                ORDER BY pu.Year DESC, pu.Month DESC
                """
            )

            purchases = cursor.fetchall()

        return purchases

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve purchases"
        )

    finally:
        if connection:
            connection.close()

class PurchaseCreate(BaseModel):
    OID: int = Field(gt=0)
    FoodID: int = Field(gt=0)
    PetID: int = Field(gt=0)
    Month: int = Field(ge=1, le=12)
    Year: int = Field(ge=1900, le=2100)
    Quantity: int = Field(gt=0)


@app.post("/api/purchases", status_code=201)
def create_purchase(purchase: PurchaseCreate):
    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO Purchases
                (OID, FoodID, PetID, Month, Year, Quantity)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    purchase.OID,
                    purchase.FoodID,
                    purchase.PetID,
                    purchase.Month,
                    purchase.Year,
                    purchase.Quantity
                )
            )

        connection.commit()

        return {
            "message": "Purchase created successfully",
            "OID": purchase.OID,
            "FoodID": purchase.FoodID,
            "PetID": purchase.PetID,
            "Month": purchase.Month,
            "Year": purchase.Year
        }

    except IntegrityError as exc:
        if connection:
            connection.rollback()

        if exc.args[0] == 1062:
            raise HTTPException(
                status_code=409,
                detail="This purchase record already exists"
            )

        if exc.args[0] == 1452:
            raise HTTPException(
                status_code=400,
                detail="Owner, food, or pet does not exist"
            )

        raise HTTPException(
            status_code=400,
            detail="Invalid purchase data"
        )

    except Exception:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to create purchase"
        )

    finally:
        if connection:
            connection.close()

@app.put("/api/purchases/{oid}/{food_id}/{pet_id}/{month}/{year}")
def update_purchase(
    oid: int,
    food_id: int,
    pet_id: int,
    month: int,
    year: int,
    purchase: PurchaseCreate
):
    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT OID FROM Purchases
                WHERE OID = %s
                  AND FoodID = %s
                  AND PetID = %s
                  AND Month = %s
                  AND Year = %s
                """,
                (oid, food_id, pet_id, month, year)
            )

            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Purchase record not found"
                )

            cursor.execute(
                """
                UPDATE Purchases
                SET OID = %s,
                    FoodID = %s,
                    PetID = %s,
                    Month = %s,
                    Year = %s,
                    Quantity = %s
                WHERE OID = %s
                  AND FoodID = %s
                  AND PetID = %s
                  AND Month = %s
                  AND Year = %s
                """,
                (
                    purchase.OID,
                    purchase.FoodID,
                    purchase.PetID,
                    purchase.Month,
                    purchase.Year,
                    purchase.Quantity,
                    oid,
                    food_id,
                    pet_id,
                    month,
                    year
                )
            )

        connection.commit()

        return {
            "message": "Purchase updated successfully",
            "OID": purchase.OID,
            "FoodID": purchase.FoodID,
            "PetID": purchase.PetID,
            "Month": purchase.Month,
            "Year": purchase.Year
        }

    except HTTPException:
        raise

    except IntegrityError as exc:
        if connection:
            connection.rollback()

        error_code = exc.args[0]
        if error_code == 1062:
            detail = "A purchase with those identifiers already exists"
        elif error_code == 1452:
            detail = "Referenced owner, food, or pet does not exist"
        else:
            detail = "Purchase update violates a database constraint"

        raise HTTPException(
            status_code=409,
            detail=detail
        )

    except Exception:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to update purchase"
        )

    finally:
        if connection:
            connection.close()

@app.delete("/api/purchases/{oid}/{food_id}/{pet_id}/{month}/{year}")
def delete_purchase(
    oid: int,
    food_id: int,
    pet_id: int,
    month: int,
    year: int
):
    if (
        oid <= 0
        or food_id <= 0
        or pet_id <= 0
        or month < 1
        or month > 12
        or year < 1900
    ):
        raise HTTPException(
            status_code=422,
            detail="Invalid purchase identifiers"
        )

    connection = None

    try:
        connection = get_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM Purchases
                WHERE OID = %s
                  AND FoodID = %s
                  AND PetID = %s
                  AND Month = %s
                  AND Year = %s
                """,
                (oid, food_id, pet_id, month, year)
            )

            deleted_rows = cursor.rowcount

        if deleted_rows == 0:
            connection.rollback()
            raise HTTPException(
                status_code=404,
                detail="Purchase record not found"
            )

        connection.commit()

        return {
            "message": "Purchase deleted successfully",
            "OID": oid,
            "FoodID": food_id,
            "PetID": pet_id,
            "Month": month,
            "Year": year
        }

    except HTTPException:
        raise

    except IntegrityError:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=409,
            detail="Cannot delete purchase due to a database constraint"
        )

    except Exception:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete purchase"
        )

    finally:
        if connection:
            connection.close()
