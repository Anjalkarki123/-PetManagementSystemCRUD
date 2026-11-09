
import { useEffect, useState } from "react";
import { api } from "./services/api";

const emptyForm = {
  LastName: "",
  Street: "",
  City: "",
  ZipCode: "",
  State: "",
  Age: "",
  AnnualIncome: "",
};

function Owners() {
  const [owners, setOwners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOwners = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api.get("/api/owners");
      setOwners(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchOwners = async () => {
      try {
        const data = await api.get("/api/owners");
        if (active) {
          setOwners(data);
          setError("");
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchOwners();
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
    setShowForm(true);
  };

  const openEditForm = (owner) => {
    setForm({
      LastName: owner.LastName || "",
      Street: owner.Street || "",
      City: owner.City || "",
      ZipCode: owner.ZipCode || "",
      State: owner.State || "",
      Age: String(owner.Age),
      AnnualIncome: String(owner.AnnualIncome),
    });

    setEditingId(owner.OID);
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const ownerData = {
      ...form,
      LastName: form.LastName.trim(),
      Age: Number(form.Age),
      AnnualIncome: Number(form.AnnualIncome),
    };

    try {
      if (editingId !== null) {
        await api.put(
          `/api/owners/${editingId}`,
          ownerData
        );

        setSuccess("Owner updated successfully!");
      } else {
        await api.post("/api/owners", ownerData);

        setSuccess("Owner created successfully!");
      }

      closeForm();
      await loadOwners();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ownerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this owner?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/api/owners/${ownerId}`);

      setSuccess("Owner deleted successfully!");

      await loadOwners();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredOwners = owners.filter((owner) => {
    const query = search.toLowerCase().trim();

    return (
      (owner.LastName || "").toLowerCase().includes(query) ||
      (owner.City || "").toLowerCase().includes(query) ||
      String(owner.OID).includes(query)
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
            Owners Management
          </h4>

          <p className="text-muted mb-0">
            Manage pet owners from your MySQL database.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openAddForm}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add New Owner
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

      {/* Owners Table */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <h5 className="fw-bold mb-0">
              All Owners ({loading || (error && owners.length === 0) ? "—" : owners.length})
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
                placeholder="Search owners..."
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
                  <th>Owner ID</th>
                  <th>Last Name</th>
                  <th>Age</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Annual Income</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-5"
                    >
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      />
                      <p className="mt-2 text-muted">
                        Loading owners...
                      </p>
                    </td>
                  </tr>
                ) : error && owners.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-5">
                      Unable to load owners. Check the API connection and try
                      again.
                    </td>
                  </tr>
                ) : filteredOwners.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center text-muted py-5"
                    >
                      <i className="bi bi-people fs-2 d-block mb-2"></i>
                      No owners found.
                    </td>
                  </tr>
                ) : (
                  filteredOwners.map((owner) => (
                    <tr key={owner.OID}>
                      <td>#{owner.OID}</td>

                      <td className="fw-semibold">
                        {owner.LastName}
                      </td>

                      <td>{owner.Age}</td>
                      <td>{owner.City}</td>
                      <td>{owner.State}</td>

                      <td>
                        {formatCurrency(owner.AnnualIncome)}
                      </td>

                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              openEditForm(owner)
                            }
                            aria-label={`Edit ${owner.LastName}`}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              handleDelete(owner.OID)
                            }
                            aria-label={`Delete ${owner.LastName}`}
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

      {/* Add / Edit Owner Modal */}
      {showForm && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-label="Owner form"
          style={{
            background: "rgba(0,0,0,0.55)",
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingId !== null
                    ? "Edit Owner"
                    : "Add New Owner"}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeForm}
                  aria-label="Close"
                  disabled={saving}
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
                      <label className="form-label" htmlFor="owners-lastname">
                        Last Name
                      </label>

                      <input
                        className="form-control"
                        name="LastName" id="owners-lastname"
                        value={form.LastName}
                        onChange={handleChange}
                        maxLength={100}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="owners-age">
                        Age
                      </label>

                      <input
                        type="number"
                        className="form-control"
                        name="Age" id="owners-age"
                        value={form.Age}
                        onChange={handleChange}
                        min="0"
                        max="120"
                        step="1"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="owners-street">
                        Street
                      </label>

                      <input
                        className="form-control"
                        name="Street" id="owners-street"
                        value={form.Street}
                        onChange={handleChange}
                        maxLength={150}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="owners-city">
                        City
                      </label>

                      <input
                        className="form-control"
                        name="City" id="owners-city"
                        value={form.City}
                        onChange={handleChange}
                        maxLength={100}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="owners-state">
                        State
                      </label>

                      <input
                        className="form-control"
                        name="State" id="owners-state"
                        value={form.State}
                        onChange={handleChange}
                        maxLength={50}
                        placeholder="e.g. Idaho"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="owners-zipcode">
                        Zip Code
                      </label>

                      <input
                        className="form-control"
                        name="ZipCode" id="owners-zipcode"
                        value={form.ZipCode}
                        onChange={handleChange}
                        maxLength={10}
                        placeholder="e.g. 83843"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="owners-annualincome">
                        Annual Income ($)
                      </label>

                      <input
                        type="number"
                        className="form-control"
                        name="AnnualIncome" id="owners-annualincome"
                        value={form.AnnualIncome}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
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
                      : "Create Owner"}
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

export default Owners;
