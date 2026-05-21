import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Settings, Bell, User, Home, X } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import './Header.scss';

const colorMap = {
  blue: '#2f80ed',
  purple: '#4b2b88',
  green: '#22c55e',
  orange: '#fb923c',
  red: '#ef4444',
};

const getStoredValue = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored || fallback;
  } catch (error) {
    return fallback;
  }
};

const getRgb = (hex) => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  const value = parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `${r}, ${g}, ${b}`;
};

const CHART_TYPES = [
  {
    type: 'bar',
    name: 'Bar Chart',
    description: 'Compare usage across clients using vertical bars.',
  },
  {
    type: 'line',
    name: 'Line Chart',
    description: 'Show usage trends over time with a line.',
  },
  {
    type: 'area',
    name: 'Area Chart',
    description: 'Highlight volume changes with filled areas.',
  },
  {
    type: 'pie',
    name: 'Pie Chart',
    description: 'Display proportionate client usage in a circle.',
  },
  {
    type: 'radar',
    name: 'Radar Chart',
    description: 'Visualize multiple metrics across clients.',
  },
];

const Header = ({ actions = null }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [sidebarColor, setSidebarColor] = useState(() => getStoredValue('dashboard_sidebar_color', 'blue'));
  const [sidebarType, setSidebarType] = useState(() => getStoredValue('dashboard_sidebar_type', 'light'));
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [documentationView, setDocumentationView] = useState(false);
  const [profile, setProfile] = useState(() => ({
    name: getStoredValue('profile_name', 'Dhilipraja'),
    email: getStoredValue('profile_email', 'Dhilip.raja@example.com'),
  }));
  const [profileForm, setProfileForm] = useState(profile);
  const [profileEditMode, setProfileEditMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const color = colorMap[sidebarColor] || colorMap.blue;
    root.style.setProperty('--sidebar-hover-color', `rgba(${getRgb(color)}, 0.18)`);
    root.style.setProperty('--sidebar-bottom-bg', color);
    root.style.setProperty('--sidebar-bottom-shadow', `0 10px 20px rgba(${getRgb(color)}, 0.25)`);

    root.style.setProperty('--sidebar-bg', 'linear-gradient(180deg, #43434d 0%, #17181f 100%)');
    root.style.setProperty('--sidebar-text-color', '#ffffff');
    root.style.setProperty('--sidebar-border', 'rgba(255, 255, 255, 0.1)');

    const themeClass = sidebarType === 'dark' ? 'theme-dark' : 'theme-light';
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(themeClass);

    try {
      localStorage.setItem('dashboard_sidebar_color', sidebarColor);
      localStorage.setItem('dashboard_sidebar_type', sidebarType);
    } catch (error) {
      // ignore write errors in private/incognito mode
    }
  }, [sidebarColor, sidebarType]);

  const handleSettingsClick = () => {
    setShowSettingsPopup(true);
  };
  const handleNotificationsClick = () => alert('No new notifications');
  const handleProfileClick = () => setShowProfilePopup(true);
  const handleCreateChart = () => {
    setShowSettingsPopup(false);
    navigate('/tables?createChart=true');
  };
  const handleHomeClick = () => {
    sessionStorage.clear();
    window.location.href = '/dashboard';
  };

  const handleEditProfile = () => {
    setProfileForm(profile);
    setProfileEditMode(true);
  };

  const handleProfileFormChange = (field, value) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveProfile = () => {
    setProfile(profileForm);
    setProfileEditMode(false);

    try {
      localStorage.setItem('profile_name', profileForm.name);
      localStorage.setItem('profile_email', profileForm.email);
    } catch (error) {
      // ignore write errors
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    sessionStorage.clear();
    setShowProfilePopup(false);
    navigate('/login');
  };

  return (
    <>
      <div className={`header ${navbarVisible ? '' : 'header--hidden'}`}>
        <button
          type="button"
          className="header__icon-btn header__icon-btn--home"
          onClick={handleHomeClick}
          aria-label="Home"
        >
          <Home size={18} />
        </button>

        <div className="header__right">
          {actions && <div className="header__actions">{actions}</div>}
          <button
            type="button"
            className="header__icon-btn header__icon-btn--visible"
            onClick={handleSettingsClick}
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            type="button"
            className="header__icon-btn header__icon-btn--visible"
            onClick={handleNotificationsClick}
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>
          <button
            type="button"
            className="header__icon-btn header__icon-btn--visible"
            onClick={handleProfileClick}
            aria-label="Profile"
          >
            <User size={18} />
          </button>
        </div>

      {showSettingsPopup && (
        <>
          <div
            className="header__overlay"
            onClick={() => setShowSettingsPopup(false)}
          ></div>
          <div className="header__popup header__popup--settings">
            <div className="header__popup-top">
              <div>
                <h3>Settings</h3>
                <p>See our dashboard options.</p>
              </div>
              <button
                className="header__popup-close"
                onClick={() => setShowSettingsPopup(false)}
                aria-label="Close Settings"
              >
                <X size={20} />
              </button>
            </div>

            <div className="header__settings-tabs">
              <button
                type="button"
                className={`header__settings-tab ${activeSettingsTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveSettingsTab('general')}
              >
                General
              </button>
              <button
                type="button"
                className={`header__settings-tab ${activeSettingsTab === 'advanced' ? 'active' : ''}`}
                onClick={() => setActiveSettingsTab('advanced')}
              >
                Advanced
              </button>
            </div>

        {activeSettingsTab === 'general' && (
          <>
            <div className="header__popup-section">
              <div className="header__popup-section-title">Sidebar Color</div>
              <p>Select the sidebar accent color</p>
              <div className="header__color-options">
                {['purple', 'blue', 'green', 'orange', 'red'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`header__color-chip ${sidebarColor === color ? 'active' : ''}`}
                    data-color={color}
                    onClick={() => setSidebarColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="header__popup-section">
              <div className="header__popup-section-title">Page Theme</div>
              <div className="header__toggle-group">
                {['light', 'dark'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`header__type-btn ${sidebarType === type ? 'active' : ''}`}
                    onClick={() => setSidebarType(type)}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="header__popup-section">
              <div className="header__popup-row">
                <div>
                  <div className="header__popup-section-title">Navbar Visible</div>
                  <p>Toggle the navbar visibility</p>
                </div>
                <label className="header__switch">
                  <input
                    type="checkbox"
                    checked={navbarVisible}
                    onChange={() => setNavbarVisible((prev) => !prev)}
                  />
                  <span className="header__slider" />
                </label>
              </div>
            </div>

            <div className="header__popup-section">
              <button
                type="button"
                className="header__documentation-btn"
                onClick={() => setDocumentationView(true)}
              >
                Documentation View
              </button>
            </div>
          </>
        )}

        {activeSettingsTab === 'advanced' && (
          <>
            <div className="header__popup-section">
              <div className="header__popup-section-title">Available Charts</div>
              <ul className="header__chart-list">
                {CHART_TYPES.map((chart) => (
                  <li key={chart.type} className="header__chart-item">
                    <strong>{chart.name}</strong>
                    <p>{chart.description}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="header__popup-section">
              <button
                type="button"
                className="header__create-chart-btn"
                onClick={handleCreateChart}
              >
                Create Chart
              </button>
            </div>
          </>
        )}
          </div>
        </>
      )}

      {showProfilePopup && (
        <>
          <div
            className="header__overlay"
            onClick={() => setShowProfilePopup(false)}
          ></div>
          <div className="header__popup header__popup--profile">
            <button
              className="header__popup-close"
              onClick={() => setShowProfilePopup(false)}
              aria-label="Close Profile"
            >
              <X size={20} />
            </button>
            <h3>Profile</h3>
            <div className="header__popup-content">
              {!profileEditMode ? (
                <>
                  <p><strong>Name:</strong> {profile.name}</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                  <button className="header__popup-btn header__popup-btn--primary" type="button" onClick={handleEditProfile}>
                    Edit Profile
                  </button>
                  <button className="header__popup-btn header__popup-btn--secondary" type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <div className="header__profile-form">
                  <label className="header__profile-field">
                    Name
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(event) => handleProfileFormChange('name', event.target.value)}
                    />
                  </label>
                  <label className="header__profile-field">
                    Email
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(event) => handleProfileFormChange('email', event.target.value)}
                    />
                  </label>
                  <button className="header__popup-btn header__popup-btn--primary" type="button" onClick={handleSaveProfile}>
                    Save Profile
                  </button>
                  <button className="header__popup-btn header__popup-btn--secondary" type="button" onClick={() => setProfileEditMode(false)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      </div>

      {!navbarVisible && (
        <button
          type="button"
          className="header__show-navbar-btn"
          onClick={() => setNavbarVisible(true)}
        >
          Show Navbar
        </button>
      )}
    </>
  );
};

export default Header;
