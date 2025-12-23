import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoginModal } from "./LoginModal";
import { SignupModal } from "./SignupModal";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import logo from "../assets/logo.png";
import "./Header.css";

export function Header() {
  const { isAuthenticated, logout, user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    }

    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showProfileDropdown]);

  // Extract username from email (part before @)
  const getUsername = () => {
    if (!user?.email) return "";
    return user.email.split("@")[0];
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsSidebarOpen(false);
  };

  const handleSwitchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignupModal(false);
    setShowForgotPasswordModal(false);
    setShowLoginModal(true);
  };

  const handleForgotPassword = () => {
    setShowLoginModal(false);
    setShowForgotPasswordModal(true);
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
    setIsSidebarOpen(false);
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
    setIsSidebarOpen(false);
  };

  const handleSignupClick = () => {
    setShowSignupModal(true);
    setIsSidebarOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          {/* Logo - Left */}
          <a href="/" className="logo">
            <img src={logo} alt="Shorten URL Logo" className="logo-icon" />
            <span className="logo-text">Shorten URL</span>
          </a>

          {/* Desktop Navigation - Center */}
          <nav className="nav-center desktop-nav">
            {isAuthenticated && (
              <button
                onClick={() => navigate("/dashboard")}
                className="nav-link-btn"
              >
                Dashboard
              </button>
            )}
          </nav>

          {/* Desktop Right Section */}
          <div className="nav-right desktop-nav">
            {isAuthenticated ? (
              <div className="profile-section" ref={dropdownRef}>
                <button
                  className="profile-trigger"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  <div className="profile-avatar">
                    {getUsername().charAt(0).toUpperCase()}
                  </div>
                  <span className="profile-username">{getUsername()}</span>
                  <svg
                    className={`profile-arrow ${
                      showProfileDropdown ? "active" : ""
                    }`}
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                  >
                    <path
                      d="M1 1.5L6 6.5L11 1.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="profile-dropdown">
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/profile");
                        setShowProfileDropdown(false);
                      }}
                    >
                      <span className="dropdown-icon">👤</span>
                      Profile
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/feedback");
                        setShowProfileDropdown(false);
                      }}
                    >
                      <span className="dropdown-icon">💬</span>
                      Send Feedback
                    </button>
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item logout"
                      onClick={() => {
                        handleLogout();
                        setShowProfileDropdown(false);
                      }}
                    >
                      <span className="dropdown-icon">🚪</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="nav-link-btn"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="btn-primary"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Hamburger Menu Button */}
          <button
            className={`hamburger ${isSidebarOpen ? "active" : ""}`}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Mobile Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? "active" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img
              src={logo}
              alt="Shorten URL Logo"
              className="sidebar-logo-icon"
            />
            <span className="sidebar-logo-text">Shorten URL</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {isAuthenticated ? (
            <>
              <div className="sidebar-user-info">
                <div className="sidebar-user-avatar">
                  {getUsername().charAt(0).toUpperCase()}
                </div>
                <span className="sidebar-user-email">{getUsername()}</span>
                <span className="sidebar-user-email-small">{user?.email}</span>
              </div>

              <button
                onClick={handleDashboardClick}
                className="sidebar-nav-link"
              >
                <span className="sidebar-icon">📊</span>
                Dashboard
              </button>

              <button
                onClick={() => {
                  navigate("/profile");
                  setIsSidebarOpen(false);
                }}
                className="sidebar-nav-link"
              >
                <span className="sidebar-icon">👤</span>
                Profile
              </button>

              <button
                onClick={() => {
                  navigate("/feedback");
                  setIsSidebarOpen(false);
                }}
                className="sidebar-nav-link"
              >
                <span className="sidebar-icon">💬</span>
                Send Feedback
              </button>

              <button onClick={handleLogout} className="sidebar-logout-btn">
                <span className="sidebar-icon">🚪</span>
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={handleLoginClick} className="sidebar-nav-link">
                <span className="sidebar-icon">🔑</span>
                Login
              </button>

              <button
                onClick={handleSignupClick}
                className="sidebar-signup-btn"
              >
                <span className="sidebar-icon">✨</span>
                Sign Up
              </button>
            </>
          )}
        </nav>
      </aside>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={handleSwitchToSignup}
        onForgotPassword={handleForgotPassword}
      />

      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onBackToLogin={handleSwitchToLogin}
      />
    </>
  );
}
