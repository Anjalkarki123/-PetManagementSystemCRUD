import { useEffect, useState } from "react";
import {
  AlertCircle,
  ChartNoAxesColumn,
  Clock3,
  Package,
  PawPrint,
  RefreshCw,
  ShoppingBag,
  UsersRound,
} from "lucide-react";
import { api } from "./services/api";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatCurrency = (value) =>
  Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      const [pets, owners, foods, purchases] = await Promise.all([
        api.get("/api/pets"),
        api.get("/api/owners"),
        api.get("/api/foods"),
        api.get("/api/purchases"),
      ]);

      setStats({
        pets: pets.length,
        owners: owners.length,
        foods: foods.length,
        purchases: purchases.length,
      });

      const sortedPurchases = [...purchases].sort(
        (a, b) =>
          Number(b.Year) - Number(a.Year) ||
          Number(b.Month) - Number(a.Month),
      );
      setRecentPurchases(sortedPurchases.slice(0, 5));
      setLoaded(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      try {
        const [pets, owners, foods, purchases] = await Promise.all([
          api.get("/api/pets"),
          api.get("/api/owners"),
          api.get("/api/foods"),
          api.get("/api/purchases"),
        ]);

        if (!active) return;

        setStats({
          pets: pets.length,
          owners: owners.length,
          foods: foods.length,
          purchases: purchases.length,
        });
        const sortedPurchases = [...purchases].sort(
          (a, b) =>
            Number(b.Year) - Number(a.Year) ||
            Number(b.Month) - Number(a.Month),
        );
        setRecentPurchases(sortedPurchases.slice(0, 5));
        setLoaded(true);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchDashboard();
    return () => {
      active = false;
    };
  }, []);

  const statCards = [
    {
      title: "Total Pets",
      value: stats?.pets,
      icon: PawPrint,
      color: "#3b4045",
      background: "#f0f1f2",
    },
    {
      title: "Total Owners",
      value: stats?.owners,
      icon: UsersRound,
      color: "#3b4045",
      background: "#f0f1f2",
    },
    {
      title: "Total Foods",
      value: stats?.foods,
      icon: Package,
      color: "#3b4045",
      background: "#f0f1f2",
    },
    {
      title: "Total Purchases",
      value: stats?.purchases,
      icon: ShoppingBag,
      color: "#3b4045",
      background: "#f0f1f2",
    },
  ];

  const refreshDashboard = () => {
    setLoading(true);
    setError("");
    void loadDashboard();
  };

  return (
    <div className="container-fluid p-0 dashboard-page">
      <section className="welcome-card" aria-labelledby="welcome-title">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h1 id="welcome-title">Pet management overview</h1>
            <p>
              Review and manage pets, owners, food products, and purchases.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-light"
            onClick={refreshDashboard}
            disabled={loading}
          >
            <RefreshCw
              size={15}
              className={`me-2${loading ? " spin" : ""}`}
              aria-hidden="true"
            />
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </section>

      {error && (
        <div className="alert alert-danger mt-4 d-flex align-items-center gap-2" role="alert">
          <AlertCircle size={17} aria-hidden="true" />
          <span>
            Unable to load dashboard data: {error}
            {stats && " Showing the last successfully loaded data."}
          </span>
        </div>
      )}

      <section className="row g-3 mt-2" aria-label="Database statistics">
        {statCards.map(({ title, value, icon: Icon, color, background }) => (
          <div className="col-12 col-sm-6 col-xl-3" key={title}>
            <article className="card border-0 shadow-sm h-100 stat-card">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-2 stat-label">{title}</p>
                    <div className="stat-value" aria-live="polite">
                      {loading && !stats ? (
                        <span aria-label="Loading">—</span>
                      ) : value === undefined ? (
                        <span aria-label="Unavailable">—</span>
                      ) : (
                        value.toLocaleString()
                      )}
                    </div>
                  </div>
                  <div
                    className="stat-icon"
                    style={{ color, background }}
                    aria-hidden="true"
                  >
                    <Icon size={22} strokeWidth={1.9} />
                  </div>
                </div>
              </div>
            </article>
          </div>
        ))}
      </section>

      <section className="row g-3 mt-1">
        <div className="col-12 col-xl-8">
          <article className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="section-heading">
                <div className="section-icon">
                  <Clock3 size={17} aria-hidden="true" />
                </div>
                <div>
                  <h2>Recent Purchases</h2>
                  <p>Latest activity recorded in your workspace</p>
                </div>
              </div>

              <div className="table-responsive dashboard-table">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th scope="col">Pet</th>
                      <th scope="col">Food product</th>
                      <th scope="col">Owner</th>
                      <th scope="col">Period</th>
                      <th scope="col">Qty</th>
                      <th scope="col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && !loaded ? (
                      <tr>
                        <td colSpan="6" className="dashboard-table-state">
                          <span className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                          Loading recent purchases...
                        </td>
                      </tr>
                    ) : error && !loaded ? (
                      <tr>
                        <td colSpan="6" className="dashboard-table-state">
                          Purchases are unavailable until the API connection is
                          restored.
                        </td>
                      </tr>
                    ) : recentPurchases.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="dashboard-table-state">
                          No purchases recorded yet.
                        </td>
                      </tr>
                    ) : (
                      recentPurchases.map((purchase) => (
                        <tr
                          key={[
                            purchase.OID,
                            purchase.FoodID,
                            purchase.PetID,
                            purchase.Month,
                            purchase.Year,
                          ].join("-")}
                        >
                          <td className="fw-semibold">{purchase.PetName}</td>
                          <td>{purchase.FoodName}</td>
                          <td>{purchase.OwnerName}</td>
                          <td>
                            {months[Number(purchase.Month) - 1]} {purchase.Year}
                          </td>
                          <td>{purchase.Quantity}</td>
                          <td className="fw-semibold">
                            {formatCurrency(purchase.TotalPrice)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </div>

        <div className="col-12 col-xl-4">
          <article className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="section-heading">
                <div className="section-icon">
                  <ChartNoAxesColumn size={17} aria-hidden="true" />
                </div>
                <div>
                  <h2>Quick Overview</h2>
                  <p>Live totals from your database</p>
                </div>
              </div>

              <div className="overview-list">
                {statCards.map(({ title, value }) => (
                  <div className="overview-row" key={title}>
                    <span>{title.replace("Total ", "Registered ")}</span>
                    <strong>
                      {loading && !stats
                        ? "—"
                        : value === undefined
                          ? "—"
                          : value.toLocaleString()}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="database-note">
                <span>
                  {error
                    ? "The latest API request did not complete."
                    : stats
                      ? "Connected to live FastAPI database records."
                      : "Waiting for database records."}
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
