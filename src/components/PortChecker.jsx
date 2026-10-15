
import { useState } from "react";
import "./PortChecker.css";

function PortChecker() {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("443");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function clearPreviousResult() {
    setResult(null);
    setError("");
  }

  async function handleCheck(event) {
    event.preventDefault();
    clearPreviousResult();

    if (!host.trim()) {
      setError("Please enter a hostname or public IPv4 address.");
      return;
    }

    const portNumber = Number(port);

    if (!Number.isInteger(portNumber) ||
        portNumber < 1 ||
        portNumber > 65535) {
      setError("Enter a port number between 1 and 65535.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/check-port",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            host: host.trim(),
            port: portNumber,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Port check failed.");
        return;
      }

      setResult(data);
    } catch {
      setError(
        "Unable to connect to the backend. Make sure the server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="port-checker">
      <h2 className="port-checker-title">Port Checker</h2>

      <p className="port-checker-description">
        Check whether a TCP port accepts connections on a public host.
      </p>

      <form className="port-checker-form" onSubmit={handleCheck}>
        <div className="port-checker-field">
          <label htmlFor="port-host">Target Host</label>
          <input
            id="port-host"
            type="text"
            placeholder="example.com"
            value={host}
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setHost(event.target.value);
              clearPreviousResult();
            }}
          />
        </div>

        <div className="port-checker-field">
          <label htmlFor="port-number">TCP Port</label>
          <input
            id="port-number"
            type="number"
            min="1"
            max="65535"
            placeholder="443"
            value={port}
            disabled={loading}
            onChange={(event) => {
              setPort(event.target.value);
              clearPreviousResult();
            }}
          />
        </div>

        <button
          type="submit"
          className="port-checker-button"
          disabled={loading}
        >
          {loading ? "Checking..." : "Check Port"}
        </button>
      </form>

      {error && (
        <p className="port-checker-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="port-checker-results" aria-live="polite">
          <h3>Check Results</h3>

          <div className="port-checker-result-grid">
            <div className="port-checker-item">
              <span>Target</span>
              <strong>{result.host}</strong>
            </div>

            <div className="port-checker-item">
              <span>Resolved IPv4</span>
              <strong>{result.resolvedAddress}</strong>
            </div>

            <div className="port-checker-item">
              <span>TCP Port</span>
              <strong>{result.port}</strong>
            </div>

            <div className="port-checker-item">
              <span>Status</span>
              <strong className={`port-status port-status-${result.status}`}>
                {result.status === "open"
                  ? "Open"
                  : result.status === "closed"
                    ? "Closed / Refused"
                    : "Inconclusive"}
              </strong>
            </div>

            <div className="port-checker-item">
              <span>Response Time</span>
              <strong>{result.responseTimeMs} ms</strong>
            </div>
          </div>

          <p className="port-checker-message">
            {result.message}
          </p>

          <p className="port-checker-note">
            A timeout does not prove that a port is closed; a firewall
            or an unreachable host may prevent a response.
          </p>
        </div>
      )}
    </section>
  );
}

export default PortChecker;
