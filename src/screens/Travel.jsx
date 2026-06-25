import "mapbox-gl/dist/mapbox-gl.css";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Gauge,
  Loader2,
  LocateFixed,
  LogOut,
  MapPinned,
  Navigation,
  Play,
  Route,
  Search,
  Settings,
  Square,
  Volume2,
  VolumeX,
  WalletCards,
  X,
} from "lucide-react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import { APP_ICON_URL, APP_NAME } from "../config/appConfig";
import { createMapboxSessionToken, getTrafficRoutes, loadMapboxAccessToken, resolveMapboxPlace, reverseMapboxGeocode, searchMapboxPlaces } from "../services/mapbox";
import { checkPicoPlaca, getCachedPicoPlacaRulesPayload } from "../services/picoPlacaService";
import { getRouteWeatherSummary } from "../services/weather";
import { getVehicle } from "../utils/storage";
import { polishSpanishText } from "../utils/textUtils";

const formatCurrency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatNumber = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 1,
});

const cityCenters = {
  armenia: [-75.6811, 4.5339],
  barranquilla: [-74.7813, 10.9685],
  bogota: [-74.0721, 4.711],
  bucaramanga: [-73.1198, 7.1193],
  cali: [-76.532, 3.4516],
  cartagena: [-75.4794, 10.391],
  cucuta: [-72.5078, 7.8891],
  manizales: [-75.5138, 5.0703],
  medellin: [-75.5812, 6.2442],
  pasto: [-77.2811, 1.2136],
  pereira: [-75.7139, 4.8143],
};

const mapStyles = {
  vector: "mapbox://styles/mapbox/standard",
  texture: "mapbox://styles/mapbox/standard-satellite",
};

export default function Travel({ user, onLogout }) {
  const vehicle = useMemo(() => getVehicle(user), [user]);
  const defaultCenter = useMemo(() => getDefaultCenter(vehicle, user), [vehicle, user]);
  const defaultProximity = useMemo(() => ({ lng: defaultCenter[0], lat: defaultCenter[1] }), [defaultCenter]);
  const mapContainerRef = useRef(null);
  const activeNavigationCardRef = useRef(null);
  const navigationReturnScrollRef = useRef(0);
  const mapRef = useRef(null);
  const mapboxglRef = useRef(null);
  const markersRef = useRef({ origin: null, destination: null });
  const userMarkerRef = useRef(null);
  const routeLayersRef = useRef([]);
  const mapLoadedRef = useRef(false);
  const latestMapDataRef = useRef({});
  const navigationWatchIdRef = useRef(null);
  const selectedRouteRef = useRef(null);
  const destinationRef = useRef(null);
  const navigationVoiceEnabledRef = useRef(true);
  const navigationFollowRef = useRef(false);
  const navigationBearingRef = useRef(null);
  const pendingNavigationCameraRef = useRef(null);
  const lastCameraFollowAtRef = useRef(0);
  const lastSpokenStepIdRef = useRef("");
  const lastRerouteAtRef = useRef(0);
  const isReroutingRef = useRef(false);
  const autoLocateOnOpenRef = useRef(false);
  const originSearchSessionRef = useRef(createMapboxSessionToken());
  const destinationSearchSessionRef = useRef(createMapboxSessionToken());

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [priceGallon, setPriceGallon] = useState("16000");
  const [autonomy, setAutonomy] = useState(vehicle?.autonomyPerGallon || "38");
  const [mapboxToken, setMapboxToken] = useState("");
  const [isMapboxConfigLoading, setIsMapboxConfigLoading] = useState(true);
  const [isMapEngineLoading, setIsMapEngineLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationPosition, setNavigationPosition] = useState(null);
  const [navigationSnapshot, setNavigationSnapshot] = useState(null);
  const [navigationVoiceEnabled, setNavigationVoiceEnabled] = useState(true);
  const [isRerouting, setIsRerouting] = useState(false);
  const [navigationViewOpen, setNavigationViewOpen] = useState(false);
  const [routePanelMinimized, setRoutePanelMinimized] = useState(false);
  const [routeEditorOpen, setRouteEditorOpen] = useState(true);
  const [mapSettingsOpen, setMapSettingsOpen] = useState(false);
  const [picoPlacaState, setPicoPlacaState] = useState({ status: "idle", result: null });
  const [picoWarningOpen, setPicoWarningOpen] = useState(false);
  const [routeWeather, setRouteWeather] = useState({});
  const [mapRevision, setMapRevision] = useState(0);
  const [mapTexture, setMapTexture] = useState("vector");
  const [mapDimension, setMapDimension] = useState("3d");

  const selectedRoute = routes.find((routeItem) => routeItem.id === selectedRouteId) || routes[0] || null;
  const bestTrafficRouteId = useMemo(() => getBestTrafficRouteId(routes), [routes]);
  const mapboxReady = Boolean(mapboxToken);
  const canCalculateRoutes = mapboxReady && hasCoordinates(origin) && hasCoordinates(destination) && !isRouting;
  const canStartNavigation = hasCoordinates(origin) && hasCoordinates(destination) && selectedRoute;
  const navigationFullscreen = isNavigating && navigationViewOpen;
  const mapStyleUrl = mapStyles[mapTexture] || mapStyles.vector;
  const mapIs3D = mapDimension === "3d";
  const mainClass = navigationFullscreen ? "fixed inset-0 z-50 overflow-hidden bg-slate-950" : "fixed inset-0 z-0 overflow-hidden bg-slate-950";
  const mapSectionClass = "absolute inset-0 overflow-hidden bg-slate-950";
  const mapContainerClass = "h-[100dvh] w-full bg-slate-200 [&_.mapboxgl-control-container]:hidden";

  useEffect(() => {
    let isActive = true;

    loadMapboxAccessToken()
      .then((token) => {
        if (isActive) setMapboxToken(token || "");
      })
      .finally(() => {
        if (isActive) setIsMapboxConfigLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setAutonomy((current) => current || vehicle?.autonomyPerGallon || "38");
  }, [vehicle?.autonomyPerGallon]);

  useEffect(() => {
    let isActive = true;
    const profile = getPicoVehicleProfile(vehicle, user);

    if (!profile.city || !profile.plate || !profile.vehicleType) {
      setPicoPlacaState({ status: "no-data", result: null });
      return () => {
        isActive = false;
      };
    }

    setPicoPlacaState((current) => ({ status: current.result ? "refreshing" : "loading", result: current.result }));

    const cachedPayload = getCachedPicoPlacaRulesPayload();
    checkPicoPlaca({
      city: profile.city,
      vehicleType: profile.vehicleType,
      plate: profile.plate,
      rules: cachedPayload.rules,
      rulesSource: cachedPayload.source,
    })
      .then((result) => {
        if (isActive) setPicoPlacaState({ status: "ready", result });
      })
      .catch((error) => console.warn("No se pudo calcular Pico y Placa desde cache", error));

    checkPicoPlaca({
      city: profile.city,
      vehicleType: profile.vehicleType,
      plate: profile.plate,
    })
      .then((result) => {
        if (isActive) setPicoPlacaState({ status: "ready", result });
      })
      .catch((error) => {
        console.warn("No se pudo calcular Pico y Placa", error);
        if (isActive) setPicoPlacaState((current) => ({ status: current.result ? "ready" : "error", result: current.result }));
      });

    return () => {
      isActive = false;
    };
  }, [user, vehicle]);

  useEffect(() => {
    latestMapDataRef.current = {
      destination,
      isNavigating,
      navigationFullscreen,
      navigationPosition,
      origin,
      routeEditorOpen,
      routes,
      selectedRouteId,
    };
  });

  useEffect(() => {
    selectedRouteRef.current = selectedRoute;
  }, [selectedRoute]);

  useEffect(() => {
    destinationRef.current = destination;
  }, [destination]);

  useEffect(() => {
    navigationVoiceEnabledRef.current = navigationVoiceEnabled;
  }, [navigationVoiceEnabled]);

  useEffect(() => {
    const resizeTimer = window.setTimeout(() => {
      mapRef.current?.resize();
      if (isNavigating && navigationPosition) {
        followNavigationCamera(navigationPosition, { immediate: true });
      }
    }, 120);

    return () => window.clearTimeout(resizeTimer);
  }, [isNavigating, navigationFullscreen, navigationPosition?.lat, navigationPosition?.lng]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    if (navigationFullscreen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overscrollBehavior = "none";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, [navigationFullscreen]);

  useEffect(() => {
    return () => {
      stopNavigationWatch();
      navigationFollowRef.current = false;
      pendingNavigationCameraRef.current = null;
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapboxReady || !mapContainerRef.current || mapRef.current) return;

    let isCancelled = false;
    let map = null;
    setIsMapEngineLoading(true);

    import("mapbox-gl")
      .then((module) => {
        if (isCancelled || !mapContainerRef.current || mapRef.current) return;

        const mapboxgl = module.default || module;
        mapboxglRef.current = mapboxgl;
        mapboxgl.accessToken = mapboxToken;

        map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: mapStyleUrl,
          config: getStandardMapConfig(false),
          center: defaultCenter,
          zoom: mapIs3D ? 15.15 : 11,
          pitch: mapIs3D ? 58 : 0,
          bearing: mapIs3D ? -24 : 0,
          cooperativeGestures: false,
          dragPan: true,
          dragRotate: true,
          scrollZoom: true,
          touchPitch: true,
          touchZoomRotate: true,
          fadeDuration: 0,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: false,
          showUserHeading: true,
        });
        map.addControl(geolocate, "top-right");
        geolocate.on("geolocate", (event) => {
          const coordinates = {
            lng: event.coords.longitude,
            lat: event.coords.latitude,
          };
          setOriginFromCoordinates(coordinates, "Origen detectado desde el mapa.");
        });

        map.once("load", () => {
          if (isCancelled || mapRef.current !== map) return;

          const latestMapData = latestMapDataRef.current;
          mapLoadedRef.current = true;
          setIsMapEngineLoading(false);
          schedule3DMapEnhancements(map, mapIs3D);
          drawRoutesOnMap(latestMapData.routes || [], latestMapData.selectedRouteId || "");
          updateMarker("origin", latestMapData.origin, "#2563eb");
          updateMarker("destination", latestMapData.destination, "#16a34a");
          const cameraPosition = latestMapData.navigationPosition || pendingNavigationCameraRef.current?.position;
          if (cameraPosition) {
            updateUserMarker(cameraPosition);
            if (latestMapData.isNavigating || latestMapData.navigationFullscreen) {
              followNavigationCamera(cameraPosition, { immediate: true });
            }
          }
        });

        map.on("error", (event) => {
          console.warn("Mapbox no pudo cargar un recurso del mapa", event?.error || event);
          if (!isCancelled && mapRef.current === map) setIsMapEngineLoading(false);
        });

        mapRef.current = map;
      })
      .catch((error) => {
        console.warn("No se pudo cargar Mapbox GL", error);
        if (!isCancelled) {
          setStatusMessage("No pudimos cargar el mapa. Revisa la conexion e intenta de nuevo.");
          setIsMapEngineLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      clearRouteLayers();
      Object.values(markersRef.current).forEach((marker) => marker?.remove());
      markersRef.current = { origin: null, destination: null };
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      mapLoadedRef.current = false;
      map?.remove();
      if (mapRef.current === map) mapRef.current = null;
    };
  }, [defaultCenter, mapIs3D, mapRevision, mapStyleUrl, mapboxReady, mapboxToken]);

  useEffect(() => {
    if (!mapboxReady || !originQuery || originQuery === origin?.label) {
      setOriginSuggestions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsSearchingOrigin(true);
      searchMapboxPlaces(originQuery, { proximity: destination || defaultProximity, sessionToken: originSearchSessionRef.current })
        .then(setOriginSuggestions)
        .catch(() => setOriginSuggestions([]))
        .finally(() => setIsSearchingOrigin(false));
    }, 360);

    return () => window.clearTimeout(timer);
  }, [defaultProximity, destination, mapboxReady, origin?.label, originQuery]);

  useEffect(() => {
    if (!mapboxReady || !destinationQuery || destinationQuery === destination?.label) {
      setDestinationSuggestions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsSearchingDestination(true);
      searchMapboxPlaces(destinationQuery, { proximity: origin || defaultProximity, sessionToken: destinationSearchSessionRef.current })
        .then(setDestinationSuggestions)
        .catch(() => setDestinationSuggestions([]))
        .finally(() => setIsSearchingDestination(false));
    }, 360);

    return () => window.clearTimeout(timer);
  }, [defaultProximity, destination?.label, destinationQuery, mapboxReady, origin]);

  useEffect(() => {
    updateMarker("origin", origin, "#2563eb");
  }, [origin]);

  useEffect(() => {
    updateMarker("destination", destination, "#16a34a");
  }, [destination]);

  useEffect(() => {
    drawRoutesOnMap(routes, selectedRouteId);
  }, [isNavigating, routeEditorOpen, routes, selectedRouteId]);

  useEffect(() => {
    let isActive = true;

    if (!routes.length) {
      setRouteWeather({});
      return () => {
        isActive = false;
      };
    }

    setRouteWeather(
      Object.fromEntries(
        routes.map((routeItem) => [
          routeItem.id,
          {
            status: "loading",
            label: "Consultando clima",
            raining: false,
            maxPrecipitation: 0,
          },
        ]),
      ),
    );

    Promise.all(
      routes.map(async (routeItem) => {
        try {
          return [routeItem.id, await getRouteWeatherSummary(routeItem)];
        } catch (error) {
          console.warn("No se pudo consultar clima de ruta", error);
          return [
            routeItem.id,
            {
              status: "unavailable",
              label: "Clima no disponible",
              raining: false,
              maxPrecipitation: 0,
            },
          ];
        }
      }),
    ).then((entries) => {
      if (isActive) setRouteWeather(Object.fromEntries(entries));
    });

    return () => {
      isActive = false;
    };
  }, [routes]);

  useEffect(() => {
    if (!mapboxReady || autoLocateOnOpenRef.current) return;

    autoLocateOnOpenRef.current = true;
    detectCurrentLocation({ silent: true });
  }, [mapboxReady]);

  function updateOriginQuery(value) {
    setOriginQuery(value);
    setOrigin(null);
    resetRoutes();
  }

  function updateDestinationQuery(value) {
    setDestinationQuery(value);
    setDestination(null);
    resetRoutes();
  }

  async function selectOrigin(place) {
    setStatusMessage("Ubicando origen...");
    const resolvedPlace = await resolvePlaceSelection(place);
    setOrigin(resolvedPlace);
    setOriginQuery(resolvedPlace.label);
    setOriginSuggestions([]);
    originSearchSessionRef.current = createMapboxSessionToken();
    resetRoutes();
    focusMap(resolvedPlace);
    setStatusMessage(hasCoordinates(resolvedPlace) ? "Origen seleccionado." : "No pudimos obtener coordenadas para ese origen.");
  }

  async function selectDestination(place) {
    setStatusMessage("Ubicando destino...");
    const resolvedPlace = await resolvePlaceSelection(place);
    setDestination(resolvedPlace);
    setDestinationQuery(resolvedPlace.label);
    setDestinationSuggestions([]);
    destinationSearchSessionRef.current = createMapboxSessionToken();
    resetRoutes();
    focusMap(resolvedPlace);
    setStatusMessage(hasCoordinates(resolvedPlace) ? "Destino seleccionado." : "No pudimos obtener coordenadas para ese destino.");
  }

  async function resolvePlaceSelection(place) {
    try {
      return await resolveMapboxPlace(place);
    } catch (error) {
      console.warn("No se pudo resolver el lugar seleccionado", error);
      return place;
    }
  }

  function resetRoutes() {
    setRoutes([]);
    setSelectedRouteId("");
    setRoutePanelMinimized(false);
    setRouteEditorOpen(true);
  }

  function detectCurrentLocation(options = {}) {
    if (!mapboxReady) return;

    if (!navigator.geolocation) {
      setStatusMessage("Este navegador no permite detectar ubicacion.");
      return;
    }

    if (!options.silent) setStatusMessage("Detectando origen...");
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        };
        setOriginFromCoordinates(coordinates, "Origen detectado.");
      },
      () => {
        setIsLocating(false);
        setStatusMessage("No pudimos detectar el origen. Puedes escribirlo manualmente.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000 * 60,
        timeout: 10000,
      },
    );
  }

  function setOriginFromCoordinates(coordinates, message) {
    reverseMapboxGeocode(coordinates)
      .then((place) => {
        const detectedPlace = place || {
          id: "current-location",
          name: "Ubicacion actual",
          label: "Ubicacion actual",
          ...coordinates,
        };

        setOrigin(detectedPlace);
        setOriginQuery(detectedPlace.label);
        setOriginSuggestions([]);
        setStatusMessage(message);
        resetRoutes();
        focusMap(detectedPlace);
      })
      .catch(() => {
        const detectedPlace = {
          id: "current-location",
          name: "Ubicacion actual",
          label: "Ubicacion actual",
          ...coordinates,
        };

        setOrigin(detectedPlace);
        setOriginQuery(detectedPlace.label);
        setStatusMessage(message);
        resetRoutes();
        focusMap(detectedPlace);
      })
      .finally(() => setIsLocating(false));
  }

  async function calculateRoutes() {
    if (!canCalculateRoutes) {
      setStatusMessage("Selecciona origen y destino.");
      return;
    }

    setIsRouting(true);
    setStatusMessage("Calculando rutas con trafico...");

    try {
      const result = await getTrafficRoutes(origin, destination);
      const rankedRoutes = rankRoutes(result.routes).slice(0, 2);

      setRoutes(rankedRoutes);
      setSelectedRouteId(rankedRoutes[0]?.id || "");
      setRouteEditorOpen(!rankedRoutes.length);
      setRoutePanelMinimized(false);
      setStatusMessage(rankedRoutes.length ? `${rankedRoutes.length} rutas encontradas.` : "No encontramos rutas disponibles.");
    } catch (error) {
      setRoutes([]);
      setSelectedRouteId("");
      setRouteEditorOpen(true);
      setStatusMessage(error?.message || "No se pudieron calcular las rutas.");
    } finally {
      setIsRouting(false);
    }
  }

  function startNavigation() {
    if (!canStartNavigation) {
      setStatusMessage("Calcula una ruta antes de iniciar navegacion.");
      return;
    }

    if (picoPlacaState.result?.aplica) {
      setPicoWarningOpen(true);
    }

    setRoutePanelMinimized(true);
    setNavigationViewOpen(false);
    setNavigationSnapshot(null);

    if (!navigator.geolocation) {
      setStatusMessage("Este navegador no permite seguimiento GPS.");
      return;
    }

    if (navigationWatchIdRef.current !== null) {
      setStatusMessage("Navegacion en curso.");
      return;
    }

    lastSpokenStepIdRef.current = "";
    navigationFollowRef.current = true;
    navigationBearingRef.current = null;
    pendingNavigationCameraRef.current = null;
    lastCameraFollowAtRef.current = 0;
    navigationReturnScrollRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    setIsNavigating(true);
    setStatusMessage("Navegacion iniciada.");
    speakInstruction("Navegacion iniciada.");

    navigationWatchIdRef.current = navigator.geolocation.watchPosition(handleNavigationPosition, handleNavigationError, {
      enableHighAccuracy: true,
      maximumAge: 1500,
      timeout: 12000,
    });
  }

  function minimizeNavigationView() {
    const targetScroll = navigationReturnScrollRef.current;
    setNavigationViewOpen(false);
    setMapRevision((current) => current + 1);

    window.setTimeout(() => {
      mapRef.current?.resize();
      window.scrollTo({ top: targetScroll, left: 0, behavior: "auto" });
    }, 80);

    window.setTimeout(() => {
      mapRef.current?.resize();
      window.scrollTo({ top: targetScroll, left: 0, behavior: "auto" });
    }, 260);
  }

  function stopNavigation() {
    stopNavigationWatch();
    navigationFollowRef.current = false;
    navigationBearingRef.current = null;
    pendingNavigationCameraRef.current = null;
    lastCameraFollowAtRef.current = 0;
    setIsNavigating(false);
    setNavigationViewOpen(false);
    setRoutePanelMinimized(false);
    setMapRevision((current) => current + 1);
    setNavigationSnapshot(null);
    setStatusMessage("Navegacion detenida.");
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function stopNavigationWatch() {
    if (navigationWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(navigationWatchIdRef.current);
    }
    navigationWatchIdRef.current = null;
  }

  function handleNavigationError() {
    stopNavigationWatch();
    navigationFollowRef.current = false;
    navigationBearingRef.current = null;
    pendingNavigationCameraRef.current = null;
    lastCameraFollowAtRef.current = 0;
    setIsNavigating(false);
    setNavigationViewOpen(false);
    setRoutePanelMinimized(true);
    setMapRevision((current) => current + 1);
    setStatusMessage("No pudimos seguir tu ubicacion. Revisa permisos de GPS.");
  }

  function handleNavigationPosition(position) {
    const nextPosition = {
      lng: position.coords.longitude,
      lat: position.coords.latitude,
      heading: Number.isFinite(position.coords.heading) ? position.coords.heading : null,
      speed: Number.isFinite(position.coords.speed) ? Math.max(0, position.coords.speed) : null,
      accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
      timestamp: position.timestamp,
    };

    const route = selectedRouteRef.current;
    const progress = getNavigationProgress(route, nextPosition);
    const trackedPosition = {
      ...nextPosition,
      heading: resolveNavigationBearing(nextPosition, route, progress),
    };

    setNavigationPosition(trackedPosition);
    setNavigationSnapshot(progress);
    updateUserMarker(trackedPosition);
    updateActiveRouteProgress(route, progress, trackedPosition);
    followNavigationCamera(trackedPosition);

    if (!progress) return;

    if (progress.arrived) {
      speakInstruction("Llegaste a tu destino.");
      stopNavigationWatch();
      navigationFollowRef.current = false;
      navigationBearingRef.current = null;
      pendingNavigationCameraRef.current = null;
      lastCameraFollowAtRef.current = 0;
      setIsNavigating(false);
      setNavigationViewOpen(false);
      setRoutePanelMinimized(false);
      setMapRevision((current) => current + 1);
      setStatusMessage("Llegaste a tu destino.");
      return;
    }

    if (progress.currentStep?.id && lastSpokenStepIdRef.current !== progress.currentStep.id) {
      lastSpokenStepIdRef.current = progress.currentStep.id;
      speakInstruction(progress.currentStep.instruction);
    }

    if (progress.offRoute) {
      rerouteFromPosition(nextPosition);
    }
  }

  async function rerouteFromPosition(position) {
    if (isReroutingRef.current) return;
    if (Date.now() - lastRerouteAtRef.current < 20000) return;
    if (!hasCoordinates(position) || !hasCoordinates(destinationRef.current)) return;

    isReroutingRef.current = true;
    lastRerouteAtRef.current = Date.now();
    setIsRerouting(true);
    setStatusMessage("Recalculando ruta...");

    try {
      const result = await getTrafficRoutes(position, destinationRef.current);
      const rankedRoutes = rankRoutes(result.routes).slice(0, 2);
      if (!rankedRoutes.length) return;

      setRoutes(rankedRoutes);
      setSelectedRouteId(rankedRoutes[0].id);
      setRouteEditorOpen(false);
      setOrigin({
        id: "current-navigation-position",
        name: "Ubicacion actual",
        label: "Ubicacion actual",
        lng: position.lng,
        lat: position.lat,
      });
      setOriginQuery("Ubicacion actual");
      setStatusMessage("Ruta recalculada.");
      speakInstruction("Ruta recalculada.");
    } catch (error) {
      console.warn("No se pudo recalcular la ruta", error);
      setStatusMessage("No pudimos recalcular la ruta.");
    } finally {
      isReroutingRef.current = false;
      setIsRerouting(false);
    }
  }

  function speakInstruction(instruction) {
    const text = String(instruction || "").trim();
    if (!text || !navigationVoiceEnabledRef.current || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-CO";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function updateMarker(type, place, color) {
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;
    if (!map || !mapboxgl || !mapLoadedRef.current) return;

    markersRef.current[type]?.remove();
    markersRef.current[type] = null;

    if (!hasCoordinates(place)) return;

    markersRef.current[type] = new mapboxgl.Marker({ color }).setLngLat([place.lng, place.lat]).addTo(map);
  }

  function updateUserMarker(position) {
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;
    if (!map || !mapboxgl || !mapLoadedRef.current || !hasCoordinates(position)) return;

    if (!userMarkerRef.current) {
      const element = document.createElement("div");
      element.className = "grid size-9 place-items-center rounded-full border-4 border-white bg-blue-600 text-white shadow-xl";
      element.innerHTML = '<div class="size-2.5 rounded-full bg-white"></div>';
      userMarkerRef.current = new mapboxgl.Marker({ element, rotationAlignment: "map" }).setLngLat([position.lng, position.lat]).addTo(map);
    }

    userMarkerRef.current.setLngLat([position.lng, position.lat]);
    if (Number.isFinite(position.heading)) {
      userMarkerRef.current.setRotation(position.heading);
    }
  }

  function applyStandardMapConfig(map, show3dObjects) {
    if (!map?.setConfigProperty) return;

    Object.entries(getStandardMapConfig(show3dObjects).basemap).forEach(([property, value]) => {
      try {
        map.setConfigProperty("basemap", property, value);
      } catch (error) {
        console.warn(`No se pudo ajustar ${property} en Mapbox Standard`, error);
      }
    });
  }

  function schedule3DMapEnhancements(map, shouldShow3D) {
    if (!map) return;

    if (!shouldShow3D) {
      applyStandardMapConfig(map, false);
      return;
    }

    const runEnhancements = () => {
      if (mapRef.current !== map || !mapLoadedRef.current) return;
      applyStandardMapConfig(map, true);
      add3DMapEffects(map);
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(runEnhancements, { timeout: 1200 });
      return;
    }

    window.setTimeout(runEnhancements, 520);
  }

  function add3DMapEffects(map) {
    if (!map) return;

    try {
      if (!map.getSource("copilot-buildings-source")) {
        map.addSource("copilot-buildings-source", {
          type: "vector",
          url: "mapbox://mapbox.mapbox-streets-v8",
        });
      }

      if (!map.getLayer("copilot-3d-buildings-fallback")) {
        map.addLayer({
          id: "copilot-3d-buildings-fallback",
          type: "fill-extrusion",
          source: "copilot-buildings-source",
          "source-layer": "building",
          slot: "middle",
          minzoom: 14.2,
          paint: {
            "fill-extrusion-color": ["interpolate", ["linear"], ["to-number", ["get", "height"], 18], 0, "#edf2f7", 70, "#d8e0e8", 180, "#bdc8d4"],
            "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 13.25, 0, 15, ["to-number", ["get", "height"], 18]],
            "fill-extrusion-base": ["to-number", ["get", "min_height"], 0],
            "fill-extrusion-opacity": 0.74,
            "fill-extrusion-vertical-gradient": true,
          },
        });
      }
    } catch (error) {
      console.warn("No se pudo activar el respaldo de edificios 3D", error);
    }
  }

  function resolveNavigationBearing(position, route, progress) {
    const rawHeading = Number(position?.heading);
    const rawSpeed = position?.speed;
    const hasSpeed = Number.isFinite(rawSpeed);
    const isMoving = !hasSpeed || rawSpeed > 1.2;

    if (Number.isFinite(rawHeading) && rawHeading >= 0 && isMoving) {
      const normalizedHeading = normalizeBearing(rawHeading);
      navigationBearingRef.current = normalizedHeading;
      return normalizedHeading;
    }

    const routeBearing = getRouteBearingAtIndex(route, progress?.nearestRouteIndex);
    if (Number.isFinite(routeBearing)) {
      navigationBearingRef.current = routeBearing;
      return routeBearing;
    }

    if (Number.isFinite(navigationBearingRef.current)) {
      return navigationBearingRef.current;
    }

    return Number.isFinite(rawHeading) ? normalizeBearing(rawHeading) : null;
  }

  function followNavigationCamera(position, options = {}) {
    if (!navigationFollowRef.current && !options.force) return;

    const map = mapRef.current;
    if (!hasCoordinates(position)) return;

    if (!map || !mapLoadedRef.current) {
      pendingNavigationCameraRef.current = { position, options };
      return;
    }

    pendingNavigationCameraRef.current = null;

    const currentCenter = map.getCenter();
    const distanceFromCenterMeters = getDistanceMeters({ lng: currentCenter.lng, lat: currentCenter.lat }, position);
    const now = Date.now();
    const hasFollowedBefore = lastCameraFollowAtRef.current > 0;
    const elapsed = hasFollowedBefore ? now - lastCameraFollowAtRef.current : 0;
    const shouldJump = options.immediate || !hasFollowedBefore || distanceFromCenterMeters > 180;
    const targetZoom = Number(position.speed || 0) > 11 ? 16.9 : 17.25;
    const targetBearing = Number.isFinite(position.heading) ? position.heading : map.getBearing();
    const targetOffset = getNavigationCameraOffset(map);

    lastCameraFollowAtRef.current = now;
    map.stop();

    const camera = {
      center: [position.lng, position.lat],
      zoom: targetZoom,
      pitch: mapIs3D ? 68 : 0,
      bearing: targetBearing,
      offset: targetOffset,
      essential: true,
    };

    if (shouldJump) {
      map.jumpTo(camera);
      return;
    }

    map.easeTo({
      ...camera,
      duration: Math.max(280, Math.min(840, elapsed || 520)),
      easing: (progress) => 1 - Math.pow(1 - progress, 3),
    });
  }

  function drawRoutesOnMap(routeItems, activeRouteId) {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    clearRouteLayers();

    const latestMapData = latestMapDataRef.current;
    const activeRoute = routeItems.find((routeItem) => routeItem.id === activeRouteId) || routeItems[0];
    const visibleRouteItems = latestMapData.isNavigating && activeRoute ? [activeRoute] : routeItems;
    const orderedRoutes = [...visibleRouteItems].sort((left, right) => {
      if (left.id === activeRouteId) return 1;
      if (right.id === activeRouteId) return -1;
      return left.index - right.index;
    });

    orderedRoutes.forEach((routeItem) => {
      if (!routeItem.geometry) return;

      const sourceId = `travel-${routeItem.id}`;
      const layerId = `travel-${routeItem.id}-line`;
      const active = routeItem.id === activeRouteId;

      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: routeItem.geometry,
        },
      });

      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        slot: "top",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": active ? "#2563eb" : "#94a3b8",
          "line-opacity": active ? 0.95 : 0.55,
          "line-width": active ? 7 : 4,
          "line-emissive-strength": active ? 1.15 : 0.65,
        },
      });

      routeLayersRef.current.push({ layerId, sourceId });
    });

    if (latestMapData.isNavigating && latestMapData.navigationPosition) {
      const progress = getNavigationProgress(activeRoute, latestMapData.navigationPosition);
      updateActiveRouteProgress(activeRoute, progress, latestMapData.navigationPosition);
      followNavigationCamera(latestMapData.navigationPosition, { immediate: true });
      return;
    }

    fitRouteBounds(activeRoute);
  }

  function updateActiveRouteProgress(routeItem, progress, position) {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current || !routeItem?.id || !progress) return;

    const source = map.getSource(`travel-${routeItem.id}`);
    if (!source?.setData) return;

    source.setData({
      type: "Feature",
      properties: {},
      geometry: getRemainingRouteGeometry(routeItem, progress, position),
    });
  }

  function clearRouteLayers() {
    const map = mapRef.current;
    if (!map) return;

    routeLayersRef.current.forEach(({ layerId, sourceId }) => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });
    routeLayersRef.current = [];
  }

  function fitRouteBounds(routeItem) {
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;
    const coordinates = routeItem?.geometry?.coordinates || [];
    if (!map || !mapboxgl || !coordinates.length) return;

    const bounds = coordinates.reduce((currentBounds, coordinate) => currentBounds.extend(coordinate), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
    const hasRoutes = Boolean(latestMapDataRef.current.routes?.length);
    const editorOpen = Boolean(latestMapDataRef.current.routeEditorOpen);
    const padding = navigationFullscreen
      ? { top: 92, right: 44, bottom: 210, left: 44 }
      : { top: 112, right: 34, bottom: hasRoutes ? (editorOpen ? 330 : 190) : 260, left: 34 };

    map.fitBounds(bounds, { padding, maxZoom: mapIs3D ? 15.65 : 14.8, pitch: mapIs3D ? (navigationFullscreen ? 68 : 58) : 0, bearing: mapIs3D ? -24 : 0 });
  }

  function focusMap(place) {
    const map = mapRef.current;
    if (!map || !hasCoordinates(place)) return;
    map.flyTo({ center: [place.lng, place.lat], zoom: mapIs3D ? 15.7 : 14, pitch: mapIs3D ? 58 : 0, bearing: mapIs3D ? -24 : 0, essential: true });
  }

  return (
    <main className={mainClass}>
      <section className={mapSectionClass}>
        <div
          key={`travel-map-${mapRevision}`}
          ref={mapContainerRef}
          className={mapContainerClass}
          aria-label="Mapa de viaje"
        />
        {navigationFullscreen ? (
          <MapModeControls
            texture={mapTexture}
            dimension={mapDimension}
            onTextureChange={setMapTexture}
            onDimensionChange={setMapDimension}
            fullscreen
          />
        ) : null}

        {!mapboxReady ? (
          <div className="absolute inset-x-3 top-[calc(env(safe-area-inset-top)+4.75rem)] z-20 mx-auto max-w-3xl">
            <MapboxSetupNotice isLoading={isMapboxConfigLoading} />
          </div>
        ) : null}

        {mapboxReady && isMapEngineLoading ? (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-slate-950/20 text-white backdrop-blur-[1px]">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2 text-xs font-black text-slate-800 shadow-sm ring-1 ring-slate-200">
              <Loader2 className="animate-spin text-blue-600" size={17} />
              Cargando mapa
            </div>
          </div>
        ) : null}
        {navigationFullscreen ? (
          <>
            <button
              type="button"
              onClick={minimizeNavigationView}
              className="absolute left-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-30 grid size-11 place-items-center rounded-2xl bg-[#020617] text-white shadow-[0_12px_30px_rgba(2,6,23,0.55)] ring-1 ring-white/15 transition hover:bg-slate-900"
              aria-label="Minimizar navegacion"
              title="Minimizar navegacion"
            >
              <X size={20} />
            </button>
            <NavigationPanel
              snapshot={navigationSnapshot}
              position={navigationPosition}
              isRerouting={isRerouting}
              voiceEnabled={navigationVoiceEnabled}
              onToggleVoice={() => setNavigationVoiceEnabled((current) => !current)}
              onStop={stopNavigation}
              fullscreen
            />
          </>
        ) : (
          <>
            <TravelTopOverlay
              user={user}
              onLogout={onLogout}
              statusMessage={routes.length ? "" : statusMessage}
              isNavigating={isNavigating}
              isRerouting={isRerouting}
              picoPlacaState={picoPlacaState}
              mapTexture={mapTexture}
              mapDimension={mapDimension}
              mapSettingsOpen={mapSettingsOpen}
              onToggleMapSettings={() => setMapSettingsOpen((current) => !current)}
              onTextureChange={setMapTexture}
              onDimensionChange={setMapDimension}
            />

            {routePanelMinimized ? (
              <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.85rem)] z-30 px-3">
                <div className="mx-auto max-w-3xl">
                  <ActiveNavigationCard
                    ref={activeNavigationCardRef}
                    snapshot={navigationSnapshot}
                    isNavigating={isNavigating}
                    onOpen={() => {
                      if (isNavigating) {
                        setNavigationViewOpen(true);
                        return;
                      }
                      setRoutePanelMinimized(false);
                    }}
                    onStop={isNavigating ? stopNavigation : () => setRoutePanelMinimized(false)}
                  />
                </div>
              </div>
            ) : (
              <TravelBottomSheet
                routes={routes}
                selectedRouteId={selectedRouteId}
                bestTrafficRouteId={bestTrafficRouteId}
                routeWeather={routeWeather}
                setAutonomy={setAutonomy}
                setPriceGallon={setPriceGallon}
                originQuery={originQuery}
                destinationQuery={destinationQuery}
                originSuggestions={originSuggestions}
                destinationSuggestions={destinationSuggestions}
                isSearchingOrigin={isSearchingOrigin}
                isSearchingDestination={isSearchingDestination}
                isLocating={isLocating}
                isRouting={isRouting}
                mapboxReady={mapboxReady}
                priceGallon={priceGallon}
                autonomy={autonomy}
                routeEditorOpen={routeEditorOpen}
                canCalculateRoutes={canCalculateRoutes}
                canStartNavigation={canStartNavigation}
                onCalculateRoutes={calculateRoutes}
                onEditRoute={() => setRouteEditorOpen(true)}
                onDetectLocation={() => detectCurrentLocation()}
                onOriginChange={updateOriginQuery}
                onDestinationChange={updateDestinationQuery}
                onOriginSelect={selectOrigin}
                onDestinationSelect={selectDestination}
                onRouteSelect={setSelectedRouteId}
                onStartNavigation={startNavigation}
              />
            )}
          </>
        )}
      </section>

      {picoWarningOpen ? (
        <PicoPlacaWarningDialog result={picoPlacaState.result} onClose={() => setPicoWarningOpen(false)} />
      ) : null}
    </main>
  );
}

function TravelTopOverlay({
  user,
  onLogout,
  statusMessage,
  isNavigating,
  isRerouting,
  picoPlacaState,
  mapTexture,
  mapDimension,
  mapSettingsOpen,
  onToggleMapSettings,
  onTextureChange,
  onDimensionChange,
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white/95 px-3 py-2 text-slate-950 shadow-[0_14px_36px_rgba(15,23,42,0.16)] ring-1 ring-white/80 backdrop-blur">
          <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-950 shadow-sm" role="img" aria-label={APP_NAME} title={APP_NAME}>
            <img src={APP_ICON_URL} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black leading-tight">Ruta360 <PicoPlacaBadge state={picoPlacaState} /></h1>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5">
              <p className="truncate text-[0.72rem] font-semibold text-slate-500">{isRerouting ? "Recalculando ruta" : isNavigating ? "Navegacion activa" : "Ponte el cinturón"}</p>
              
            </div>
          </div>
        </div>

        <div className="pointer-events-auto relative flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleMapSettings}
            className={`grid size-11 place-items-center rounded-2xl bg-white/95 shadow-[0_14px_36px_rgba(15,23,42,0.16)] ring-1 ring-white/80 backdrop-blur transition ${mapSettingsOpen ? "text-blue-700" : "text-slate-600 hover:text-blue-700"}`}
            aria-label="Ajustes del mapa"
            title="Ajustes del mapa"
          >
            <Settings size={18} />
          </button>

          {user ? (
            <button
              type="button"
              onClick={onLogout}
              className="grid size-11 place-items-center rounded-2xl bg-white/95 text-slate-600 shadow-[0_14px_36px_rgba(15,23,42,0.16)] ring-1 ring-white/80 backdrop-blur transition hover:text-red-600"
              aria-label="Cerrar sesion"
              title="Cerrar sesion"
            >
              <LogOut size={18} />
            </button>
          ) : null}

          {mapSettingsOpen ? (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white/95 p-2 shadow-[0_18px_44px_rgba(15,23,42,0.22)] ring-1 ring-slate-200 backdrop-blur">
              <MapModeControls
                texture={mapTexture}
                dimension={mapDimension}
                onTextureChange={onTextureChange}
                onDimensionChange={onDimensionChange}
                embedded
              />
            </div>
          ) : null}
        </div>
      </div>

      {statusMessage ? (
        <p className="pointer-events-auto mx-auto mt-2 max-w-3xl rounded-2xl bg-blue-600/95 px-3 py-2 text-xs font-black text-white shadow-[0_12px_30px_rgba(37,99,235,0.26)] ring-1 ring-white/20 backdrop-blur">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}

function PicoPlacaBadge({ state }) {
  const result = state?.result;

  if (state?.status === "loading" || state?.status === "refreshing") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[0.62rem] font-black text-slate-500 ring-1 ring-slate-200">
        <Loader2 className="animate-spin" size={11} />
        Pico y placa
      </span>
    );
  }

  if (!result) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[0.62rem] font-black text-slate-500 ring-1 ring-slate-200">
        <AlertCircle size={11} />
        Sin pico y placa
      </span>
    );
  }

  if (result.aplica) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[0.62rem] font-black text-red-700 ring-1 ring-red-200">
        <AlertTriangle size={11} />
        Pico y placa
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-black text-emerald-700 ring-1 ring-emerald-200">
      <CheckCircle2 size={11} />
      Sin pico y placa
    </span>
  );
}

function PicoPlacaWarningDialog({ result, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <section className="w-full max-w-sm rounded-[1.5rem] bg-white p-5 text-slate-950 shadow-[0_24px_70px_rgba(2,6,23,0.38)] ring-1 ring-white/80">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <AlertTriangle size={24} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black leading-tight">Hoy tienes Pico y Placa</h2>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">
              {polishSpanishText(result?.message || "Tu vehiculo tiene restriccion de circulacion para la fecha consultada.")}
            </p>
          </div>
        </div>
        <p className="mb-4 rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-700 ring-1 ring-red-100">
          Puedes revisar la ruta, pero ten presente la restriccion antes de iniciar el viaje.
        </p>
        <button type="button" onClick={onClose} className="primary-button w-full rounded-2xl">
          ENTENDIDO GRACIAS
        </button>
      </section>
    </div>
  );
}

function TravelBottomSheet({
  routes,
  selectedRouteId,
  bestTrafficRouteId,
  routeWeather,
  setAutonomy,
  setPriceGallon,
  priceGallon,
  autonomy,
  originQuery,
  destinationQuery,
  originSuggestions,
  destinationSuggestions,
  isSearchingOrigin,
  isSearchingDestination,
  isLocating,
  isRouting,
  mapboxReady,
  routeEditorOpen,
  canCalculateRoutes,
  canStartNavigation,
  onCalculateRoutes,
  onEditRoute,
  onDetectLocation,
  onOriginChange,
  onDestinationChange,
  onOriginSelect,
  onDestinationSelect,
  onRouteSelect,
  onStartNavigation,
}) {
  const showEditor = routeEditorOpen || !routes.length;
  const visibleRoutes = routes.slice(0, 2);

  return (
    <section className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.85rem)] z-30 px-3">
      <div className="mx-auto max-w-3xl rounded-[1.35rem] bg-white/95 p-2 text-slate-950 shadow-[0_-18px_48px_rgba(15,23,42,0.18)] ring-1 ring-white/75 backdrop-blur-xl">
        <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-slate-300" />

        {visibleRoutes.length ? (
          <div className={showEditor ? "mb-2 rounded-[1.1rem] bg-slate-50/95 p-2 ring-1 ring-slate-100" : "rounded-[1.1rem] bg-slate-50/95 p-2 ring-1 ring-slate-100"}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-xs font-black uppercase tracking-wide text-slate-700">Rutas sugeridas</h2>
                <p className="truncate text-[0.66rem] font-semibold text-slate-500">{showEditor ? "Toca una alternativa para verla en el mapa." : "Mapa ampliado. Puedes volver a editar los datos."}</p>
              </div>
              <StatusBadge tone="info">{visibleRoutes.length}</StatusBadge>
            </div>
            <div className="flex items-stretch gap-2">
              <div className="min-w-0 flex-1 overflow-x-auto">
                <div className="flex snap-x gap-2">
                  {visibleRoutes.map((routeItem) => (
                    <RouteMiniOption
                      key={routeItem.id}
                      routeItem={routeItem}
                      active={selectedRouteId === routeItem.id}
                      bestTraffic={routeItem.id === bestTrafficRouteId}
                      priceGallon={priceGallon}
                      autonomy={autonomy}
                      weather={routeWeather[routeItem.id]}
                      onSelect={() => onRouteSelect(routeItem.id)}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={onStartNavigation}
                disabled={!canStartNavigation}
                className="grid w-12 shrink-0 place-items-center rounded-2xl bg-black text-white shadow-[0_16px_36px_rgba(0,0,0,0.26)] transition hover:bg-neutral-900 disabled:bg-slate-300"
                aria-label="Iniciar navegacion"
                title="Iniciar navegacion"
              >
                <Play size={20} />
              </button>
            </div>
            {!showEditor ? (
              <button type="button" onClick={onEditRoute} className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-xs font-black text-black ring-1 ring-slate-200 transition hover:bg-slate-50">
                Editar origen, destino y consumo
              </button>
            ) : null}
          </div>
        ) : null}

        {showEditor ? (
        <div className="grid gap-1.5 rounded-[1.15rem] bg-white/90 p-2 ring-1 ring-slate-100">
          <PlaceField
            label="Origen"
            value={originQuery}
            placeholder="Detectar o escribir origen"
            icon={LocateFixed}
            disabled={!mapboxReady}
            isLoading={isSearchingOrigin}
            suggestions={originSuggestions}
            onChange={onOriginChange}
            onSelect={onOriginSelect}
            suggestionsPlacement="top"
            compact
            action={
              <button
                type="button"
                onClick={onDetectLocation}
                disabled={!mapboxReady || isLocating}
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-black text-white transition hover:bg-neutral-900 disabled:bg-slate-300"
                aria-label="Detectar origen"
                title="Detectar origen"
              >
                {isLocating ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />}
              </button>
            }
          />

          <PlaceField
            label="Destino"
            value={destinationQuery}
            placeholder="Buscar destino"
            icon={Search}
            disabled={!mapboxReady}
            isLoading={isSearchingDestination}
            suggestions={destinationSuggestions}
            onChange={onDestinationChange}
            onSelect={onDestinationSelect}
            suggestionsPlacement="top"
            compact
          />

          <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
            <NumberField label="Precio galon" value={priceGallon} onChange={setPriceGallon} compact />
            <NumberField label="Km/galon" value={autonomy} onChange={setAutonomy} compact />
            <button type="button" onClick={onCalculateRoutes} disabled={!canCalculateRoutes} className="primary-button min-h-10 self-end rounded-xl px-3 py-2 text-xs sm:px-4">
              {isRouting ? <Loader2 className="animate-spin" size={18} /> : <Route size={18} />}
              <span className="hidden min-[390px]:inline">Calcular</span>
            </button>
          </div>
        </div>
        ) : null}
      </div>
    </section>
  );
}

function RouteMiniOption({ routeItem, active, bestTraffic, priceGallon, autonomy, weather, onSelect }) {
  const metrics = getRouteMetrics(routeItem, priceGallon, autonomy);
  const activeStyles = active ? "border-slate-300 bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "border-slate-100 bg-white/80 text-slate-800";

  return (
    <button type="button" onClick={onSelect} className={`w-[10.8rem] shrink-0 snap-start rounded-2xl border p-2 text-left transition hover:border-slate-300 ${activeStyles}`}>
      <div className="mb-1 flex items-center gap-1.5">
        <div className={`grid size-6 shrink-0 place-items-center rounded-lg ${active ? "bg-black text-white" : "bg-slate-100 text-slate-500"}`}>
          <Route size={13} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.72rem] font-black">{routeItem.summary || `Ruta ${routeItem.index + 1}`}</p>
          <p className="truncate text-[0.6rem] font-bold text-slate-500">{bestTraffic ? "Menor trafico" : active ? "Seleccionada" : "Alternativa"}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 text-[0.61rem] font-black text-slate-600">
        <span className="inline-flex min-w-0 items-center gap-1">
          <Clock3 size={11} />
          <span className="truncate">{formatDuration(routeItem.durationSeconds)}</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1">
          <Gauge size={11} />
          <span className="truncate">{formatNumber.format(metrics.km)} km</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1 text-slate-950">
          <WalletCards size={11} />
          <span className="truncate">{formatCurrency.format(metrics.cost)}</span>
        </span>
      </div>
      <RouteWeatherBadge weather={weather} />
    </button>
  );
}

function RouteWeatherBadge({ weather }) {
  if (!weather || weather.status === "loading") {
    return (
      <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[0.58rem] font-black text-slate-500 ring-1 ring-slate-200">
        <Loader2 className="shrink-0 animate-spin" size={10} />
        <span className="truncate">Clima</span>
      </span>
    );
  }

  if (weather.status === "rain") {
    return (
      <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[0.58rem] font-black text-sky-700 ring-1 ring-sky-200">
        <AlertTriangle className="shrink-0" size={10} />
        <span className="truncate">{weather.label}</span>
      </span>
    );
  }

  if (weather.status === "clear") {
    return (
      <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.58rem] font-black text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="shrink-0" size={10} />
        <span className="truncate">Sin lluvia</span>
      </span>
    );
  }

  return (
    <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[0.58rem] font-black text-slate-500 ring-1 ring-slate-200">
      <AlertCircle className="shrink-0" size={10} />
      <span className="truncate">Clima N/D</span>
    </span>
  );
}

function MapModeControls({ texture, dimension, onTextureChange, onDimensionChange, fullscreen = false, embedded = false, offsetForStatus = false }) {
  if (embedded) {
    return (
      <div className="grid gap-2 text-slate-900" aria-label="Modo del mapa">
        <SegmentedMapControl
          value={texture}
          options={[
            { value: "vector", label: "Mapa" },
            { value: "texture", label: "Textura" },
          ]}
          onChange={onTextureChange}
          fullscreen={false}
        />
        <SegmentedMapControl
          value={dimension}
          options={[
            { value: "2d", label: "2D" },
            { value: "3d", label: "3D" },
          ]}
          onChange={onDimensionChange}
          fullscreen={false}
        />
      </div>
    );
  }

  const topOffsetClass = offsetForStatus ? "top-[calc(env(safe-area-inset-top)+7.15rem)]" : "top-[calc(env(safe-area-inset-top)+4.75rem)]";
  const shellClass = fullscreen
    ? "absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-30 flex flex-col gap-2 rounded-2xl bg-slate-950/90 p-1.5 text-white shadow-[0_12px_30px_rgba(2,6,23,0.55)] ring-1 ring-white/15 backdrop-blur"
    : `absolute right-3 ${topOffsetClass} z-30 flex flex-col gap-2 rounded-2xl bg-white/95 p-1.5 text-slate-900 shadow-[0_14px_36px_rgba(15,23,42,0.16)] ring-1 ring-white/80 backdrop-blur`;

  return (
    <div className={shellClass} aria-label="Modo del mapa">
      <SegmentedMapControl
        value={texture}
        options={[
          { value: "vector", label: "Mapa" },
          { value: "texture", label: "Textura" },
        ]}
        onChange={onTextureChange}
        fullscreen={fullscreen}
      />
      <SegmentedMapControl
        value={dimension}
        options={[
          { value: "2d", label: "2D" },
          { value: "3d", label: "3D" },
        ]}
        onChange={onDimensionChange}
        fullscreen={fullscreen}
      />
    </div>
  );
}

function SegmentedMapControl({ value, options, onChange, fullscreen }) {
  const inactiveClass = fullscreen ? "text-slate-200 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100";
  const activeClass = fullscreen ? "bg-white text-slate-950" : "bg-black text-white shadow-sm";

  return (
    <div className={fullscreen ? "grid grid-cols-2 gap-1 rounded-xl bg-white/10 p-1" : "grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`min-h-8 rounded-lg px-2 text-[0.68rem] font-black transition ${value === option.value ? activeClass : inactiveClass}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function MapboxSetupNotice({ isLoading }) {
  return (
    <section className="mb-4 rounded-[1.75rem] bg-amber-50 p-4 text-amber-900 shadow-sm ring-1 ring-amber-100">
      <div className="flex gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-amber-600">
          {isLoading ? <Loader2 className="animate-spin" size={21} /> : <AlertCircle size={21} />}
        </div>
        <div>
          <h2 className="font-black">{isLoading ? "Cargando mapa" : "Mapa no disponible"}</h2>
          <p className="mt-1 text-sm font-semibold leading-6">
            {isLoading ? "Preparando busqueda, rutas y trafico." : "Revisa la configuracion del token para activar busqueda, rutas y trafico."}
          </p>
        </div>
      </div>
    </section>
  );
}

function NavigationPanel({ snapshot, position, isRerouting, voiceEnabled, onToggleVoice, onStop, fullscreen = false }) {
  const speedKmh = position?.speed ? Math.round(position.speed * 3.6) : 0;

  return (
    <section className={fullscreen ? "absolute inset-x-0 bottom-0 z-20 rounded-t-[1.5rem] border-t border-white/10 bg-[#020617] text-white shadow-[0_-28px_70px_rgba(2,6,23,0.88)] ring-1 ring-black/70 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]" : "overflow-hidden rounded-[1.75rem] bg-slate-950 text-white shadow-soft"}>
      <div className={fullscreen ? "p-3 sm:p-4" : "p-4"}>
        <div className={fullscreen ? "mb-3 flex items-start justify-between gap-3" : "mb-4 flex items-start justify-between gap-3"}>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">{isRerouting ? "Recalculando" : "Navegacion"}</p>
            <h2 className={fullscreen ? "mt-1 line-clamp-2 text-lg font-black leading-tight" : "mt-1 text-xl font-black leading-tight"}>{snapshot?.currentStep?.instruction || "Esperando GPS..."}</h2>
          </div>
          <button
            type="button"
            onClick={onToggleVoice}
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-800 text-white ring-1 ring-white/15 transition hover:bg-slate-700"
            aria-label={voiceEnabled ? "Silenciar voz" : "Activar voz"}
            title={voiceEnabled ? "Silenciar voz" : "Activar voz"}
          >
            {voiceEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
        </div>

        <div className={fullscreen ? "grid grid-cols-4 gap-2" : "grid gap-2 sm:grid-cols-4"}>
          <NavigationMetric label="Maniobra" value={snapshot ? formatMeters(snapshot.distanceToManeuverMeters) : "--"} />
          <NavigationMetric label="Restante" value={snapshot ? formatMeters(snapshot.remainingMeters) : "--"} />
          <NavigationMetric label="Velocidad" value={`${speedKmh} km/h`} />
          <NavigationMetric label="Estado" value={snapshot?.offRoute ? "Fuera de ruta" : "En ruta"} />
        </div>

        {fullscreen ? (
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={onStop} className="secondary-button min-h-10 flex-1 border-white/10 bg-slate-800 py-2 text-white hover:bg-slate-700 hover:text-white">
              <Square size={16} />
              Detener
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function NavigationMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-900 p-2.5 ring-1 ring-white/12 sm:p-3">
      <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-300">{label}</p>
      <p className="mt-1 truncate text-sm font-black sm:text-base">{value}</p>
    </div>
  );
}

const ActiveNavigationCard = forwardRef(function ActiveNavigationCard({ snapshot, isNavigating, onOpen, onStop }, ref) {
  const title = isNavigating ? snapshot?.currentStep?.instruction || "Esperando ubicacion GPS" : "GPS sin seguimiento";
  const stateLabel = isNavigating ? (snapshot?.offRoute ? "Ajustando" : "En ruta") : "Revisar GPS";

  return (
    <section ref={ref} className="flex min-h-14 items-center gap-2 rounded-full bg-slate-950/95 px-2.5 py-2 text-white shadow-[0_-12px_36px_rgba(2,6,23,0.34)] ring-1 ring-white/10 backdrop-blur">
      <button
        type="button"
        onClick={onOpen}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-black text-white shadow-sm transition hover:bg-neutral-900"
        aria-label={isNavigating ? "Ver mapa de navegacion" : "Editar ruta"}
        title={isNavigating ? "Ver mapa" : "Editar ruta"}
      >
        <Navigation size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.62rem] font-black uppercase tracking-[0.16em] text-blue-200">{stateLabel}</p>
        <h2 className="truncate text-xs font-black leading-tight min-[390px]:text-sm">{title}</h2>
      </div>
      <button
        type="button"
        onClick={onStop}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20"
        aria-label={isNavigating ? "Detener navegacion" : "Expandir ruta"}
        title={isNavigating ? "Detener" : "Expandir ruta"}
      >
        <Square size={16} />
      </button>
    </section>
  );
});

function PlaceField({ label, value, placeholder, icon: Icon, disabled, isLoading, suggestions, onChange, onSelect, action, compact = false, suggestionsPlacement = "bottom" }) {
  const suggestionsClass =
    suggestionsPlacement === "top"
      ? "absolute inset-x-0 bottom-full z-40 mb-2 max-h-72 overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200"
      : "absolute inset-x-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200";

  return (
    <div className="relative">
      <label className="block">
        <span className={compact ? "mb-1 block text-[0.65rem] font-black uppercase tracking-wide text-slate-500" : "label mb-1 block"}>{label}</span>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className={compact ? "input min-h-10 rounded-xl py-2 pl-9 pr-3 text-xs" : "input pl-10"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} />
            {isLoading ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={18} /> : null}
          </div>
          {action}
        </div>
      </label>

      {suggestions.length ? (
        <div className={suggestionsClass}>
          {suggestions.map((place) => (
            <button key={place.id} type="button" onClick={() => onSelect(place)} className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50">
              <MapPinned className="mt-0.5 shrink-0 text-slate-700" size={18} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-slate-950">{polishSpanishText(getPlaceTitle(place))}</span>
                <span className="block truncate text-xs font-semibold text-slate-500">{polishSpanishText(getPlaceSubtitle(place))}</span>
                <span className="mt-1 flex flex-wrap gap-1">
                  {getPlaceBadges(place).map((badge) => (
                    <span key={badge} className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide text-slate-500">
                      {polishSpanishText(badge)}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getPlaceTitle(place) {
  return place?.name || place?.label || "Ubicacion";
}

function getPlaceSubtitle(place) {
  const title = normalizeText(getPlaceTitle(place));
  const candidates = [place?.address, place?.label, place?.placeFormatted, place?.city].filter(Boolean);
  const subtitle = candidates.find((candidate) => normalizeText(candidate) !== title);
  return subtitle || place?.typeLabel || "Seleccionar ubicacion";
}

function getPlaceBadges(place) {
  return [
    Number.isFinite(place?.distanceMeters) ? formatMeters(place.distanceMeters) : "",
    place?.neighborhood || place?.city || "",
    place?.category || place?.typeLabel || "",
  ].filter(Boolean).slice(0, 3);
}

function NumberField({ label, value, onChange, compact = false }) {
  return (
    <label className="block">
      <span className={compact ? "mb-1 block text-[0.65rem] font-black uppercase tracking-wide text-slate-500" : "label mb-1 block"}>{label}</span>
      <input className={compact ? "input min-h-10 rounded-xl px-3 py-2 text-xs" : "input"} value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" placeholder="0" />
    </label>
  );
}

function getDefaultCenter(vehicle, user) {
  const city = normalizeText(vehicle?.city || user?.city || "Medellin");
  return cityCenters[city] || cityCenters.medellin;
}

function getPicoVehicleProfile(vehicle, user) {
  return {
    city: vehicle?.city || vehicle?.ciudad || user?.city || user?.ciudad || "",
    plate: vehicle?.plate || vehicle?.placa || "",
    vehicleType: vehicle?.type || vehicle?.tipoVehiculo || vehicle?.vehicleType || "particular",
  };
}

function getStandardMapConfig(show3dObjects) {
  return {
    basemap: {
      lightPreset: "day",
      show3dObjects,
      showPlaceLabels: true,
      showPointOfInterestLabels: true,
      showRoadLabels: true,
      showTransitLabels: true,
    },
  };
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function rankRoutes(routeItems) {
  return [...routeItems].sort((left, right) => {
    const leftScore = getTrafficDelay(left) * 2 + left.durationSeconds;
    const rightScore = getTrafficDelay(right) * 2 + right.durationSeconds;
    return leftScore - rightScore;
  });
}

function getBestTrafficRouteId(routeItems) {
  if (!routeItems.length) return "";
  return [...routeItems].sort((left, right) => getTrafficDelay(left) - getTrafficDelay(right) || left.durationSeconds - right.durationSeconds)[0].id;
}

function getTrafficDelay(routeItem) {
  if (!routeItem) return 0;
  if (routeItem.durationTypicalSeconds) {
    return Math.max(0, routeItem.durationSeconds - routeItem.durationTypicalSeconds);
  }
  return Math.max(0, routeItem.trafficScore * 60);
}

function getRouteMetrics(routeItem, priceGallon, autonomy) {
  const km = Number(routeItem?.distanceMeters || 0) / 1000;
  const cleanAutonomy = parseNumber(autonomy);
  const cleanPrice = parseNumber(priceGallon);
  const gallons = cleanAutonomy ? km / cleanAutonomy : 0;

  return {
    km,
    gallons,
    cost: gallons * cleanPrice,
    costPerKm: cleanAutonomy ? cleanPrice / cleanAutonomy : 0,
  };
}

function parseNumber(value) {
  const text = String(value || "").replace(/[^\d,.-]/g, "");
  if (!text) return 0;
  if (text.includes(",")) {
    return Number(text.replace(/\./g, "").replace(",", ".")) || 0;
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    return Number(text.replace(/\./g, "")) || 0;
  }
  return Number(text) || 0;
}

function hasCoordinates(value) {
  return Number.isFinite(value?.lng) && Number.isFinite(value?.lat);
}

function formatDuration(seconds) {
  const totalMinutes = Math.max(0, Math.round(Number(seconds || 0) / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

function getNavigationProgress(route, position) {
  if (!route?.geometry?.coordinates?.length || !hasCoordinates(position)) return null;

  const routeCoordinates = route.geometry.coordinates;
  const nearest = findNearestRoutePoint(routeCoordinates, position);
  const traveledMeters = getDistanceAlongRoute(routeCoordinates, nearest.index);
  const remainingMeters = Math.max(0, Number(route.distanceMeters || 0) - traveledMeters);
  const currentStep = getCurrentNavigationStep(route.steps || [], traveledMeters);
  const distanceToManeuverMeters = currentStep ? Math.max(0, currentStep.endMeters - traveledMeters) : remainingMeters;

  return {
    currentStep,
    distanceToManeuverMeters,
    nearestRouteIndex: nearest.index,
    nearestDistanceMeters: nearest.distanceMeters,
    offRoute: nearest.distanceMeters > 90,
    remainingMeters,
    traveledMeters,
    progress: route.distanceMeters ? Math.min(1, traveledMeters / route.distanceMeters) : 0,
    arrived: remainingMeters < 45,
  };
}

function getRemainingRouteGeometry(routeItem, progress, position) {
  const coordinates = routeItem?.geometry?.coordinates || [];
  if (coordinates.length < 2) return routeItem?.geometry || { type: "LineString", coordinates: [] };

  const nearestIndex = clampIndex(progress?.nearestRouteIndex, coordinates.length - 1);
  const nextIndex = Math.min(nearestIndex + 1, coordinates.length - 1);
  const startCoordinate = hasCoordinates(position) ? [position.lng, position.lat] : coordinates[nearestIndex];
  const remainingCoordinates = compactRouteCoordinates([startCoordinate, ...coordinates.slice(nextIndex)]);

  if (remainingCoordinates.length >= 2) {
    return {
      ...routeItem.geometry,
      coordinates: remainingCoordinates,
    };
  }

  return {
    ...routeItem.geometry,
    coordinates: coordinates.slice(-2),
  };
}

function compactRouteCoordinates(coordinates) {
  return coordinates.filter((coordinate, index, list) => {
    if (!isValidRouteCoordinate(coordinate)) return false;
    const previous = list[index - 1];
    return !previous || Number(previous[0]) !== Number(coordinate[0]) || Number(previous[1]) !== Number(coordinate[1]);
  });
}

function findNearestRoutePoint(routeCoordinates, position) {
  return routeCoordinates.reduce(
    (best, coordinate, index) => {
      const distanceMeters = getDistanceMeters({ lng: coordinate[0], lat: coordinate[1] }, position);
      return distanceMeters < best.distanceMeters ? { index, distanceMeters } : best;
    },
    { index: 0, distanceMeters: Number.POSITIVE_INFINITY },
  );
}

function getDistanceAlongRoute(routeCoordinates, endIndex) {
  let total = 0;
  for (let index = 1; index <= endIndex; index += 1) {
    total += getDistanceMeters({ lng: routeCoordinates[index - 1][0], lat: routeCoordinates[index - 1][1] }, { lng: routeCoordinates[index][0], lat: routeCoordinates[index][1] });
  }
  return total;
}

function getCurrentNavigationStep(steps, traveledMeters) {
  let cursor = 0;

  for (const step of steps) {
    const endMeters = cursor + Number(step.distanceMeters || 0);
    if (traveledMeters <= endMeters || step.index === steps.length - 1) {
      return {
        ...step,
        startMeters: cursor,
        endMeters,
      };
    }
    cursor = endMeters;
  }

  return null;
}

function getRouteBearingAtIndex(routeItem, routeIndex) {
  const coordinates = routeItem?.geometry?.coordinates || [];
  if (coordinates.length < 2) return null;

  const startIndex = clampIndex(routeIndex, coordinates.length - 2);

  for (let index = startIndex; index < coordinates.length - 1; index += 1) {
    const bearing = getBearingBetweenCoordinates(coordinates[index], coordinates[index + 1]);
    if (Number.isFinite(bearing)) return bearing;
  }

  for (let index = startIndex; index > 0; index -= 1) {
    const bearing = getBearingBetweenCoordinates(coordinates[index - 1], coordinates[index]);
    if (Number.isFinite(bearing)) return bearing;
  }

  return null;
}

function getBearingBetweenCoordinates(fromCoordinate, toCoordinate) {
  if (!isValidRouteCoordinate(fromCoordinate) || !isValidRouteCoordinate(toCoordinate)) return null;

  const fromLat = toRadians(fromCoordinate[1]);
  const toLat = toRadians(toCoordinate[1]);
  const deltaLng = toRadians(toCoordinate[0] - fromCoordinate[0]);
  const y = Math.sin(deltaLng) * Math.cos(toLat);
  const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng);
  const bearing = Math.atan2(y, x) * (180 / Math.PI);

  return normalizeBearing(bearing);
}

function getNavigationCameraOffset(map) {
  const height = map?.getContainer?.()?.clientHeight || window.innerHeight || 0;
  const offsetY = Math.round(Math.min(170, Math.max(84, height * 0.2)));
  return [0, offsetY];
}

function normalizeBearing(value) {
  return ((Number(value) % 360) + 360) % 360;
}

function clampIndex(value, maxIndex) {
  const index = Number.isFinite(value) ? Math.round(value) : 0;
  return Math.max(0, Math.min(index, Math.max(0, maxIndex)));
}

function isValidRouteCoordinate(coordinate) {
  return Array.isArray(coordinate) && Number.isFinite(Number(coordinate[0])) && Number.isFinite(Number(coordinate[1]));
}

function getDistanceMeters(left, right) {
  if (!hasCoordinates(left) || !hasCoordinates(right)) return 0;

  const earthRadiusMeters = 6371000;
  const leftLat = toRadians(left.lat);
  const rightLat = toRadians(right.lat);
  const deltaLat = toRadians(right.lat - left.lat);
  const deltaLng = toRadians(right.lng - left.lng);
  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(leftLat) * Math.cos(rightLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function formatMeters(value) {
  const meters = Number(value || 0);
  if (meters >= 1000) return `${formatNumber.format(meters / 1000)} km`;
  return `${Math.max(0, Math.round(meters))} m`;
}
