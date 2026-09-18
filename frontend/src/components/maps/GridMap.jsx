import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const zoneCoordinates = {
  whitefield: [12.9698, 77.75],
  indiranagar: [12.9784, 77.6408],
  koramangala: [12.9352, 77.6245],
  varthur: [12.9406, 77.7468],
}

export default function GridMap({ selectedZones = ['whitefield', 'indiranagar'] }) {
  // TODO: Janhavi — refine route highlighting and map styling.
  return (
    <MapContainer className="h-72 w-full rounded-xl" center={[12.96, 77.69]} zoom={11} scrollWheelZoom={false}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {selectedZones.map((zoneId) => {
        const position = zoneCoordinates[zoneId]
        if (!position) return null
        return <CircleMarker key={zoneId} center={position} pathOptions={{ color: '#22d3ee', fillColor: '#0891b2', fillOpacity: 0.8 }} radius={9}><Tooltip>{zoneId}</Tooltip></CircleMarker>
      })}
    </MapContainer>
  )
}
