import "./FeatureCard.css";

function FeatureCard({ icon, title, description, onClick }) {
  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <div
      className="feature-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="feature-icon">{icon}</div>

      <h3 className="feature-title">{title}</h3>

      <p className="feature-description">{description}</p>
    </div>
  );
}

export default FeatureCard;