
import "./TCPIPGuide.css";

const layers = [
  {
    number: "01",
    name: "Application Layer",
    purpose: "Provides network services to applications.",
    protocols: "HTTP, HTTPS, DNS, SMTP",
    example: "A browser requests a webpage using HTTPS.",
  },
  {
    number: "02",
    name: "Transport Layer",
    purpose: "Provides communication between applications and manages data delivery.",
    protocols: "TCP, UDP",
    example: "TCP provides reliable delivery; UDP supports lightweight communication.",
  },
  {
    number: "03",
    name: "Internet Layer",
    purpose: "Handles logical addressing and routing packets between networks.",
    protocols: "IP, ICMP",
    example: "IP helps route packets toward their destination.",
  },
  {
    number: "04",
    name: "Network Access Layer",
    purpose: "Handles communication over the local network.",
    protocols: "Ethernet, Wi-Fi, ARP",
    example: "Ethernet or Wi-Fi carries data across a local network.",
  },
];

function TCPIPGuide() {
  return (
    <section className="tcpip-guide">
      <h2 className="tcpip-title">TCP/IP Guide</h2>

      <p className="tcpip-description">
        Explore the four layers of the TCP/IP model and
        understand how network communication works.
      </p>

      <div className="tcpip-flow">
        Application → Transport → Internet → Network Access
      </div>

      <div className="tcpip-layers">
        {layers.map((layer) => (
          <article className="tcpip-layer" key={layer.number}>
            <div className="tcpip-layer-number">
              {layer.number}
            </div>

            <div className="tcpip-layer-content">
              <h3>{layer.name}</h3>

              <p>{layer.purpose}</p>

              <div className="tcpip-protocols">
                <strong>Common protocols:</strong>{" "}
                {layer.protocols}
              </div>

              <p className="tcpip-example">
                <strong>Example:</strong> {layer.example}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="tcpip-note">
        <strong>Remember:</strong> Data moves down the layers
        when being sent and up the layers when being received.
      </div>
    </section>
  );
}

export default TCPIPGuide;
