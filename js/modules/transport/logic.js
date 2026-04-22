/**
 * Transport Logic Module
 * Fusion ERP v1.0
 */

'use strict';

const TransportLogic = (() => {
    let _gmap = null;
    let _directionsRenderer = null;
    let _trafficLayer = null;

    function initGoogleMap(containerId, lat, lng, label) {
        if (!window.google || !window.google.maps) return;

        const mapOptions = {
            zoom: 14,
            center: { lat: parseFloat(lat), lng: parseFloat(lng) },
            styles: _darkMapStyles(),
            disableDefaultUI: true,
            zoomControl: true,
        };

        _gmap = new google.maps.Map(document.getElementById(containerId), mapOptions);
        new google.maps.Marker({
            position: { lat: parseFloat(lat), lng: parseFloat(lng) },
            map: _gmap,
            title: label,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#FF00FF',
                fillOpacity: 0.8,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
            }
        });
    }

    function renderRouteMap(containerId, routePoints, directionsResult) {
        if (!window.google || !window.google.maps) return;

        if (!_gmap) {
            _gmap = new google.maps.Map(document.getElementById(containerId), {
                zoom: 12,
                center: routePoints[0],
                styles: _darkMapStyles(),
                disableDefaultUI: true,
            });
        }

        if (!_directionsRenderer) {
            _directionsRenderer = new google.maps.DirectionsRenderer({
                map: _gmap,
                suppressMarkers: false,
                polylineOptions: {
                    strokeColor: '#00e5ff',
                    strokeWeight: 5,
                    strokeOpacity: 0.8
                }
            });
        }

        if (!_trafficLayer) {
            _trafficLayer = new google.maps.TrafficLayer();
        }

        _directionsRenderer.setDirections(directionsResult);
        _trafficLayer.setMap(_gmap);
    }

    async function getGoogleDirections(origin, destination, waypoints, optimize = true) {
        return new Promise((resolve, reject) => {
            const service = new google.maps.DirectionsService();
            service.route({
                origin,
                destination,
                waypoints: waypoints.map(w => ({ location: w, stopover: true })),
                optimizeWaypoints: optimize,
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
            }, (result, status) => {
                if (status === 'OK') resolve(result);
                else reject(new Error('Google Maps Directions failed: ' + status));
            });
        });
    }

    function _darkMapStyles() {
        return [
            { elementType: "geometry", stylers: [{ color: "#212121" }] },
            { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
            { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
            { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
            { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
            { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
            { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
            { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
            { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
            { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
            { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
            { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
            { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
            { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
            { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
        ];
    }

    return { initGoogleMap, renderRouteMap, getGoogleDirections };
})();

window.TransportLogic = TransportLogic;
