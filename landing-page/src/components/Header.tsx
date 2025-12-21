import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoginModal } from './LoginModal'
import { SignupModal } from './SignupModal'
import './Header.css'

export function Header() {
  const { isAuthenticated, logout, user } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSwitchToSignup = () => {
    setShowLoginModal(false)
    setShowSignupModal(true)
  }

  const handleSwitchToLogin = () => {
    setShowSignupModal(false)
    setShowLoginModal(true)
  }

  return (
    <>
      <header className="header">
        <div className="header-container">
          <a href="/" className="logo">
            <span className="logo-icon">🔗</span>
            <span className="logo-text">URL Shortener</span>
          </a>

          <nav className="nav">
            {isAuthenticated ? (
              <>
                <button onClick={() => navigate('/dashboard')} className="nav-link-btn">
                  Dashboard
                </button>
                <span className="user-email">{user?.email}</span>
                <button onClick={handleLogout} className="btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowLoginModal(true)} className="nav-link-btn">
                  Login
                </button>
                <button onClick={() => setShowSignupModal(true)} className="btn-primary">
                  Sign Up
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={handleSwitchToSignup}
      />
      
      <SignupModal 
        isOpen={showSignupModal} 
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  )
}
