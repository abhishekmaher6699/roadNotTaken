import L from "leaflet";

const cache = new Map<number, L.DivIcon>();

function getSize(pinCount: number): number {
  if (pinCount >= 50) return 52;
  if (pinCount >= 20) return 46;
  if (pinCount >= 10) return 40;
  return 34;
}

/** Returns a cached DivIcon for a tile-summary cluster marker. */
export function getSummaryIcon(pinCount: number): L.DivIcon {
  const size = getSize(pinCount);
  const cached = cache.get(size);
  if (cached) return cached;

  const icon = L.divIcon({
    className: "map-summary-marker",
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:999px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgba(15,23,42,0.92);
        color:#fff;
        border:2px solid rgba(255,255,255,0.95);
        box-shadow:0 12px 30px rgba(15,23,42,0.22);
        font-size:${size >= 46 ? "13px" : "12px"};
        font-weight:700;
      ">${pinCount}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  cache.set(size, icon);
  return icon;
}
