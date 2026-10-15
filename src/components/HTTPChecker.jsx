
import { useState } from "react";
import "./HTTPChecker.css";

function HTTPChecker() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState({
    statusCode: "--",
    responseTime: "--",
    protocol: "--",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkStatus(event) {
    event.preventDefault();

    setError("");
    setResult({
      statusCode: "--",
      responseTime: "--",
      protocol: "--",
    });

    const enteredUrl = url.trim();

    if (!enteredUrl) {
      setError("Please enter a website URL.");
      return;
    }

    // Automatically add HTTPS when the user enters only a domain.
    let normalizedUrl = enteredUrl;

    if (!/^https?:\/\//i.test(enteredUrl)) {
      const hasUnsupportedScheme =
        /^[a-z][a-z\d+.-]*:\/\//i.test(enteredUrl);

      if (hasUnsupportedScheme) {
        setError("Only HTTP and HTTPS URLs are allowed.");
        return;
      }

      normalizedUrl = `https://${enteredUrl}`;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/check-http",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: normalizedUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to check this URL.");
        return;
      }

      setUrl(normalizedUrl);

      setResult({
        statusCode: data.statusCode,
        responseTime: data.responseTime,
        protocol: data.protocol,
      });
    } catch {
      setError(
        "Unable to connect to the backend or reach the website."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="http-checker">
      <h2 className="http-title">HTTP Status Checker</h2>

      <p className="http-description">
        Enter a website URL to check its HTTP status and response details.
      </p>

      <form className="http-form" onSubmit={checkStatus}>
        <input
          type="text"
          placeholder="https://example.com"
          className="http-input"
          value={url}
          disabled={loading}
          autoComplete="url"
          onChange={(event) => {
            setUrl(event.target.value);
            setError("");
          }}
        />

        <button
          type="submit"
          className="http-button"
          disabled={loading}
        >
          {loading ? "Checking..." : "Check Status"}
        </button>
      </form>

      {error && (
        <p className="http-error" role="alert">
          {error}
        </p>
      )}

      <div className="http-result" aria-live="polite">
        <p>Status Code : {result.statusCode}</p>
        <p>Response Time : {result.responseTime} ms</p>
        <p>Protocol : {result.protocol}</p>
      </div>
    </section>
  );
}

export default HTTPChecker;
