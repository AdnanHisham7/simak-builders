import React from "react";

const ConstructionSiteIllustration = React.memo(() => {
    return (
      <div className="absolute inset-0 opacity-20">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-lg"
            style={{
              width: `${Math.random() * 120 + 40}px`,
              height: `${Math.random() * 120 + 40}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.4,
            }}
          />
        ))}
      </div>
    );
  });

  export default ConstructionSiteIllustration