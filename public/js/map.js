// Map initialization and utilities
let map = null;
let marker = null;
let issueMarkers = [];

// Initialize map
const initMap = (containerId, center = [20.5937, 78.9629], zoom = 5) => {
    if (!window.L) {
        console.error('Leaflet library not loaded');
        return null;
    }

    map = L.map(containerId).setView(center, zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
    }).addTo(map);

    return map;
};

// Add marker to map
const addMarker = (lat, lng, options = {}) => {
    if (!map) return null;

    // Remove existing marker if it exists
    if (marker) {
        map.removeLayer(marker);
    }

    marker = L.marker([lat, lng], options).addTo(map);

    if (options.popup) {
        marker.bindPopup(options.popup);
    }

    return marker;
};

// Get current location
const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                reject(error);
            }
        );
    });
};

// Set map location with marker
const setMapLocation = async (lat, lng) => {
    if (!map) return;

    map.setView([lat, lng], 15);
    addMarker(lat, lng, {
        draggable: true,
        popup: 'Issue Location',
    });

    // Update coordinates on marker drag
    if (marker) {
        marker.on('dragend', function (e) {
            const position = marker.getLatLng();
            updateLocationInputs(position.lat, position.lng);
            reverseGeocode(position.lat, position.lng);
        });
    }

    updateLocationInputs(lat, lng);
    await reverseGeocode(lat, lng);
};

// Update location input fields
const updateLocationInputs = (lat, lng) => {
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');

    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lng;
};

// Reverse geocode to get address
const reverseGeocode = async (lat, lng) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();

        const addressInput = document.getElementById('address');
        if (addressInput && data.display_name) {
            addressInput.value = data.display_name;
        }

        return data.display_name;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
};

// Search location by address
const searchLocation = async (address) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const data = await response.json();

        if (data && data.length > 0) {
            const location = data[0];
            await setMapLocation(parseFloat(location.lat), parseFloat(location.lon));
            return location;
        }

        return null;
    } catch (error) {
        console.error('Location search error:', error);
        return null;
    }
};

// Add issue markers to map
const addIssueMarkers = (issues) => {
    if (!map) return;

    // Clear existing markers
    issueMarkers.forEach(marker => map.removeLayer(marker));
    issueMarkers = [];

    // Category icons/colors
    const categoryColors = {
        pothole: '#ef4444',
        streetlight: '#f59e0b',
        garbage: '#10b981',
        drainage: '#3b82f6',
        water_supply: '#06b6d4',
        road_damage: '#dc2626',
        traffic_signal: '#eab308',
        park_maintenance: '#22c55e',
        graffiti: '#a855f7',
        other: '#6b7280',
    };

    issues.forEach(issue => {
        const [lng, lat] = issue.location.coordinates;
        const color = categoryColors[issue.category] || '#6b7280';

        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
        });

        const issueMarker = L.marker([lat, lng], { icon }).addTo(map);

        const popupContent = `
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; color: #1e293b;">${issue.title}</h4>
        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 0.875rem;">${issue.description.substring(0, 100)}...</p>
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">${issue.category}</span>
          <span style="background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">${issue.status}</span>
        </div>
        <a href="/issue-detail.html?id=${issue.id}" style="color: #6366f1; text-decoration: none; font-weight: 600; font-size: 0.875rem;">View Details →</a>
      </div>
    `;

        issueMarker.bindPopup(popupContent);
        issueMarkers.push(issueMarker);
    });

    // Fit map to show all markers
    if (issueMarkers.length > 0) {
        const group = L.featureGroup(issueMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
};

// Map click handler
const onMapClick = (callback) => {
    if (!map) return;

    map.on('click', function (e) {
        setMapLocation(e.latlng.lat, e.latlng.lng);
        if (callback) callback(e.latlng);
    });
};

// Export map utilities
window.MapUtils = {
    initMap,
    addMarker,
    getCurrentLocation,
    setMapLocation,
    updateLocationInputs,
    reverseGeocode,
    searchLocation,
    addIssueMarkers,
    onMapClick,
    getMap: () => map,
};
