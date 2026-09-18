import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const zoneCoordinates = {
  indiranagar: [12.9784, 77.6408],
  koramangala: [12.9352, 77.6245],
  varthur: [12.9406, 77.7468],
  whitefield: [12.9698, 77.75],
}

export default function CompassMap({ recommendedZone = 'koramangala' }) {
  // TODO: Shravya — add suggestion markers and congestion-aware map behavior.
  const position = zoneCoordinates[recommendedZone] ?? zoneCoordinates.koramangala
  return (
    <MapContainer className="h-72 w-full rounded-xl" center={position} zoom={12} scrollWheelZoom={false}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker center={position} pathOptions={{ color: '#c084fc', fillColor: '#9333ea', fillOpacity: 0.8 }} radius={10}><Tooltip>{recommendedZone}</Tooltip></CircleMarker>
    </MapContainer>
  )
}
