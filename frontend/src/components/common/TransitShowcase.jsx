import { useEffect, useState } from "react";

const vehicles = [
  { name: "BMTC bus", src: "/bus.svg", accent: "BUS / GRID" },
  { name: "Auto rickshaw", src: "/rickshaw.svg", accent: "AUTO / FLOW" },
];

export default function TransitShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % vehicles.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  const vehicle = vehicles[activeIndex];

  return (
    <div className="transit-showcase" aria-label="Namma Flow transport modes">
      <div className="transit-showcase-meta">
        <span>IN MOTION</span>
        <span className="font-mono-data">0{activeIndex + 1} / 02</span>
      </div>
      <div className="transit-art-stage">
        <img
          key={vehicle.src}
          className="transit-art"
          src={vehicle.src}
          alt={vehicle.name}
        />
      </div>
      <div className="transit-showcase-footer">
        <span className="font-display">{vehicle.name}</span>
        <span className="font-mono-data">{vehicle.accent}</span>
      </div>
      <div className="transit-dots" aria-hidden="true">
        {vehicles.map((item, index) => (
          <span
            key={item.src}
            className={index === activeIndex ? "active" : ""}
          />
        ))}
      </div>
    </div>
  );
}
