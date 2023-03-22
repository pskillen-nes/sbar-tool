import React from "react";
import "../overrides.css";

export default function BlockLoadingSpinner() {
  return (
    <div style={{display: "flex"}} className="loading-container">
      <div className="spinner-container">
        <div className="loading-spinner">
        </div>
      </div>
    </div>
  );
}
