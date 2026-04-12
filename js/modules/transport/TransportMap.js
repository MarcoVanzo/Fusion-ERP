/**
 * Transport Map Module
 * Encapsulates Google Maps and Leaflet integration for the Transport module.
 * Fusion ERP v1.0
 */

const TransportMap = {
    _pollInterval: null,
    _activeIntervals: [],

    resetAllIntervals: () => {
        TransportMap._activeIntervals.forEach(clearInterval);
        TransportMap._activeIntervals = [];
    },

    initGoogleMaps: (callback) => {
        if (typeof google !== "undefined" && google.maps && google.maps.places) {
            TransportMap._injectStyles();
            return callback();
        }

        const apiKey = window.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.error('[TransportMap] Google Maps API key is missing.');
            return;
        }

        if (document.querySelector("script[data-gmaps-places]")) {
            let _pollCount = 0;
            const poll = setInterval(() => {
                _pollCount++;
                if (_pollCount > 150) { 
                    clearInterval(poll); 
                    console.warn('[TransportMap] Google Maps Places timeout'); 
                    return; 
                }
                if (typeof google !== "undefined" && google.maps?.places) {
                    clearInterval(poll);
                    TransportMap._activeIntervals = TransportMap._activeIntervals.filter(i => i !== poll);
                    TransportMap._injectStyles();
                    callback();
                }
            }, 100);
            TransportMap._activeIntervals.push(poll);
            return;
        }

        const callbackName = "__gmPlaces_" + Date.now();
        window[callbackName] = () => {
            delete window[callbackName];
            TransportMap._injectStyles();
            callback();
        };

        const scriptTag = document.createElement("script");
        scriptTag.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=${callbackName}`;
        scriptTag.async = true;
        scriptTag.defer = true;
        scriptTag.dataset.gmapsPlaces = "1";
        document.head.appendChild(scriptTag);
    },

    _injectStyles: () => {
        if (document.getElementById("gm-pac-styles")) return;
        const style = document.createElement("style");
        style.id = "gm-pac-styles";
        style.textContent = `
            .pac-container {
                background: #18181c !important;
                border: 1px solid rgba(255,255,255,0.12) !important;
                border-radius: 12px !important;
                box-shadow: 0 12px 40px rgba(0,0,0,0.6) !important;
                font-family: inherit !important;
                overflow: hidden !important;
                margin-top: 4px !important;
                z-index: 10000 !important;
            }
            .pac-container::after { display: none !important; }
            .pac-item {
                color: rgba(255,255,255,0.8) !important;
                border-top: 1px solid rgba(255,255,255,0.06) !important;
                padding: 10px 14px !important;
                cursor: pointer !important;
                font-size: 13px !important;
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
            }
            .pac-item:first-child { border-top: none !important; }
            .pac-item:hover, .pac-item-selected { background: rgba(0,229,255,0.08) !important; }
            .pac-item-query { color: #fff !important; font-weight: 600 !important; font-size: 13px !important; }
            .pac-matched { color: #00e5ff !important; font-weight: 700 !important; }
            .pac-icon { display: none !important; }
            .pac-secondary-text { color: rgba(255,255,255,0.45) !important; font-size: 12px !important; }
        `;
        document.head.appendChild(style);
    },

    initAutocomplete: (input, onPlaceChanged) => {
        if (!input || typeof google === "undefined" || !google.maps?.places) return;
        const autocomp = new google.maps.places.Autocomplete(input, {
            types: ["establishment", "geocode"],
            fields: ["formatted_address", "geometry", "name"],
        });
        autocomp.addListener("place_changed", () => {
            const place = autocomp.getPlace();
            if (!place.geometry) return;
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const addr = place.formatted_address || input.value;
            input.value = addr;
            if (onPlaceChanged) onPlaceChanged({ lat, lng, address: addr, place });
        });
        return autocomp;
    },

    renderMiniMap: (containerId, lat, lng, title) => {
        const container = document.getElementById(containerId);
        if (!container || typeof google === "undefined") return;
        container.style.display = "block";
        const coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
        const map = new google.maps.Map(container, {
            center: coords,
            zoom: 15,
            disableDefaultUI: true,
            styles: TransportMap.getDarkStyles()
        });
        new google.maps.Marker({
            position: coords,
            map: map,
            title: title || "Posizione",
        });
        return map;
    },

    getDarkStyles: () => [
        { elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
        { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#FF00FF", lightness: -80 }] },
    ],

    getRoute: async (origin, destination, waypoints, optimize = true, departureTime = null) => {
        return new Promise((resolve, reject) => {
            if (typeof google === "undefined" || !google.maps || !google.maps.DirectionsService) {
                return reject(new Error("Google Maps API non accessibile."));
            }
            const service = new google.maps.DirectionsService();
            const request = {
                origin,
                destination,
                waypoints: waypoints.map(loc => ({ location: loc, stopover: true })),
                optimizeWaypoints: optimize,
                travelMode: google.maps.TravelMode.DRIVING,
            };
            if (departureTime instanceof Date && departureTime > new Date()) {
                request.drivingOptions = { departureTime, trafficModel: "bestguess" };
            }
            service.route(request, (result, status) => {
                status === google.maps.DirectionsStatus.OK ? resolve(result) : reject(new Error(status));
            });
        });
    },

    renderLeafletRoute: (containerId, result) => {
        if (typeof L === "undefined") {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            document.head.appendChild(script);
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
            script.onload = () => TransportMap._doLeafletRender(containerId, result);
        } else {
            TransportMap._doLeafletRender(containerId, result);
        }
    },

    _doLeafletRender: (containerId, result) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";
        const map = L.map(containerId, { zoomControl: false }).setView([45.4642, 9.19], 13);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(map);
        
        const route = result.routes[0];
        const points = [];
        
        if (route.legs && route.legs.length > 0) {
            // Marker with number 1 (Partenza)
            const startLoc = route.legs[0].start_location;
            const iconStart = L.divIcon({
                className: 'nt-map-marker',
                html: `<div style="width:24px; height:24px; border-radius:50%; background:#fff; border:2px solid #ec4899; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px; color:#000;">1</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            L.marker([startLoc.lat(), startLoc.lng()], { icon: iconStart }).addTo(map).bindPopup('<strong>Tappa 1</strong><br>Partenza');
        }

        route.legs.forEach((leg, i) => {
            leg.steps.forEach(step => {
                step.path.forEach(p => points.push([p.lat(), p.lng()]));
            });
            const last = leg.end_location;
            
            // Marker with number (Raccolte & Arrivo)
            const number = i + 2;
            const isLast = i === route.legs.length - 1;
            const borderColor = isLast ? "#00e676" : "#00e5ff";

            const icon = L.divIcon({
                className: 'nt-map-marker',
                html: `<div style="width:24px; height:24px; border-radius:50%; background:#fff; border:2px solid ${borderColor}; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px; color:#000;">${number}</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const marker = L.marker([last.lat(), last.lng()], { icon }).addTo(map);
            marker.bindPopup(`<strong>Tappa ${number}</strong><br>${leg.end_address}`);
        });

        const polyline = L.polyline(points, { color: "#E6007E", weight: 4, opacity: 0.8 }).addTo(map);
        map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    }
};

export default TransportMap;
