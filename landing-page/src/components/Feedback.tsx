import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import "./Feedback.css";

export function Feedback() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    if (feedback.length > 5000) {
      toast.error("Feedback must be less than 5000 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL ||
        "https://shorturl.life";

      const response = await fetch(`${apiUrl}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: rating > 0 ? rating : null,
          feedback: feedback.trim(),
          email: email.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit feedback");
      }

      toast.success("Thank you for your feedback!");
      navigate(-1); // Go back to previous page
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast.error(error.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="feedback-page">
      <div className="feedback-overlay" onClick={handleClose}></div>
      <div className="feedback-modal">
        <div className="feedback-header">
          <h2 className="feedback-title">Send Feedback</h2>
          <button className="feedback-close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          {/* Star Rating */}
          <div className="rating-section">
            <label className="rating-label">
              How would you rate your experience? (Optional)
            </label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star ${
                    star <= (hoveredRating || rating) ? "active" : ""
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className="form-field">
            <label htmlFor="feedback" className="field-label">
              Your Feedback <span className="required">*</span>
            </label>
            <textarea
              id="feedback"
              className="feedback-textarea"
              placeholder="Tell us what you think about Shorten URL..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={5000}
              rows={6}
              required
            />
            <div className="char-count">{feedback.length}/5000</div>
          </div>

          {/* Email Input */}
          <div className="form-field">
            <label htmlFor="email" className="field-label">
              Email (Optional - if you'd like a response)
            </label>
            <input
              type="email"
              id="email"
              className="feedback-input"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="feedback-actions">
            <button
              type="button"
              className="feedback-cancel-btn"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="feedback-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
