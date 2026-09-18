import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import { findZone, zones } from '../../data/zones.js'

function MapViewport({ suggestions, redirectSuggestions, recommendedZone }) {
  const map = useMap()
  useEffect(() => {
    const allPlaces = [...(suggestions || []), ...(redirectSuggestions || [])]
    const validPoints = allPlaces
      .map(s => {
        if (s.location) return [s.location.lat, s.location.lng]
        const zone = findZone(s.zoneId || s.zone)
        if (zone) return [zone.coordinates.lat, zone.coordinates.lng]
        return null
      })
      .filter(Boolean)
    
    if (validPoints.length > 0) {
      map.fitBounds(validPoints, { padding: [40, 40], maxZoom: 14 })
    } else {
      const zone = findZone(recommendedZone)
      if (zone) map.setView([zone.coordinates.lat, zone.coordinates.lng], 12)
    }
  }, [map, suggestions, redirectSuggestions, recommendedZone])
  
  return null
}

export default function CompassMap({ recommendedZone = 'koramangala', suggestions = [], redirectSuggestions = [] }) {
  const allPoints = [...suggestions, ...redirectSuggestions]
  const defaultPos = findZone(recommendedZone)?.coordinates || { lat: 12.9352, lng: 77.6245 }
  
  return (
    <MapContainer className="h-72 w-full rounded-xl" center={[defaultPos.lat, defaultPos.lng]} zoom={12} scrollWheelZoom={false}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapViewport suggestions={suggestions} redirectSuggestions={redirectSuggestions} recommendedZone={recommendedZone} />
      
      {allPoints.map((suggestion, index) => {
        let lat, lng
        if (suggestion.location) {
          lat = suggestion.location.lat
          lng = suggestion.location.lng
        } else {
          const zone = findZone(suggestion.zoneId || suggestion.zone)
          if (!zone) return null
          // slight random offset for mock data so they don't overlap perfectly
          lat = zone.coordinates.lat + (Math.random() - 0.5) * 0.01
          lng = zone.coordinates.lng + (Math.random() - 0.5) * 0.01
        }
        
        const isRedirect = redirectSuggestions.some(s => s.id === suggestion.id)
        const color = isRedirect ? '#eab308' : '#9333ea' // yellow for redirect, purple for normal
        const fillColor = isRedirect ? '#fef08a' : '#c084fc'

        return (
          <CircleMarker 
            key={`${suggestion.id}-${index}`} 
            center={[lat, lng]} 
            pathOptions={{ color, fillColor, fillOpacity: 0.8, weight: 2 }} 
            radius={8}
          >
            <Tooltip>{suggestion.name}</Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
