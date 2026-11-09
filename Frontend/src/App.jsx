import { useState } from "react";
import {
  HeartHandshake,
  LayoutDashboard,
  Menu,
  Package,
  PawPrint,
  ShoppingBag,
  UsersRound,
  X,
} from "lucide-react";
import Dashboard from "./Dashboard";
import Pets from "./Pets";
import Owners from "./owners";
import Owns from "./owns";
import Foods from "./Foods";
import Purchases from "./Purchases";
import "./App.css";

const menuItems = [
  { name: "Dashboard", title: "Dashboard", icon: LayoutDashboard },
  { name: "Pets", title: "Pets", icon: PawPrint },
  { name: "Owners", title: "Owners", icon: UsersRound },
  { name: "Owns", title: "Ownerships", icon: HeartHandshake },
  { name: "Foods", title: "Foods", icon: Package },
  { name: "Purchases", title: "Purchases", icon: ShoppingBag },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const activeTitle =
    menuItems.find((item) => item.name === activePage)?.title ?? "Dashboard";

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;
      case "Pets":
        return <Pets />;
      case "Owners":
        return <Owners />;
      case "Owns":
        return <Owns />;
      case "Foods":
        return <Foods />;
      case "Purchases":
        return <Purchases />;
      default:
        return null;
    }
  };

  const navigate = (page) => {
    setActivePage(page);
    setMobileNavOpen(false);
  };

  return (
    <div className="app-layout">
      {mobileNavOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside className={`sidebar${mobileNavOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">
            <PawPrint size={21} strokeWidth={2.25} />
          </span>
          <span className="brand-copy">
            <strong>Pet Management</strong>
            <small>Administration</small>
          </span>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {menuItems.map(({ name, title, icon: Icon }) => (
            <button
              key={name}
              type="button"
              className={`nav-item${activePage === name ? " active" : ""}`}
              onClick={() => navigate(name)}
              aria-current={activePage === name ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
              <span>{title}</span>
            </button>
          ))}
        </nav>

      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={21} />
          </button>
          <span className="topbar-brand">Pet Management</span>
          <span className="topbar-page">{activeTitle}</span>
        </header>

        <main className="main-content">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
