
import { useEffect, useRef, useState } from "react";
import "./Home.css";
import Navbar from "../components/Navbar";
import FeatureCard from "../components/FeatureCard";
import features from "../data/features";
import HTTPChecker from "../components/HTTPChecker";
import DNSLookup from "../components/DNSLookup";
import IPInfo from "../components/IPInfo";
import TCPIPGuide from "../components/TCPIPGuide";
import PortChecker from "../components/PortChecker";

function Home() {
  const [activeTool, setActiveTool] = useState(null);
  const toolContainerRef = useRef(null);

  useEffect(() => {
    if (activeTool && toolContainerRef.current) {
      toolContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [activeTool]);

  function openTool(tool) {
    if (tool === null) {
      setActiveTool(null);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    // If the same tool is clicked again, scroll to it directly.
    if (activeTool === tool && toolContainerRef.current) {
      toolContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    setActiveTool(tool);
  }

  const knownTools = [
    "HTTP Checker",
    "DNS Lookup",
    "IP Information",
    "TCP/IP Guide",
    "Port Checker",
  ];

  return (
    <>
      <Navbar onNavigate={openTool} />

      <main className="hero">
        <h1 className="hero-title">
          Network Diagnostic Toolkit
        </h1>

        <p className="hero-description">
          Check HTTP, DNS, IP information, TCP/IP concepts and ports
          from one place.
        </p>

        <button
          className="hero-button"
          onClick={() => openTool("HTTP Checker")}
        >
          Start Diagnosis
        </button>

        {activeTool && (
          <div
            ref={toolContainerRef}
            style={{ scrollMarginTop: "24px" }}
            tabIndex={-1}
          >
            {activeTool === "HTTP Checker" && <HTTPChecker />}

            {activeTool === "DNS Lookup" && <DNSLookup />}

            {activeTool === "IP Information" && <IPInfo />}

            {activeTool === "TCP/IP Guide" && <TCPIPGuide />}

            {activeTool === "Port Checker" && <PortChecker />}

            {!knownTools.includes(activeTool) && (
              <section className="tool-placeholder">
                <h2>{activeTool}</h2>

                <p>
                  This tool is coming soon. We will implement
                  its functionality next.
                </p>

                <button
                  className="hero-button"
                  onClick={() => openTool(null)}
                >
                  Close Tool
                </button>
              </section>
            )}
          </div>
        )}

        <div className="feature-section">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              onClick={() => openTool(feature.title)}
            />
          ))}
        </div>
      </main>
    </>
  );
}

export default Home;
