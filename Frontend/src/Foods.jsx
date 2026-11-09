
import { useEffect, useState } from "react";
import { api } from "./services/api";

const emptyForm = {
  Name: "",
  Brand: "",
  TypeofFood: "",
  Price: "",
  ItemWeight: "",
  ClassofFood: "",
};

function Foods() {
  const [foods, setFoods] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFoods = async () => {
    setLoading(true);

    try {
      const data = await api.get("/api/foods");
      setFoods(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchFoods = async () => {
      try {
        const data = await api.get("/api/foods");
        if (active) {
          setFoods(data);
          setError("");
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchFoods();
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
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (food) => {
    setForm({
      Name: food.Name || "",
      Brand: food.Brand || "",
      TypeofFood: food.TypeofFood || "",
      Price: String(food.Price),
      ItemWeight: String(food.ItemWeight),
      ClassofFood: food.ClassofFood || "",
    });

    setEditingId(food.FoodID);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const foodData = {
      Name: form.Name.trim(),
      Brand: form.Brand.trim(),
      TypeofFood: form.TypeofFood,
      Price: Number(form.Price),
      ItemWeight: Number(form.ItemWeight),
      ClassofFood: form.ClassofFood,
    };

    if (
      !foodData.Name ||
      !foodData.Brand ||
      !foodData.TypeofFood ||
      !Number.isFinite(foodData.Price) ||
      foodData.Price < 0 ||
      !Number.isFinite(foodData.ItemWeight) ||
      foodData.ItemWeight <= 0
    ) {
      setError("Please enter valid food information.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId !== null) {
        await api.put(
          `/api/foods/${editingId}`,
          foodData
        );

        setSuccess("Food updated successfully!");
      } else {
        await api.post("/api/foods", foodData);

        setSuccess("Food created successfully!");
      }

      closeForm();
      await loadFoods();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (foodId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this food product?"
    );

    if (!confirmed) return;

    setDeletingId(foodId);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/api/foods/${foodId}`);

      setSuccess("Food deleted successfully!");

      await loadFoods();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredFoods = foods.filter((food) => {
    const query = search.toLowerCase().trim();

    return (
      (food.Name || "").toLowerCase().includes(query) ||
      (food.Brand || "").toLowerCase().includes(query) ||
      (food.TypeofFood || "").toLowerCase().includes(query) ||
      (food.ClassofFood || "").toLowerCase().includes(query) ||
      String(food.FoodID).includes(query)
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
            Foods Management
          </h4>

          <p className="text-muted mb-0">
            Manage pet food products stored in MySQL.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openAddForm}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add New Food
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

      {/* Foods Table */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <h5 className="fw-bold mb-0">
              All Foods ({loading || (error && foods.length === 0) ? "—" : foods.length})
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
                placeholder="Search food products..."
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
                  <th>Food ID</th>
                  <th>Food Name</th>
                  <th>Brand</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Weight</th>
                  <th>Class</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      />
                      <p className="mt-2 text-muted">
                        Loading foods...
                      </p>
                    </td>
                  </tr>
                ) : error && foods.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-5">
                      Unable to load foods. Check the API connection and try
                      again.
                    </td>
                  </tr>
                ) : filteredFoods.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center text-muted py-5"
                    >
                      <i className="bi bi-basket fs-2 d-block mb-2"></i>
                      No food products found.
                    </td>
                  </tr>
                ) : (
                  filteredFoods.map((food) => (
                    <tr key={food.FoodID}>
                      <td>#{food.FoodID}</td>

                      <td className="fw-semibold">
                        {food.Name}
                      </td>

                      <td>{food.Brand}</td>

                      <td>
                        <span className="badge bg-primary-subtle text-primary">
                          {food.TypeofFood}
                        </span>
                      </td>

                      <td className="fw-semibold">
                        {formatCurrency(food.Price)}
                      </td>

                      <td>{food.ItemWeight}</td>

                      <td>{food.ClassofFood}</td>

                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openEditForm(food)}
                            aria-label={`Edit ${food.Name}`}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              handleDelete(food.FoodID)
                            }
                            disabled={deletingId === food.FoodID}
                            aria-label={`Delete ${food.Name}`}
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

      {/* Add / Edit Food Modal */}
      {showForm && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-label="Food product form"
          style={{
            background: "rgba(0,0,0,0.55)",
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingId !== null
                    ? "Edit Food Product"
                    : "Add New Food Product"}
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
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="foods-name">
                        Food Name
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        name="Name" id="foods-name"
                        value={form.Name}
                        onChange={handleChange}
                        placeholder="e.g. Adult Dog Formula"
                        maxLength={100}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="foods-brand">
                        Brand
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        name="Brand" id="foods-brand"
                        value={form.Brand}
                        onChange={handleChange}
                        placeholder="e.g. Purina"
                        maxLength={100}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="foods-typeoffood">
                        Type of Food
                      </label>

                      <select
                        className="form-select"
                        name="TypeofFood" id="foods-typeoffood"
                        value={form.TypeofFood}
                        onChange={handleChange}
                        required
                      >
                        <option value="">
                          Select food type
                        </option>
                        <option value="Dry">Dry</option>
                        <option value="Wet">Wet</option>
                        <option value="Raw">Raw</option>
                        <option value="Treats">Treats</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="foods-classoffood">
                        Class of Food
                      </label>

                      <select
                        className="form-select"
                        name="ClassofFood" id="foods-classoffood"
                        value={form.ClassofFood}
                        onChange={handleChange}
                        required
                      >
                        <option value="">
                          Select food class
                        </option>
                        <option value="Dog">Dog</option>
                        <option value="Cat">Cat</option>
                        <option value="Bird">Bird</option>
                        <option value="Fish">Fish</option>
                        <option value="Small Animal">
                          Small Animal
                        </option>
                        <option value="General">
                          General
                        </option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="foods-price">
                        Price ($)
                      </label>

                      <input
                        type="number"
                        className="form-control"
                        name="Price" id="foods-price"
                        value={form.Price}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="foods-itemweight">
                        Item Weight
                      </label>

                      <input
                        type="number"
                        className="form-control"
                        name="ItemWeight" id="foods-itemweight"
                        value={form.ItemWeight}
                        onChange={handleChange}
                        placeholder="e.g. 5.5"
                        min="0.01"
                        step="any"
                        required
                      />
                    </div>
                  </div>
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
                    disabled={saving}
                  >
                    <i className="bi bi-check-lg me-2"></i>

                    {saving
                      ? "Saving..."
                      : editingId !== null
                      ? "Save Changes"
                      : "Create Food"}
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

export default Foods;
