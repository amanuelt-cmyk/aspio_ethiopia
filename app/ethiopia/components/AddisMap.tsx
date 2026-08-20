"use client";

import maplibregl, { type Map as MapLibreMap, type Marker as MapLibreMarker, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";

const ETHIOPIA_OUTLINE = "M351.9 40L387.6 66.8L422.2 52.9L436.4 65.2L476.8 65.9L528.1 89.6L543.4 109.9L569.5 128.8L593.7 163.4L613.9 182.5L593.2 208.5L573.2 236.2L577.8 252.4L578.8 270.4L611.7 271.4L625.9 267.2L638.9 277.7L626.1 298.6L647.9 331L669.6 359.4L692.1 380.4L884.8 450.4L934.4 450L767.8 626.9L691.1 629.5L638.5 671.1L600.7 672.1L584.6 690.7L544.3 690.7L520.6 670.8L466.7 695.5L449.3 720L410 715.4L397 708.6L383.2 710.2L364.5 709.6L289.9 659.6L248.9 659.6L228.8 640.2L228.8 607.1L198.1 597.2L163.3 533L136.4 519.4L126.1 495.8L96.2 467.1L60 462.9L80.1 429.3L111.4 427.8L120.2 409.8L119.4 356.9L136.8 295.2L164.7 278.7L170.7 254.6L195.9 209.5L231.5 180.3L255.4 122.3L264.8 71.7L333.5 84L351.9 40Z";
const COUNTRY_CAMERA = { lng: 40.4897, lat: 9.145, zoom: 5.8 };
const ADDIS_CAMERA = { lng: 38.7845, lat: 8.9975, zoom: 11.35 };
const OPEN_MAP_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
      attribution: '<a href="https://openfreemap.org/">OpenFreeMap</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#e8e6df" } },
    { id: "landcover", type: "fill", source: "openmaptiles", "source-layer": "landcover", paint: { "fill-color": "#dbe1d6", "fill-opacity": 0.72 } },
    { id: "landuse", type: "fill", source: "openmaptiles", "source-layer": "landuse", paint: { "fill-color": "#deddd5", "fill-opacity": 0.58 } },
    { id: "park", type: "fill", source: "openmaptiles", "source-layer": "park", paint: { "fill-color": "#d0ddcd", "fill-opacity": 0.86 } },
    { id: "water", type: "fill", source: "openmaptiles", "source-layer": "water", paint: { "fill-color": "#bfd1d0" } },
    { id: "building", type: "fill", source: "openmaptiles", "source-layer": "building", minzoom: 12.5, paint: { "fill-color": "#cecac0", "fill-outline-color": "#c0bbb0", "fill-opacity": 0.76 } },
    {
      id: "road-casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      paint: {
        "line-color": "#bbb8af",
        "line-opacity": 0.78,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.5, 14, 5, 17, 12],
      },
    },
    {
      id: "road-fill",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      paint: {
        "line-color": "#fffef9",
        "line-opacity": 0.96,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.8, 14, 3.3, 17, 9.5],
      },
    },
    {
      id: "major-road-accent",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["match", ["get", "class"], ["motorway", "trunk", "primary"], true, false],
      paint: {
        "line-color": "#c3a79f",
        "line-opacity": 0.72,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1, 14, 2.6, 17, 6],
      },
    },
    {
      id: "road-labels",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "transportation_name",
      minzoom: 12,
      layout: {
        "symbol-placement": "line",
        "text-field": ["coalesce", ["get", "name:am"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 9, 16, 12],
      },
      paint: { "text-color": "#5b5c57", "text-halo-color": "#f7f5ef", "text-halo-width": 1.4 },
    },
    {
      id: "place-labels",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 9,
      layout: {
        "text-field": ["coalesce", ["get", "name:am"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 9, 11, 15, 15],
        "text-letter-spacing": 0.02,
      },
      paint: { "text-color": "#31332f", "text-halo-color": "#f3f1ea", "text-halo-width": 1.6 },
    },
  ],
};

export type AddisMapLocation = {
  name: string;
  count: number;
  lat: number;
  lng: number;
};

type AddisMapProps = {
  locations: readonly AddisMapLocation[];
  activeIndex: number;
  onSelect: (index: number) => void;
  language: "am" | "en";
};

type MarkerRecord = {
  marker: MapLibreMarker;
  element: HTMLButtonElement;
  handleClick: (event: MouseEvent) => void;
  locationIndex: number;
};

export default function AddisMap({ locations, activeIndex, onSelect, language }: AddisMapProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MarkerRecord[]>([]);
  const scrollProgressRef = useRef(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const isAmharic = language === "am";

  useEffect(() => {
    if (!rootRef.current || !containerRef.current || mapRef.current) return;

    let loaded = false;
    let scrollFrame = 0;
    let lastCameraProgress = -1;
    const rootElement = rootRef.current;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPEN_MAP_STYLE,
      center: [COUNTRY_CAMERA.lng, COUNTRY_CAMERA.lat],
      zoom: COUNTRY_CAMERA.zoom,
      minZoom: 5,
      maxZoom: 17,
      attributionControl: { compact: true },
      cooperativeGestures: true,
      pitchWithRotate: false,
      dragRotate: false,
    });

    mapRef.current = map;
    map.touchZoomRotate.disableRotation();

    const handleReady = () => {
      loaded = true;
      setStatus("ready");
    };
    const handleError = () => {
      if (!loaded) setStatus("error");
    };

    map.once("style.load", handleReady);
    map.once("load", handleReady);
    map.on("error", handleError);

    markersRef.current = locations.map((pin, locationIndex) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "am-open-marker";
      element.style.opacity = "0";
      element.style.pointerEvents = "none";
      element.setAttribute("aria-label", `${pin.name} — ${pin.count}`);
      const pinShape = document.createElement("span");
      pinShape.appendChild(document.createElement("i"));
      element.appendChild(pinShape);

      const handleClick = (event: MouseEvent) => {
        event.stopPropagation();
        onSelect(locationIndex);
      };
      element.addEventListener("click", handleClick);

      const marker = new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);

      return { marker, element, handleClick, locationIndex };
    });

    const updateScrollCamera = () => {
      scrollFrame = 0;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const scene = rootElement.closest<HTMLElement>(".am-locator-scroll-scene");
      let progress = 0;

      if (reduceMotion) {
        progress = 1;
      } else if (scene && window.matchMedia("(min-width: 761px)").matches) {
        const travel = Math.max(1, scene.offsetHeight - rootElement.offsetHeight);
        progress = Math.min(1, Math.max(0, (84 - scene.getBoundingClientRect().top) / travel));
      } else {
        const mapTop = rootElement.getBoundingClientRect().top;
        const start = window.innerHeight * 0.84;
        const end = window.innerHeight * 0.16;
        progress = Math.min(1, Math.max(0, (start - mapTop) / (start - end)));
      }

      const zoomProgress = progress * progress * (3 - 2 * progress);
      const zoom = COUNTRY_CAMERA.zoom + (ADDIS_CAMERA.zoom - COUNTRY_CAMERA.zoom) * zoomProgress;
      const totalScaleChange = 1 - 2 ** (COUNTRY_CAMERA.zoom - ADDIS_CAMERA.zoom);
      const cameraFocusProgress = (1 - 2 ** (COUNTRY_CAMERA.zoom - zoom)) / totalScaleChange;
      scrollProgressRef.current = progress;
      rootElement.style.setProperty("--am-map-progress", progress.toFixed(3));
      const markerProgress = Math.min(1, Math.max(0, (progress - 0.68) / 0.24));
      markersRef.current.forEach(({ element }) => {
        element.style.opacity = markerProgress.toFixed(3);
        element.style.pointerEvents = markerProgress > 0.82 ? "auto" : "none";
      });

      if (Math.abs(progress - lastCameraProgress) < 0.001) return;
      lastCameraProgress = progress;
      map.jumpTo({
        center: [
          COUNTRY_CAMERA.lng + (ADDIS_CAMERA.lng - COUNTRY_CAMERA.lng) * cameraFocusProgress,
          COUNTRY_CAMERA.lat + (ADDIS_CAMERA.lat - COUNTRY_CAMERA.lat) * cameraFocusProgress,
        ],
        zoom,
      });
    };

    const queueScrollCamera = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(updateScrollCamera);
    };

    window.addEventListener("scroll", queueScrollCamera, { passive: true });
    window.addEventListener("resize", queueScrollCamera);

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
      queueScrollCamera();
    });
    resizeObserver.observe(containerRef.current);
    queueScrollCamera();

    return () => {
      window.removeEventListener("scroll", queueScrollCamera);
      window.removeEventListener("resize", queueScrollCamera);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      resizeObserver.disconnect();
      markersRef.current.forEach(({ marker, element, handleClick }) => {
        element.removeEventListener("click", handleClick);
        marker.remove();
      });
      markersRef.current = [];
      map.off("error", handleError);
      map.remove();
      mapRef.current = null;
    };
  }, [isAmharic, locations, onSelect]);

  useEffect(() => {
    markersRef.current.forEach(({ element, locationIndex }) => {
      element.classList.toggle("active", locationIndex === activeIndex);
    });

    const selected = locations[activeIndex];
    const map = mapRef.current;
    if (!map || !selected || scrollProgressRef.current < 0.98) return;

    map.easeTo({
      center: [selected.lng, selected.lat],
      duration: 650,
      easing: (time) => 1 - Math.pow(1 - time, 3),
    });
  }, [activeIndex, locations]);

  const changeZoom = (amount: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ zoom: Math.min(17, Math.max(5, map.getZoom() + amount)), duration: 350 });
  };

  return (
    <div ref={rootRef} className={`am-locator-map am-open-map ${status === "ready" ? "is-live" : "is-fallback"}`}>
      <div className="am-map-toolbar">
        <span><i />{isAmharic ? `በአሁኑ ጊዜ ${locations.length} ቦታዎች በካርታው ላይ አሉ` : `${locations.length} places are mapped right now`}</span>
        <div>
          <button type="button" aria-label={isAmharic ? "ካርታውን አጉላ" : "Zoom map in"} onClick={() => changeZoom(1)}>+</button>
          <button type="button" aria-label={isAmharic ? "ካርታውን አሳንስ" : "Zoom map out"} onClick={() => changeZoom(-1)}>−</button>
        </div>
      </div>

      <div className="am-ethiopia-canvas">
        <div ref={containerRef} className="am-open-map-surface" aria-label={isAmharic ? "የአዲስ አበባ ክፍት ካርታ" : "Open map of Addis Ababa"} />

        {status === "error" && (
          <div className="am-open-map-preview" aria-live="polite">
            <div className="am-preview-roads" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            {locations.map((location, index) => (
              <button
                key={location.name}
                type="button"
                className={index === activeIndex ? "active" : ""}
                style={{
                  left: `${Math.min(94, Math.max(6, 8 + ((location.lng - 38.67) / 0.24) * 84))}%`,
                  top: `${Math.min(94, Math.max(6, 8 + ((9.09 - location.lat) / 0.22) * 84))}%`,
                }}
                onClick={() => onSelect(index)}
                aria-label={`${location.name} — ${location.count}`}
              ><span /></button>
            ))}
            <p>
              <b>{isAmharic ? "ካርታው ለጊዜው አልተገኘም" : "Map temporarily unavailable"}</b>
              <span>{isAmharic ? "በአዲስ አበባ ያሉ ቦታዎችን ይፈልጉ" : "Discover places across Addis Ababa"}</span>
            </p>
          </div>
        )}

        <svg className="am-open-ethiopia-frame" viewBox="0 0 1000 760" preserveAspectRatio="none" aria-hidden="true">
          <path className="am-open-outside-veil" d={`M0 0H1000V710H0Z ${ETHIOPIA_OUTLINE}`} fillRule="evenodd" />
          <path className="am-ethiopia-outline" d={ETHIOPIA_OUTLINE} />
        </svg>

        <div className="am-map-journey" aria-hidden="true">
          <span>{isAmharic ? "ኢትዮጵያ" : "ETHIOPIA"}</span><i /><span>{isAmharic ? "አዲስ" : "ADDIS"}</span>
        </div>
      </div>

      <div className="am-map-key">
        <span><i />{isAmharic ? "የተመረጠ" : "Selected"}</span>
        <span><i />{isAmharic ? "ሌሎች ቦታዎች" : "Other locations"}</span>
      </div>
      <small className="am-map-attribution">ADDIS ABABA · OPENSTREETMAP DATA</small>
    </div>
  );
}
