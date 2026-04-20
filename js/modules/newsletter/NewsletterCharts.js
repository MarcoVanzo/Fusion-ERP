// js/modules/newsletter/NewsletterCharts.js

let _chartJsLoaded = false;
let _chartJsPromise = null;

function loadChartJs() {
    if (_chartJsLoaded) return Promise.resolve();
    if (_chartJsPromise) return _chartJsPromise;

    _chartJsPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/chart.js";
        script.onload = () => {
            _chartJsLoaded = true;
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
    return _chartJsPromise;
}

export async function initCampaignCharts(campaigns) {
    if (!campaigns || campaigns.length === 0) return;
    const ctxRates = document.getElementById("nl-chart-rates");
    const ctxVols = document.getElementById("nl-chart-volumes");
    if (!ctxRates || !ctxVols) return;

    try {
        await loadChartJs();
    } catch (_e) {
        console.error("[Newsletter] Failed to load Chart.js", e);
        return;
    }

    // Prepare data (reverse because campaigns are newest first)
    const sorted = [...campaigns].reverse();
    const labels = sorted.map((c) => {
        const date = c.scheduled_for || c.created_at || "";
        if (!date) return "";
        const d = new Date(date);
        return d.toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "2-digit",
        });
    });

    const sentData = sorted.map((c) => (c.stats && c.stats.sent) || 0);
    const openRates = sorted.map((c) => {
        const sent = (c.stats && c.stats.sent) || 0;
        const opens = (c.stats && c.stats.opens_count) || 0;
        return c.stats?.open_rate?.float
            ? c.stats.open_rate.float * 100
            : sent > 0
                ? (opens / sent) * 100
                : 0;
    });
    const clickRates = sorted.map((c) => {
        const sent = (c.stats && c.stats.sent) || 0;
        const clicks = (c.stats && c.stats.clicks_count) || 0;
        return c.stats?.click_rate?.float
            ? c.stats.click_rate.float * 100
            : sent > 0
                ? (clicks / sent) * 100
                : 0;
    });

    // Destroy existing instances if any
    if (window._nlChartRates) window._nlChartRates.destroy();
    if (window._nlChartVols) window._nlChartVols.destroy();

    // Colors
    const primary =
        getComputedStyle(document.documentElement)
            .getPropertyValue("--color-primary")
            .trim() || "#3b82f6";
    const pink =
        getComputedStyle(document.documentElement)
            .getPropertyValue("--color-pink")
            .trim() || "#ec4899";
    const textMuted =
        getComputedStyle(document.documentElement)
            .getPropertyValue("--color-text-muted")
            .trim() || "#64748b";
    const border =
        getComputedStyle(document.documentElement)
            .getPropertyValue("--color-border")
            .trim() || "#e2e8f0";

    Chart.defaults.color = textMuted;
    Chart.defaults.font.family = "Inter, sans-serif";

    // Rates Chart
    window._nlChartRates = new Chart(ctxRates, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Aperture (%)",
                    data: openRates,
                    borderColor: primary,
                    backgroundColor: primary + "33",
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointBackgroundColor: "#fff",
                    pointBorderColor: primary,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
                {
                    label: "Click (%)",
                    data: clickRates,
                    borderColor: pink,
                    backgroundColor: "transparent",
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: "#fff",
                    pointBorderColor: pink,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                    labels: { usePointStyle: true, boxWidth: 8 },
                },
                tooltip: {
                    mode: "index",
                    intersect: false,
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`,
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: border },
                    ticks: { callback: (v) => v + "%" },
                },
                x: { grid: { display: false } },
            },
            interaction: { mode: "nearest", axis: "x", intersect: false },
        },
    });

    // Volumes Chart
    window._nlChartVols = new Chart(ctxVols, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Email Inviate",
                    data: sentData,
                    backgroundColor: primary + "cc",
                    borderRadius: 4,
                    hoverBackgroundColor: primary,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Inviate: ${ctx.raw.toLocaleString("it-IT")}`,
                    },
                },
            },
            scales: {
                y: { beginAtZero: true, grid: { color: border } },
                x: { grid: { display: false } },
            },
        },
    });
}
