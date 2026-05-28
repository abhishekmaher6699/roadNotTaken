import L from "leaflet";

const cache = new Map<string, L.DivIcon>();

function getSize(pinCount: number): number {
  return Math.min(52, Math.max(34, Math.round(30 + Math.log2(pinCount + 1) * 5)));
}

/** Returns a cached DivIcon for a tile-summary cluster marker. */

export function getSummaryIcon(pinCount: number): L.DivIcon {
  const size = getSize(pinCount);
  const key = `${size}-${pinCount}`;

  const cached = cache.get(key);
  if (cached) return cached;

  const icon = L.divIcon({
    className: "map-summary-marker",
    html: `
      <div
        class="map-summary-marker__bubble"
        style="
          width:${size}px;
          height:${size}px;
          font-size:${size >= 46 ? "13px" : "12px"};
        "
      >${pinCount}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  cache.set(key, icon);
  return icon;
}
