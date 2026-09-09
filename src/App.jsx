import React, {
  useEffect,
  useState,
  Suspense,
  lazy,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import axios from "axios";
import PhoneLogin from "./pages/PhoneLogin";
import { Toaster } from "sonner";

import AOS from "aos";
import "aos/dist/aos.css";

import Spinner from "./components/Spinner";

import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import VerifySignIn from "./pages/VerifySignIn";
import ProfilePage from "./pages/account/ProfilePage";
import PersonalInfoPage from "./pages/account/PersonalInfoPage";
import AddressesPage from "./pages/account/AddressesPage";
import AddAddressPage from "./pages/account/AddAddressPage";
import EditAddressPage from "./pages/account/EditAddressPage";
import AccountOrdersPage from "./pages/account/OrdersPage";
import AccountOrderDetailsPage from "./pages/account/OrderDetailsPage";
import AccountTrackOrderPage from "./pages/account/TrackOrderPage";
import AccountWishlistPage from "./pages/account/WishlistPage";
import PaymentMethodsPage from "./pages/account/PaymentMethodsPage";
import SecurityPage from "./pages/account/SecurityPage";
import NotificationsPage from "./pages/account/NotificationsPage";
import HelpSupportPage from "./pages/account/HelpSupportPage";
import AccountLegalPage from "./pages/account/LegalPage";
import DeleteAccountPage from "./pages/account/DeleteAccountPage";
import Offline from "./pages/Offline";
import TrackOrder from "./pages/TrackOrder";
import SingleOrderPage from "./pages/SingleOrderPage.jsx";
import ReviewsPage from "./pages/ReviewsPage.jsx";

/* =========================================================
   LAZY PAGES
========================================================= */

const Home =
  lazy(() => import("./pages/Home"));

const Contact =
  lazy(() => import("./pages/Contact"));

const Cart =
  lazy(() => import("./pages/Cart"));

const Products =
  lazy(() => import("./pages/Products"));

const SearchPage =
  lazy(() => import("./pages/SearchPage"));

const SingleProduct =
  lazy(() => import("./pages/SingleProduct"));

const CategoryProduct =
  lazy(() => import("./pages/CategoryProduct"));

const WishlistPage =
  lazy(() => import("./pages/WishlistPage"));

const OrderSuccess =
  lazy(() => import("./pages/OrderSuccess"));

const OrderHistory =
  lazy(() => import("./pages/OrderHistory"));

const Verify =
  lazy(() => import("./pages/verify"));

const LegalPage =
  lazy(() => import("./pages/LegalPage.jsx"));
import SearchNavbar from "./components/SearchNavbar";

/* =========================================================
   LAZY COMPONENTS
========================================================= */

const Navbar =
  lazy(() => import("./components/Navbar"));

const Footer =
  lazy(() => import("./components/Footer"));

const ProtectedRoute =
  lazy(() => import("./components/ProtectedRoute"));

const AppLoader =
  lazy(() => import("./components/ModernAppLoader"));

const NotFound =
  lazy(() => import("./components/NotFound"));

const ScrollToTop =
  lazy(() => import("./components/scrollToTop"));

const Particles =
  lazy(() => import("./components/Particles"));

const ScrollProgressBar =
  lazy(() => import("./components/ScrollProgressBar"));


/* =========================================================
   LOADING MESSAGES
========================================================= */

const STEP_MSGS = [
  "Warming up the engine…",
  "Fetching your products…",
  "Loading assets…",
  "Almost ready…",
  "Polishing the pixels…",
];

const STEP_LABELS = [
  "Init",
  "Fetch",
  "Assets",
  "Render",
];


/* =========================================================
   APP WRAPPER
========================================================= */

const AppWrapper = () => {

  /* =======================================================
     STATE
  ======================================================= */

  const [
    locationData,
    setLocationData,
  ] = useState(null);

  const location =
    useLocation();

  const [
    isOnline,
    setIsOnline,
  ] = useState(
    navigator.onLine
  );

  const [
    deferredPrompt,
    setDeferredPrompt,
  ] = useState(null);

  const [
    showInstall,
    setShowInstall,
  ] = useState(false);

  const [
    appLoading,
    setAppLoading,
  ] = useState(true);


  /* =======================================================
     NAVBAR VISIBILITY
  ======================================================= */

  /*
    Modern ecommerce navigation:

    HOME:
      /                 -> Full Navbar

    NORMAL APP PAGES:
      /products
      /products/:id
      /category/:category
      /cart
      /wishlist
      /profile
      /order-history
      /orders/:id
      /track-order
      /contact
                        -> Compact Search Navbar

    SEARCH PAGE:
      /search
                        -> SearchPage only (no SearchNavbar)

    STANDALONE PAGES:
      /sign-in/*
      /sign-up/*
      /verify-signin
      /verify-signup-otp
      /order-success
      /legal/*
      404
                        -> No Navbar
  */
  const pathname = location.pathname;

  const isHomePage =
    pathname === "/";

  const isAuthPage =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname === "/verify-signin" ||
    pathname === "/verify-signup-otp";

  const isStandalonePage =
    pathname === "/order-success" ||
    pathname.startsWith("/legal");

  /* =========================================
     PROFILE / ACCOUNT PAGES
     No Navbar
     No SearchNavbar
  ========================================= */

  const isProfilePage =
    pathname === "/profile" ||
    pathname === "/account" ||
    pathname.startsWith("/account/");

  /* =========================================
     ECOMMERCE PAGES
  ========================================= */

  const isEcommercePage =
    isHomePage ||
    pathname === "/search" ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/category") ||
    pathname === "/cart" ||
    pathname === "/wishlist" ||
    pathname === "/order-history" ||
    pathname.startsWith("/orders") ||
    pathname === "/track-order" ||
    pathname === "/contact";

  /* =========================================
     NAVBAR VISIBILITY
  ========================================= */

  const showFullNavbar =
    isHomePage;

  const showSearchNavbar =
    !isHomePage &&
    pathname !== "/search" &&
    !isAuthPage &&
    !isStandalonePage &&
    !isProfilePage &&
    isEcommercePage;


  /* =======================================================
     APP LOADING
  ======================================================= */

  useEffect(() => {

    const timer =
      setTimeout(
        () => {
          setAppLoading(false);
        },
        2400
      );

    return () =>
      clearTimeout(timer);

  }, []);


  /* =======================================================
     ONLINE / OFFLINE
  ======================================================= */

  useEffect(() => {

    const handleOnline =
      () => setIsOnline(true);

    const handleOffline =
      () => setIsOnline(false);

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {

      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );

    };

  }, []);


  /* =======================================================
     PWA INSTALL PROMPT
  ======================================================= */

  useEffect(() => {

    const handler = (event) => {

      event.preventDefault();

      setDeferredPrompt(event);

      setTimeout(() => {

        const standalone =
          window.matchMedia(
            "(display-mode: standalone)"
          ).matches ||
          window.navigator.standalone === true;

        if (standalone) {
          return;
        }

        const last =
          Number(
            localStorage.getItem(
              "pwa_banner_time"
            )
          );

        if (
          last &&
          Date.now() - last <
          60 * 60 * 1000
        ) {
          return;
        }

        setShowInstall(true);

        localStorage.setItem(
          "pwa_banner_time",
          Date.now().toString()
        );

      }, 9000);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handler
    );

    return () => {

      window.removeEventListener(
        "beforeinstallprompt",
        handler
      );

    };

  }, []);


  /* =======================================================
     APP INSTALLED
  ======================================================= */

  useEffect(() => {

    const handleInstalled =
      () => setShowInstall(false);

    window.addEventListener(
      "appinstalled",
      handleInstalled
    );

    return () => {

      window.removeEventListener(
        "appinstalled",
        handleInstalled
      );

    };

  }, []);


  /* =======================================================
     LOCATION
  ======================================================= */

  const getLocation =
    async () => {

      if (
        !navigator.geolocation
      ) {
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {

          try {

            const {
              latitude,
              longitude,
            } = position.coords;

            const key =
              import.meta.env
                .VITE_GEOAPIFY_API_KEY;

            const response =
              await axios.get(
                `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${key}`
              );

            setLocationData(
              response.data
                .features?.[0]
                ?.properties ||
              null
            );

          } catch (error) {

            console.error(
              "Location fetch failed",
              error
            );

          }

        }
      );
    };


  /* =======================================================
     MANUAL LOCATION CHANGE
  ======================================================= */

  const onLocationChange =
    async (
      lat,
      lon
    ) => {

      try {

        const key =
          import.meta.env
            .VITE_GEOAPIFY_API_KEY;

        const response =
          await axios.get(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${key}`
          );

        const loc =
          response.data
            .features?.[0]
            ?.properties;

        setLocationData(
          loc
        );

        localStorage.setItem(
          "userLocation",
          JSON.stringify(loc)
        );

      } catch (error) {

        console.error(
          "Manual location update failed",
          error
        );

      }

    };


  /* =======================================================
     INITIALIZATION
  ======================================================= */

  useEffect(() => {

    getLocation();

    AOS.init({
      duration: 300,
      once: false,
      easing:
        "ease-in-out",
    });

  }, []);


  /* =======================================================
     INSTALL APP
  ======================================================= */

  const handleInstall =
    async () => {

      if (!deferredPrompt) {
        return;
      }

      deferredPrompt.prompt();

      await deferredPrompt.userChoice;

      setShowInstall(false);

    };


  /* =======================================================
     LOADING
  ======================================================= */

  if (appLoading) {
    return <AppLoader />;
  }


  /* =======================================================
     OFFLINE
  ======================================================= */

  if (!isOnline) {
    return <Offline />;
  }


  /* =======================================================
     MAIN APP
  ======================================================= */

  return (
    <>

      {/* ===================================================
          TOASTER
      =================================================== */}

      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,

          classNames: {

            toast:
              "bg-white/80 backdrop-blur-xl text-gray-800 border border-blue-200 rounded-xl shadow-lg px-4 py-1",

            success:
              "border-green-400/40 shadow-[0_0_25px_rgba(34,197,94,0.5)]",

            error:
              "border-red-400/40 shadow-[0_0_25px_rgba(239,68,68,0.5)]",

            warning:
              "border-yellow-400/40 shadow-[0_0_25px_rgba(250,204,21,0.5)]",

            description:
              "text-gray-300 text-xs",

            actionButton:
              "bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-md",

            cancelButton:
              "bg-white/10 text-white text-xs px-3 py-1 rounded-md",
          },
        }}
      />


      {/* ===================================================
          APP CONTAINER
      =================================================== */}

      <Suspense
        fallback={<Spinner />}
      >

        <div
          className="
            relative
            min-h-screen
            w-full
            overflow-hidden
            text-gray-800
          "
        >

          {/* =================================================
              BACKGROUND PATTERN
          ================================================= */}

          <div
            className="
              absolute
              inset-0
              bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.05)_1px,_transparent_0)]
              bg-[length:40px_40px]
              opacity-10
              -z-20
            "
          />


          {/* =================================================
              PARTICLES
          ================================================= */}

          <div
            className="
              absolute
              inset-0
              -z-10
            "
          >

            <Particles
              particleColors={[
                "#2563eb",
                "#60a5fa",
                "#93c5fd",
                "#3b82f6",
                "#1d4ed8",
              ]}
              particleCount={105}
              particleSpread={6}
              speed={0.3}
              particleBaseSize={180}
              moveParticlesOnHover
              alphaParticles
            />

          </div>


          {/* =================================================
              MAIN CONTENT
          ================================================= */}

          <div
            className="
              relative
              z-10
            "
          >


            {/* =================================================
                PWA INSTALL BANNER
            ================================================= */}

            {showInstall &&
              location.pathname === "/" && (

                <div
                  data-aos="fade-down"
                  data-aos-duration="700"
                  className="
                    fixed
                    left-1/2
                    top-20
                    z-50
                    w-full
                    max-w-md
                    -translate-x-1/2
                    px-4
                  "
                >

                  <div
                    className="
                      relative
                      overflow-hidden
                      rounded-2xl
                      border
                      border-blue-200/20
                      bg-white/60
                      shadow-[0_20px_60px_rgba(37,99,235,0.35)]
                      backdrop-blur-3xl
                    "
                  >

                    <div
                      className="
                        absolute
                        -left-16
                        -top-16
                        h-56
                        w-56
                        animate-pulse
                        rounded-full
                        bg-blue-400/30
                        blur-[120px]
                      "
                    />

                    <div
                      className="
                        absolute
                        -bottom-16
                        -right-16
                        h-56
                        w-56
                        rounded-full
                        bg-indigo-400/30
                        blur-[140px]
                      "
                    />

                    <div
                      className="
                        relative
                        z-10
                        flex
                        items-center
                        justify-between
                        gap-4
                        px-5
                        py-4
                      "
                    >

                      <div
                        className="
                          flex
                          flex-col
                        "
                      >

                        <span
                          className="
                            text-sm
                            font-semibold
                            tracking-wide
                            text-gray-800
                          "
                        >
                          Install App 🚀
                        </span>

                        <span
                          className="
                            text-xs
                            text-gray-500
                          "
                        >
                          Faster checkout ·
                          Offline access ·
                          Smooth experience
                        </span>

                      </div>


                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >

                        <button
                          type="button"
                          onClick={
                            handleInstall
                          }
                          className="
                            rounded-lg
                            bg-gradient-to-r
                            from-blue-500
                            to-indigo-600
                            px-4
                            py-1.5
                            text-xs
                            font-medium
                            text-white
                            shadow-lg
                            transition-all
                            duration-300
                            hover:scale-105
                          "
                        >
                          Install
                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            setShowInstall(
                              false
                            )
                          }
                          className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-full
                            bg-white/40
                            text-gray-600
                            backdrop-blur-md
                            transition
                            hover:bg-white/70
                            hover:text-black
                          "
                          aria-label="Close install banner"
                        >
                          ✕
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              )}


            {/* =================================================
                NAVBAR
            ================================================= */}

            {/* =================================================
                HOME NAVBAR
            ================================================= */}

            {showFullNavbar && (
              <>
                <Navbar
                  location={locationData}
                  onLocationChange={
                    onLocationChange
                  }
                />

                <div className="pt-12" />
              </>
            )}


            {/* =================================================
                COMPACT SEARCH NAVBAR
            ================================================= */}

            {showSearchNavbar && (
              <>
                <SearchNavbar />

                <div className="pt-14" />
              </>
            )}


            {/* =================================================
                ROUTES
            ================================================= */}

            <Routes>

              {/* =================================================
                  LEGAL
              ================================================= */}

              <Route
                path="/legal/:type"
                element={
                  <LegalPage />
                }
              />
              <Route
  path="/phone-login"
  element={<PhoneLogin />}
/>

              {/* =================================================
                  404
              ================================================= */}

              <Route
                path="*"
                element={
                  <NotFound />
                }
              />


              {/* =================================================
                  VERIFICATION
              ================================================= */}

              <Route
                path="/verify-signup-otp"
                element={
                  <Verify />
                }
              />
              <Route path="/product/:id/reviews"
                element={<ReviewsPage />}
              />
              <Route
                path="/verify-signin"
                element={
                  <VerifySignIn />
                }
              />


              {/* =================================================
                  AUTH
              ================================================= */}

        <Route
  path="/sign-in/*"
  element={<SignInPage />}
/>

<Route
  path="/sign-up/*"
  element={<SignUpPage />}
/>


              {/* =================================================
                  HOME
              ================================================= */}

              <Route
                path="/"
                element={
                  <Home />
                }
              />

              <Route
                path="/home"
                element={
                  <Home />
                }
              />


              {/* =================================================
                  SEARCH
              ================================================= */}

              <Route
                path="/search"
                element={
                  <SearchPage />
                }
              />


              {/* =================================================
                  PRODUCTS
              ================================================= */}

              <Route
                path="/products"
                element={
                  <Products />
                }
              />

              <Route
                path="/products/:id"
                element={
                  <SingleProduct />
                }
              />


              {/* =================================================
                  CATEGORY
              ================================================= */}

              <Route
                path="/category/:category"
                element={
                  <CategoryProduct />
                }
              />


              {/* =================================================
                  ORDER SUCCESS
              ================================================= */}

              <Route
                path="/order-success"
                element={
                  <OrderSuccess />
                }
              />


              {/* =================================================
                  PROFILE
              ================================================= */}

              <Route
                path="/profile"
                element={
                  <ProfilePage />
                }
              />

              {/* =================================================
                  ACCOUNT / PROFILE SUB-PAGES
              ================================================= */}

              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/personal-information"
                element={
                  <ProtectedRoute>
                    <PersonalInfoPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/addresses"
                element={
                  <ProtectedRoute>
                    <AddressesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/addresses/add"
                element={
                  <ProtectedRoute>
                    <AddAddressPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/addresses/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditAddressPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/orders"
                element={
                  <ProtectedRoute>
                    <AccountOrdersPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/orders/:id"
                element={
                  <ProtectedRoute>
                    <AccountOrderDetailsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/orders/:id/track"
                element={
                  <ProtectedRoute>
                    <AccountTrackOrderPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/wishlist"
                element={
                  <ProtectedRoute>
                    <AccountWishlistPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/payment-methods"
                element={
                  <ProtectedRoute>
                    <PaymentMethodsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/security"
                element={
                  <ProtectedRoute>
                    <SecurityPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/help"
                element={
                  <ProtectedRoute>
                    <HelpSupportPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/legal"
                element={
                  <ProtectedRoute>
                    <AccountLegalPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/delete"
                element={
                  <ProtectedRoute>
                    <DeleteAccountPage />
                  </ProtectedRoute>
                }
              />


              {/* =================================================
                  ORDER HISTORY
              ================================================= */}

              <Route
                path="/order-history"
                element={
                  <ProtectedRoute>
                    <OrderHistory />
                  </ProtectedRoute>
                }
              />


              {/* =================================================
                  SINGLE ORDER
              ================================================= */}

              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <SingleOrderPage />
                  </ProtectedRoute>
                }
              />


              {/* =================================================
                  WISHLIST
              ================================================= */}

              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <WishlistPage />
                  </ProtectedRoute>
                }
              />


              {/* =================================================
                  CONTACT
              ================================================= */}

              <Route
                path="/contact"
                element={
                  <ProtectedRoute>
                    <Contact />
                  </ProtectedRoute>
                }
              />


              {/* =================================================
                  CART
              ================================================= */}

              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <Cart
                      location={
                        locationData
                      }
                      getLocation={
                        getLocation
                      }
                      onLocationChange={
                        onLocationChange
                      }
                    />
                  </ProtectedRoute>
                }
              />


              {/* =================================================
                  TRACK ORDER
              ================================================= */}

              <Route
                path="/track-order"
                element={
                  <ProtectedRoute>
                    <TrackOrder />
                  </ProtectedRoute>
                }
              />

            </Routes>

          </div>

        </div>

      </Suspense>

    </>
  );
};


/* =========================================================
   ROOT APP
========================================================= */

export default function App() {

  return (
    <BrowserRouter>

      <Suspense
        fallback={null}
      >
        <ScrollToTop />
      </Suspense>

      <AppWrapper />

    </BrowserRouter>
  );
}