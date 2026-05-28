import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";

// ---- Types ----
interface University {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

// ---- Icon ----
const icon = new L.Icon({
  iconUrl: "/marker hose.png",
  iconSize: [35, 55],
  iconAnchor: [17, 55],
  popupAnchor: [1, -48],
});

// ---- Overpass ----
const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

async function overpassQuery(query: string): Promise<any> {
  let lastError: any;
  for (const server of OVERPASS_SERVERS) {
    try {
      const res = await axios.post(
        "/api/overpass",
        { server, data: query },
        { headers: { "Content-Type": "application/json" }, timeout: 60000 }
      );
      if (res.data?.elements) return res.data;
    } catch (err: any) {
      console.warn(`Serveur ${server} échoué:`, err.message);
      lastError = err;
    }
  }
  throw lastError;
}

// ---- Geometry helpers ----
function mergeSegmentsIntoRings(segments: number[][][]): number[][][] {
  if (segments.length === 0) return [];
  const remaining = segments.map((s) => [...s]);
  const rings: number[][][] = [];
  while (remaining.length > 0) {
    let ring = [...remaining.shift()!];
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < remaining.length; i++) {
        const seg = remaining[i];
        const ringEnd = ring[ring.length - 1];
        const segStart = seg[0];
        const segEnd = seg[seg.length - 1];
        const ringStart = ring[0];
        const eq = (a: number[], b: number[]) =>
          Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
        if (eq(ringEnd, segStart)) {
          ring = [...ring, ...seg.slice(1)];
          remaining.splice(i, 1);
          changed = true;
          break;
        } else if (eq(ringEnd, segEnd)) {
          ring = [...ring, ...[...seg].reverse().slice(1)];
          remaining.splice(i, 1);
          changed = true;
          break;
        } else if (eq(ringStart, segEnd)) {
          ring = [...seg, ...ring.slice(1)];
          remaining.splice(i, 1);
          changed = true;
          break;
        } else if (eq(ringStart, segStart)) {
          ring = [...[...seg].reverse(), ...ring.slice(1)];
          remaining.splice(i, 1);
          changed = true;
          break;
        }
      }
    }
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (
      Math.abs(first[0] - last[0]) > 1e-6 ||
      Math.abs(first[1] - last[1]) > 1e-6
    )
      ring.push(ring[0]);
    if (ring.length >= 4) rings.push(ring);
  }
  return rings;
}

function elementsToGeoJSON(elements: any[]) {
  return elements
    .map((el: any) => {
      const outerSegments: number[][][] = (el.members || [])
        .filter(
          (m: any) => m.role === "outer" && m.geometry?.length > 1
        )
        .map((m: any) => m.geometry.map((g: any) => [g.lon, g.lat]));
      const innerSegments: number[][][] = (el.members || [])
        .filter(
          (m: any) => m.role === "inner" && m.geometry?.length > 1
        )
        .map((m: any) => m.geometry.map((g: any) => [g.lon, g.lat]));
      if (!outerSegments.length) return null;
      const outerRings = mergeSegmentsIntoRings(outerSegments);
      const innerRings = mergeSegmentsIntoRings(innerSegments);
      if (!outerRings.length) return null;
      return {
        type: "Feature",
        properties: {
          id: el.id,
          name: el.tags?.["name:fr"] || el.tags?.name || "Province",
        },
        geometry: {
          type: "MultiPolygon",
          coordinates: outerRings.map((outer) => [outer, ...innerRings]),
        },
      };
    })
    .filter(Boolean);
}

// ---- Data fetchers ----
async function fetchRegions() {
  const query = `[out:json][timeout:60][maxsize:134217728];
relation["boundary"="administrative"]["admin_level"="3"](-26.9,43.2,-11.9,50.5);
out geom qt;`;
  const data = await overpassQuery(query);
  if (!data.elements?.length) throw new Error("Aucune province trouvée");
  return data.elements;
}

async function fetchUniversitiesByRelation(
  relationId: number
): Promise<University[]> {
  const areaId = relationId + 3_600_000_000;
  const query = `[out:json][timeout:30];
area(${areaId})->.p;
(
  node["amenity"="university"](area.p);
  way["amenity"="university"](area.p);
);
out center qt;`;
  const data = await overpassQuery(query);
  return (data.elements || [])
    .map((el: any) => ({
      id: el.id,
      name:
        el.tags?.name ||
        el.tags?.["name:fr"] ||
        el.tags?.["name:en"] ||
        "Université",
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
    }))
    .filter((u: University) => u.lat && u.lon);
}

// ---- MapController ----
function MapController({ resetView }: { resetView: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (resetView) map.flyTo([-18.8792, 47.5079], 6, { duration: 1.2 });
  }, [resetView, map]);
  return null;
}

// ---- ProvinceLayer ----
function ProvinceLayer({
  geo,
  onProvinceClick,
  selectedId,
}: {
  geo: any;
  onProvinceClick: (relationId: number) => void;
  selectedId: number | null;
}) {
  const { t } = useTranslation();
  const map = useMap();
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // ✅ Province non sélectionnée = bleu | Sélectionnée = pas de couleur
  const style = (feature: any) => ({
    color: "#1d4ed8",
    weight: feature?.properties?.id === selectedId ? 3.5 : 2,
    fillColor: "#2563eb",
    fillOpacity: feature?.properties?.id === selectedId ? 0 : 0.15,
  });

  const onEachFeature = (feature: any, layer: any) => {
    const name = feature.properties?.name || t('map.province');
    layer.bindTooltip(name, { sticky: true });
    layer.on({
      mouseover: (e: any) => {
        const isSelected =
          feature.properties.id === selectedIdRef.current;
        if (!isSelected) {
          // Non sélectionnée → bleu plus opaque
          e.target.setStyle({ fillOpacity: 0.35, weight: 3 });
        } else {
          // Sélectionnée → toujours sans couleur, juste bordure épaissie
          e.target.setStyle({ fillOpacity: 0, weight: 4 });
        }
      },
      mouseout: (e: any) => {
        const isSelected =
          feature.properties.id === selectedIdRef.current;
        if (isSelected) {
          // Sélectionnée → retour à sans couleur
          e.target.setStyle({ fillOpacity: 0, weight: 3.5 });
        } else {
          // Non sélectionnée → retour à bleu normal
          e.target.setStyle({ fillOpacity: 0.15, weight: 2 });
        }
      },
      click: (e: any) => {
        const bounds: L.LatLngBounds = e.target.getBounds();
        if (bounds.isValid())
          map.fitBounds(bounds, { padding: [30, 30] });
        onProvinceClick(feature.properties.id);
      },
    });
  };

  return (
    <GeoJSON
      key={`${geo.features.length}-${selectedId}`}
      data={geo}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}

// ---- Main Component ----
export default function UniversitiesMapPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [geo, setGeo] = useState<any>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingUni, setLoadingUni] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resetView, setResetView] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    fetchRegions()
      .then((elements) => {
        const features = elementsToGeoJSON(elements);
        setGeo({ type: "FeatureCollection", features });
      })
      .catch((err: any) => setError(`Erreur : ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  const handleProvinceClick = useCallback(
    async (relationId: number) => {
      const feature = geo?.features.find(
        (f: any) => f.properties.id === relationId
      );
      const name = feature?.properties?.name || t('map.province');
      setSelectedProvince(name);
      setSelectedId(relationId);
      setLoadingUni(true);
      setUniversities([]);
      setSearchTerm("");
      setSidebarOpen(true);
      setResetView(false);
      try {
        const data = await fetchUniversitiesByRelation(relationId);
        setUniversities(data);
      } catch (err: any) {
        console.error("Erreur universités:", err.message);
      } finally {
        setLoadingUni(false);
      }
    },
    [geo]
  );

  const handleUniversityClick = useCallback(
    (u: University) => {
      mapRef.current?.flyTo([u.lat, u.lon], 15, { duration: 1 });
      if (isMobile) setMobilePanelOpen(false);
    },
    [isMobile]
  );

  const handleResetView = useCallback(() => {
    setSelectedProvince(null);
    setSelectedId(null);
    setUniversities([]);
    setSearchTerm("");
    setSidebarOpen(false);
    setMobilePanelOpen(false);
    setResetView(true);
    setTimeout(() => setResetView(false), 1500);
  }, []);

  const handleGoHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const filtered = universities.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dataReady = !loading && !error;

  return (
    <div
      className="fixed inset-0 flex flex-col md:flex-row overflow-hidden"
      style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slide-up { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        .leaflet-popup-content-wrapper { background: #fff !important; color: #1e293b !important; border-radius: 12px !important; border: 1px solid #e2e8f0 !important; box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important; }
        .leaflet-popup-tip { background: #fff !important; }
        .leaflet-popup-close-button { color: #94a3b8 !important; }
        .leaflet-popup-close-button:hover { color: #1e293b !important; }
        .leaflet-popup-content { margin: 10px 14px !important; }
        .leaflet-control-attribution { background: rgba(255,255,255,0.85) !important; color: #64748b !important; font-size: 9px !important; border-radius: 8px 0 0 0 !important; }
        .leaflet-control-attribution a { color: #2563eb !important; }
        .leaflet-control-zoom a { background: #fff !important; color: #475569 !important; border-color: #cbd5e1 !important; }
        .leaflet-control-zoom a:hover { background: #f1f5f9 !important; color: #1e293b !important; }
      `}</style>

      {/* ====== SIDEBAR (Desktop) ====== */}
      <div
        className="hidden md:flex flex-col flex-shrink-0"
        style={{
          width: sidebarOpen ? "340px" : "0px",
          minWidth: sidebarOpen ? "340px" : "0px",
          height: "100%",
          background: "#ffffff",
          borderRight: sidebarOpen ? "1px solid #e2e8f0" : "none",
          transition:
            "width 0.35s cubic-bezier(0.4,0,0.2,1), min-width 0.35s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: sidebarOpen ? "4px 0 24px rgba(0,0,0,0.08)" : "none",
          zIndex: 10,
        }}
      >
        {sidebarOpen && (
          <>
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid #e2e8f0",
                flexShrink: 0,
              }}
            >
              <button
                onClick={handleGoHome}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  width: "100%",
                  marginBottom: "8px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#2563eb",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#2563eb";
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#eff6ff";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#2563eb";
                }}
              >
                <span style={{ fontSize: "14px" }}>🏠</span>
                {t('map.backToHome')}
              </button>

              <button
                onClick={handleResetView}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  width: "100%",
                  marginBottom: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#e2e8f0";
                  (e.currentTarget as HTMLButtonElement).style.color = "#1e293b";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#f8fafc";
                  (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
                }}
              >
                <span style={{ fontSize: "14px" }}>←</span>
                {t('map.overview')}
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    flexShrink: 0,
                  }}
                >
                  🎓
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {t('map.province')}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#1e293b",
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedProvince}
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('map.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg text-sm pl-9 pr-3 py-2 outline-none transition-all"
                  style={{
                    background: "#f8fafc",
                    color: "#1e293b",
                    border: "1px solid #e2e8f0",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: "#94a3b8" }}
                >
                  🔍
                </span>
              </div>

              {!loadingUni && universities.length > 0 && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "6px 10px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  <span
                    style={{
                      color: "#2563eb",
                      fontWeight: 700,
                      fontSize: "15px",
                    }}
                  >
                    {filtered.length}
                  </span>
                  /{universities.length} {universities.length === 1 ? t('map.establishment') : t('map.establishments')}
                </div>
              )}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                padding: "10px",
              }}
              className="scrollbar-thin"
            >
              {loadingUni ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    padding: "4px 0",
                  }}
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: "56px",
                        borderRadius: "10px",
                        background:
                          "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s infinite",
                      }}
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 16px",
                    color: "#94a3b8",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>
                    🏫
                  </div>
                  {universities.length === 0
                    ? t('map.noUniversityFound')
                    : t('map.noResults')}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {filtered.map((u, idx) => (
                    <div
                      key={u.id}
                      style={{
                        padding: "10px 11px",
                        background: "#ffffff",
                        borderRadius: "9px",
                        border: "1px solid #e2e8f0",
                        cursor: "pointer",
                        transition: "all 0.18s",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "9px",
                        animation: `fadeSlideIn 0.3s ease both`,
                        animationDelay: `${Math.min(idx, 20) * 0.03}s`,
                      }}
                      onMouseOver={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.background = "#f8fafc";
                        el.style.borderColor = "#3b82f6";
                        el.style.transform = "translateX(3px)";
                      }}
                      onMouseOut={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.background = "#ffffff";
                        el.style.borderColor = "#e2e8f0";
                        el.style.transform = "translateX(0)";
                      }}
                      onClick={() => handleUniversityClick(u)}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          background: "#eff6ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          flexShrink: 0,
                          marginTop: "1px",
                          color: "#2563eb",
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#1e293b",
                            lineHeight: 1.35,
                            wordBreak: "break-word",
                          }}
                        >
                          {u.name}
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            marginTop: "2px",
                          }}
                        >
                          {u.lat.toFixed(4)}, {u.lon.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ====== MAP AREA ====== */}
      <div
        className="flex-1 relative"
        style={{ height: "100%", minWidth: 0, overflow: "hidden" }}
      >
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              color: "#2563eb",
              fontSize: "14px",
              fontWeight: 600,
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                border: "3px solid #bfdbfe",
                borderTopColor: "#2563eb",
                animation: "spin 0.8s linear infinite",
              }}
            />
            {t('map.loadingProvinces')}
          </div>
        )}

        {error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "12px",
              background: "#ffffff",
              color: "#ef4444",
              fontSize: "14px",
              padding: "20px",
            }}
          >
            <span
              className="text-center"
              style={{ maxWidth: "300px", lineHeight: 1.5 }}
            >
              {error}
            </span>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#ef4444",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {t('map.retry')}
            </button>
          </div>
        )}

        {dataReady && !sidebarOpen && !isMobile && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 999,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(8px)",
              color: "#64748b",
              padding: "10px 20px",
              borderRadius: "24px",
              fontSize: "13px",
              border: "1px solid #e2e8f0",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
          >
            🗺️ {t('map.mapTooltip')}
          </div>
        )}

        {loadingUni && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 999,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(8px)",
              color: "#2563eb",
              padding: "10px 20px",
              borderRadius: "24px",
              fontSize: "13px",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                border: "2px solid #bfdbfe",
                borderTopColor: "#2563eb",
                animation: "spin 0.8s linear infinite",
                flexShrink: 0,
              }}
            />
            {t('map.searching')}
          </div>
        )}

        {dataReady && (
          <MapContainer
            center={[-18.8792, 47.5079]}
            zoom={6}
            style={{ width: "100%", height: "100%" }}
            ref={mapRef}
            zoomControl={false}
          >
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController resetView={resetView} />
            {geo && (
              <ProvinceLayer
                geo={geo}
                onProvinceClick={handleProvinceClick}
                selectedId={selectedId}
              />
            )}
            {universities.map((u) => (
              <Marker
                key={u.id}
                position={[u.lat, u.lon]}
                icon={icon}
                eventHandlers={{
                  click: () => handleUniversityClick(u),
                }}
              >
                <Popup>
                  <strong style={{ fontSize: "13px", color: "#1e293b" }}>
                    {u.name}
                  </strong>
                  <br />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {u.lat.toFixed(5)}, {u.lon.toFixed(5)}
                  </span>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Stats badge */}
        {universities.length > 0 && selectedProvince && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              zIndex: 1000,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(12px)",
              color: "#475569",
              padding: "8px 14px",
              borderRadius: "12px",
              fontSize: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              fontWeight: 600,
            }}
          >
            <span style={{ color: "#2563eb", fontWeight: 700 }}>
              {universities.length}
            </span>{" "}
            🎓
          </div>
        )}

        {/* Desktop open sidebar button */}
        {!sidebarOpen && !isMobile && selectedId && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              zIndex: 1000,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(12px)",
              color: "#2563eb",
              padding: "10px 16px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 600,
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "#3b82f6";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "#e2e8f0";
            }}
          >
            <span>📋</span>
            {selectedProvince}
            <span
              style={{
                background: "#2563eb",
                color: "#fff",
                padding: "2px 7px",
                borderRadius: "6px",
                fontSize: "10px",
                fontWeight: 700,
              }}
            >
              {universities.length}
            </span>
          </button>
        )}

        {/* Mobile bottom sheet */}
        {isMobile && selectedId && (
          <>
            <button
              onClick={() => setMobilePanelOpen(!mobilePanelOpen)}
              style={{
                position: "absolute",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000,
                background: mobilePanelOpen
                  ? "#ffffff"
                  : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: mobilePanelOpen ? "#64748b" : "#fff",
                border: mobilePanelOpen ? "1px solid #e2e8f0" : "1px solid transparent",
                padding: "12px 20px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                transition: "all 0.2s",
              }}
            >
              {mobilePanelOpen ? `▼ ${t('map.hide')}` : `📋 ${t('map.list')}`}
              <span
                style={{
                  background: mobilePanelOpen ? "#eff6ff" : "rgba(255,255,255,0.25)",
                  color: mobilePanelOpen ? "#2563eb" : "#fff",
                  padding: "2px 8px",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              >
                {universities.length}
              </span>
            </button>

            {mobilePanelOpen && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  maxHeight: "65vh",
                  background: "#ffffff",
                  borderTop: "1px solid #e2e8f0",
                  animation: "slide-up 0.35s cubic-bezier(0.4,0,0.2,1)",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    flexShrink: 0,
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background:
                            "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "15px",
                        }}
                      >
                        🎓
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "9px",
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {t('map.province')}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#1e293b",
                            lineHeight: 1.2,
                          }}
                        >
                          {selectedProvince}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleResetView}
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          color: "#2563eb",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        🌍
                      </button>
                      <button
                        onClick={() => setMobilePanelOpen(false)}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t('map.search')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-lg text-sm pl-9 pr-3 py-2.5 outline-none transition-all"
                      style={{
                        background: "#f8fafc",
                        color: "#1e293b",
                        border: "1px solid #e2e8f0",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    />
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                      style={{ color: "#94a3b8" }}
                    >
                      🔍
                    </span>
                  </div>
                </div>

                <div
                  className="scrollbar-thin"
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "10px",
                    paddingBottom: "90px",
                  }}
                >
                  {loadingUni ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          style={{
                            height: "56px",
                            borderRadius: "10px",
                            background:
                              "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
                            backgroundSize: "200% 100%",
                            animation: "shimmer 1.5s infinite",
                          }}
                        />
                      ))}
                    </div>
                  ) : filtered.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "30px 16px",
                        color: "#94a3b8",
                        fontSize: "13px",
                      }}
                    >
                      <div style={{ fontSize: "28px", marginBottom: "8px" }}>
                        🏫
                      </div>
                      {universities.length === 0
                        ? t('map.noUniversityFound')
                        : t('map.noResults')}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {filtered.map((u, idx) => (
                        <div
                          key={u.id}
                          onClick={() => handleUniversityClick(u)}
                          style={{
                            padding: "10px",
                            background: "#ffffff",
                            borderRadius: "9px",
                            border: "1px solid #e2e8f0",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "9px",
                            animation: `fadeSlideIn 0.3s ease both`,
                            animationDelay: `${Math.min(idx, 15) * 0.03}s`,
                          }}
                        >
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "6px",
                              background: "#eff6ff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              flexShrink: 0,
                              marginTop: "1px",
                              color: "#2563eb",
                              fontWeight: 700,
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#1e293b",
                                lineHeight: 1.35,
                                wordBreak: "break-word",
                              }}
                            >
                              {u.name}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#94a3b8",
                                marginTop: "2px",
                              }}
                            >
                              {u.lat.toFixed(4)}, {u.lon.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Mobile selected detail popup */}
        {isMobile && universities.length > 0 && !mobilePanelOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "70px",
              left: "12px",
              right: "12px",
              zIndex: 999,
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(12px)",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              animation: "slide-up 0.3s ease",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
                flexShrink: 0,
              }}
            >
              🎓
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                className="truncate"
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#1e293b",
                  lineHeight: 1.3,
                }}
              >
                {selectedProvince}
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  marginTop: "1px",
                }}
              >
                {universities.length} {universities.length === 1 ? t('map.university') : t('map.universities')}
              </p>
            </div>
            <button
              onClick={() => setMobilePanelOpen(true)}
              style={{
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "8px 14px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {t('map.seeList')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
