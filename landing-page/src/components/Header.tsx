import { useState } from "react";
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
  const navigate = useNavigate();

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
          <a href="/" className="logo">
            <img src={logo} alt="Shorten URL Logo" className="logo-icon" />
            <span className="logo-text">Shorten URL</span>
          </a>

          {/* Desktop Navigation */}
          <nav className="nav desktop-nav">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="nav-link-btn"
                >
                  Dashboard
                </button>
                <span className="user-email">{user?.email}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </>
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
          </nav>

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
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="sidebar-user-email">{user?.email}</span>
              </div>

              <button
                onClick={handleDashboardClick}
                className="sidebar-nav-link"
              >
                <span className="sidebar-icon">📊</span>
                Dashboard
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
