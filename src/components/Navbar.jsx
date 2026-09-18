import React, { useState, useEffect } from "react";

import {
  Link,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  ShoppingCart,
  MapPin,
  ChevronDown,
  Home,
  ShoppingBag,
  Package,
  Search,
  Mic,
  X,
  Heart,
  User,
  Truck,
  LogOut,
  LocateFixed,
  MapPinned,
  Bell,
} from "lucide-react";
import { TbCategory } from "react-icons/tb";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/wishlistContext";
import { getData } from "../context/DataContext";
import LocationMap from "../components/LocationMap";
import { toast } from "sonner";
import NotificationBell from "./NotificationBell";


/* =====================================================
   NAVIGATION
===================================================== */

const NAV_LINKS = [
  {
    name: "Shop",
    path: "/products",
    icon: <ShoppingBag size={17} />,
  },
];

const BOTTOM_LINKS = [
  {
    name: "Home",
    path: "/",
    icon: Home,
  },
  // {
  //   name: "Shop",
  //   path: "/products",
  //   icon: ShoppingBag,
  // },
  {
    name: "Categories",
    path: "/categorypage",
    icon: TbCategory,
  },
  // {
  //   name: "Track",
  //   path: "/track-order",
  //   icon: MapPin,
  // },
];


/* =====================================================
   HELPER
===================================================== */

const clean = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "";
  }

  return String(value).trim();
};


/* =====================================================
   LOCATION LABEL
===================================================== */

const buildLocationLabel = (data) => {
  if (!data) {
    return "Set location";
  }

  /*
   * Prefer Google's/provider's complete formatted
   * address when available.
   */
  if (
    data.formattedAddress &&
    data.formattedAddress.trim()
  ) {
    return data.formattedAddress;
  }

  /*
   * Otherwise construct a detailed address.
   */

  const parts = [
    data.plotNumber,
    data.houseNumber,
    data.buildingName,
    data.flatNumber,
    data.floor,
    data.road,
    data.street,
    data.landmark,
    data.area,
    data.locality,
    data.suburb,
    data.city,
    data.district,
    data.state,
    data.pincode,
  ]
    .map(clean)
    .filter(Boolean);

  if (parts.length === 0) {
    return "Set location";
  }

  return parts.join(", ");
};


/* =====================================================
   NORMALIZE NOMINATIM RESULT
===================================================== */

const normalizeSearchLocation = (
  result
) => {
  const addr = result?.address || {};

  const latitude = Number(result?.lat);
  const longitude = Number(result?.lon);

  return {
    latitude,
    longitude,

    /*
     * GeoJSON:
     * [longitude, latitude]
     */
    location: {
      type: "Point",
      coordinates: [
        longitude,
        latitude,
      ],
    },

    formattedAddress:
      result?.display_name || "",

    address:
      result?.display_name || "",

    plotNumber:
      addr.plot_number ||
      addr.plot ||
      "",

    houseNumber:
      addr.house_number ||
      "",

    buildingName:
      addr.building ||
      addr.building_name ||
      "",

    flatNumber:
      addr.unit ||
      addr.flat ||
      "",

    floor:
      addr.floor ||
      "",

    road:
      addr.road ||
      "",

    street:
      addr.street ||
      addr.road ||
      "",

    landmark:
      addr.landmark ||
      "",

    neighbourhood:
      addr.neighbourhood ||
      "",

    area:
      addr.quarter ||
      addr.residential ||
      addr.subdivision ||
      "",

    locality:
      addr.locality ||
      addr.city_district ||
      "",

    suburb:
      addr.suburb ||
      "",

    city:
      addr.city ||
      addr.town ||
      addr.village ||
      "",

    district:
      addr.county ||
      addr.district ||
      "",

    stateDistrict:
      addr.state_district ||
      "",

    state:
      addr.state ||
      "",

    pincode:
      addr.postcode ||
      "",

    postalCode:
      addr.postcode ||
      "",

    country:
      addr.country ||
      "",

    countryCode:
      (
        addr.country_code ||
        ""
      ).toUpperCase(),

    placeName:
      result?.name ||
      "",

    osmType:
      result?.osm_type ||
      "",

    osmId:
      result?.osm_id ||
      null,

    placeId:
      result?.place_id ||
      null,
  };
};


/* =====================================================
   LOCATION SEARCH SKELETON
   Mobile-first modern skeleton for location results
===================================================== */

const LocationSearchSkeleton = () => {
  return (
    <div className="odikart-location-skeleton" aria-hidden="true">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="odikart-location-skeleton-item"
        >
          <div className="odikart-skeleton-icon" />

          <div className="odikart-skeleton-content">
            <div className="odikart-skeleton-line odikart-skeleton-title" />
            <div className="odikart-skeleton-line odikart-skeleton-address" />
            <div className="odikart-skeleton-line odikart-skeleton-small" />
          </div>

          <div className="odikart-skeleton-arrow" />
        </div>
      ))}
    </div>
  );
};


/* =====================================================
   NAVBAR
===================================================== */

export default function Navbar({
  location,
  onLocationChange,
}) {
  const {
    isOpen,
    onOpen,
    onClose,
  } = useDisclosure();


  const [showNav, setShowNav] =
    useState(true);

  // Independent visibility state for the mobile bottom navbar.
  const [showBottomNav, setShowBottomNav] =
    useState(true);

  const [scrolled, setScrolled] =
    useState(false);

  const [isListening, setIsListening] =
    useState(false);

  const [area, setArea] =
    useState("");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [
    recentSearches,
    setRecentSearches,
  ] = useState([]);

  /* =====================================================
     LOCATION SEARCH / PICKER
  ===================================================== */

  const [locationResults, setLocationResults] =
    useState([]);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [currentLocationLoading, setCurrentLocationLoading] =
    useState(false);

  const [mapOpen, setMapOpen] =
    useState(false);

  /*
   * Local copy of selected location.
   *
   * This makes the navbar update immediately
   * after the user selects a map location.
   */
  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState(location || null);

  const { cartItem } = useCart();

  const { wishlist } =
    useWishlist();

  const navigate =
    useNavigate();

  const routerLocation =
    useLocation();

  const {
    search,
    setSearch,
  } = getData();

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL;

  /* =====================================================
     AUTH USER
  ===================================================== */

  const [authUser, setAuthUser] =
    useState(null);


  /* =====================================================
     KEEP LOCAL LOCATION IN SYNC
  ===================================================== */

  useEffect(() => {
    if (location) {
      setSelectedLocation(location);
    }
  }, [location]);


  /* =====================================================
     FETCH AUTH USER
  ===================================================== */

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) return;

    const fetchUser = async () => {
      try {
        const res =
          await fetch(
            `${BACKEND_URL}/api/auth/me`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await res.json();

        if (data.success) {
          setAuthUser(data.user);
        }
      } catch (error) {
        console.error(
          "❌ AUTH USER ERROR:",
          error
        );
      }
    };

    fetchUser();
  }, [BACKEND_URL]);


  /* =====================================================
     LOGOUT
  ===================================================== */

  const logout = () => {
    localStorage.removeItem(
      "token"
    );

    toast.success(
      "Logged out"
    );

    window.location.href =
      "/sign-in";
  };


  /* =====================================================
     NAVBAR SCROLL
  ===================================================== */

  useEffect(() => {
    let lastScrollY = Math.max(window.scrollY, 0);
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(() => {
        const currentScrollY = Math.max(
          window.scrollY,
          0
        );

        const difference =
          currentScrollY - lastScrollY;

        // Always show both navbars near the top.
        if (currentScrollY <= 80) {
          setShowNav(true);
          setShowBottomNav(true);
        }

        // Require a meaningful downward movement
        // before hiding the navigation.
        else if (difference > 8) {
          setShowNav(false);
          setShowBottomNav(false);
        }

        // Require a meaningful upward movement
        // before showing the navigation again.
        else if (difference < -8) {
          setShowNav(true);
          setShowBottomNav(true);
        }

        setScrolled(currentScrollY > 10);

        lastScrollY = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);


  /* =====================================================
     VOICE SEARCH
  ===================================================== */

  const handleVoiceSearch =
    () => {
      const SR =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      if (!SR) {
        toast.error(
          "Speech recognition not supported"
        );

        return;
      }

      const rec =
        new SR();

      rec.continuous =
        false;

      rec.lang =
        "en-US";

      rec.interimResults =
        false;

      const tid =
        toast.loading(
          "Listening… speak now"
        );

      setIsListening(
        true
      );

      rec.start();

      rec.onresult =
        (e) => {
          const t =
            e.results[0][0]
              .transcript;

          setSearch(t);

          toast.dismiss(
            tid
          );

          toast.success(
            `Searching: "${t}"`
          );

          navigate(
            "/products"
          );
        };

      rec.onend =
        () => {
          setIsListening(
            false
          );

          toast.dismiss(
            tid
          );
        };

      rec.onerror =
        () => {
          setIsListening(
            false
          );

          toast.dismiss(
            tid
          );

          toast.error(
            "Not recognized."
          );
        };
    };


  /* =====================================================
     KEYBOARD SEARCH
  ===================================================== */

  useEffect(() => {
    const handleKeyDown =
      (e) => {
        if (
          (e.metaKey ||
            e.ctrlKey) &&
          e.key.toLowerCase() ===
            "k"
        ) {
          e.preventDefault();

          setSearchOpen(
            true
          );
        }

        if (
          e.key ===
          "Escape"
        ) {
          setSearchOpen(
            false
          );
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, []);


  const openSearchPage = () => {
    setSearchOpen(false);
    navigate("/search");
  };

  /* =====================================================
     PRODUCT SEARCH
  ===================================================== */

  const handleSearchSubmit =
    (query) => {
      if (
        !query.trim()
      ) {
        return;
      }

      setRecentSearches(
        (prev) => {
          const filtered =
            prev.filter(
              (s) =>
                s !== query
            );

          return [
            query,
            ...filtered,
          ].slice(0, 5);
        }
      );

      setSearch(
        query
      );

      setSearchOpen(
        false
      );

      navigate(
        "/products"
      );
    };


  /* =====================================================
     SEARCH LOCATION
  ===================================================== */

  /*
   * Same Nominatim request used by the React Native app:
   * q + format=jsonv2 + addressdetails=1 +
   * limit=8 + countrycodes=in
   */
  const searchRealLocations = async (query) => {
    const cleanQuery = query.trim();

    if (cleanQuery.length < 2) {
      setLocationResults([]);
      setLocationLoading(false);
      return [];
    }

    try {
      setLocationLoading(true);

      const url =
        "https://nominatim.openstreetmap.org/search" +
        `?q=${encodeURIComponent(cleanQuery)}` +
        "&format=jsonv2" +
        "&addressdetails=1" +
        "&limit=8" +
        "&countrycodes=in";

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Location +failed: ${response.status}`
        );
      }

      const data = await response.json();

      const results = Array.isArray(data)
        ? data
        : [];

      setLocationResults(results);

      return results;
    } catch (error) {
      console.error(
        "LOCATION SEARCH ERROR:",
        error
      );

      setLocationResults([]);
      return [];
    } finally {
      setLocationLoading(false);
    }
  };

  /*
   * Same 500ms debounce used by the React Native app.
   */
  useEffect(() => {
    if (!isOpen) return;

    const cleanQuery = area.trim();

    if (cleanQuery.length < 2) {
      setLocationResults([]);
      setLocationLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      searchRealLocations(cleanQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [area, isOpen]);

  const selectLocationResult = (result) => {
    const exactLocation =
      normalizeSearchLocation(result);

    setSelectedLocation(exactLocation);

    if (
      typeof onLocationChange ===
      "function"
    ) {
      onLocationChange(
        exactLocation.latitude,
        exactLocation.longitude,
        exactLocation
      );
    }

    setArea("");
    setLocationResults([]);
    setMapOpen(false);

    toast.success(
      "Delivery location updated"
    );

    onClose();
  };

  const handleAreaSearch = async () => {
    const query = area.trim();

    if (!query) {
      toast.warning(
        "Please enter a location"
      );
      return;
    }

    const tid = toast.loading(
      "Searching location..."
    );

    try {
      const results =
        await searchRealLocations(query);

      if (
        !results ||
        results.length === 0
      ) {
        toast.dismiss(tid);

        toast.error(
          "Location not found. Try a more specific address."
        );

        return;
      }

      toast.dismiss(tid);
      selectLocationResult(results[0]);
    } catch (error) {
      toast.dismiss(tid);

      console.error(
        "❌ LOCATION SEARCH ERROR:",
        error
      );

      toast.error(
        "Unable to search location"
      );
    }
  };


  /* =====================================================
     REVERSE GEOCODE
  ===================================================== */

const reverseGeocode = async (lat, lng) => {
  try {
    const latitude = Number(lat);
    const longitude = Number(lng);

    console.log("📍 EXACT USER LOCATION");
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);

    const url =
      "https://nominatim.openstreetmap.org/reverse" +
      `?format=jsonv2` +
      `&lat=${latitude}` +
      `&lon=${longitude}` +
      `&zoom=18` +
      `&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(
        `Reverse geocoding failed: ${res.status}`
      );
    }

    const result = await res.json();
    const addr = result?.address || {};

    /*
     * GPS coordinates are the EXACT location.
     * Address is only the human-readable representation.
     */
    const exactLocation = {
      latitude,
      longitude,

      location: {
        type: "Point",
        coordinates: [
          longitude,
          latitude,
        ],
      },

      formattedAddress:
        result?.display_name || "",

      address:
        result?.display_name || "",

      plotNumber:
        addr.plot_number ||
        addr.plot ||
        "",

      houseNumber:
        addr.house_number ||
        "",

      buildingName:
        addr.building ||
        addr.building_name ||
        "",

      flatNumber:
        addr.unit ||
        addr.flat ||
        "",

      floor:
        addr.floor ||
        "",

      road:
        addr.road ||
        "",

      street:
        addr.street ||
        addr.road ||
        "",

      landmark:
        addr.landmark ||
        "",

      neighbourhood:
        addr.neighbourhood ||
        "",

      area:
        addr.quarter ||
        addr.residential ||
        addr.subdivision ||
        "",

      locality:
        addr.locality ||
        addr.city_district ||
        "",

      suburb:
        addr.suburb ||
        "",

      city:
        addr.city ||
        addr.town ||
        addr.village ||
        "",

      district:
        addr.county ||
        addr.district ||
        "",

      stateDistrict:
        addr.state_district ||
        "",

      state:
        addr.state ||
        "",

      pincode:
        addr.postcode ||
        "",

      country:
        addr.country ||
        "",

      countryCode:
        (
          addr.country_code ||
          ""
        ).toUpperCase(),

      placeName:
        result?.name ||
        "",

      osmType:
        result?.osm_type ||
        "",

      osmId:
        result?.osm_id ||
        null,

      placeId:
        result?.place_id ||
        null,
    };

    console.log(
      "================================"
    );

    console.log(
      "📍 EXACT LOCATION SELECTED"
    );

    console.log({
      latitude:
        exactLocation.latitude,

      longitude:
        exactLocation.longitude,

      address:
        exactLocation.formattedAddress,

      house:
        exactLocation.houseNumber,

      road:
        exactLocation.road,

      area:
        exactLocation.neighbourhood ||
        exactLocation.area,

      city:
        exactLocation.city,

      district:
        exactLocation.district,

      state:
        exactLocation.state,

      pincode:
        exactLocation.pincode,
    });

    console.log(
      "================================"
    );

    setSelectedLocation(
      exactLocation
    );

    if (
      typeof onLocationChange ===
      "function"
    ) {
      onLocationChange(
        latitude,
        longitude,
        exactLocation
      );
    }

    return exactLocation;

  } catch (error) {
    console.error(
      "❌ REVERSE GEOCODING ERROR:",
      error
    );

    /*
     * Even when address lookup fails,
     * NEVER lose the exact GPS coordinates.
     */
    const fallback = {
      latitude: Number(lat),
      longitude: Number(lng),

      location: {
        type: "Point",

        coordinates: [
          Number(lng),
          Number(lat),
        ],
      },

      formattedAddress:
        `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`,
    };

    setSelectedLocation(fallback);

    if (
      typeof onLocationChange ===
      "function"
    ) {
      onLocationChange(
        fallback.latitude,
        fallback.longitude,
        fallback
      );
    }

    return fallback;
  }
};


  /* =====================================================
     USE MY LOCATION
  ===================================================== */

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        "Geolocation not supported"
      );
      return;
    }

    setCurrentLocationLoading(true);

    const tid = toast.loading(
      "Getting your exact location..."
    );

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat =
            position.coords.latitude;

          const lng =
            position.coords.longitude;

          console.log(
            "================================="
          );
          console.log(
            "📍 DEVICE GPS LOCATION"
          );
          console.log(
            "Latitude:",
            lat
          );
          console.log(
            "Longitude:",
            lng
          );
          console.log(
            "Accuracy:",
            position.coords.accuracy,
            "meters"
          );
          console.log(
            "================================="
          );

          await reverseGeocode(
            lat,
            lng
          );

          toast.dismiss(tid);

          toast.success(
            "Exact location detected"
          );

          setArea("");
          setLocationResults([]);
          setMapOpen(false);

          onClose();
        } catch (error) {
          toast.dismiss(tid);

          console.error(
            "❌ GPS LOCATION ERROR:",
            error
          );

          toast.error(
            "Unable to detect location"
          );
        } finally {
          setCurrentLocationLoading(false);
        }
      },
      (error) => {
        toast.dismiss(tid);

        console.error(
          "❌ GEOLOCATION ERROR:",
          error
        );

        toast.error(
          "Failed: " + error.message
        );

        setCurrentLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };


  /* =====================================================
     CURRENT LOCATION LABEL
  ===================================================== */

  const locationLabel =
    buildLocationLabel(
      selectedLocation ||
        location
    );


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      <style>{`
        @keyframes odikartNavIn {
          from { opacity: 0; transform: translateY(-14px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes odikartGlow {
          0%, 100% { opacity: .35; transform: scale(.9); }
          50% { opacity: .8; transform: scale(1.05); }
        }
        @keyframes odikartDockIn {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes odikartSearchFocus {
          0%, 100% { box-shadow: 0 8px 25px rgba(15,23,42,.05); }
          50% { box-shadow: 0 14px 38px rgba(79,70,229,.12); }
        }
        /* =====================================================
           LOCATION SEARCH SKELETON
           Mobile-first + shimmer + stagger animation
        ===================================================== */

        @keyframes odikartSkeletonShimmer {
          0% {
            background-position: -450px 0;
          }
          100% {
            background-position: 450px 0;
          }
        }

        @keyframes odikartSkeletonItemIn {
          from {
            opacity: 0;
            transform: translateY(7px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .odikart-location-skeleton {
          padding: 7px;
          background: linear-gradient(180deg, #ffffff 0%, #fafbff 100%);
        }

        .odikart-location-skeleton-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 66px;
          padding: 11px 10px;
          margin-bottom: 3px;
          border-radius: 18px;
          animation: odikartSkeletonItemIn .4s cubic-bezier(.22,1,.36,1) both;
        }

        .odikart-location-skeleton-item:last-child {
          margin-bottom: 0;
        }

        .odikart-location-skeleton-item:nth-child(1) {
          animation-delay: 0ms;
        }

        .odikart-location-skeleton-item:nth-child(2) {
          animation-delay: 70ms;
        }

        .odikart-location-skeleton-item:nth-child(3) {
          animation-delay: 140ms;
        }

        .odikart-skeleton-icon,
        .odikart-skeleton-line,
        .odikart-skeleton-arrow {
          background: linear-gradient(
            90deg,
            #edf0f6 0%,
            #f7f8fb 35%,
            #ffffff 50%,
            #f7f8fb 65%,
            #edf0f6 100%
          );
          background-size: 450px 100%;
          animation: odikartSkeletonShimmer 1.45s ease-in-out infinite;
        }

        .odikart-skeleton-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border-radius: 13px;
        }

        .odikart-skeleton-content {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .odikart-skeleton-line {
          height: 8px;
          border-radius: 999px;
        }

        .odikart-skeleton-title {
          width: 42%;
          height: 10px;
        }

        .odikart-skeleton-address {
          width: 88%;
        }

        .odikart-skeleton-small {
          width: 62%;
        }

        .odikart-skeleton-arrow {
          width: 15px;
          height: 15px;
          flex: 0 0 15px;
          border-radius: 5px;
        }

        @media (min-width: 641px) {
          .odikart-location-skeleton {
            padding: 8px;
          }

          .odikart-location-skeleton-item {
            min-height: 70px;
            padding: 12px;
            gap: 12px;
          }

          .odikart-skeleton-icon {
            width: 42px;
            height: 42px;
            flex-basis: 42px;
            border-radius: 14px;
          }

          .odikart-skeleton-title {
            width: 34%;
          }

          .odikart-skeleton-address {
            width: 82%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .odikart-location-skeleton-item,
          .odikart-skeleton-icon,
          .odikart-skeleton-line,
          .odikart-skeleton-arrow {
            animation: none !important;
          }
        }

        .odikart-navbar-shell { animation: odikartNavIn .45s cubic-bezier(.22,1,.36,1) both; }
        .odikart-search:hover { animation: odikartSearchFocus 1.6s ease-in-out infinite; }
        .odikart-location-dot::after {
          content: ''; position: absolute; inset: -4px; border-radius: 9999px;
          background: rgba(99,102,241,.16); animation: odikartGlow 2s ease-in-out infinite;
          pointer-events: none;
        }
        .odikart-icon-btn { transition: transform .22s cubic-bezier(.22,1,.36,1), background .22s ease, box-shadow .22s ease; }
        .odikart-icon-btn:hover { transform: translateY(-2px) scale(1.035); box-shadow: 0 10px 22px rgba(79,70,229,.10); }
        .odikart-icon-btn:active { transform: translateY(0) scale(.96); }
        .odikart-bottom-item { transition: transform .22s cubic-bezier(.22,1,.36,1), color .2s ease; }
        .odikart-bottom-item:hover { transform: translateY(-3px); }
        .odikart-bottom-item:active { transform: scale(.94); }
        @media (prefers-reduced-motion: reduce) {
          .odikart-navbar-shell, .odikart-search, .odikart-location-dot::after { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* =================================================
          SEARCH OVERLAY
      ================================================= */}

      {searchOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-sm"
            onClick={() =>
              setSearchOpen(false)
            }
          />

          <div className="fixed inset-0 z-[101] flex items-start justify-center px-3 pt-[8vh] sm:px-4">
            <div
              className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.18)]"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="flex items-center gap-2 border-b border-slate-200 p-3">
                <Search
                  size={18}
                  className="shrink-0 text-slate-500"
                />

                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      handleSearchSubmit(
                        search
                      );
                    }
                  }}
                  placeholder="Search products, brands, categories..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                />

                <span className="hidden h-6 min-w-8 items-center justify-center rounded-md border border-slate-200 bg-white px-1.5 text-[9px] font-extrabold text-slate-500 shadow-sm sm:flex">
                  ESC
                </span>

                <button
                  aria-label="Close search"
                  onClick={() =>
                    setSearchOpen(
                      false
                    )
                  }
                  className="odikart-icon-btn relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[66vh] overflow-y-auto p-4">
                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
                    <Mic size={12} />
                    Voice search
                  </div>

                  <button
                    onClick={
                      handleVoiceSearch
                    }
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      isListening
                        ? "border-indigo-200 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isListening
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Mic
                        size={17}
                        className={
                          isListening
                            ? "animate-pulse text-white"
                            : "text-slate-500"
                        }
                      />
                    </div>

                    <div className="flex flex-col items-start">
                      <span className="text-[12px] font-semibold text-slate-900">
                        {isListening
                          ? "Listening..."
                          : "Tap to speak"}
                      </span>

                      <span className="text-[10px] text-slate-500">
                        Search using your voice
                      </span>
                    </div>
                  </button>
                </div>

                {recentSearches.length >
                  0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
                      <Search
                        size={12}
                      />
                      Recent searches
                    </div>

                    {recentSearches.map(
                      (
                        item,
                        idx
                      ) => (
                        <div
                          key={idx}
                          className="mb-2 flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <span className="text-indigo-600">
                              <Search
                                size={
                                  14
                                }
                              />
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleSearchSubmit(
                                item
                              )
                            }
                            className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-slate-900"
                          >
                            {item}
                          </button>

                          <button
                            type="button"
                            aria-label={`Remove ${item} from recent searches`}
                            onClick={() =>
                              setRecentSearches(
                                (
                                  prev
                                ) =>
                                  prev.filter(
                                    (
                                      s
                                    ) =>
                                      s !==
                                      item
                                  )
                              )
                            }
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          >
                            <X
                              size={
                                13
                              }
                            />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}


      {/* =================================================
          NAVBAR
      ================================================= */}

      <header
        className={`fixed inset-x-0 top-0 z-40 px-2 pt-2 transition-transform duration-300 sm:px-3 ${
          showNav ? "translate-y-0" : "-translate-y-full"
        }`}
      >
      <div
  className={`mx-auto max-w-7xl overflow-visible rounded-[22px] border backdrop-blur-2xl transition-all duration-300 ${
            scrolled
              ? "border-indigo-100/80 bg-white/95 shadow-[0_14px_40px_rgba(15,23,42,.10)]"
              : "border-slate-200/70 bg-white/92 shadow-[0_8px_28px_rgba(15,23,42,.07)]"
          }`}
        >
          <div className="flex min-h-[64px] items-center gap-2 px-2.5 py-2 sm:px-4">
            {/* <Link
              to="/"
              className="group flex h-12 w-[78px] shrink-0 items-center justify-center overflow-hidden md:w-[105px]"
            >
              <img
                src="/logo.png"
                alt="Odikart"
                className="max-h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link> */}

            {/* <div className="h-10 w-px shrink-0 bg-slate-200" /> */}

            <button
              type="button"
              aria-label={`Choose delivery location: ${locationLabel}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className="group flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-2 py-1.5 text-left transition-all duration-200 hover:bg-slate-50 focus:outline-none"
            >
              <span className="flex shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                <MapPin size={18} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[8px] font-bold uppercase tracking-[.08em] text-slate-400">
                  Deliver to
                </span>

                <span className="mt-0.5 block max-w-[190px] truncate text-[10px] font-extrabold text-slate-800 sm:max-w-[300px]">
                  {locationLabel}
                </span>
              </span>

              <ChevronDown
                size={15}
                className="shrink-0 text-slate-400 transition group-hover:text-indigo-600"
              />
            </button>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={openSearchPage}
                aria-label="Search products"
                className="odikart-icon-btn flex h-10 w-10 items-center justify-center rounded-xl  bg-white/80 text-slate-600 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none"
              >
                <Search size={20} />
              </button>

              <NotificationBell />

              <Link
                to="/cart"
                aria-label="Cart"
                className="odikart-icon-btn relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-slate-600 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              >
                <ShoppingCart size={20} />

                {cartItem.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-indigo-600 px-1 text-[8px] font-black text-white shadow-md">
                    {cartItem.length}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* <div className="px-3 pb-3 sm:px-4 sm:pb-3.5">
            <button
              type="button"
              onClick={openSearchPage}
              className="group flex h-[54px] w-full items-center gap-3 rounded-[19px] border border-slate-200 bg-slate-50 px-3.5 text-left transition-all duration-300 hover:border-indigo-200 hover:bg-white hover:shadow-[0_10px_30px_rgba(79,70,229,.08)] focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                <Search size={18} />
              </span>

              <span className="flex-1 truncate text-[14px] font-medium text-slate-400">
                Search products...
              </span>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                <span className="text-[11px]">☷</span>
              </span>
            </button>
          </div> */}

          <div className="hidden items-center justify-between border-t border-slate-100 px-4 py-2 md:flex">
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map(
                ({ name, path, icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) =>
                      `group inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[10px] font-extrabold transition ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                      }`
                    }
                  >
                    {icon}
                    {name}
                  </NavLink>
                )
              )}

              <NavLink
                to="/wishlist"
                className={({ isActive }) =>
                  `inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[10px] font-extrabold transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                  }`
                }
              >
                <Heart size={16} />
                Wishlist
              </NavLink>
            </nav>

            {!authUser ? (
              <button
                onClick={() => navigate("/sign-in")}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 text-[10px] font-extrabold text-indigo-700 transition hover:bg-indigo-100"
              >
                <User size={14} />
                Sign in
              </button>
            ) : (
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <button className="flex h-9 items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 py-1 pl-1 pr-2.5 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50">
                    {authUser?.image ? (
                      <img
                        src={authUser.image}
                        alt="Profile"
                        className="h-7 w-7 rounded-full object-cover ring-2 ring-indigo-50"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <User size={14} />
                      </span>
                    )}
                    <span className="max-w-[100px] truncate text-[11px] font-bold text-slate-800">
                      {authUser?.firstName || "Account"}
                    </span>
                    <ChevronDown size={13} className="text-slate-400" />
                  </button>
                </DropdownTrigger>

                <DropdownMenu
                  aria-label="Profile Actions"
                  variant="flat"
                  classNames={{
                    base: "min-w-[240px] rounded-[18px] border p-1.5",
                    list: "gap-1",
                  }}
                >
                  <DropdownItem
                    key="profile"
                    onPress={() => navigate("/profile")}
                    startContent={<User size={16} />}
                  >
                    Account
                  </DropdownItem>

                  <DropdownItem
                    key="orders"
                    onPress={() => navigate("/order-history")}
                    startContent={<Package size={16} />}
                  >
                    Orders
                  </DropdownItem>

                  <DropdownItem
                    key="track"
                    onPress={() => navigate("/track-order")}
                    startContent={<Truck size={16} />}
                  >
                    Track order
                  </DropdownItem>

                  <DropdownItem
                    key="logout"
                    className="text-red-600"
                    color="danger"
                    onPress={logout}
                    startContent={<LogOut size={16} />}
                  >
                    Logout
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
          </div>
        </div>
      </header>


<div className="sm:h-[91px] md:h-[139px]" />
      {/* =================================================
          LOCATION MODAL — RN STYLE + EXACT NOMINATIM FLOW
      ================================================= */}

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setArea("");
          setLocationResults([]);
          setMapOpen(false);
          onClose();
        }}
        placement="center"
        backdrop="blur"
        hideCloseButton
        classNames={{
          backdrop: "bg-slate-950/45 backdrop-blur-md",
          wrapper: "p-0 sm:p-4 items-end sm:items-center",
        }}
      >
        <ModalContent
          className="w-full max-w-2xl max-h-[94vh] overflow-hidden rounded-t-[32px] rounded-b-none border border-white/80 bg-white shadow-[0_30px_100px_rgba(15,23,42,.25)] sm:rounded-[28px]"
        >
          {(onModalClose) => (
            <div className="flex max-h-[94vh] flex-col">

              <div className="flex justify-center pt-2 sm:hidden">
                <span className="h-1.5 w-14 rounded-full bg-slate-200" />
              </div>

              <ModalHeader className="flex shrink-0 items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0">
                  <h2 className="text-[21px] font-black tracking-tight text-slate-900 sm:text-2xl">
                    Select delivery address
                  </h2>
                  <p className="mt-1 text-[12px] font-medium text-slate-500 sm:text-sm">
                    Search or choose a delivery address
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onModalClose}
                  aria-label="Close delivery address"
                  className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 transition hover:bg-slate-100 active:scale-95"
                >
                  <X size={21} />
                </button>
              </ModalHeader>

              <ModalBody className="min-h-0 overflow-y-auto p-0">
                <div className="space-y-3.5 px-4 py-4 sm:space-y-4 sm:px-5 sm:py-5">

                  {/* SEARCH — same Nominatim request as RN */}
                  <div className="flex h-[58px] items-center gap-3 rounded-[19px] border border-slate-200 bg-slate-50 px-4 transition focus-within:border-indigo-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10">
                    <Search size={20} className="shrink-0 text-slate-400" />

                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAreaSearch();
                        }
                      }}
                      placeholder="Search by name, area, street, pincode"
                      className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                      autoComplete="street-address"
                    />

                    {area ? (
                      <button
                        type="button"
                        onClick={() => {
                          setArea("");
                          setLocationResults([]);
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm hover:bg-slate-100"
                      >
                        <X size={15} />
                      </button>
                    ) : null}
                  </div>

                  {/* LIVE SEARCH RESULTS */}
                  {area.trim().length >= 2 ? (
                    <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                      {locationLoading ? (
                        <LocationSearchSkeleton />
                      ) : locationResults.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto p-2">
                          {locationResults.map((result) => {
                            const addr = result?.address || {};

                            const local =
                              addr.neighbourhood ||
                              addr.suburb ||
                              addr.village;

                            const city =
                              addr.city ||
                              addr.town ||
                              addr.village;

                            const shortName =
                              local &&
                              city &&
                              local.toLowerCase() !== city.toLowerCase()
                                ? `${local}, ${city}`
                                : city ||
                                  local ||
                                  result.display_name
                                    ?.split(",")
                                    .slice(0, 2)
                                    .join(", ")
                                    .trim();

                            return (
                              <button
                                key={String(result.place_id)}
                                type="button"
                                onClick={() =>
                                  selectLocationResult(result)
                                }
                                className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-indigo-50 active:scale-[.99]"
                              >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                                  <MapPin
                                    size={18}
                                    className="text-indigo-600"
                                  />
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[13px] font-extrabold text-slate-900">
                                    {shortName}
                                  </span>

                                  <span className="mt-0.5 block line-clamp-2 text-[11px] font-medium leading-4 text-slate-500">
                                    {result.display_name}
                                  </span>
                                </span>

                                <ChevronDown
                                  size={17}
                                  className="-rotate-90 shrink-0 text-slate-300"
                                />
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="px-4 py-5 text-center">
                          <MapPin
                            size={20}
                            className="mx-auto text-slate-300"
                          />
                          <p className="mt-2 text-xs font-bold text-slate-600">
                            No matching locations found
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            Try a more specific area, street or pincode.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {!area.trim() ? (
                    <>
                      {/* CURRENT LOCATION */}
                      <button
                        type="button"
                        disabled={currentLocationLoading}
                        onClick={handleUseMyLocation}
                        className="group flex w-full items-center gap-4 rounded-[20px] border border-indigo-100 bg-indigo-50/70 px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-[0_10px_30px_rgba(79,70,229,.10)] disabled:cursor-wait disabled:opacity-70"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                          <LocateFixed
                            size={21}
                            className="text-indigo-600"
                          />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-black text-indigo-700">
                            {currentLocationLoading
                              ? "Detecting location..."
                              : "Use current location"}
                          </span>

                          <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                            {currentLocationLoading
                              ? "Getting your exact address"
                              : "Allow access to your location"}
                          </span>
                        </span>

                        <ChevronDown
                          size={20}
                          className="-rotate-90 shrink-0 text-slate-400"
                        />
                      </button>

                      {/* ADD NEW + PICK MAP */}
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            navigate("/account/addresses/add")
                          }
                          className="flex items-center gap-4 rounded-[20px] border border-indigo-100 bg-indigo-50/55 px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50"
                        >
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                            <span className="text-[28px] font-light leading-none text-indigo-600">
                              +
                            </span>
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-black text-indigo-700">
                              Add New
                            </span>
                            <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                              Add a delivery address
                            </span>
                          </span>

                          <ChevronDown
                            size={19}
                            className="-rotate-90 shrink-0 text-indigo-600"
                          />
                        </button>

                        {/* <button
                          type="button"
                          onClick={() =>
                            setMapOpen((value) => !value)
                          }
                          className="flex items-center gap-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60"
                        >
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                            <MapPinned
                              size={23}
                              className="text-indigo-600"
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-black text-slate-800">
                              {mapOpen
                                ? "Hide map"
                                : "Pick on map"}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                              Select an exact location
                            </span>
                          </span>

                          <ChevronDown
                            size={19}
                            className={`shrink-0 text-slate-400 transition-transform ${
                              mapOpen
                                ? "rotate-180"
                                : "-rotate-90"
                            }`}
                          />
                        </button> */}
                      </div>

                      {/* MAP */}
                      {mapOpen ? (
                        <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-100 shadow-inner">
                          <div className="relative h-[300px] w-full sm:h-[360px]">
                            <LocationMap
                              initialLocation={selectedLocation}
                              onSelect={async (
                                lat,
                                lng,
                                locationData
                              ) => {
                                const exactLocation =
                                  locationData
                                    ? {
                                        ...locationData,
                                        latitude:
                                          Number(lat),
                                        longitude:
                                          Number(lng),
                                        location: {
                                          type: "Point",
                                          coordinates: [
                                            Number(lng),
                                            Number(lat),
                                          ],
                                        },
                                      }
                                    : await reverseGeocode(
                                        Number(lat),
                                        Number(lng)
                                      );

                                setSelectedLocation(
                                  exactLocation
                                );

                                if (
                                  typeof onLocationChange ===
                                  "function"
                                ) {
                                  onLocationChange(
                                    Number(lat),
                                    Number(lng),
                                    exactLocation
                                  );
                                }

                                setMapOpen(false);

                                toast.success(
                                  "Delivery location updated"
                                );

                                onModalClose();
                              }}
                            />

                            <button
                              type="button"
                              onClick={handleUseMyLocation}
                              disabled={
                                currentLocationLoading
                              }
                              className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] font-black text-slate-700 shadow-[0_8px_25px_rgba(15,23,42,.15)] transition hover:text-indigo-600 disabled:opacity-60"
                            >
                              <LocateFixed
                                size={14}
                                className="text-indigo-600"
                              />
                              Use my location
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {/* SELECTED LOCATION */}
                  <div className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                        <MapPin
                          size={19}
                          className="text-indigo-600"
                        />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">
                            Delivering to
                          </p>

                          {selectedLocation ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-black text-emerald-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Selected
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 break-words text-[13px] font-extrabold leading-5 text-slate-900">
                          {locationLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* BENEFITS */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      [Truck, "Accurate delivery"],
                      [MapPin, "Exact location"],
                      [LocateFixed, "GPS supported"],
                    ].map(([Icon, label]) => (
                      <div
                        key={label}
                        className="rounded-2xl bg-slate-50 px-2 py-2.5 text-center"
                      >
                        <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm">
                          <Icon
                            size={14}
                            className="text-indigo-600"
                          />
                        </span>
                        <p className="mt-1.5 text-[8px] font-bold text-slate-500">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </ModalBody>

              <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3.5 sm:px-5">
                <button
                  type="button"
                  onClick={onModalClose}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-xs font-black text-white shadow-[0_8px_22px_rgba(79,70,229,.22)] transition hover:-translate-y-0.5 hover:bg-indigo-700 active:scale-[.99]"
                >
                  <MapPin size={14} />
                  Done
                </button>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>


      {/* =================================================
          MOBILE BOTTOM NAV
      ================================================= */}

      <div
        className="fixed inset-x-2 bottom-1 z-40 rounded-[24px] border border-white/80 bg-white/90 shadow-[0_12px_45px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:hidden"
        style={{
          transform:
            showBottomNav
              ? "translateY(0)"
              : "translateY(calc(100% + 30px))",

          transition:
            "transform 0.32s cubic-bezier(.22,1,.36,1)",

          willChange:
            "transform",
        }}
      >
        <div className="flex items-center justify-around gap-1 px-1.5 py-2">
          {BOTTOM_LINKS.map(
            ({
              name,
              path,
              icon: Icon,
            }) => (
              <NavLink
                key={path}
                to={path}
                className={({
                  isActive,
                }) =>
                  `odikart-bottom-item relative flex min-w-[55px] flex-col items-center gap-1 text-[9px] font-bold ${
                    isActive
                      ? "text-indigo-700"
                      : "text-slate-500"
                  }`
                }
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                    routerLocation.pathname ===
                    path
                      ? "bg-indigo-50 text-indigo-700 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  <Icon
                    size={19}
                  />
                </span>

                {name}
              </NavLink>
            )
          )}

          <button
            onClick={() =>
              navigate(
                authUser
                  ? "/profile"
                  : "/sign-in"
              )
            }
            className={`odikart-bottom-item flex min-w-[55px] flex-col items-center gap-1 text-[9px] font-bold ${
              routerLocation.pathname ===
              "/profile"
                ? "text-indigo-700"
                : "text-slate-500"
            }`}
          >
            <span className="flex h-8 w-12 items-center justify-center rounded-2xl transition-all duration-300">
              {authUser?.image ? (
                <img
                  src={
                    authUser.image
                  }
                  alt="profile"
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <User
                  size={19}
                />
              )}
            </span>

           Account
          </button>
        </div>
      </div>
      <style>{`
/* ============================================================
   ODikart MODERN NATIVE-STYLE NAVBAR OVERRIDES
   ============================================================ */

.odikart-navbar-shell {
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

@media (min-width: 641px) {
  .odikart-navbar-shell {
    border-radius: 20px !important;
  }
}

@media (max-width: 640px) {
  .odikart-navbar-shell {
    border-radius: 18px !important;
  }

  .odikart-navbar-shell > div {
    min-height: 58px !important;
    padding: 7px 8px !important;
  }
}

/* Cleaner location control */
.odikart-navbar-shell button[aria-label^="Choose delivery location"] {
  border-radius: 14px !important;
  padding: 5px 7px !important;
}

.odikart-navbar-shell button[aria-label^="Choose delivery location"] > span:first-child {
  width: 34px !important;
  height: 34px !important;
  border-radius: 11px !important;
}

.odikart-navbar-shell button[aria-label^="Choose delivery location"] svg {
  width: 16px !important;
  height: 16px !important;
}

/* Compact icon buttons */
.odikart-icon-btn {
  width: 39px !important;
  height: 39px !important;
  border-radius: 12px !important;
  border-color: rgba(226,232,240,.78) !important;
  background: rgba(248,250,252,.82) !important;
}

.odikart-icon-btn:hover {
  background: #eef2ff !important;
  border-color: #c7d2fe !important;
}

/* Cart badge */
.odikart-navbar-shell .absolute.-right-1.-top-1 {
  min-width: 16px !important;
  min-height: 16px !important;
  font-size: 7px !important;
  border-width: 1.5px !important;
}

/* Modern search overlay */
.odikart-navbar-shell input::placeholder {
  opacity: .72;
}

@media (max-width: 640px) {
  /* Make modal/search surfaces feel closer to a native bottom sheet */
  .odikart-location-skeleton-item {
    min-height: 60px !important;
    padding: 9px !important;
    border-radius: 15px !important;
  }
}

/* Reduce visual noise from large text */
.odikart-navbar-shell .text-\\[12px\\] {
  line-height: 1.25 !important;
}

.odikart-navbar-shell .text-\\[11px\\] {
  line-height: 1.25 !important;
}

/* Subtle premium glass effect */
.odikart-navbar-shell {
  box-shadow:
    0 8px 28px rgba(15,23,42,.055),
    0 1px 2px rgba(15,23,42,.04) !important;
}

.odikart-navbar-shell:hover {
  box-shadow:
    0 12px 34px rgba(15,23,42,.075),
    0 1px 2px rgba(15,23,42,.04) !important;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .odikart-navbar-shell,
  .odikart-icon-btn,
  .odikart-bottom-item {
    animation: none !important;
    transition: none !important;
  }
}
`}</style>
    </>
  );
}