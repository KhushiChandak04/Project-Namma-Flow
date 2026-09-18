import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { findZone, zones } from "../../data/zones.js";

const defaultCenter = [12.96, 77.69];
const congestionColor = (value) =>
  value >= 75 ? "#E1432B" : value >= 55 ? "#F2711C" : "#D9A400";

function MapViewport({ routePoints }) {
  const map = useMap();

  useEffect(() => {
    if (routePoints.length > 1)
      map.fitBounds(routePoints, { padding: [34, 34], maxZoom: 12 });
  }, [map, routePoints]);

  return null;
}

function FitRouteButton({ routePoints }) {
  const map = useMap();

  function fitRoute() {
    if (routePoints.length > 1)
      map.fitBounds(routePoints, { padding: [34, 34], maxZoom: 12 });
  }

  return (
    <button
      type="button"
      className="map-fit-button"
      onClick={fitRoute}
      disabled={routePoints.length < 2}
    >
      Fit route
    </button>
  );
}

export default function GridMap({
  origin = "Whitefield",
  destination = "Indiranagar",
}) {
  const originZone = findZone(origin) || zones[0];
  const destinationZone = findZone(destination) || zones[1];
  const routePoints = [
    [originZone.coordinates.lat, originZone.coordinates.lng],
    [12.965, 77.695],
    [12.982, 77.665],
    [destinationZone.coordinates.lat, destinationZone.coordinates.lng],
  ];

  return (
    <div className="grid-map-shell">
      <MapContainer
        className="grid-map"
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport routePoints={routePoints} />
        <FitRouteButton routePoints={routePoints} />
        <Polyline
          positions={routePoints}
          pathOptions={{
            color: "#E1432B",
            weight: 6,
            opacity: 0.9,
            lineCap: "round",
          }}
        />
        <CircleMarker
          center={routePoints[0]}
          radius={11}
          pathOptions={{
            color: "#221B14",
            weight: 3,
            fillColor: "#E1432B",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>Start: {originZone.name}</strong>
            <br />
            Your commute begins here.
          </Popup>
        </CircleMarker>
        <CircleMarker
          center={routePoints[routePoints.length - 1]}
          radius={11}
          pathOptions={{
            color: "#221B14",
            weight: 3,
            fillColor: "#FFC22E",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>Destination: {destinationZone.name}</strong>
            <br />
            You&apos;ll arrive here.
          </Popup>
        </CircleMarker>
        {zones.map((zone) => {
          const position = [zone.coordinates.lat, zone.coordinates.lng];
          const congestion = zone.congestion.daytime;
          return (
            <CircleMarker
              key={zone.id}
              center={position}
              radius={7}
              pathOptions={{
                color: "#221B14",
                weight: 2,
                fillColor: congestionColor(congestion),
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <strong>{zone.name}</strong>
                <br />
                <span>{congestion}% simulated daytime load</span>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="map-overlay map-status">
        <span className="map-live-dot" /> Route preview · tap a pin
      </div>
      <div className="map-legend">
        <span>
          <i className="legend-dot legend-high" /> busy
        </span>
        <span>
          <i className="legend-dot legend-mid" /> moving
        </span>
        <span>
          <i className="legend-dot legend-low" /> lighter
        </span>
      </div>
    </div>
  );
}
