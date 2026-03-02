import { useState } from "react";
import { RiArrowRightLine } from "react-icons/ri";
import "../styles/ExpandableElement.css";

const ExpandableElement = ({ title, headerElement, innerElement }) => {
  const [showElement, setShowElement] = useState(true);

  return (
    <div className="expandable-element-container">
      <button
        onClick={() => {
          setShowElement(!showElement);
          console.log(`Toggled element`);
        }}
        className="expandable-element-toggle"
      >
        <span className="expandable-element-title">{title}</span>

        {headerElement && (
          <div className="expandable-element-header">{headerElement}</div>
        )}

        <RiArrowRightLine
          size={24}
          className={`expandable-element-arrow ${showElement ? "expandable-element-arrow--open" : "expandable-element-arrow--closed"}`}
        />
      </button>

      {showElement && innerElement && (
        <div className="expandable-element-content">{innerElement}</div>
      )}
    </div>
  );
};

export default ExpandableElement;
