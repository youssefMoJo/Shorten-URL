import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import './AuthModal.css'
import './Auth.css'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignup: () => void
  onForgotPassword?: () => void
}

export function LoginModal({ isOpen, onClose, onSwitchToSignup, onForgotPassword }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const { login, verifyEmailAndLogin, resendVerificationCode } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      await login(email, password)
      onClose()
      setEmail('')
      setPassword('')
    } catch (err: any) {
      // Check if user needs to verify their email
      if (err.code === 'UserNotConfirmedException') {
        setNeedsVerification(true)
        setUserEmail(err.email || email)
        setUserPassword(password)
      } else {
        setError(err.message || 'Failed to login. Please check your credentials.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }

    setIsLoading(true)

    try {
      await verifyEmailAndLogin(userEmail, userPassword, verificationCode)
      onClose()
      // Reset all state
      setEmail('')
      setPassword('')
      setVerificationCode('')
      setNeedsVerification(false)
      setUserEmail('')
      setUserPassword('')
    } catch (err: any) {
      setError(err.message || 'Failed to verify email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setIsLoading(true)

    try {
      await resendVerificationCode(userEmail)
      setError('') // Clear any previous errors
      toast.success('Verification code resent to your email!')
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setVerificationCode('')
    setError('')
    setNeedsVerification(false)
    setUserEmail('')
    setUserPassword('')
    onClose()
  }

  // If user needs verification, show verification UI
  if (needsVerification) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={handleClose}>&times;</button>

          <div className="auth-header">
            <h2>Verify Your Email</h2>
            <p>We sent a verification code to <strong>{userEmail}</strong></p>
          </div>

          <form className="auth-form" onSubmit={handleVerification}>
            <div className="form-group">
              <label htmlFor="verificationCode">Verification Code</label>
              <input
                id="verificationCode"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={isLoading}
                autoComplete="one-time-code"
                maxLength={6}
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Didn't receive the code?{' '}
              <button onClick={handleResendCode} className="auth-link-btn" disabled={isLoading}>
                Resend
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>&times;</button>
        
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to manage your shortened links</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
            {onForgotPassword && (
              <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="auth-link-btn"
                  style={{ fontSize: '0.875rem' }}
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button onClick={onSwitchToSignup} className="auth-link-btn">Sign up</button>
          </p>
        </div>
      </div>
    </div>
  )
}
