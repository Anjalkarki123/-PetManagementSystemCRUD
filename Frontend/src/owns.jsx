
import { useEffect, useState } from "react";
import { api } from "./services/api";

const emptyForm = {
  PetID: "",
  OID: "",
  Year: "",
  PetAgeatOwnership: "",
  PricePaid: "",
};

function Owns() {
  const [records, setRecords] = useState([]);
  const [pets, setPets] = useState([]);
  const [owners, setOwners] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingKey, setEditingKey] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);

    try {
      const [ownershipData, petData, ownerData] =
        await Promise.all([
          api.get("/api/owns"),
          api.get("/api/pets"),
          api.get("/api/owners"),
        ]);

      setRecords(ownershipData);
      setPets(petData);
      setOwners(ownerData);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchOwnershipData = async () => {
      try {
        const [ownershipData, petData, ownerData] = await Promise.all([
          api.get("/api/owns"),
          api.get("/api/pets"),
          api.get("/api/owners"),
        ]);

        if (active) {
          setRecords(ownershipData);
          setPets(petData);
          setOwners(ownerData);
          setError("");
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchOwnershipData();
    return () => {
      active = false;
    };
  }, []);

  const getKey = (record) =>
    `${record.PetID}-${record.Year}-${record.OID}`;

  const openAddForm = () => {
    setEditingKey(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (record) => {
    setEditingKey({
      PetID: record.PetID,
      Year: record.Year,
      OID: record.OID,
    });

    setForm({
      PetID: String(record.PetID),
      OID: String(record.OID),
      Year: String(record.Year),
      PetAgeatOwnership: String(
        record.PetAgeatOwnership
      ),
      PricePaid: String(record.PricePaid),
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingKey(null);
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      PetID: Number(form.PetID),
      OID: Number(form.OID),
      Year: Number(form.Year),
      PetAgeatOwnership: Number(
        form.PetAgeatOwnership
      ),
      PricePaid: Number(form.PricePaid),
    };

    if (
      !Number.isInteger(payload.PetID) ||
      payload.PetID <= 0 ||
      !Number.isInteger(payload.OID) ||
      payload.OID <= 0 ||
      !Number.isInteger(payload.Year) ||
      payload.Year < 1900 ||
      payload.Year > 2100 ||
      !Number.isInteger(payload.PetAgeatOwnership) ||
      payload.PetAgeatOwnership < 0 ||
      payload.PetAgeatOwnership > 100 ||
      !Number.isFinite(payload.PricePaid) ||
      payload.PricePaid < 0
    ) {
      setError("Please enter valid ownership details.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingKey) {
        const endpoint =
          `/api/owns/${editingKey.PetID}` +
          `/${editingKey.Year}/${editingKey.OID}`;

        await api.put(endpoint, payload);
        setSuccess("Ownership updated successfully!");
      } else {
        await api.post("/api/owns", payload);
        setSuccess("Ownership created successfully!");
      }

      closeForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const confirmed = window.confirm(
      `Delete ownership record for ${record.PetName} ` +
      `and ${record.OwnerName}?`
    );

    if (!confirmed) return;

    const key = getKey(record);
    setDeletingKey(key);
    setError("");
    setSuccess("");

    try {
      await api.delete(
        `/api/owns/${record.PetID}/${record.Year}/${record.OID}`
      );

      setSuccess("Ownership deleted successfully!");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingKey(null);
    }
  };

  const filteredRecords = records.filter((record) => {
    const query = search.toLowerCase().trim();

    return (
      String(record.PetID).includes(query) ||
      String(record.OID).includes(query) ||
      String(record.Year).includes(query) ||
      (record.PetName || "")
        .toLowerCase()
        .includes(query) ||
      (record.OwnerName || "")
        .toLowerCase()
        .includes(query)
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
            Ownership Management
          </h4>

          <p className="text-muted mb-0">
            Connect pets with their owners.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openAddForm}
          disabled={loading}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Ownership
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

      {/* Ownership Table */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <h5 className="fw-bold mb-0">
              Ownership Records ({loading || (error && records.length === 0) ? "—" : records.length})
            </h5>

            <input
              type="search"
              className="form-control"
              style={{ maxWidth: "280px" }}
              placeholder="Search ownerships..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Pet</th>
                  <th>Owner</th>
                  <th>Year</th>
                  <th>Pet Age</th>
                  <th>Price Paid</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      Loading ownership records...
                    </td>
                  </tr>
                ) : error && records.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-5">
                      Unable to load ownership records. Check the API
                      connection and try again.
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center text-muted py-5"
                    >
                      <i className="bi bi-house-heart fs-2 d-block mb-2"></i>
                      No ownership records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={getKey(record)}>
                      <td>
                        <span className="fw-semibold">
                          {record.PetName}
                        </span>
                        <small className="d-block text-muted">
                          Pet #{record.PetID}
                        </small>
                      </td>

                      <td>
                        <span className="fw-semibold">
                          {record.OwnerName}
                        </span>
                        <small className="d-block text-muted">
                          Owner #{record.OID}
                        </small>
                      </td>

                      <td>{record.Year}</td>
                      <td>{record.PetAgeatOwnership}</td>

                      <td className="fw-semibold">
                        {formatCurrency(record.PricePaid)}
                      </td>

                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openEditForm(record)}
                            aria-label="Edit ownership"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(record)}
                            disabled={
                              deletingKey === getKey(record)
                            }
                            aria-label="Delete ownership"
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

      {/* Add / Edit Modal */}
      {showForm && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-label="Ownership form"
          style={{
            background: "rgba(0,0,0,0.55)",
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingKey
                    ? "Edit Ownership"
                    : "Add Ownership"}
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
                    {/* Pet Selection */}
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="owns-petid">
                        Select Pet
                      </label>

                      <select
                        className="form-select"
                        name="PetID" id="owns-petid"
                        value={form.PetID}
                        onChange={handleChange}
                        required
                      >
                        <option value="">
                          Select a pet
                        </option>

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

                    {/* Owner Selection */}
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="owns-oid">
                        Select Owner
                      </label>

                      <select
                        className="form-select"
                        name="OID" id="owns-oid"
                        value={form.OID}
                        onChange={handleChange}
                        required
                      >
                        <option value="">
                          Select an owner
                        </option>

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

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="owns-year">
                        Year of Ownership
                      </label>

                      <input
                        type="number"
                        className="form-control"
                        name="Year" id="owns-year"
                        value={form.Year}
                        onChange={handleChange}
                        min="1900"
                        max="2100"
                        step="1"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="owns-petageatownership">
                        Pet Age at Ownership
                      </label>

                      <input
                        type="number"
                        className="form-control"
                        name="PetAgeatOwnership" id="owns-petageatownership"
                        value={form.PetAgeatOwnership}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="1"
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="owns-pricepaid">
                        Price Paid ($)
                      </label>

                      <input
                        type="number"
                        className="form-control"
                        name="PricePaid" id="owns-pricepaid"
                        value={form.PricePaid}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {(pets.length === 0 ||
                    owners.length === 0) && (
                    <div className="alert alert-warning mt-3 mb-0">
                      Add at least one pet and one owner
                      before creating an ownership record.
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
                      pets.length === 0 ||
                      owners.length === 0
                    }
                  >
                    <i className="bi bi-check-lg me-2"></i>

                    {saving
                      ? "Saving..."
                      : editingKey
                      ? "Save Changes"
                      : "Create Ownership"}
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

export default Owns;
