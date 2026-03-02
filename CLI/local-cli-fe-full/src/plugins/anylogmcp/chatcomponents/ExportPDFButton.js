import React from "react";
import { IoDownloadOutline } from "react-icons/io5";
import "../styles/ExportPDFButton.css";

const ExportButton = ({ onClick, disabled = false, hint }) => {
  return (
    <div className="export-button">
      <IoDownloadOutline
        className={`export-button__icon ${disabled ? "export-button__icon--disabled" : "export-button__icon--enabled"}`}
        size={24}
        onClick={disabled ? undefined : onClick}
      />
      <span className="export-button__hint">{hint}</span>
    </div>
  );
};

export default ExportButton;
