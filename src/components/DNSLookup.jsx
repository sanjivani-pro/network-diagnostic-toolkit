
import { useState } from "react";
import "./DNSLookup.css";

function DNSLookup() {
  const [domain, setDomain] = useState("");
  const [recordType, setRecordType] = useState("A");
  const [lookupResult, setLookupResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function clearPreviousResult() {
    setLookupResult(null);
    setError("");
  }

  async function handleLookup(event) {
    event.preventDefault();

    clearPreviousResult();

    if (!domain.trim()) {
      setError("Please enter a domain name.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/dns-lookup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            domain: domain.trim(),
            recordType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "DNS lookup failed.");
        return;
      }

      setLookupResult({
        domain: data.domain || domain.trim(),
        recordType: data.recordType || recordType,
        records: Array.isArray(data.records)
          ? data.records
          : [],
        message: data.message || "",
      });
    } catch {
      setError(
        "Unable to connect to the backend. Make sure the server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatRecord(record, type) {
    if (typeof record === "string") {
      return record;
    }

    if (record && typeof record === "object") {
      if (
        type === "MX" &&
        record.exchange === "." &&
        record.priority === 0
      ) {
        return "Null MX — this domain does not accept email.";
      }

      if (type === "MX") {
        return `Mail server: ${record.exchange} | Priority: ${record.priority}`;
      }
    }

    return String(record);
  }

  return (
    <section className="dns-tool">
      <h2 className="dns-title">DNS Lookup</h2>

      <p className="dns-description">
        Find DNS records for any domain name.
      </p>

      <form className="dns-form" onSubmit={handleLookup}>
        <div className="dns-field">
          <label htmlFor="dns-domain">Domain Name</label>

          <input
            id="dns-domain"
            type="text"
            placeholder="example.com"
            value={domain}
            disabled={loading}
            onChange={(event) => {
              setDomain(event.target.value);
              clearPreviousResult();
            }}
          />
        </div>

        <div className="dns-field">
          <label htmlFor="dns-record-type">Record Type</label>

          <select
            id="dns-record-type"
            value={recordType}
            disabled={loading}
            onChange={(event) => {
              setRecordType(event.target.value);
              clearPreviousResult();
            }}
          >
            <option value="A">A (IPv4)</option>
            <option value="AAAA">AAAA (IPv6)</option>
            <option value="MX">MX (Mail)</option>
            <option value="NS">NS (Nameserver)</option>
          </select>
        </div>

        <button
          type="submit"
          className="dns-button"
          disabled={loading}
        >
          {loading ? "Looking up..." : "Lookup DNS"}
        </button>
      </form>

      {error && (
        <p className="dns-error" role="alert">
          {error}
        </p>
      )}

      {lookupResult && lookupResult.records.length === 0 && (
        <p className="dns-info" role="status">
          {lookupResult.message ||
            `No ${lookupResult.recordType} records found.`}
        </p>
      )}

      {lookupResult && lookupResult.records.length > 0 && (
        <div className="dns-results" aria-live="polite">
          <h3>Lookup Results</h3>

          <p className="dns-result-summary">
            Domain: <strong>{lookupResult.domain}</strong>
            {" | "}
            Type: <strong>{lookupResult.recordType}</strong>
          </p>

          <ul className="dns-record-list">
            {lookupResult.records.map((record, index) => (
              <li key={`${lookupResult.recordType}-${index}`}>
                <span className="dns-record-badge">
                  {lookupResult.recordType}
                </span>

                <span className="dns-record-value">
                  {formatRecord(record, lookupResult.recordType)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default DNSLookup;
