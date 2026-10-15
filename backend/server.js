
import http from "http";
import net from "node:net";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

const PORT = 5000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    ...corsHeaders,
    "Content-Type": "application/json",
  });

  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

function validateUrl(input) {
  if (typeof input !== "string" || !input.trim()) {
    return { valid: false, error: "Please enter a URL." };
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(input.trim());
  } catch {
    return { valid: false, error: "Please enter a valid URL." };
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return {
      valid: false,
      error: "Only HTTP and HTTPS URLs are allowed.",
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  const isPrivate172 =
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

  const isBlockedHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("169.254.") ||
    isPrivate172;

  if (isBlockedHost) {
    return {
      valid: false,
      error: "Local and private network URLs are not allowed.",
    };
  }

  return { valid: true, url: parsedUrl.toString() };
}

function validateDomain(input) {
  if (typeof input !== "string" || !input.trim()) {
    return {
      valid: false,
      error: "Please enter a domain name.",
    };
  }

  let domain = input.trim().toLowerCase();

  if (domain.endsWith(".")) {
    domain = domain.slice(0, -1);
  }

  if (
    domain.length > 253 ||
    !domain.includes(".") ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(domain)
  ) {
    return {
      valid: false,
      error: "Enter a valid domain name, such as example.com.",
    };
  }

  const invalidLabel = domain.split(".").some((label) => {
    return (
      label.length > 63 ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
    );
  });

  if (invalidLabel) {
    return {
      valid: false,
      error: "Enter a valid domain name, such as example.com.",
    };
  }

  return { valid: true, domain };
}

async function lookupDnsRecords(domain, recordType) {
  const recordTypeCodes = {
    A: 1,
    NS: 2,
    MX: 15,
    AAAA: 28,
  };

  const queryUrl = new URL(
    "https://cloudflare-dns.com/dns-query"
  );

  queryUrl.searchParams.set("name", domain);
  queryUrl.searchParams.set("type", recordType);

  const response = await fetch(queryUrl, {
    headers: { Accept: "application/dns-json" },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error("DNS service is unavailable.");
  }

  const result = await response.json();

  if (result.Status === 3) {
    const error = new Error("Domain not found.");
    error.code = "ENOTFOUND";
    throw error;
  }

  if (result.Status !== 0) {
    throw new Error(`DNS resolver status: ${result.Status}`);
  }

  const answers = Array.isArray(result.Answer)
    ? result.Answer
    : [];

  return answers
    .filter((answer) => answer.type === recordTypeCodes[recordType])
    .map((answer) => {
      if (recordType === "MX") {
        const parts = answer.data.trim().split(/\s+/);

        return {
          priority: Number(parts[0]),
          exchange: parts.slice(1).join(" "),
        };
      }

      return answer.data;
    });
}

// Allow only public IPv4 addresses for the port checker.
function isPublicIPv4(address) {
  if (isIP(address) !== 4) {
    return false;
  }

  const [a, b, c] = address.split(".").map(Number);

  const isPrivateOrReserved =
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224;

  return !isPrivateOrReserved;
}

function checkTcpPort(address, port) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = net.createConnection({
      host: address,
      port,
      family: 4,
    });

    let finished = false;

    function finish(status, message) {
      if (finished) {
        return;
      }

      finished = true;

      const responseTimeMs = Date.now() - startTime;

      socket.destroy();

      resolve({
        status,
        message,
        responseTimeMs,
      });
    }

    socket.setTimeout(4000);

    socket.once("connect", () => {
      finish(
        "open",
        "TCP connection succeeded; the port accepted the connection."
      );
    });

    socket.once("timeout", () => {
      finish(
        "inconclusive",
        "Connection timed out. The port may be filtered or the host may be unreachable."
      );
    });

    socket.once("error", (error) => {
      if (error.code === "ECONNREFUSED") {
        finish(
          "closed",
          "The target refused the connection; the port is likely closed."
        );
        return;
      }

      finish(
        "inconclusive",
        "The connection failed. The host may be unreachable or the port may be filtered."
      );
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/api/health") {
    sendJson(res, 200, {
      message: "Network Diagnostic Toolkit backend is running.",
    });
    return;
  }

  // HTTP Checker
  if (req.method === "POST" && req.url === "/api/check-http") {
    let data;

    try {
      data = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body." });
      return;
    }

    const validation = validateUrl(data.url);

    if (!validation.valid) {
      sendJson(res, 400, { error: validation.error });
      return;
    }

    try {
      const startTime = Date.now();
      const targetResponse = await fetch(validation.url);
      const responseTime = Date.now() - startTime;

      const protocol = new URL(targetResponse.url)
        .protocol.replace(":", "")
        .toUpperCase();

      sendJson(res, 200, {
        statusCode: targetResponse.status,
        statusText: targetResponse.statusText,
        responseTime,
        protocol,
      });
    } catch {
      sendJson(res, 502, {
        error: "Unable to reach target URL.",
      });
    }

    return;
  }

  // DNS Lookup
  if (req.method === "POST" && req.url === "/api/dns-lookup") {
    let data;

    try {
      data = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body." });
      return;
    }

    const validation = validateDomain(data.domain);

    if (!validation.valid) {
      sendJson(res, 400, { error: validation.error });
      return;
    }

    const recordType =
      typeof data.recordType === "string"
        ? data.recordType.trim().toUpperCase()
        : "";

    if (!["A", "AAAA", "MX", "NS"].includes(recordType)) {
      sendJson(res, 400, {
        error: "Choose A, AAAA, MX, or NS.",
      });
      return;
    }

    try {
      const records = await lookupDnsRecords(
        validation.domain,
        recordType
      );

      sendJson(res, 200, {
        domain: validation.domain,
        recordType,
        records,
        ...(records.length === 0 && {
          message: `No ${recordType} records were found for ${validation.domain}.`,
        }),
      });
    } catch (error) {
      if (error.code === "ENOTFOUND") {
        sendJson(res, 404, {
          error: "The domain could not be found.",
        });
        return;
      }

      console.error("DNS lookup error:", error.message);

      sendJson(res, 502, {
        error: "DNS lookup failed. Please try again.",
      });
    }

    return;
  }

  // IP Information
  if (req.method === "POST" && req.url === "/api/ip-info") {
    let data;

    try {
      data = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body." });
      return;
    }

    const ip = typeof data.ip === "string" ? data.ip.trim() : "";
    const ipVersion = isIP(ip);

    if (!ipVersion) {
      sendJson(res, 400, {
        error: "Enter a valid IPv4 or IPv6 address.",
      });
      return;
    }

    try {
      const response = await fetch(
        `https://ipwho.is/${ip}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        throw new Error("IP information service is unavailable.");
      }

      const info = await response.json();

      if (!info.success) {
        sendJson(res, 400, {
          error: info.message ||
            "Information is unavailable for this IP.",
        });
        return;
      }

      sendJson(res, 200, {
        ip: info.ip || ip,
        type: info.type || (ipVersion === 4 ? "IPv4" : "IPv6"),
        continent: info.continent ?? null,
        country: info.country ?? null,
        region: info.region ?? null,
        city: info.city ?? null,
        latitude: info.latitude ?? null,
        longitude: info.longitude ?? null,
        connection: {
          asn: info.connection?.asn ?? null,
          org: info.connection?.org ?? null,
          isp: info.connection?.isp ?? null,
          domain: info.connection?.domain ?? null,
        },
        timezone: {
          id: info.timezone?.id ?? null,
          utc: info.timezone?.utc ?? null,
        },
      });
    } catch (error) {
      console.error("IP information error:", error.message);

      sendJson(res, 502, {
        error: "Unable to retrieve IP information. Please try again.",
      });
    }

    return;
  }

  // Port Checker: checks one TCP port on a public destination.
  if (req.method === "POST" && req.url === "/api/check-port") {
    let data;

    try {
      data = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body." });
      return;
    }

    const host =
      typeof data.host === "string" ? data.host.trim() : "";

    const port = Number(data.port);

    if (!host) {
      sendJson(res, 400, {
        error: "Please enter a hostname or public IPv4 address.",
      });
      return;
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      sendJson(res, 400, {
        error: "Enter a valid port number between 1 and 65535.",
      });
      return;
    }

    let targetAddress;

    if (isIP(host) === 4) {
      if (!isPublicIPv4(host)) {
        sendJson(res, 400, {
          error: "Local, private, and reserved IP addresses are not allowed.",
        });
        return;
      }

      targetAddress = host;
    } else {
      if (isIP(host) === 6) {
        sendJson(res, 400, {
          error: "Please enter a hostname or public IPv4 address.",
        });
        return;
      }

      const validation = validateDomain(host);

      if (!validation.valid) {
        sendJson(res, 400, {
          error: "Enter a valid hostname, such as example.com.",
        });
        return;
      }

      try {
        const addresses = await lookup(validation.domain, {
          family: 4,
          all: true,
        });

        if (addresses.length === 0) {
          sendJson(res, 400, {
            error: "The hostname did not resolve to an IPv4 address.",
          });
          return;
        }

        if (addresses.some(({ address }) => !isPublicIPv4(address))) {
          sendJson(res, 400, {
            error: "This hostname resolves to a private or reserved address and cannot be checked.",
          });
          return;
        }

        targetAddress = addresses[0].address;
      } catch {
        sendJson(res, 400, {
          error: "Unable to resolve this hostname to an IPv4 address.",
        });
        return;
      }
    }

    const result = await checkTcpPort(targetAddress, port);

    sendJson(res, 200, {
      host,
      resolvedAddress: targetAddress,
      port,
      ...result,
    });

    return;
  }

  sendJson(res, 404, { error: "Route not found." });
});

server.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
