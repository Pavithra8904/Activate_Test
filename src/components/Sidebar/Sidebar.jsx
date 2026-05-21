// Sidebar.jsx

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Table2,
  Boxes,
} from "lucide-react";

import "./Sidebar.scss";

const Sidebar = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (

    
    <aside className="sidebar">
      {/* LOGO SECTION */}
    <div className="sidebar__top">
      <button
        type="button"
        className="sidebar__logo"
        onClick={handleRefresh}
        aria-label="Refresh Activate Usage"
      >
        <Boxes size={34} strokeWidth={1.8} />
        <h2>Activate Usage</h2>
      </button>

        {/* MENU */}
        <div className="sidebar__menu">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive
                ? "sidebar__item active"
                : "sidebar__item"
            }
          >
            <LayoutDashboard size={22} />

            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/tables"
            className={({ isActive }) =>
              isActive
                ? "sidebar__item active"
                : "sidebar__item"
            }
          >
            <Table2 size={22} />

            <span>Tables</span>
          </NavLink>
        </div>
      </div>

      {/* BOTTOM BUTTON */}
      <div className="sidebar__bottom">
        <button className="client-btn">
          IPSOS MMA
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;