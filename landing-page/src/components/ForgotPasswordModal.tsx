import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./AuthModal.css";
import "./Auth.css";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

type Step = "request-code" | "reset-password" | "success";

export function ForgotPasswordModal({
  isOpen,
  onClose,
  onBackToLogin,
}: ForgotPasswordModalProps) {
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState<Step>("request-code");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setStep("reset-password");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(email, code, newPassword);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("request-code");
    setEmail("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    onClose();
  };

  const handleSuccessClose = () => {
    handleClose();
    onBackToLogin();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          ×
        </button>

        {step === "request-code" && (
          <>
            <div className="auth-header">
              <h2>Forgot Password</h2>
              <p>Enter your email to receive a password reset code</p>
            </div>

            <form className="auth-form" onSubmit={handleRequestCode}>
              {error && <div className="auth-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>

            <div className="auth-footer">
              Remember your password?{" "}
              <button onClick={onBackToLogin} className="auth-link-btn">
                Back to Login
              </button>
            </div>
          </>
        )}

        {step === "reset-password" && (
          <>
            <div className="auth-header">
              <h2>Reset Password</h2>
              <p>Enter the code sent to {email}</p>
            </div>

            <form className="auth-form" onSubmit={handleResetPassword}>
              {error && <div className="auth-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="code">Verification Code</label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={isLoading}
                />
                <span className="password-hint">
                  Must be at least 8 characters with uppercase, lowercase,
                  numbers, and symbols
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <div className="auth-footer">
              Didn't receive the code?{" "}
              <button
                onClick={() => {
                  setStep("request-code");
                  setCode("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setError("");
                }}
                className="auth-link-btn"
              >
                Resend Code
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <div className="auth-header">
              <div className="success-icon">✓</div>
              <h2>Password Reset Successful!</h2>
              <p>You can now log in with your new password</p>
            </div>

            <button onClick={handleSuccessClose} className="auth-submit-btn">
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
