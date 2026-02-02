import { useState } from "react";
import toast from "react-hot-toast";
import { config } from "../config";
import { useAuth } from "../contexts/AuthContext";

export function LandingPage() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { getIdToken } = useAuth();

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShortUrl("");

    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add Authorization header if user is authenticated
      const token = await getIdToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.shorten}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ long_link: url }),
        }
      );

      if (!response.ok) {
        // If 401 and we had a token, it expired - remove auth header and retry as anonymous
        if (response.status === 401 && token) {
          console.warn('Token expired during request, retrying without auth');
          delete headers["Authorization"];
          const retryResponse = await fetch(
            `${config.api.baseUrl}${config.api.endpoints.shorten}`,
            {
              method: "POST",
              headers,
              body: JSON.stringify({ long_link: url }),
            }
          );
          if (!retryResponse.ok) {
            throw new Error("Failed to shorten URL");
          }
          const retryData = await retryResponse.json();
          // Handle both string response and object response
          setShortUrl(typeof retryData === 'string' ? retryData : retryData.short_url);
          return;
        }
        throw new Error("Failed to shorten URL");
      }

      const data = await response.json();
      // Handle both string response and object response
      setShortUrl(typeof data === 'string' ? data : data.short_url);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="app">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            {/* Hero Header */}
            <div className="hero-header">
              <h1 className="hero-title">
                Shorten Your URLs
                <span className="gradient-text"> Instantly</span>
              </h1>
              <p className="hero-subtitle">
                Fast, secure, and reliable URL shortening service powered by
                AWS. Create short links in seconds, track them with
                authentication, and share them anywhere.
              </p>
            </div>

            {/* Main Action Area */}
            <div className="hero-main-action">
              {/* URL Shortener Form */}
              <form className="shortener-form" onSubmit={handleShorten}>
                <div className="input-group">
                  <input
                    type="url"
                    placeholder="Enter your long URL here..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="url-input"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className="shorten-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? "Shortening..." : "Shorten"}
                  </button>
                </div>
                {error && <p className="error-message">{error}</p>}
              </form>

              {/* Result Display */}
              {shortUrl && (
                <div className="result-box">
                  <div className="result-content">
                    <p className="result-label">Your shortened URL:</p>
                    <div className="result-url-container">
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="result-url"
                      >
                        {shortUrl}
                      </a>
                      <button onClick={copyToClipboard} className="copy-btn">
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hero Footer - Secondary Actions & Stats */}
            <div className="hero-footer">
              {/* Chrome Extension CTA */}
              <div className="extension-cta-compact">
                <div className="extension-info">
                  <span className="extension-badge">🚀 Chrome Extension</span>
                  <p className="extension-text-compact">
                    One-click shortening from any webpage
                  </p>
                </div>
                <a
                  href="https://chromewebstore.google.com/detail/shorten-url/pkdhbhbeapnenbeihmabpgmeeinbdpgc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="extension-btn-compact"
                >
                  Add to Chrome
                </a>
              </div>

              {/* Stats */}
              <div className="stats-compact">
                <div className="stat-item-compact">
                  <div className="stat-number-compact">∞</div>
                  <div className="stat-label-compact">Links</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item-compact">
                  <div className="stat-number-compact">99.9%</div>
                  <div className="stat-label-compact">Uptime</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item-compact">
                  <div className="stat-number-compact">&lt;50ms</div>
                  <div className="stat-label-compact">Speed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-subtitle">
            Everything you need for professional URL management
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>
                Generate short URLs in milliseconds with our optimized AWS
                Lambda functions
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>
                Cryptographically random 8-character codes with enterprise-grade
                AWS security
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👤</div>
              <h3>User Authentication</h3>
              <p>
                Sign up with AWS Cognito to track and manage all your shortened
                links
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Link Dashboard</h3>
              <p>
                View all your links in one place with timestamps and analytics
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Anonymous Mode</h3>
              <p>
                No account needed - create short links instantly without signing
                up
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">♾️</div>
              <h3>Infinite Scale</h3>
              <p>
                Built on serverless AWS infrastructure that scales automatically
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Simple, fast, and efficient</p>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Paste Your URL</h3>
              <p>Enter any long URL you want to shorten</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Get Short Link</h3>
              <p>Receive a unique 8-character short code</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Share Anywhere</h3>
              <p>Use your short link on social media, emails, or anywhere</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="tech-stack">
        <div className="container">
          <h2 className="section-title">Built with Modern Technology</h2>
          <p className="section-subtitle">
            Powered by AWS serverless architecture
          </p>

          <div className="tech-grid">
            <div className="tech-item">
              <div className="tech-badge">AWS Lambda</div>
              <p>Serverless functions</p>
            </div>
            <div className="tech-item">
              <div className="tech-badge">DynamoDB</div>
              <p>NoSQL database</p>
            </div>
            <div className="tech-item">
              <div className="tech-badge">API Gateway</div>
              <p>REST API</p>
            </div>
            <div className="tech-item">
              <div className="tech-badge">Cognito</div>
              <p>Authentication</p>
            </div>
            <div className="tech-item">
              <div className="tech-badge">Terraform</div>
              <p>Infrastructure as Code</p>
            </div>
            <div className="tech-item">
              <div className="tech-badge">CloudWatch</div>
              <p>Monitoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="security">
        <div className="container">
          <h2 className="section-title">Enterprise-Grade Security</h2>
          <div className="security-features">
            <div className="security-item">
              <span className="security-check">✓</span>
              <div>
                <h4>Cryptographic Random Generation</h4>
                <p>48-bit entropy with 281 trillion possible combinations</p>
              </div>
            </div>
            <div className="security-item">
              <span className="security-check">✓</span>
              <div>
                <h4>JWT Authentication</h4>
                <p>Secure token-based authentication with AWS Cognito</p>
              </div>
            </div>
            <div className="security-item">
              <span className="security-check">✓</span>
              <div>
                <h4>HTTPS Only</h4>
                <p>All communications encrypted with TLS</p>
              </div>
            </div>
            <div className="security-item">
              <span className="security-check">✓</span>
              <div>
                <h4>Collision Prevention</h4>
                <p>Atomic DynamoDB writes prevent duplicate codes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2 className="cta-title">Ready to Start Shortening?</h2>
          <p className="cta-subtitle">
            Join thousands of users who trust our service
          </p>
          <div className="cta-buttons">
            <a
              href="https://chromewebstore.google.com/detail/shorten-url/pkdhbhbeapnenbeihmabpgmeeinbdpgc"
              className="btn btn-primary"
              target="_blank"
            >
              Try It Now
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>URL Shortener</h3>
              <p>Fast, secure, and reliable URL shortening powered by AWS</p>
            </div>
            <div className="footer-section">
              <h4>Features</h4>
              <ul>
                <li>Anonymous Shortening</li>
                <li>User Authentication</li>
                <li>Link Dashboard</li>
                <li>Secure Codes</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Technology</h4>
              <ul>
                <li>AWS Lambda</li>
                <li>DynamoDB</li>
                <li>Cognito</li>
                <li>Terraform</li>
              </ul>
            </div>
            {/* <div className="footer-section">
              <h4>Resources</h4>
              <ul>
                <li>
                  <a href="https://github.com/yourusername/Shorten-URL">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="https://github.com/yourusername/Shorten-URL/blob/main/ARCHITECTURE.md">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="https://github.com/yourusername/Shorten-URL/blob/main/DEPLOYMENT.md">
                    API Docs
                  </a>
                </li>
              </ul>
            </div> */}
          </div>
          <div className="footer-bottom">
            <p>
              &copy; 2025 ShortenURL. Built by{" "}
              <a
                href="https://youssefmohamed.ca/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Youssef Mohamed
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
