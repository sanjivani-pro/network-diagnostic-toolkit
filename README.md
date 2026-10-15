# Network Diagnostic Toolkit

A web-based networking utility built with React and Node.js to check HTTP responses, inspect DNS records, retrieve public IP information, understand TCP/IP layers, and test TCP port connectivity.

## Features

### HTTP Checker
- Checks a website's HTTP response.
- Automatically adds HTTPS when a domain is entered without a protocol.
- Displays HTTP status code, response time, and protocol.
- Handles invalid URLs and request errors.

### DNS Lookup
- Retrieves A (IPv4), AAAA (IPv6), MX (mail server), and NS (nameserver) records.
- Displays DNS lookup results in a readable format.
- Includes input validation and error handling.
- Uses Cloudflare DNS over HTTPS.

### IP Information
- Accepts IPv4 and IPv6 addresses.
- Displays IP version, country, region, city, ISP, organization, and timezone.
- Uses ipwho.is to retrieve IP information.
- Notes that IP-based geolocation is approximate.

### TCP/IP Guide
- Explains the four layers of the TCP/IP model.
- Shows common protocols, layer responsibilities, and practical examples.

### Port Checker
- Checks an individual TCP port on a public hostname or public IPv4 address.
- Displays the resolved IPv4 address, port, connection status, and response time.
- Distinguishes successful connections, refused connections, and inconclusive results.
- Validates port numbers and restricts certain local, private, and reserved destinations.

### User Interface
- Dark-themed interface.
- Reusable React feature cards.
- Functional navbar and feature selection.
- Automatic scrolling to the selected tool.
- Responsive layouts for smaller screens.

## Technology Stack

**Frontend:** React, Vite, JavaScript, CSS

**Backend:** Node.js, built-in HTTP and networking modules, Fetch API

**External Services:**
- Cloudflare DNS over HTTPS
- ipwho.is IP information API

## Project Structure

```text
network-diagnostic-toolkit/
├── backend/
│   └── server.js
├── src/
│   ├── components/
│   │   ├── FeatureCard.jsx
│   │   ├── FeatureCard.css
│   │   ├── Navbar.jsx
│   │   ├── Navbar.css
│   │   ├── HTTPChecker.jsx
│   │   ├── HTTPChecker.css
│   │   ├── DNSLookup.jsx
│   │   ├── DNSLookup.css
│   │   ├── IPInfo.jsx
│   │   ├── IPInfo.css
│   │   ├── TCPIPGuide.jsx
│   │   ├── TCPIPGuide.css
│   │   ├── PortChecker.jsx
│   │   └── PortChecker.css
│   ├── data/
│   │   └── features.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   └── Home.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── public/
├── package.json
├── package-lock.json
└── README.md
```

## Prerequisites

- Node.js and npm
- Internet connectivity for external DNS and IP-information services

## Run Locally

Clone the repository and navigate into the project directory.

Install dependencies:

```bash
npm install
```

### Start the backend

Open a terminal in the project root:

```bash
node backend/server.js
```

The backend runs at `http://localhost:5000`.

### Start the frontend

Open a second terminal in the same project root:

```bash
npm run dev
```

Open the local Vite URL displayed in the terminal. The current backend CORS configuration expects the frontend at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend availability |
| POST | `/api/check-http` | Check an HTTP response |
| POST | `/api/dns-lookup` | Retrieve DNS records |
| POST | `/api/ip-info` | Retrieve IP information |
| POST | `/api/check-port` | Check one TCP port |

### Example Request Bodies

**HTTP Checker**

```json
{
  "url": "https://example.com"
}
```

**DNS Lookup**

```json
{
  "domain": "example.com",
  "recordType": "A"
}
```

**IP Information**

```json
{
  "ip": "8.8.8.8"
}
```

**Port Checker**

```json
{
  "host": "example.com",
  "port": 443
}
```

## Limitations and Safety

- External DNS and IP-information lookups require internet connectivity and depend on third-party services.
- IP geolocation is approximate and does not establish a device's exact physical location.
- A TCP connection timeout does not prove that a port is closed; firewalls and network conditions may affect the result.
- Use the port checker only on systems you own or have permission to assess.
- This is a learning and demonstration project, not a production-hardened network security scanner. Additional security controls are required before exposing the backend publicly.

## Project Objective

The project demonstrates how a React frontend communicates with a Node.js backend to provide practical networking utilities in one application.

It combines web development, HTTP communication, DNS records, IP information, TCP connectivity, input validation, and error handling.