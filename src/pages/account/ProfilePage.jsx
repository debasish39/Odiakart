import React, { useState } from "react";



import {

  useQuery,

  useQueryClient,

} from "@tanstack/react-query";



import {

  FaUser,

  FaMapMarkerAlt,

  FaShoppingBag,

  FaHeart,

  FaBell,

  FaQuestionCircle,

  FaSignOutAlt,

  FaTrash,

  FaChevronRight,

  FaShieldAlt,

  FaTimes,

  FaGift,

  FaCreditCard,

  FaWallet,

  FaLock,

  FaMobileAlt,

  FaInstagram,

  FaYoutube,

  FaLinkedin,

  FaHeadset,

  FaEdit,

  FaStore,

} from "react-icons/fa";



import {

  MdOutlineLocalOffer,

  MdPayment,

  MdSecurity,

  MdHelpOutline,

} from "react-icons/md";



import { useNavigate } from "react-router-dom";



import {

  AccountShell,

  api,

} from "./AccountShell";



/* =========================================================

   PROFILE PAGE

\========================================================= */



export default function ProfilePage() {

  const navigate = useNavigate();

  const queryClient = useQueryClient();



  const [showSignOutModal, setShowSignOutModal] =

    useState(false);



  const [signingOut, setSigningOut] =

    useState(false);



  const token = localStorage.getItem("token");



  /* =========================================================

     CURRENT USER

  ========================================================= */



  const {

    data: user = null,

    isLoading: loading,

    error: userError,

  } = useQuery({

    queryKey: ["currentUser", token],



    queryFn: async () => {

      const data = await api("/api/auth/me");



      console.log("PROFILE USER RESPONSE:", data);



      if (!data?.success) {

        throw new Error(

          data?.message || "Failed to load profile"

        );

      }



      return data.user;

    },



    enabled: !!token,



    staleTime: 5 * 60 * 1000,



    gcTime: 15 * 60 * 1000,



    refetchOnWindowFocus: false,



    retry: 1,

  });



  /* =========================================================

     RECENTLY VIEWED

  ========================================================= */



  const {

    data: recentlyViewedData,

    isLoading: recentlyViewedLoading,

  } = useQuery({

    queryKey: ["recentlyViewed", token],



    queryFn: async () => {

      const BACKEND_URL =

        import.meta.env.VITE_BACKEND_URL;



      if (!BACKEND_URL) {

        throw new Error(

          "VITE_BACKEND_URL is not configured"

        );

      }



      const response = await fetch(

        `${BACKEND_URL}/api/products/recently-viewed`,

        {

          method: "GET",



          credentials: "include",



          headers: {

            Accept: "application/json",

          },

        }

      );



      const data = await response.json();



      if (!response.ok || !data?.success) {

        throw new Error(

          data?.message ||

            "Failed to load recently viewed products"

        );

      }



      return data;

    },



    enabled: !!token,



    staleTime: 0,



    gcTime: 5 * 60 * 1000,



    refetchOnMount: "always",



    refetchOnWindowFocus: true,



    retry: 1,



    onError: (error) => {

      console.error(

        "RECENTLY VIEWED GET ERROR:",

        error

      );

    },

  });



  const recentlyViewedProducts =

    Array.isArray(

      recentlyViewedData?.products

    )

      ? recentlyViewedData.products

      : [];



  /* =========================================================

     LOGOUT

  ========================================================= */



  const handleSignOut = () => {

    setSigningOut(true);



    queryClient.removeQueries({

      queryKey: ["currentUser", token],

    });



    queryClient.removeQueries({

      queryKey: ["wishlist", token],

    });



    queryClient.removeQueries({

      queryKey: ["cart", token],

    });



    queryClient.removeQueries({

      queryKey: ["recentlyViewed", token],

    });



    localStorage.removeItem("token");



    setTimeout(() => {

      navigate("/sign-in", {

        replace: true,

      });

    }, 350);

  };



  /* =========================================================

     LOADING

  ========================================================= */



  if (loading && !user) {

    return (

      <AccountShell title="Account">
      <style>{`
  .odikart-profile-modern {
    --odi-indigo: #4f46e5;
    --odi-purple: #7c3aed;
    --odi-blue: #2563eb;
    background:
      radial-gradient(circle at 8% 5%, rgba(99,102,241,.16), transparent 26%),
      radial-gradient(circle at 92% 12%, rgba(168,85,247,.15), transparent 28%),
      radial-gradient(circle at 50% 100%, rgba(37,99,235,.12), transparent 34%),
      #eef2ff;
  }

  .odikart-profile-modern::before,
  .odikart-profile-modern::after {
    content: "";
    position: fixed;
    pointer-events: none;
    z-index: 0;
    border-radius: 999px;
    filter: blur(55px);
    opacity: .28;
  }

  .odikart-profile-modern::before {
    width: 180px;
    height: 180px;
    top: 12%;
    left: -70px;
    background: #8b5cf6;
    animation: odikartFloat 7s ease-in-out infinite;
  }

  .odikart-profile-modern::after {
    width: 210px;
    height: 210px;
    right: -90px;
    top: 45%;
    background: #3b82f6;
    animation: odikartFloat 9s ease-in-out infinite reverse;
  }

  .odikart-profile-modern > * {
    position: relative;
    z-index: 1;
  }

  .odikart-profile-modern section,
  .odikart-profile-modern .group {
    transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  }

  .odikart-profile-modern section {
    border-color: rgba(99,102,241,.12) !important;
  }

  .odikart-profile-modern main > section:first-child {
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(135deg, rgba(79,70,229,.97), rgba(124,58,237,.94) 48%, rgba(37,99,235,.96));
    color: white;
    border: 1px solid rgba(255,255,255,.22) !important;
    box-shadow: 0 18px 50px rgba(79,70,229,.20);
  }

  .odikart-profile-modern main > section:first-child::before {
    content: "";
    position: absolute;
    inset: -70%;
    background: linear-gradient(
      115deg,
      transparent 42%,
      rgba(255,255,255,.06) 47%,
      rgba(255,255,255,.45) 50%,
      rgba(255,255,255,.06) 53%,
      transparent 58%
    );
    transform: translateX(-55%);
    animation: odikartShine 5s ease-in-out infinite;
  }

  .odikart-profile-modern main > section:first-child::after {
    content: "✦  ✧  ✦";
    position: absolute;
    right: 7%;
    top: 18%;
    color: rgba(255,255,255,.55);
    font-size: 15px;
    letter-spacing: 13px;
    animation: odikartSparkle 2.8s ease-in-out infinite;
    pointer-events: none;
  }

  .odikart-profile-modern main > section:first-child > * {
    position: relative;
    z-index: 1;
  }

  .odikart-profile-modern main > section:first-child h2,
  .odikart-profile-modern main > section:first-child p {
    color: white !important;
  }

  .odikart-profile-modern main > section:first-child .bg-green-50 {
    background: rgba(255,255,255,.18) !important;
    color: white !important;
  }

  .odikart-profile-modern .relative.h-16.w-16.shrink-0 {
    filter: drop-shadow(0 0 13px rgba(255,255,255,.42));
  }

  .odikart-profile-modern .relative.h-16.w-16.shrink-0::before {
    content: "";
    position: absolute;
    inset: -5px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.65);
    animation: odikartAvatarGlow 2.4s ease-in-out infinite;
    pointer-events: none;
  }

  .odikart-profile-modern main > section:first-child button {
    border-color: rgba(255,255,255,.55) !important;
    color: white !important;
    background: rgba(255,255,255,.10);
    backdrop-filter: blur(10px);
    transition: all .25s ease;
  }

  .odikart-profile-modern main > section:first-child button:hover {
    background: rgba(255,255,255,.22) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(0,0,0,.12);
  }

  .odikart-profile-modern main > section:not(:first-child),
  .odikart-profile-modern main > div > section {
    box-shadow: 0 8px 30px rgba(79,70,229,.06);
    backdrop-filter: blur(8px);
  }

  .odikart-profile-modern .grid.grid-cols-3 > button {
    position: relative;
    overflow: hidden;
    background: rgba(255,255,255,.92);
  }

  .odikart-profile-modern .grid.grid-cols-3 > button::after {
    content: "";
    position: absolute;
    width: 70px;
    height: 140%;
    top: -20%;
    left: -100px;
    transform: rotate(20deg);
    background: linear-gradient(90deg, transparent, rgba(124,58,237,.16), transparent);
    transition: left .55s ease;
  }

  .odikart-profile-modern .grid.grid-cols-3 > button:hover::after {
    left: 130%;
  }

  .odikart-profile-modern .grid.grid-cols-3 > button:hover {
    color: #4f46e5;
    background: #faf9ff;
  }

  .odikart-profile-modern .group:hover {
    transform: translateX(3px);
  }

  .odikart-profile-modern button[class*="w-[150px]"] {
    border-color: rgba(99,102,241,.16);
    border-radius: 14px;
    box-shadow: 0 7px 22px rgba(79,70,229,.06);
  }

  .odikart-profile-modern button[class*="w-[150px]"]:hover {
    transform: translateY(-4px);
    border-color: rgba(124,58,237,.32);
    box-shadow: 0 13px 30px rgba(79,70,229,.15);
  }

  .odikart-profile-modern button[class*="w-[150px]"] img {
    transition: transform .4s ease, filter .4s ease;
  }

  .odikart-profile-modern button[class*="w-[150px]"]:hover img {
    transform: scale(1.07);
    filter: saturate(1.08);
  }

  .odikart-profile-modern .text-\\[\\#2874f0\\] {
    color: var(--odi-indigo) !important;
  }

  .odikart-profile-modern .bg-\\[\\#2874f0\\] {
    background: linear-gradient(135deg, var(--odi-indigo), var(--odi-purple), var(--odi-blue)) !important;
  }

  .odikart-profile-modern section button[class*="border-indigo-500"] {
    border-color: rgba(79,70,229,.45) !important;
    color: var(--odi-indigo) !important;
  }

  .odikart-profile-modern section button[class*="border-indigo-500"]:hover {
    background: linear-gradient(135deg, rgba(79,70,229,.08), rgba(124,58,237,.10)) !important;
  }

  .odikart-profile-modern [role="dialog"] {
    overflow: hidden;
    border: 1px solid rgba(124,58,237,.18);
    box-shadow: 0 25px 80px rgba(30,27,75,.28);
  }

  .odikart-profile-modern [role="dialog"] > div:first-child {
    background: linear-gradient(90deg, #4f46e5, #7c3aed, #2563eb) !important;
  }

  .odikart-profile-modern [role="dialog"] .bg-blue-50 {
    background: #eef2ff !important;
  }

  .odikart-profile-modern [role="dialog"] button.bg-\\[\\#2874f0\\] {
    background: linear-gradient(135deg, #4f46e5, #7c3aed, #2563eb) !important;
    box-shadow: 0 7px 20px rgba(79,70,229,.25);
  }

  @keyframes odikartShine {
    0%, 25% { transform: translateX(-55%); }
    65%, 100% { transform: translateX(55%); }
  }

  @keyframes odikartSparkle {
    0%, 100% { opacity: .25; transform: translateY(0) scale(.9); }
    50% { opacity: .9; transform: translateY(-5px) scale(1.12); }
  }

  @keyframes odikartAvatarGlow {
    0%, 100% { opacity: .35; transform: scale(.98); }
    50% { opacity: 1; transform: scale(1.07); }
  }

  @keyframes odikartFloat {
    0%, 100% { transform: translateY(0) translateX(0); }
    50% { transform: translateY(-20px) translateX(12px); }
  }

  @media (max-width: 640px) {
    .odikart-profile-modern main > section:first-child::after {
      right: 4%;
      top: 12%;
      font-size: 11px;
      letter-spacing: 8px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .odikart-profile-modern *,
    .odikart-profile-modern::before,
    .odikart-profile-modern::after {
      animation: none !important;
      transition: none !important;
    }
  }
`}</style>

        <ProfileSkeleton />

      </AccountShell>

    );

  }



  /* =========================================================

     ERROR

  ========================================================= */



  if (userError && !user) {

    return (

      <AccountShell title="Account">

        <div className="flex min-h-[65vh] w-full items-center justify-center bg-[#f1f3f6] px-4">

          <div className="w-full max-w-md bg-white p-8 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">

              <FaUser size={19} />

            </div>



            <h2 className="mt-5 text-lg font-semibold text-slate-900">

              Unable to load your profile

            </h2>



            <p className="mt-2 text-sm leading-5 text-slate-500">

              Something went wrong while loading

              your account details.

            </p>



            <button

              type="button"

              onClick={() =>

                queryClient.invalidateQueries({

                  queryKey: [

                    "currentUser",

                    token,

                  ],

                })

              }

              className="mt-6 h-11 rounded-md bg-indigo-600 px-7 text-sm font-semibold text-white hover:bg-[#1769e8]"

            >

              Try again

            </button>

          </div>

        </div>

      </AccountShell>

    );

  }



  /* =========================================================

     USER INFORMATION

  ========================================================= */



  const name =

    [

      user?.firstName,

      user?.lastName,

    ]

      .filter(Boolean)

      .join(" ") || "Odikart User";



  const firstName =

    user?.firstName ||

    name.split(" ")[0] ||

    "there";



  const email =

    user?.email || "";



  const phone =

    user?.phone ||

    user?.phoneNumber ||

    "";



  /* =========================================================

     PROFILE IMAGE



     MongoDB:

     image: "https\://res.cloudinary.com/..."

  ========================================================= */



  const profileImage =

    typeof user?.image === "string" &&

    user.image.trim().length > 0

      ? user.image.trim()

      : null;



  console.log(

    "PROFILE IMAGE:",

    profileImage

  );



  /* =========================================================

     MAIN

  ========================================================= */



  return (

    <AccountShell title="Account">

      <div className="odikart-profile-modern relative min-h-screen w-full overflow-hidden bg-[#eef2ff] pb-20 text-slate-800">



        {/* =================================================

            MAIN FULL WIDTH

        ================================================= */}



        <main className="w-full px-0">



          {/* =================================================

              PROFILE

          ================================================= */}



          <section className="w-full border-b border-slate-200 bg-white">



            <div className="flex w-full items-center gap-4 px-4 py-5 sm:px-8 lg:px-12">



              {/* PROFILE IMAGE */}



              <div className="relative h-16 w-16 shrink-0">



                {profileImage ? (

                  <img

                    src={profileImage}

                    alt={name}

                    className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-md"

                    referrerPolicy="no-referrer"

                    loading="eager"

                    onError={(event) => {

                      console.error(

                        "PROFILE IMAGE FAILED:",

                        profileImage

                      );



                      event.currentTarget.style.display =

                        "none";



                      if (

                        event.currentTarget

                          .nextElementSibling

                      ) {

                        event.currentTarget

                          .nextElementSibling.style.display =

                          "flex";

                      }

                    }}

                  />

                ) : null}



                {/* FALLBACK */}



                <div

                  className={`${

                    profileImage

                      ? "hidden"

                      : "flex"

                  } h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-lg font-bold text-white shadow-lg`}

                >

                  {getInitials(name)}

                </div>



                {/* VERIFIED */}



                {user?.isVerified && (

                  <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-green-500">

                    <span className="text-[7px] font-bold text-white">

                      ✓

                    </span>

                  </span>

                )}

              </div>



              {/* USER DETAILS */}



              <div className="min-w-0 flex-1">



                <div className="flex items-center gap-2">



                  <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">

                    Hello, {firstName}

                  </h2>



                  {user?.isVerified && (

                    <span className="hidden rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-semibold text-green-600 sm:inline-block">

                      Verified

                    </span>

                  )}

                </div>



                {email && (

                  <p className="mt-1 truncate text-xs text-slate-500">

                    {email}

                  </p>

                )}



                {phone && (

                  <p className="mt-0.5 text-xs text-slate-500">

                    {phone}

                  </p>

                )}

              </div>



              {/* EDIT */}



              <button

                type="button"

                onClick={() =>

                  navigate(

                    "/account/personal-information"

                  )

                }

                className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-indigo-500 px-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"

              >

                <FaEdit size={10} />



                <span className="hidden sm:inline">

                  Edit Profile

                </span>



                <span className="sm:hidden">

                  Edit

                </span>

              </button>



            </div>



            {/* =================================================

                QUICK ACTIONS

            ================================================= */}



            <div className="grid grid-cols-3 border-t border-slate-100">



              <MiniStat

                icon={<FaShoppingBag />}

                label="Orders"

                onClick={() =>

                  navigate("/account/orders")

                }

              />



              <MiniStat

                icon={<FaHeart />}

                label="Wishlist"

                onClick={() =>

                  navigate("/account/wishlist")

                }

              />



              <MiniStat

                icon={<MdOutlineLocalOffer />}

                label="Coupons"

                onClick={() =>

                  navigate("/coupons")

                }

              />



            </div>



          </section>



          {/* =================================================

              RECENTLY VIEWED

          ================================================= */}



          {(recentlyViewedLoading ||

            recentlyViewedProducts.length > 0) && (



            <section className="mt-3 w-full border-y border-slate-200 bg-white">



              <SectionHeader

                title="Recently Viewed"

                subtitle="Continue shopping from where you left off"

                action={

                  recentlyViewedProducts.length >

                  0

                    ? "View All"

                    : null

                }

                onAction={() =>

                  navigate("/products")

                }

              />



              {recentlyViewedLoading ? (

                <div className="flex gap-3 overflow-hidden px-4 pb-5 sm:px-6">



                  {[1, 2, 3, 4, 5].map(

                    (item) => (

                      <div

                        key={item}

                        className="w-[150px] shrink-0 overflow-hidden border border-slate-100"

                      >

                        <div className="aspect-square animate-pulse bg-slate-100" />



                        <div className="p-3">

                          <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />



                          <div className="mt-2 h-2.5 w-14 animate-pulse rounded bg-slate-100" />



                          <div className="mt-3 h-3 w-12 animate-pulse rounded bg-slate-100" />

                        </div>

                      </div>

                    )

                  )}



                </div>

              ) : (

                <div className="flex gap-3 overflow-x-auto px-4 pb-5 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">



                  {recentlyViewedProducts.map(

                    (product) => {



                      const productId =

                        product?._id ||

                        product?.id;



                      if (!productId) {

                        return null;

                      }



                      const images = [

                        product?.media

                          ?.thumbnail,



                        ...(Array.isArray(

                          product?.media?.images

                        )

                          ? product.media.images

                          : []),



                        ...(Array.isArray(

                          product?.images

                        )

                          ? product.images

                          : []),



                        ...(Array.isArray(

                          product?.variants

                        )

                          ? product.variants.flatMap(

                              (variant) =>

                                Array.isArray(

                                  variant?.images

                                )

                                  ? variant.images

                                  : []

                            )

                          : []),



                        product?.image,



                        product?.thumbnail,

                      ].filter(Boolean);



                      const image =

                        images[0] ||

                        "https\://via.placeholder.com/400x400?text=Product";



                      const productName =

                        product?.title ||

                        product?.name ||

                        "Product";



                      const activeVariant =

                        Array.isArray(

                          product?.variants

                        )

                          ? product.variants.find(

                              (variant) =>

                                variant?.isActive !==

                                false

                            ) ||

                            product.variants[0]

                          : null;



                      const price =

                        activeVariant?.price ??

                        product?.price ??

                        null;



                      const category =

                        product?.category?.name ||

                        product?.categoryName ||

                        product?.category ||

                        "";



                      return (

                        <button

                          key={productId}

                          type="button"

                          onClick={() =>

                            navigate(

                              `/products/${productId}`

                            )

                          }

                          className="group w-[150px] shrink-0 overflow-hidden border border-slate-200 bg-white text-left transition hover:shadow-md"

                        >

                          <div className="relative aspect-square overflow-hidden bg-slate-50">



                            <img

                              src={image}

                              alt={productName}

                              loading="lazy"

                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"

                              onError={(event) => {

                                event.currentTarget.src =

                                  "https\://via.placeholder.com/400x400?text=Product";

                              }}

                            />



                            <span className="absolute left-2 top-2 bg-white px-1.5 py-1 text-[8px] font-medium text-slate-600 shadow-sm">

                              Viewed

                            </span>



                          </div>



                          <div className="p-3">



                            <p className="line-clamp-2 min-h-[32px] text-xs font-medium leading-4 text-slate-800">

                              {productName}

                            </p>



                            {category && (

                              <p className="mt-1 truncate text-[10px] text-slate-400">

                                {category}

                              </p>

                            )}



                            {price !== null && (

                              <p className="mt-2 text-sm font-semibold text-slate-900">

                                ₹

                                {Number(

                                  price

                                ).toLocaleString(

                                  "en-IN"

                                )}

                              </p>

                            )}



                          </div>

                        </button>

                      );

                    }

                  )}



                </div>

              )}



            </section>

          )}



          {/* =================================================

              ACCOUNT SETTINGS

          ================================================= */}



          <AccountGroup

            title="Account Settings"

            icon={<FaUser />}

          >



            <AccountRow

              icon={<FaUser />}

              title="Personal Information"

              description="Name, phone number and profile details"

              color="blue"

              onClick={() =>

                navigate(

                  "/account/personal-information"

                )

              }

            />



            <AccountRow

              icon={<FaMapMarkerAlt />}

              title="Saved Addresses"

              description="Manage your delivery addresses"

              color="cyan"

              onClick={() =>

                navigate("/account/addresses")

              }

            />



            <AccountRow

              icon={<FaBell />}

              title="Notification Settings"

              description="Manage alerts, updates and offers"

              color="orange"

              onClick={() =>

                navigate("/account/notifications")

              }

            />



          </AccountGroup>



          {/* =================================================

              PAYMENTS

          ================================================= */}



          <AccountGroup

            title="Payments & Wallet"

            icon={<MdPayment />}

          >



            <AccountRow

              icon={<FaGift />}

              title="Gift Cards"

              description="Add or manage your gift cards"

              color="purple"

              onClick={() =>

                navigate("/account/gift-card")

              }

            />



            <AccountRow

              icon={<FaCreditCard />}

              title="Saved Payment Methods"

              description="Manage cards and payment preferences"

              color="indigo"

              onClick={() =>

                navigate(

                  "/account/payment-methods"

                )

              }

            />



            <AccountRow

              icon={<FaWallet />}

              title="Odikart Wallet"

              description="View balance and wallet activity"

              color="green"

              onClick={() =>

                navigate("/account/wallet")

              }

            />



          </AccountGroup>



          {/* =================================================

              PRIVACY

          ================================================= */}



          <AccountGroup

            title="Privacy & Security"

            icon={<MdSecurity />}

          >



            <AccountRow

              icon={<FaLock />}

              title="Privacy Center"

              description="Control your privacy preferences"

              color="blue"

              onClick={() =>

                navigate("/account/privacy")

              }

            />



            <AccountRow

              icon={<FaMobileAlt />}

              title="Manage Devices"

              description="Review active signed-in devices"

              color="slate"

              rightLabel="Active devices"

              onClick={() =>

                navigate("/account/devices")

              }

            />



            <AccountRow

              icon={<FaShieldAlt />}

              title="Terms, Policies & Licences"

              description="Read Odikart's legal information"

              color="gray"

              onClick={() =>

                navigate("/account/legal")

              }

            />



          </AccountGroup>



          {/* =================================================

              MORE

          ================================================= */}



          <AccountGroup

            title="More"

            icon={<FaStore />}

          >



            <AccountRow

              icon={<FaStore />}

              title="Sell on Odikart"

              description="Start selling your products"

              color="blue"

              rightLabel="Start Selling"

              onClick={() =>

                navigate("/seller")

              }

            />



            <AccountRow

              icon={<FaQuestionCircle />}

              title="FAQs"

              description="Frequently asked questions"

              color="cyan"

              onClick={() =>

                navigate("/faq")

              }

            />



            <AccountRow

              icon={<FaQuestionCircle />}

              title="Questions & Answers"

              description="Your product questions and answers"

              color="indigo"

              onClick={() =>

                navigate(

                  "/account/questions"

                )

              }

            />



            <AccountRow

              icon={<FaHeart />}

              title="Wishlist Activity"

              description="Recently saved products"

              color="red"

              onClick={() =>

                navigate("/account/wishlist")

              }

            />



          </AccountGroup>



          {/* =================================================

              SUPPORT

          ================================================= */}



          <section className="mt-3 w-full border-y border-slate-200 bg-white">



            <div className="px-4 py-4 sm:px-6">



              <div className="flex items-center gap-3">



                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">

                  <FaHeadset size={14} />

                </div>



                <div>

                  <h3 className="text-sm font-semibold text-slate-900">

                    Need Help?

                  </h3>



                  <p className="mt-0.5 text-[10px] text-slate-500">

                    We're here to help you

                  </p>

                </div>



              </div>



              <div className="mt-4 grid grid-cols-2 gap-2">



                <button

                  type="button"

                  onClick={() =>

                    navigate("/account/help")

                  }

                  className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"

                >

                  <FaHeadset

                    size={11}

                    className="text-indigo-600"

                  />



                  Help Center

                </button>



                <button

                  type="button"

                  onClick={() =>

                    navigate("/faq")

                  }

                  className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"

                >

                  <MdHelpOutline

                    size={15}

                    className="text-indigo-600"

                  />



                  FAQs

                </button>



              </div>



            </div>



          </section>



          {/* =================================================

              SOCIAL

          ================================================= */}



          <section className="mt-3 w-full border-y border-slate-200 bg-white p-4 sm:px-6">



            <p className="text-xs font-semibold text-slate-700">

              Follow Odikart

            </p>



            <div className="mt-3 grid grid-cols-3 gap-2">



              <SocialButton

                icon={<FaInstagram />}

                label="Instagram"

              />



              <SocialButton

                icon={<FaYoutube />}

                label="YouTube"

              />



              <SocialButton

                icon={<FaLinkedin />}

                label="LinkedIn"

              />



            </div>



          </section>



          {/* =================================================

              LOGOUT

          ================================================= */}



          <section className="mt-3 w-full border-y border-slate-200 bg-white p-4 sm:px-6">



            <button

              type="button"

              onClick={() =>

                setShowSignOutModal(true)

              }

              className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-indigo-500 bg-white text-sm font-semibold text-indigo-600 hover:bg-indigo-50"

            >

              <FaSignOutAlt size={13} />



              Logout

            </button>



            <p className="mt-3 text-center text-[10px] text-slate-400">

              Odikart • v1.0.0

            </p>



          </section>



          {/* =================================================

              DELETE ACCOUNT

          ================================================= */}



          <section className="w-full px-4 pb-8 pt-4 text-center">



            <button

              type="button"

              onClick={() =>

                navigate("/account/delete")

              }

              className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-red-500"

            >

              <FaTrash size={9} />



              Delete account

            </button>



          </section>



        </main>



        {/* =================================================

            LOGOUT MODAL

        ================================================= */}



        {showSignOutModal && (

          <div

            className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 sm:items-center sm:p-5"

            onMouseDown={(event) => {

              if (

                event.target ===

                  event.currentTarget &&

                !signingOut

              ) {

                setShowSignOutModal(false);

              }

            }}

          >



            <div

              role="dialog"

              aria-modal="true"

              className="relative w-full rounded-t-2xl bg-white shadow-2xl sm:max-w-[420px] sm:rounded-lg"

              onMouseDown={(event) =>

                event.stopPropagation()

              }

            >



              <div className="h-1 w-full bg-indigo-600" />



              <div className="p-6">



                <button

                  type="button"

                  onClick={() =>

                    setShowSignOutModal(false)

                  }

                  disabled={signingOut}

                  className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"

                >

                  <FaTimes size={11} />

                </button>



                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">

                  <FaSignOutAlt size={17} />

                </div>



                <h2 className="mt-4 text-lg font-semibold text-slate-900">

                  Logout from Odikart?

                </h2>



                <p className="mt-2 text-xs leading-5 text-slate-500">

                  You can sign back in anytime using

                  your account credentials.

                </p>



                <div className="mt-4 flex gap-2 rounded-md bg-blue-50 p-3">



                  <FaShieldAlt

                    className="mt-0.5 shrink-0 text-indigo-600"

                    size={12}

                  />



                  <p className="text-[10px] leading-4 text-slate-600">

                    Your account data will remain safe.

                  </p>



                </div>



                <div className="mt-5 grid grid-cols-2 gap-2">



                  <button

                    type="button"

                    onClick={() =>

                      setShowSignOutModal(false)

                    }

                    disabled={signingOut}

                    className="h-11 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"

                  >

                    Cancel

                  </button>



                  <button

                    type="button"

                    onClick={handleSignOut}

                    disabled={signingOut}

                    className="flex h-11 items-center justify-center gap-2 rounded-md bg-indigo-600 text-xs font-semibold text-white disabled:opacity-60"

                  >

                    {signingOut ? (

                      <>

                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />



                        Logging out...

                      </>

                    ) : (

                      <>

                        <FaSignOutAlt size={11} />



                        Logout

                      </>

                    )}

                  </button>



                </div>



              </div>



            </div>



          </div>

        )}



      </div>

    </AccountShell>

  );

}



/* =========================================================

   GET INITIALS

\========================================================= */



function getInitials(name = "") {

  const initials = name

    .split(" ")

    .filter(Boolean)

    .slice(0, 2)

    .map((item) =>

      item.charAt(0).toUpperCase()

    )

    .join("");



  return initials || "O";

}



/* =========================================================

   MINI STAT

\========================================================= */



function MiniStat({

  icon,

  label,

  onClick,

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      className="flex h-16 items-center justify-center gap-2 border-r border-slate-100 text-xs font-medium text-slate-700 last:border-r-0 hover:bg-slate-50"

    >

      <span className="text-indigo-600">

        {icon}

      </span>



      {label}



      <FaChevronRight

        size={7}

        className="text-slate-300"

      />

    </button>

  );

}



/* =========================================================

   SECTION HEADER

\========================================================= */



function SectionHeader({

  title,

  subtitle,

  action,

  onAction,

}) {

  return (

    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">



      <div>

        <h2 className="text-sm font-semibold text-slate-900">

          {title}

        </h2>



        {subtitle && (

          <p className="mt-0.5 text-[10px] text-slate-400">

            {subtitle}

          </p>

        )}

      </div>



      {action && (

        <button

          type="button"

          onClick={onAction}

          className="flex items-center gap-1 text-xs font-semibold text-indigo-600"

        >

          {action}



          <FaChevronRight size={7} />

        </button>

      )}



    </div>

  );

}



/* =========================================================

   ACCOUNT GROUP

\========================================================= */



function AccountGroup({

  title,

  icon,

  children,

}) {

  return (

    <section className="mt-3 w-full border-y border-slate-200 bg-white">



      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3.5 sm:px-6">



        <span className="text-indigo-600">

          {icon}

        </span>



        <h2 className="text-sm font-semibold text-slate-900">

          {title}

        </h2>



      </div>



      <div>

        {children}

      </div>



    </section>

  );

}



/* =========================================================

   ACCOUNT ROW

\========================================================= */



function AccountRow({

  icon,

  title,

  description,

  color = "blue",

  rightLabel,

  onClick,

}) {

  const colorMap = {

    blue:

      "bg-blue-50 text-blue-600",



    cyan:

      "bg-cyan-50 text-cyan-600",



    orange:

      "bg-orange-50 text-orange-600",



    purple:

      "bg-purple-50 text-purple-600",



    indigo:

      "bg-indigo-50 text-indigo-600",



    green:

      "bg-green-50 text-green-600",



    slate:

      "bg-slate-100 text-slate-600",



    gray:

      "bg-gray-100 text-gray-600",



    red:

      "bg-red-50 text-red-600",

  };



  return (

    <button

      type="button"

      onClick={onClick}

      className="group flex min-h-[68px] w-full items-center gap-3 border-b border-slate-100 px-4 text-left last:border-b-0 hover:bg-slate-50 active:bg-slate-100 sm:px-6"

    >



      {/* ICON */}



      <span

        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs ${

          colorMap[color] ||

          colorMap.blue

        }`}

      >

        {icon}

      </span>



      {/* CONTENT */}



      <span className="min-w-0 flex-1">



        <span className="block truncate text-xs font-medium text-slate-800 sm:text-[13px]">

          {title}

        </span>



        <span className="mt-0.5 block truncate text-[10px] text-slate-400 sm:text-[11px]">

          {description}

        </span>



      </span>



      {/* OPTIONAL LABEL */}



      {rightLabel && (

        <span className="hidden rounded-sm bg-blue-50 px-2 py-1 text-[9px] font-semibold text-indigo-600 sm:block">

          {rightLabel}

        </span>

      )}



      {/* ARROW */}



      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-300 group-hover:text-indigo-600">

        <FaChevronRight size={9} />

      </span>



    </button>

  );

}



/* =========================================================

   SOCIAL BUTTON

\========================================================= */



function SocialButton({

  icon,

  label,

}) {

  return (

    <button

      type="button"

      className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-[10px] font-medium text-slate-600 hover:bg-slate-50"

    >

      <span className="text-sm text-slate-700">

        {icon}

      </span>



      {label}

    </button>

  );

}



/* =========================================================

   PROFILE SKELETON

\========================================================= */



function ProfileSkeleton() {

  return (

    <div className="min-h-screen w-full bg-[#f1f3f6]">



      <div className="border-b border-slate-200 bg-white px-4 py-5">

        <Skeleton className="h-5 w-28 rounded" />



        <Skeleton className="mt-2 h-3 w-48 rounded" />

      </div>



      <div className="w-full bg-white p-5">



        <div className="flex items-center gap-4">



          <Skeleton className="h-16 w-16 rounded-full" />



          <div className="flex-1">



            <Skeleton className="h-4 w-32 rounded" />



            <Skeleton className="mt-2 h-3 w-44 rounded" />



            <Skeleton className="mt-2 h-3 w-32 rounded" />



          </div>



          <Skeleton className="h-9 w-16 rounded" />



        </div>



      </div>



      <div className="grid grid-cols-3 bg-white">



        {[1, 2, 3].map(

          (item) => (

            <Skeleton

              key={item}

              className="h-16 rounded-none border-r border-white"

            />

          )

        )}



      </div>



      <div className="space-y-3 pt-3">



        {[4, 3, 3, 4].map(

          (rows, sectionIndex) => (



            <section

              key={sectionIndex}

              className="overflow-hidden bg-white"

            >



              <div className="px-4 py-4">

                <Skeleton

                  className="h-3 w-28 rounded"

                />

              </div>



              {Array.from({

                length: rows,

              }).map((_, index) => (



                <div

                  key={index}

                  className="flex min-h-[68px] items-center gap-3 border-t border-slate-100 px-4"

                >



                  <Skeleton className="h-9 w-9 rounded-full" />



                  <div className="flex-1">



                    <Skeleton className="h-2.5 w-32 rounded" />



                    <Skeleton className="mt-2 h-2 w-48 rounded" />



                  </div>



                  <Skeleton className="h-4 w-2 rounded" />



                </div>



              ))}



            </section>



          )

        )}



      </div>



    </div>

  );

}



/* =========================================================

   SKELETON

\========================================================= */



function Skeleton({

  className = "",

}) {

  return (

    <div

      className={`animate-pulse bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 ${className}`}

    />

  );

}