/**
 * Transport Logic Module
 * Encapsulates the backward planning algorithm and route calculations.
 * Fusion ERP v1.0
 */

const TransportLogic = {
    /**
     * Estimates traffic based on the arrival time and weather.
     * @param {string} arrivalTimeStr - "HH:mm"
     * @returns {number} Ratio (e.g., 1.2 for 20% more time)
     */
    estimateTrafficRatio: (arrivalTimeStr) => {
        const [h, m] = (arrivalTimeStr || "18:00").split(":").map(Number);
        let ratio = 1.05; // 5% buffer base
        if (h >= 7 && h <= 9) ratio = 1.35; // Morning rush
        if (h >= 17 && h <= 19) ratio = 1.45; // Evening rush
        if (h >= 12 && h <= 14) ratio = 1.15; // Lunch
        return ratio;
    },

    /**
     * Backward Planning Algorithm:
     * Calculates pickup times starting from the target arrival time.
     * @param {Object} result - Directions result
     * @param {string} arrivalTimeStr - Target arrival "HH:mm"
     * @param {number} trafficRatio - Multiplier
     * @returns {Object} { departureTime, timeline, stats }
     */
    calculateBackwards: (result, arrivalTimeStr, trafficRatio = 1.1) => {
        const route = result.routes[0];
        const legs = [...route.legs].reverse(); // Reverse legs for backward calculation
        const arrivalDate = new Date();
        const [h, m] = arrivalTimeStr.split(":").map(Number);
        arrivalDate.setHours(h, m, 0, 0);

        let currentTime = arrivalDate.getTime();
        const timeline = [];
        let totalDist = 0;
        let totalDur = 0;

        // Arrival Stop
        timeline.push({
            tipo: "arrivo",
            luogo: legs[0].end_address,
            orario: arrivalTimeStr,
            nota: "Arrivo a destinazione",
            coord: { lat: legs[0].end_location.lat(), lng: legs[0].end_location.lng() }
        });

        legs.forEach((leg, i) => {
            const dur = Math.round(leg.duration.value * trafficRatio);
            const dist = leg.distance.value;
            totalDist += dist;
            totalDur += dur;

            // Travel time back
            currentTime -= dur * 1000;
            const stopTime = new Date(currentTime);
            const timeStr = stopTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            timeline.push({
                tipo: i === legs.length - 1 ? "partenza" : "raccolta",
                luogo: leg.start_address,
                orario: timeStr,
                nota: i === legs.length - 1 ? "Inizio viaggio" : `Carico atleta presso ${leg.start_address.split(',')[0]}`,
                coord: { lat: leg.start_location.lat(), lng: leg.start_location.lng() }
            });

            // 3-minute stop for pickup (not for departure)
            if (i < legs.length - 1) {
                currentTime -= 180000;
            }
        });

        const departureTime = new Date(currentTime);
        const depStr = departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return {
            departureTime: depStr,
            timeline: timeline.reverse(),
            stats: {
                distanza: (totalDist / 1000).toFixed(1) + " km",
                durata: Math.round(totalDur / 60) + " min",
                orarioPartenza: depStr,
                orarioArrivo: arrivalTimeStr
            }
        };
    },

    /**
     * Generates HTML for the timeline items.
     */
    generateTimelineHtml: (timeline) => {
        return timeline.map((stop, i) => {
            let icon = "ph-map-pin";
            let color = "var(--accent-cyan)";
            if (stop.tipo === "partenza") { icon = "ph-van"; color = "var(--accent-pink)"; }
            if (stop.tipo === "arrivo") { icon = "ph-flag-pennant"; color = "#00e676"; }
            
            // Map our stop types to the classes expected by dashboard_ui.css
            const typeClass = stop.tipo === "partenza" ? "partenza" : (stop.tipo === "arrivo" ? "arrivo" : "raccolta");
            const isDraggable = stop.tipo === "raccolta";
            
            const badgeHtml = `<span style="position:absolute; top:-6px; right:-6px; background:${color}; color:#000; width:14px; height:14px; border-radius:50%; font-size:9px; font-weight:900; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.3);">${i + 1}</span>`;
            
            return `
                <div class="nt-tl-item ${typeClass}" 
                     ${isDraggable ? `draggable="true" data-index="${i}"` : ""}
                     style="position:relative; cursor:${isDraggable ? 'grab' : 'default'};">
                    <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                        <span style="font-family:var(--font-display); font-size:18px; font-weight:800; color:#fff;">${stop.orario}</span>
                        <div style="width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.05); border:1px solid ${color}; display:flex; align-items:center; justify-content:center; color:${color}; position:relative; z-index:1;">
                            <i class="ph ${icon}" style="font-size:14px;"></i>
                            ${badgeHtml}
                        </div>
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:700; font-size:14px; margin-bottom:4px; text-transform:uppercase; color:${color};">${stop.tipo}</div>
                        <div style="font-size:12px; color:rgba(255,255,255,0.7); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${Utils.escapeHtml(stop.luogo)}">
                            <i class="ph ph-map-pin"></i> ${Utils.escapeHtml(stop.luogo)}
                        </div>
                        ${stop.atleta_name ? `<div style="font-weight:700; color:#fff; font-size:11px; margin-top:6px; display:flex; align-items:center; gap:6px;"><i class="ph ph-user-circle" style="color:var(--accent-cyan);"></i> ${Utils.escapeHtml(stop.atleta_name)}</div>` : ""}
                    </div>
                    ${isDraggable ? '<div style="color:rgba(255,255,255,0.15); display:flex; align-items:center;"><i class="ph ph-dots-six-vertical" style="font-size:20px;"></i></div>' : ""}
                </div>`;
        }).join("");
    }
};

export default TransportLogic;
