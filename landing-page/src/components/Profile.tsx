import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import "./Profile.css";

export function Profile() {
  const { user, resetPassword } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const getUsername = () => {
    if (!user?.email) return "";
    return user.email.split("@")[0];
  };

  const handleSendCode = async () => {
    if (!user?.email) return;

    setIsSendingCode(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "https://shorturl.life"}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: user.email }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send verification code");
      }

      setCodeSent(true);
      toast.success("Verification code sent to your email!");
    } catch (error) {
      toast.error("Failed to send verification code. Please try again.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      toast.error("User email not found");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(user.email, verificationCode, newPassword);
      toast.success("Password changed successfully!");
      setShowChangePassword(false);
      setVerificationCode("");
      setNewPassword("");
      setConfirmPassword("");
      setCodeSent(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-page" style={{ paddingTop: "100px" }}>
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {getUsername().charAt(0).toUpperCase()}
          </div>
          <h1 className="profile-title">Account Information</h1>
        </div>

        <div className="profile-content">
          <div className="info-card">
            <div className="info-item">
              <label className="info-label">Name:</label>
              <p className="info-value">{getUsername()}</p>
            </div>

            <div className="info-item">
              <label className="info-label">Email:</label>
              <p className="info-value">{user?.email}</p>
            </div>

            {!showChangePassword ? (
              <button
                className="change-password-btn"
                onClick={() => setShowChangePassword(true)}
              >
                <span className="btn-icon">🔐</span>
                Change Password
              </button>
            ) : (
              <div className="change-password-section">
                <div className="section-header">
                  <h3>Change Password</h3>
                  <button
                    className="close-btn"
                    onClick={() => {
                      setShowChangePassword(false);
                      setCodeSent(false);
                      setVerificationCode("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    ✕
                  </button>
                </div>

                {!codeSent ? (
                  <div className="verification-step">
                    <p className="step-description">
                      We'll send a verification code to your email to confirm
                      it's you.
                    </p>
                    <button
                      className="send-code-btn"
                      onClick={handleSendCode}
                      disabled={isSendingCode}
                    >
                      {isSendingCode
                        ? "Sending Code..."
                        : "Send Verification Code"}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword}>
                    <div className="form-group">
                      <label htmlFor="verificationCode">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        id="verificationCode"
                        placeholder="Enter code from email"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input
                        type="password"
                        id="newPassword"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => {
                          setShowChangePassword(false);
                          setCodeSent(false);
                          setVerificationCode("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="submit-btn"
                        disabled={isLoading}
                      >
                        {isLoading ? "Changing..." : "Change Password"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
