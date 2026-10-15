
import "./Navbar.css";

const navItems = [
  { label: "Home", tool: null },
  { label: "HTTP", tool: "HTTP Checker" },
  { label: "DNS", tool: "DNS Lookup" },
  { label: "IP", tool: "IP Information" },
  { label: "TCP/IP", tool: "TCP/IP Guide" },
  { label: "Ports", tool: "Port Checker" },
];

function Navbar({ onNavigate }) {
  return (
    <nav className="navbar">
      <h2 className="navbar-logo">
        🌐 Network Diagnostic Toolkit
      </h2>

      <ul className="navbar-menu">
        {navItems.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              className="navbar-item"
              onClick={() => onNavigate(item.tool)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navbar;
