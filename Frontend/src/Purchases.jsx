
import { useEffect, useState } from "react";
import { api } from "./services/api";

const months = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const emptyForm = {
  OID: "",
  FoodID: "",
  PetID: "",
  Month: "",
  Year: "",
  Quantity: "",
};

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [owners, setOwners] = useState([]);
  const [pets, setPets] = useState([]);
  const [foods, setFoods] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingKey, setEditingKey] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getKey = (purchase) =>
    [
      purchase.OID,
      purchase.FoodID,
      purchase.PetID,
      purchase.Month,
      purchase.Year,
    ].join("-");

  const loadData = async () => {
    setLoading(true);

    try {
      const [
        purchaseData,
        ownerData,
        petData,
        foodData,
      ] = await Promise.all([
        api.get("/api/purchases"),
        api.get("/api/owners"),
        api.get("/api/pets"),
        api.get("/api/foods"),
      ]);

      setPurchases(purchaseData);
      setOwners(ownerData);
      setPets(petData);
      setFoods(foodData);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchPurchaseData = async () => {
      try {
        const [purchaseData, ownerData, petData, foodData] = await Promise.all([
          api.get("/api/purchases"),
          api.get("/api/owners"),
          api.get("/api/pets"),
          api.get("/api/foods"),
        ]);

        if (active) {
          setPurchases(purchaseData);
          setOwners(ownerData);
          setPets(petData);
          setFoods(foodData);
          setError("");
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchPurchaseData();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingKey(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (purchase) => {
    setEditingKey({
      OID: purchase.OID,
      FoodID: purchase.FoodID,
      PetID: purchase.PetID,
      Month: purchase.Month,
      Year: purchase.Year,
    });

    setForm({
      OID: String(purchase.OID),
      FoodID: String(purchase.FoodID),
      PetID: String(purchase.PetID),
      Month: String(purchase.Month),
      Year: String(purchase.Year),
      Quantity: String(purchase.Quantity),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingKey(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      OID: Number(form.OID),
      FoodID: Number(form.FoodID),
      PetID: Number(form.PetID),
      Month: Number(form.Month),
      Year: Number(form.Year),
      Quantity: Number(form.Quantity),
    };

    if (
      !Number.isInteger(payload.OID) ||
      payload.OID <= 0 ||
      !Number.isInteger(payload.FoodID) ||
      payload.FoodID <= 0 ||
      !Number.isInteger(payload.PetID) ||
      payload.PetID <= 0 ||
      !Number.isInteger(payload.Month) ||
      payload.Month < 1 ||
      payload.Month > 12 ||
      !Number.isInteger(payload.Year) ||
      payload.Year < 1900 ||
      payload.Year > 2100 ||
      !Number.isInteger(payload.Quantity) ||
      payload.Quantity <= 0
    ) {
      setError("Please enter valid purchase details.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingKey) {
        const endpoint =
          `/api/purchases/${editingKey.OID}` +
          `/${editingKey.FoodID}` +
          `/${editingKey.PetID}` +
          `/${editingKey.Month}` +
          `/${editingKey.Year}`;

        await api.put(endpoint, payload);
        setSuccess("Purchase updated successfully!");
      } else {
        await api.post("/api/purchases", payload);
        setSuccess("Purchase created successfully!");
      }

      closeForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (purchase) => {
    const confirmed = window.confirm(
      `Delete purchase of ${purchase.FoodName} ` +
      `for ${purchase.PetName}?`
    );

    if (!confirmed) return;

    const key = getKey(purchase);
    setDeletingKey(key);
    setError("");
    setSuccess("");

    try {
      await api.delete(
        `/api/purchases/${purchase.OID}` +
        `/${purchase.FoodID}` +
        `/${purchase.PetID}` +
        `/${purchase.Month}` +
        `/${purchase.Year}`
      );

      setSuccess("Purchase deleted successfully!");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingKey(null);
    }
  };

  const filteredPurchases = purchases.filter((purchase) => {
    const query = search.toLowerCase().trim();

    return (
      (purchase.OwnerName || "")
        .toLowerCase().includes(query) ||
      (purchase.FoodName || "")
        .toLowerCase().includes(query) ||
      (purchase.PetName || "")
        .toLowerCase().includes(query) ||
      String(purchase.OID).includes(query) ||
      String(purchase.FoodID).includes(query) ||
      String(purchase.PetID).includes(query) ||
      String(purchase.Year).includes(query) ||
      months[Number(purchase.Month) - 1]
        ?.toLowerCase().includes(query)
    );
  });

  const formatCurrency = (value) =>
    Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            Purchases Management
          </h4>

          <p className="text-muted mb-0">
            Manage food purchases stored in MySQL.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openAddForm}
          disabled={loading}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Purchase
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </div>
      )}

      {/* Purchase Records */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <h5 className="fw-bold mb-0">
              Purchase Records ({loading || (error && purchases.length === 0) ? "—" : purchases.length})
            </h5>

            <div
              className="input-group"
              style={{ maxWidth: "300px" }}
            >
              <span className="input-group-text bg-white">
                <i className="bi bi-search"></i>
              </span>

              <input
                type="search"
                className="form-control"
                placeholder="Search purchases..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Owner</th>
                  <th>Food</th>
                  <th>Pet</th>
                  <th>Month / Year</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      Loading purchases...
                    </td>
                  </tr>
                ) : error && purchases.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-5">
                      Unable to load purchases. Check the API connection and
                      try again.
                    </td>
                  </tr>
                ) : filteredPurchases.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center text-muted py-5"
                    >
                      <i className="bi bi-cart3 fs-2 d-block mb-2"></i>
                      No purchase records found.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr key={getKey(purchase)}>
                      <td>
                        <strong>{purchase.OwnerName}</strong>
                        <small className="d-block text-muted">
                          Owner #{purchase.OID}
                        </small>
                      </td>

                      <td>
                        <strong>{purchase.FoodName}</strong>
                        <small className="d-block text-muted">
                          Food #{purchase.FoodID}
                        </small>
                      </td>

                      <td>
                        <strong>{purchase.PetName}</strong>
                        <small className="d-block text-muted">
                          Pet #{purchase.PetID}
                        </small>
                      </td>

                      <td>
                        {months[Number(purchase.Month) - 1]}{" "}
                        {purchase.Year}
                      </td>

                      <td>
                        <span className="badge bg-success-subtle text-success">
                          {purchase.Quantity}
                        </span>
                      </td>

                      <td>{formatCurrency(purchase.Price)}</td>

                      <td className="fw-semibold">
                        {formatCurrency(purchase.TotalPrice)}
                      </td>

                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openEditForm(purchase)}
                            aria-label="Edit purchase"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(purchase)}
                            disabled={
                              deletingKey === getKey(purchase)
                            }
                            aria-label="Delete purchase"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Purchase Modal */}
      {showForm && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-label="Purchase form"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingKey
                    ? "Edit Purchase"
                    : "Add New Purchase"}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Close"
                />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <div className="row g-3">
                    {/* Owner */}
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="purchases-oid">
                        Select Owner
                      </label>

                      <select
                        className="form-select"
                        name="OID" id="purchases-oid"
                        value={form.OID}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select an owner</option>

                        {owners.map((owner) => (
                          <option
                            key={owner.OID}
                            value={owner.OID}
                          >
                            {owner.LastName} (ID: {owner.OID})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Food */}
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="purchases-foodid">
                        Select Food
                      </label>

                      <select
                        className="form-select"
                        name="FoodID" id="purchases-foodid"
                        value={form.FoodID}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select a food</option>

                        {foods.map((food) => (
                          <option
                            key={food.FoodID}
                            value={food.FoodID}
                          >
                            {food.Name} (ID: {food.FoodID})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Pet */}
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="purchases-petid">
                        Select Pet
                      </label>

                      <select
                        className="form-select"
                        name="PetID" id="purchases-petid"
                        value={form.PetID}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select a pet</option>

                        {pets.map((pet) => (
                          <option
                            key={pet.PetID}
                            value={pet.PetID}
                          >
                            {pet.Name} (ID: {pet.PetID})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Month */}
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="purchases-month">Month</label>

                      <select
                        className="form-select"
                        name="Month" id="purchases-month"
                        value={form.Month}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select month</option>

                        {months.map((month, index) => (
                          <option
                            key={month}
                            value={index + 1}
                          >
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Year */}
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="purchases-year">Year</label>

                      <input
                        type="number"
                        className="form-control"
                        name="Year" id="purchases-year"
                        value={form.Year}
                        onChange={handleChange}
                        min="1900"
                        max="2100"
                        step="1"
                        placeholder="e.g. 2026"
                        required
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="purchases-quantity">Quantity</label>

                      <input
                        type="number"
                        className="form-control"
                        name="Quantity" id="purchases-quantity"
                        value={form.Quantity}
                        onChange={handleChange}
                        min="1"
                        step="1"
                        placeholder="Enter quantity"
                        required
                      />
                    </div>
                  </div>

                  {(owners.length === 0 ||
                    pets.length === 0 ||
                    foods.length === 0) && (
                    <div className="alert alert-warning mt-3 mb-0">
                      Add at least one owner, pet, and food
                      before creating a purchase.
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      saving ||
                      owners.length === 0 ||
                      pets.length === 0 ||
                      foods.length === 0
                    }
                  >
                    <i className="bi bi-check-lg me-2"></i>

                    {saving
                      ? "Saving..."
                      : editingKey
                      ? "Save Changes"
                      : "Create Purchase"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Purchases;
