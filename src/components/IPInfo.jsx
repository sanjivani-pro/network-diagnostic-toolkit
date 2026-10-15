
import { useState } from "react";
import "./IPInfo.css";

function IPInfo() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLookup(event) {
    event.preventDefault();
    setResult(null);
    setError("");

    if (!ip.trim()) {
      setError("Please enter an IP address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/ip-info",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ip: ip.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "IP lookup failed.");
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

  const fields = result
    ? [
        ["IP Address", result.ip],
        ["IP Version", result.type],
        ["Country", result.country],
        ["Region", result.region],
        ["City", result.city],
        ["ISP", result.connection?.isp],
        ["Organization", result.connection?.org],
        ["Timezone", result.timezone?.id],
      ]
    : [];

  return (
    <section className="ip-info-tool">
      <h2 className="ip-info-title">IP Information</h2>

      <p className="ip-info-description">
        Look up network and geographic details for an IP address.
      </p>

      <form className="ip-info-form" onSubmit={handleLookup}>
        <div className="ip-info-field">
          <label htmlFor="ip-address">IP Address</label>

          <input
            id="ip-address"
            type="text"
            placeholder="8.8.8.8"
            value={ip}
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setIp(event.target.value);
              setResult(null);
              setError("");
            }}
          />
        </div>

        <button
          type="submit"
          className="ip-info-button"
          disabled={loading}
        >
          {loading ? "Looking up..." : "Lookup IP"}
        </button>
      </form>

      {error && (
        <p className="ip-info-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="ip-info-results" aria-live="polite">
          <h3>Lookup Results</h3>

          <div className="ip-info-grid">
            {fields.map(([label, value]) => (
              <div className="ip-info-item" key={label}>
                <span className="ip-info-label">{label}</span>
                <strong className="ip-info-value">
                  {value ?? "Not available"}
                </strong>
              </div>
            ))}
          </div>

          <p className="ip-info-note">
            IP-based locations are approximate and may not identify
            the exact physical location of a device.
          </p>
        </div>
      )}
    </section>
  );
}

export default IPInfo;
