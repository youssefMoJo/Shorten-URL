import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { config } from "../config";
import "./Dashboard.css";

interface ShortenedLink {
  short_code: string;
  original_url: string;
  created_at: number;
  user_id?: string;
}

export function Dashboard() {
  const [url, setUrl] = useState("");
  const [links, setLinks] = useState<ShortenedLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLinks, setIsFetchingLinks] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { getIdToken, logout } = useAuth();

  useEffect(() => {
    fetchUserLinks();
  }, []);

  const fetchUserLinks = async () => {
    try {
      setIsFetchingLinks(true);
      const token = getIdToken();

      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.meLinks}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch links");
      }

      const data = await response.json();
      console.log("API Response:", data); // Debug log

      // Handle both array response and object with links property
      const linksArray = Array.isArray(data) ? data : data.links || [];
      setLinks(linksArray);
    } catch (err) {
      console.error("Error fetching links:", err);
      setLinks([]); // Set empty array on error
    } finally {
      setIsFetchingLinks(false);
    }
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);

    try {
      const token = getIdToken();

      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.shorten}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ original_url: url }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to shorten URL");
      }

      await response.json();
      setSuccessMessage("Link shortened successfully!");
      setUrl("");

      // Refresh the links list
      await fetchUserLinks();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (shortUrl: string) => {
    navigator.clipboard.writeText(shortUrl);
    setSuccessMessage("Copied to clipboard!");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getShortUrl = (shortCode: string) => {
    return `${config.api.baseUrl}/expand/${shortCode}`;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">My Dashboard</h1>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Shorten URL Section */}
        <section className="shorten-section">
          <h2>Create New Short Link</h2>
          <form className="dashboard-form" onSubmit={handleShorten}>
            <div className="input-group-dashboard">
              <input
                type="url"
                placeholder="Enter your long URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="url-input-dashboard"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="shorten-btn-dashboard"
                disabled={isLoading}
              >
                {isLoading ? "Shortening..." : "Shorten"}
              </button>
            </div>
            {error && <p className="error-message-dashboard">{error}</p>}
            {successMessage && (
              <p className="success-message-dashboard">{successMessage}</p>
            )}
          </form>
        </section>

        {/* Links List Section */}
        <section className="links-section">
          <div className="section-header">
            <h2>Your Shortened Links</h2>
            <span className="links-count">
              {links.length} link{links.length !== 1 ? "s" : ""}
            </span>
          </div>

          {isFetchingLinks ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your links...</p>
            </div>
          ) : links.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <h3>No links yet</h3>
              <p>Start by shortening your first URL above!</p>
            </div>
          ) : (
            <div className="links-grid">
              {links.map((link) => (
                <div key={link.short_code} className="link-card">
                  <div className="link-header">
                    <span className="link-date">
                      {formatDate(link.created_at)}
                    </span>
                  </div>
                  <div className="link-content">
                    <div className="link-section">
                      <label>Short URL</label>
                      <div className="link-url short-url">
                        <a
                          href={getShortUrl(link.short_code)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {getShortUrl(link.short_code)}
                        </a>
                        <button
                          onClick={() =>
                            copyToClipboard(getShortUrl(link.short_code))
                          }
                          className="copy-btn-small"
                          title="Copy to clipboard"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div className="link-section">
                      <label>Original URL</label>
                      <div className="link-url original-url">
                        <a
                          href={link.original_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={link.original_url || "No URL"}
                        >
                          {link.original_url && link.original_url.length > 60
                            ? link.original_url.substring(0, 60) + "..."
                            : link.original_url || "No URL"}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
