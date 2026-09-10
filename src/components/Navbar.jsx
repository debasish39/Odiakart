
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
    name: "Orders",
    path: "/order-history",
    icon: Package,
  },
  {
    name: "Track",
    path: "/track-order",
    icon: MapPin,
  },
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

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [showNav, setShowNav] =
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
    let last =
      window.scrollY;

    const fn = () => {
      const cur =
        window.scrollY;

      setShowNav(
        cur <= last ||
          cur < 80
      );

      setScrolled(
        cur > 10
      );

      last = cur;
    };

    window.addEventListener(
      "scroll",
      fn,
      {
        passive: true,
      }
    );

    return () =>
      window.removeEventListener(
        "scroll",
        fn
      );
  }, []);


  /* =====================================================
     LOCK BODY WHEN MOBILE DRAWER OPEN
  ===================================================== */

  useEffect(() => {
    document.body.style.overflow =
      mobileOpen
        ? "hidden"
        : "";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [mobileOpen]);


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

  const handleAreaSearch =
    async () => {
      if (
        !area.trim()
      ) {
        toast.warning(
          "Please enter a location"
        );

        return;
      }

      const tid =
        toast.loading(
          "Searching exact location..."
        );

      try {
        console.log(
          "================================="
        );

        console.log(
          "🔎 LOCATION SEARCH"
        );

        console.log(
          "Query:",
          area
        );

        console.log(
          "================================="
        );

        const url =
          "https://nominatim.openstreetmap.org/search" +
          "?format=jsonv2" +
          `&q=${encodeURIComponent(
            area.trim()
          )}` +
          "&countrycodes=in" +
          "&addressdetails=1" +
          "&limit=5";

        const res =
          await fetch(
            url,
            {
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        if (!res.ok) {
          throw new Error(
            `Search failed: ${res.status}`
          );
        }

        const results =
          await res.json();

        console.log(
          "🌍 SEARCH RESULTS:",
          results
        );

        if (
          !results ||
          results.length === 0
        ) {
          toast.dismiss(
            tid
          );

          toast.error(
            "Location not found. Try a more specific address."
          );

          return;
        }

        const result =
          results[0];

        const exactLocation =
          normalizeSearchLocation(
            result
          );

        console.log(
          "================================="
        );

        console.log(
          "📍 EXACT SEARCH LOCATION"
        );

        console.log(
          exactLocation
        );

        console.table({
          "Plot Number":
            exactLocation.plotNumber,

          "House Number":
            exactLocation.houseNumber,

          Building:
            exactLocation.buildingName,

          Flat:
            exactLocation.flatNumber,

          Floor:
            exactLocation.floor,

          Road:
            exactLocation.road,

          Landmark:
            exactLocation.landmark,

          Area:
            exactLocation.area,

          Locality:
            exactLocation.locality,

          City:
            exactLocation.city,

          District:
            exactLocation.district,

          State:
            exactLocation.state,

          Pincode:
            exactLocation.pincode,

          Country:
            exactLocation.country,

          Latitude:
            exactLocation.latitude,

          Longitude:
            exactLocation.longitude,
        });

        console.log(
          "GeoJSON:",
          exactLocation.location
        );

        console.log(
          "================================="
        );

        /*
         * Update navbar immediately.
         */
        setSelectedLocation(
          exactLocation
        );

        /*
         * Send COMPLETE location
         * to parent.
         */
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

        toast.dismiss(
          tid
        );

        toast.success(
          "Exact location selected"
        );

        onClose();

      } catch (error) {
        console.error(
          "❌ LOCATION SEARCH ERROR:",
          error
        );

        toast.dismiss(
          tid
        );

        toast.error(
          "Unable to search location"
        );
      }
    };


  /* =====================================================
     REVERSE GEOCODE
  ===================================================== */

  const reverseGeocode =
    async (
      lat,
      lng
    ) => {
      try {
        console.log(
          "🌍 REVERSE GEOCODING:"
        );

        console.log(
          "Latitude:",
          lat
        );

        console.log(
          "Longitude:",
          lng
        );

        const url =
          "https://nominatim.openstreetmap.org/reverse" +
          `?format=jsonv2` +
          `&lat=${lat}` +
          `&lon=${lng}` +
          "&addressdetails=1";

        const res =
          await fetch(
            url,
            {
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        if (!res.ok) {
          throw new Error(
            `Reverse geocoding failed: ${res.status}`
          );
        }

        const result =
          await res.json();

        const exactLocation =
          normalizeSearchLocation(
            {
              ...result,

              lat:
                lat,

              lon:
                lng,
            }
          );

        /*
         * Ensure selected map coordinates
         * are authoritative.
         */
        exactLocation.latitude =
          Number(lat);

        exactLocation.longitude =
          Number(lng);

        exactLocation.location = {
          type: "Point",

          coordinates: [
            Number(lng),
            Number(lat),
          ],
        };

        console.log(
          "================================="
        );

        console.log(
          "📍 EXACT MAP LOCATION"
        );

        console.log(
          exactLocation
        );

        console.table({
          "Latitude":
            exactLocation.latitude,

          "Longitude":
            exactLocation.longitude,

          "Plot":
            exactLocation.plotNumber,

          "House":
            exactLocation.houseNumber,

          "Building":
            exactLocation.buildingName,

          "Flat":
            exactLocation.flatNumber,

          "Floor":
            exactLocation.floor,

          "Road":
            exactLocation.road,

          "Area":
            exactLocation.area,

          "Locality":
            exactLocation.locality,

          "City":
            exactLocation.city,

          "District":
            exactLocation.district,

          "State":
            exactLocation.state,

          "Pincode":
            exactLocation.pincode,
        });

        console.log(
          "GeoJSON:",
          exactLocation.location
        );

        console.log(
          "================================="
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

        return exactLocation;

      } catch (error) {
        console.error(
          "❌ REVERSE GEOCODING ERROR:",
          error
        );

        /*
         * Even if reverse geocoding fails,
         * preserve exact coordinates.
         */
        const fallback = {
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

          formattedAddress:
            `${Number(lat).toFixed(
              6
            )}, ${Number(lng).toFixed(
              6
            )}`,
        };

        setSelectedLocation(
          fallback
        );

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

  const handleUseMyLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        toast.error(
          "Geolocation not supported"
        );

        return;
      }

      const tid =
        toast.loading(
          "Getting your exact location..."
        );

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat =
              position.coords
                .latitude;

            const lng =
              position.coords
                .longitude;

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
              position.coords
                .accuracy,
              "meters"
            );

            console.log(
              "================================="
            );

            await reverseGeocode(
              lat,
              lng
            );

            toast.dismiss(
              tid
            );

            toast.success(
              "Exact location detected"
            );

            onClose();

          } catch (error) {
            toast.dismiss(
              tid
            );

            console.error(
              "❌ GPS LOCATION ERROR:",
              error
            );

            toast.error(
              "Unable to detect location"
            );
          }
        },

        (error) => {
          toast.dismiss(
            tid
          );

          console.error(
            "❌ GEOLOCATION ERROR:",
            error
          );

          toast.error(
            "Failed: " +
              error.message
          );
        },

        {
          enableHighAccuracy:
            true,

          timeout:
            15000,

          maximumAge:
            0,
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
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
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
                      <span className="text-[13.5px] font-semibold text-slate-900">
                        {isListening
                          ? "Listening..."
                          : "Tap to speak"}
                      </span>

                      <span className="text-xs text-slate-500">
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
          MOBILE OVERLAY
      ================================================= */}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[2px]"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}


      {/* =================================================
          NAVBAR
      ================================================= */}

      <header
        className={`fixed inset-x-0 top-0 z-40 px-2 pt-2 transition-transform duration-300 sm:px-3 ${
          showNav
            ? "translate-y-0"
            : "-translate-y-full"
        }`}
      >
        <div
          className={`mx-auto flex min-h-[64px] max-w-7xl items-center justify-between gap-3 rounded-2xl border px-3.5 shadow-sm backdrop-blur-xl transition-all duration-300 sm:px-4 ${
            scrolled
              ? "border-indigo-100/80 bg-white/95 shadow-[0_12px_35px_rgba(15,23,42,0.09)]"
              : "border-slate-200/70 bg-white/90 shadow-[0_8px_25px_rgba(15,23,42,0.06)]"
          }`}
        >

          {/* =================================================
              LOGO + LOCATION
          ================================================= */}

          <div className="flex min-w-0 items-center gap-1 sm:gap-3">
            <Link
              to="/"
              className="flex h-12 w-21 shrink-0 items-center justify-center overflow-hidden md:hidden"
            >
              <img
                src="/logo.png"
                alt="Logo"
                className=" w-auto object-contain"
              />
            </Link>

            <Link
              to="/"
              className="group hidden h-10 items-center justify-center px-1 transition-transform duration-200 hover:scale-[1.03] md:flex"
            >
              <img
                src="/logo.png"
                alt="Logo"
                className="h-9 w-auto object-contain"
              />
            </Link>

            <button
              type="button"
              aria-label={`Choose delivery location: ${locationLabel}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-indigo-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-md sm:w-auto sm:max-w-[260px] sm:gap-2 sm:rounded-xl sm:bg-slate-50/80 sm:px-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition group-hover:bg-white">
                <MapPinned
                  size={16}
                />
              </span>

              <span className="hidden min-w-0 truncate text-[11px] font-bold text-slate-600 sm:block">
                {locationLabel}
              </span>

              <ChevronDown
                size={13}
                className="hidden shrink-0 text-slate-400 sm:block"
              />
            </button>
          </div>


          {/* =================================================
              DESKTOP SEARCH
          ================================================= */}

          <div className="hidden max-w-[480px] flex-1 md:flex">
            <button
              onClick={openSearchPage}
              className="group flex h-12 w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 text-left text-slate-500 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                <Search
                  size={15}
                />
              </span>

              <span
                className="text-sm"
                style={{
                  color:
                    "#9B98A8",
                }}
              >
                Search products...
              </span>

              <div className="ml-auto hidden h-6 min-w-8 items-center justify-center rounded-md border border-slate-200 bg-white px-1.5 text-[9px] font-extrabold text-slate-500 shadow-sm lg:flex">
                ⌘K
              </div>
            </button>
          </div>


          {/* =================================================
              DESKTOP NAV
          ================================================= */}

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(
              ({
                name,
                path,
                icon,
              }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({
                    isActive,
                  }) =>
                    `group relative inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[11px] font-extrabold transition-all duration-200 ${
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

            <NotificationBell />

            <div className="mx-2 h-6 w-px bg-slate-200" />

            <Link
              to="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            >
              <ShoppingCart
                size={19}
              />

              {cartItem.length >
                0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-indigo-600 px-1 text-[8px] font-black leading-none text-white shadow-md shadow-indigo-200">
                  {
                    cartItem.length
                  }
                </span>
              )}
            </Link>

            <Link
              to="/wishlist"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            >
              <Heart size={21} />

              {wishlist.length >
                0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-indigo-600 px-1 text-[8px] font-black leading-none text-white shadow-md shadow-indigo-200">
                  {
                    wishlist.length
                  }
                </span>
              )}
            </Link>

            <div className="ml-2">
              {!authUser ? (
                <button
                  onClick={() =>
                    navigate(
                      "/sign-in"
                    )
                  }
                  className="flex h-10 items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 text-xs font-extrabold text-indigo-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-100 hover:shadow-md"
                >
                  <User
                    size={15}
                  />
                  Sign in
                </button>
              ) : (
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <button className="group flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50">
                      <img
                        src={
                          authUser?.image
                        }
                        alt={
                          authUser?.name
                        }
                        className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />

                      <span className="hidden text-xs font-semibold text-slate-900 lg:block">
                        {
                          authUser.name
                        }
                      </span>

                      <ChevronDown
                        size={14}
                        className="text-slate-500"
                      />
                    </button>
                  </DropdownTrigger>

                  <DropdownMenu
                    aria-label="Profile Actions"
                    variant="flat"
                    classNames={{
                      base: "min-w-[240px] rounded-[20px] border p-2",
                      list: "gap-1",
                    }}
                    style={{
                      borderColor:
                        "#e2e8f0",
                      background:
                        "#ffffff",
                      boxShadow:
                        "0 10px 30px rgba(15,23,42,.08)",
                    }}
                  >
                    <DropdownItem
                      key="profile"
                      onPress={() =>
                        navigate(
                          "/profile"
                        )
                      }
                      startContent={
                        <User
                          size={
                            16
                          }
                        />
                      }
                    >
                      Profile
                    </DropdownItem>

                    <DropdownItem
                      key="orders"
                      onPress={() =>
                        navigate(
                          "/order-history"
                        )
                      }
                      startContent={
                        <Package
                          size={
                            16
                          }
                        />
                      }
                    >
                      Orders
                    </DropdownItem>

                    <DropdownItem
                      key="track"
                      onPress={() =>
                        navigate(
                          "/track-order"
                        )
                      }
                      startContent={
                        <Truck
                          size={
                            16
                          }
                        />
                      }
                    >
                      Track order
                    </DropdownItem>

                    <DropdownItem
                      key="logout"
                      className="text-red-600"
                      color="danger"
                      onPress={
                        logout
                      }
                      startContent={
                        <LogOut
                          size={
                            16
                          }
                        />
                      }
                    >
                      Logout
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              )}
            </div>
          </nav>


          {/* =================================================
              MOBILE RIGHT
          ================================================= */}

          <div className="flex flex-1 items-center justify-end gap-2 sm:hidden">
            <button
              onClick={openSearchPage}
              className="flex h-11 min-w-0 max-w-[170px] flex-1 items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white px-3 text-left shadow-sm transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-md"
            >
              <span className="shrink-0 text-indigo-600">
                <Search
                  size={14}
                />
              </span>

              <span className="truncate text-xs text-slate-400">
                Search...
              </span>
            </button>

            {/* <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              aria-label="Choose delivery location"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-indigo-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              <MapPinned
                size={18}
              />
            </button> */}

            <Link
              to="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            >
              <ShoppingCart
                size={19}
              />

              {cartItem.length >
                0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-indigo-600 px-1 text-[8px] font-black leading-none text-white shadow-md shadow-indigo-200">
                  {
                    cartItem.length
                  }
                </span>
              )}
            </Link>

            <NotificationBell />

            {/* <Link
              to="/wishlist"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            >
              <Heart
                size={19}
              />

              {wishlist.length >
                0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-indigo-600 px-1 text-[8px] font-black leading-none text-white shadow-md shadow-indigo-200">
                  {
                    wishlist.length
                  }
                </span>
              )}
            </Link> */}
          </div>
        </div>
      </header>


      {/* =================================================
          LOCATION MODAL
      ================================================= */}

    
{/* =====================================================
    MODERN ECOMMERCE LOCATION MODAL
===================================================== */}

<Modal
  isOpen={isOpen}
  onClose={onClose}
  placement="center"
  backdrop="blur"
  hideCloseButton
  classNames={{
    backdrop:
      "bg-slate-950/55 backdrop-blur-md",
    wrapper:
      "p-2 sm:p-4",
  }}
>
  <ModalContent
    className="
      w-full
      max-w-2xl
      overflow-hidden
      rounded-[28px]
      border
      border-white/70
      bg-white
      shadow-[0_30px_100px_rgba(15,23,42,0.25)]
    "
  >
    {(onModalClose) => (
      <div className="flex max-h-[92vh] flex-col">

        {/* =================================================
            HEADER
        ================================================= */}

        <ModalHeader className="relative flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
              <MapPinned
                size={18}
                strokeWidth={2.2}
                className="text-indigo-600"
              />
            </div>

            <div className="min-w-0">

              <h2 className="truncate text-[15px] font-extrabold tracking-tight text-slate-900 sm:text-base">
                Choose delivery location
              </h2>

              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                Get your order delivered to the right place
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onModalClose}
            aria-label="Close location picker"
            className="
              ml-3
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-slate-100
              text-slate-500
              transition
              hover:bg-slate-200
              hover:text-slate-900
            "
          >
            <X size={16} />
          </button>

        </ModalHeader>


        {/* =================================================
            BODY
        ================================================= */}

        <ModalBody className="min-h-0 overflow-y-auto p-0">

          <div className="space-y-4 p-4 sm:p-5">

            {/* =================================================
                SEARCH BAR
            ================================================= */}

            <div className="relative z-20">

              {/* <div
                className="
                  flex
                  h-12
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  px-3.5
                  shadow-[0_8px_30px_rgba(15,23,42,0.08)]
                  transition
                  focus-within:border-indigo-300
                  focus-within:ring-4
                  focus-within:ring-indigo-500/10
                "
              >

                <Search
                  size={17}
                  className="shrink-0 text-slate-400"
                />

                <input
                  type="text"
                  value={area}
                  onChange={(e) =>
                    setArea(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAreaSearch();
                    }
                  }}
                  placeholder="Search area, street, landmark or pincode"
                  className="
                    min-w-0
                    flex-1
                    bg-transparent
                    text-sm
                    font-semibold
                    text-slate-800
                    outline-none
                    placeholder:text-slate-400
                  "
                />

                {area && (
                  <button
                    type="button"
                    onClick={() => setArea("")}
                    className="
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-slate-100
                      text-slate-400
                      hover:bg-slate-200
                      hover:text-slate-700
                    "
                  >
                    <X size={13} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAreaSearch}
                  className="
                    hidden
                    h-9
                    shrink-0
                    items-center
                    gap-1.5
                    rounded-xl
                    bg-indigo-600
                    px-3
                    text-xs
                    font-extrabold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-indigo-700
                    sm:flex
                  "
                >
                  <Search size={13} />
                  Search
                </button>

              </div> */}

            </div>


            {/* =================================================
                MAP
            ================================================= */}

            <div
              className="
                relative
                overflow-hidden
                rounded-[12px]
                border
                p-3
                border-slate-200
                bg-slate-100
                shadow-inner
              "
            >

              <div className="h-[350px] w-full sm:h-[390px]">

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

                              // GeoJSON:
                              // longitude first
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

                    toast.success(
                      "Delivery location updated"
                    );

                    onModalClose();
                  }}
                />

              </div>


              {/* =================================================
                  CURRENT LOCATION FLOATING BUTTON
              ================================================= */}

              <button
                type="button"
                onClick={
                  handleUseMyLocation
                }
                className="
                  absolute
                  bottom-4
                  right-4
                  z-10
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-slate-200
                  bg-white
                  px-3.5
                  py-2.5
                  text-xs
                  font-extrabold
                  text-slate-700
                  shadow-[0_8px_25px_rgba(15,23,42,0.15)]
                  transition
                  hover:-translate-y-0.5
                  hover:border-indigo-200
                  hover:text-indigo-600
                "
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50">
                  <LocateFixed
                    size={13}
                    className="text-indigo-600"
                  />
                </span>

                Use my location
              </button>

            </div>


            {/* =================================================
                SELECTED ADDRESS
            ================================================= */}

            <div
              className="
                rounded-[20px]
                border
                border-slate-200
                bg-white
                p-3.5
                shadow-sm
              "
            >

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  <MapPin
                    size={17}
                    className="text-indigo-600"
                  />
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex items-center gap-2">

                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                      Delivering to
                    </p>

                    {selectedLocation && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Selected
                      </span>
                    )}

                  </div>

                  <p className="mt-1 break-words text-sm font-bold leading-5 text-slate-900">
                    {locationLabel}
                  </p>

                  {selectedLocation && (
                    <div className="mt-2 flex flex-wrap gap-1.5">

                      {[
                        selectedLocation.area ||
                          selectedLocation.suburb,

                        selectedLocation.locality,

                        selectedLocation.city,

                        selectedLocation.pincode,
                      ]
                        .filter(Boolean)
                        .slice(0, 4)
                        .map(
                          (item, index) => (
                            <span
                              key={`${item}-${index}`}
                              className="
                                rounded-lg
                                bg-slate-50
                                px-2
                                py-1
                                text-[10px]
                                font-semibold
                                text-slate-500
                              "
                            >
                              {item}
                            </span>
                          )
                        )}

                    </div>
                  )}

                </div>

              </div>

            </div>


            {/* =================================================
                LOCATION BENEFITS
            ================================================= */}

            <div className="grid grid-cols-3 gap-2">

              <div className="rounded-xl bg-slate-50 px-2.5 py-2.5 text-center">

                <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Truck
                    size={13}
                    className="text-indigo-600"
                  />
                </div>

                <p className="mt-1.5 text-[9px] font-bold text-slate-500">
                  Accurate delivery
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 px-2.5 py-2.5 text-center">

                <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
                  <MapPin
                    size={13}
                    className="text-indigo-600"
                  />
                </div>

                <p className="mt-1.5 text-[9px] font-bold text-slate-500">
                  Exact location
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 px-2.5 py-2.5 text-center">

                <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
                  <LocateFixed
                    size={13}
                    className="text-indigo-600"
                  />
                </div>

                <p className="mt-1.5 text-[9px] font-bold text-slate-500">
                  GPS supported
                </p>

              </div>

            </div>

          </div>

        </ModalBody>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            shrink-0
            border-t
            border-slate-100
            bg-white
            px-4
            py-3.5
            sm:px-5
          "
        >

          <div className="flex items-center gap-3">

            <div className="hidden min-w-0 flex-1 sm:block">

              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Delivery location
              </p>

              <p className="truncate text-xs font-bold text-slate-700">
                {locationLabel}
              </p>

            </div>

            <button
              type="button"
              onClick={onModalClose}
              className="
                flex
                h-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                text-xs
                font-extrabold
                text-slate-600
                transition
                hover:bg-slate-50
              "
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onModalClose}
              disabled={!selectedLocation}
              className="
                flex
                h-11
                flex-1
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-indigo-600
                px-5
                text-xs
                font-extrabold
                text-white
                shadow-[0_8px_20px_rgba(79,70,229,0.25)]
                transition
                hover:-translate-y-0.5
                hover:bg-indigo-700
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:flex-none
                sm:min-w-[190px]
              "
            >
              <MapPin size={14} />

              Confirm location
            </button>

          </div>

        </div>

      </div>
    )}
  </ModalContent>
</Modal>




      {/* =================================================
          MOBILE DRAWER
      ================================================= */}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[290px] border-r border-slate-200 bg-white shadow-[20px_0_55px_rgba(15,23,42,0.14)] transition-transform duration-300 ease-out ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
              <span className="text-sm font-bold text-white">
                E
              </span>
            </div>

            <span className="text-lg font-bold text-slate-900">
              Odikart
            </span>
          </Link>

          <button
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          >
            <X size={16} />
          </button>
        </div>


        {/* MOBILE LOCATION */}

        <div className="px-4 pt-4">
          <button
            onClick={() => {
              onOpen();
              setMobileOpen(
                false
              );
            }}
            className="flex w-full min-w-0 items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <MapPinned
              size={15}
              className="mt-0.5 shrink-0"
            />

            <span className="min-w-0 flex-1 break-words text-xs font-semibold leading-5">
              {locationLabel}
            </span>

            <ChevronDown
              size={13}
              className="mt-1 shrink-0"
            />
          </button>

          {selectedLocation?.latitude !==
              undefined &&
            selectedLocation?.longitude !==
              undefined && (
              <p className="mt-1 px-1 text-[9px] text-slate-400">
                {Number(
                  selectedLocation.latitude
                ).toFixed(
                  6
                )}
                ,{" "}
                {Number(
                  selectedLocation.longitude
                ).toFixed(
                  6
                )}
              </p>
            )}
        </div>


        {/* MOBILE NAV */}

        <nav className="space-y-1 px-4 pt-4">
          {[
            {
              name: "Home",
              path: "/",
              icon: (
                <Home
                  size={17}
                />
              ),
            },
            {
              name: "Orders",
              path: "/order-history",
              icon: (
                <ShoppingCart
                  size={17}
                />
              ),
            },
            {
              name: "Track order",
              path: "/track-order",
              icon: (
                <Truck
                  size={17}
                />
              ),
            },
          ].map(
            ({
              name,
              path,
              icon,
            }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
                className={({
                  isActive,
                }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                  }`
                }
              >
                {icon}
                {name}
              </NavLink>
            )
          )}
        </nav>


        {/* MOBILE BOTTOM ACTIONS */}

        <div className="absolute bottom-6 left-4 right-4 flex gap-3">
          <Link
            to="/cart"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5"
          >
            <ShoppingCart
              size={15}
            />

            Cart

            {cartItem.length >
              0 && (
              <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">
                {
                  cartItem.length
                }
              </span>
            )}
          </Link>

          <Link
            to="/wishlist"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-50 py-3 text-sm font-extrabold text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-100"
          >
            <Heart
              size={15}
            />

            Wishlist

            {wishlist.length >
              0 && (
              <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-bold">
                {
                  wishlist.length
                }
              </span>
            )}
          </Link>
        </div>
      </aside>


      {/* =================================================
          MOBILE BOTTOM NAV
      ================================================= */}

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 shadow-[0_-10px_30px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:hidden"
        style={{
          transform:
            showNav
              ? "translateY(0)"
              : "translateY(100%)",

          transition:
            "transform 0.3s ease",
        }}
      >
        <div className="flex items-center justify-around px-1 py-2">
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
                  `flex min-w-[55px] flex-col items-center gap-1 text-[9px] font-bold transition ${
                    isActive
                      ? "text-indigo-700"
                      : "text-slate-500"
                  }`
                }
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full ${
                    routerLocation.pathname ===
                    path
                      ? "bg-indigo-50"
                      : ""
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
            className={`flex min-w-[55px] flex-col items-center gap-1 text-[9px] font-bold transition ${
              routerLocation.pathname ===
              "/profile"
                ? "text-indigo-700"
                : "text-slate-500"
            }`}
          >
            <span className="flex h-7 w-12 items-center justify-center rounded-full">
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

            Profile
          </button>
        </div>
      </div>
    </>
  );
}

