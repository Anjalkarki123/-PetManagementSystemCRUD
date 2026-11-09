
import { useEffect, useState } from "react";
import { api } from "./services/api";

const emptyForm = {
  Name: "",
  Age: "",
  Street: "",
  City: "",
  ZipCode: "",
  State: "",
  TypeofPet: "",
};

function Pets() {
  const [pets, setPets] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPets = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api.get("/api/pets");
      setPets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchPets = async () => {
      try {
        const data = await api.get("/api/pets");
        if (active) {
          setPets(data);
          setError("");
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchPets();
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

  const openEditForm = (pet) => {
    setForm({
      Name: pet.Name,
      Age: String(pet.Age),
      Street: pet.Street || "",
      City: pet.City || "",
      ZipCode: pet.ZipCode || "",
      State: pet.State || "",
      TypeofPet: pet.TypeofPet,
    });

    setEditingId(pet.PetID);
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

    const petData = {
      ...form,
      Name: form.Name.trim(),
      Age: Number(form.Age),
    };

    try {
      if (editingId !== null) {
        await api.put(`/api/pets/${editingId}`, petData);
        setSuccess("Pet updated successfully!");
      } else {
        await api.post("/api/pets", petData);
        setSuccess("Pet created successfully!");
      }

      closeForm();
      await loadPets();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (petId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this pet?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/api/pets/${petId}`);
      setSuccess("Pet deleted successfully!");
      await loadPets();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredPets = pets.filter((pet) => {
    const query = search.toLowerCase();

    return (
      (pet.Name || "").toLowerCase().includes(query) ||
      (pet.TypeofPet || "").toLowerCase().includes(query) ||
      (pet.City || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            Pets Management
          </h4>
          <p className="text-muted mb-0">
            Manage registered pets from your MySQL database.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={openAddForm}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add New Pet
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-bold mb-0">
              All Pets ({loading || (error && pets.length === 0) ? "—" : pets.length})
            </h5>

            <input
              type="search"
              className="form-control"
              style={{ maxWidth: "260px" }}
              placeholder="Search pets..."
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
                  <th>Pet ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Type</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      Loading pets...
                    </td>
                  </tr>
                ) : error && pets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      Unable to load pets. Check the API connection and try
                      again.
                    </td>
                  </tr>
                ) : filteredPets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      No pets found.
                    </td>
                  </tr>
                ) : (
                  filteredPets.map((pet) => (
                    <tr key={pet.PetID}>
                      <td>#{pet.PetID}</td>
                      <td className="fw-semibold">{pet.Name}</td>
                      <td>{pet.Age}</td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary">
                          {pet.TypeofPet}
                        </span>
                      </td>
                      <td>{pet.City}</td>
                      <td>{pet.State}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => openEditForm(pet)}
                          aria-label={`Edit ${pet.Name}`}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(pet.PetID)}
                          aria-label={`Delete ${pet.Name}`}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div
          className="modal d-block"
          role="dialog"
          aria-modal="true"
          aria-label="Pet form"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingId !== null
                    ? "Edit Pet"
                    : "Add New Pet"}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeForm}
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
                      <label className="form-label" htmlFor="pets-name">
                        Pet Name
                      </label>
                      <input
                        className="form-control"
                        name="Name" id="pets-name"
                        value={form.Name}
                        onChange={handleChange}
                        required
                        maxLength={100}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="pets-age">
                        Age
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="Age" id="pets-age"
                        value={form.Age}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="1"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="pets-typeofpet">
                        Type of Pet
                      </label>
                      <select
                        className="form-select"
                        name="TypeofPet" id="pets-typeofpet"
                        value={form.TypeofPet}
                        onChange={handleChange}
                        required
                      >
                        <option value="">
                          Select pet type
                        </option>
                        <option value="Dog">Dog</option>
                        <option value="Cat">Cat</option>
                        <option value="Bird">Bird</option>
                        <option value="Fish">Fish</option>
                        <option value="Rabbit">Rabbit</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="pets-street">
                        Street
                      </label>
                      <input
                        className="form-control"
                        name="Street" id="pets-street"
                        value={form.Street}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="pets-city">
                        City
                      </label>
                      <input
                        className="form-control"
                        name="City" id="pets-city"
                        value={form.City}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="pets-state">
                        State
                      </label>
                      <input
                        className="form-control"
                        name="State" id="pets-state"
                        value={form.State}
                        onChange={handleChange}
                        maxLength={50}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="pets-zipcode">
                        Zip Code
                      </label>
                      <input
                        className="form-control"
                        name="ZipCode" id="pets-zipcode"
                        value={form.ZipCode}
                        onChange={handleChange}
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
                    {saving
                      ? "Saving..."
                      : editingId !== null
                      ? "Save Changes"
                      : "Create Pet"}
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

export default Pets;
