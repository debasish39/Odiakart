import React, { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";

import {
  FaRegTrashAlt,
  FaCheckCircle,
  FaHistory,
  FaWallet,
  FaCreditCard,
  FaUser,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaEnvelope,
  FaShieldAlt,
  FaShoppingBag,
  FaHome,
  FaHeart,
  FaUserCircle,
  FaCheck,
  FaThLarge,
} from "react-icons/fa";
import {
  FiShoppingBag,
  FiMapPin,
  FiCreditCard,
} from "react-icons/fi";
import {
  MdPayments,
  MdLocationCity,
  MdMyLocation,
} from "react-icons/md";

import { GiShoppingBag } from "react-icons/gi";

import {
  AiOutlinePlus,
  AiOutlineMinus,
  AiFillEnvironment,
} from "react-icons/ai";

import {
  FiEdit2,
  FiTrash2,
  FiStar,
  FiPlus,
  FiCheck,

} from "react-icons/fi";

import {
  IoArrowForward,
  IoArrowBack,
} from "react-icons/io5";

import { BsTelephoneFill } from "react-icons/bs";

import { useNavigate } from "react-router-dom";

import emptyCart from "../assets/empty-cart.png";
import razorpayLogo from "../assets/razorpay.png";
import successmusic from "../assets/successmusic.mp3";

import { toast } from "sonner";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";


/* =========================================================
   STEPS
========================================================= */

const STEPS = [
  {
    id: 1,
    label: "Cart",
    icon: <GiShoppingBag size={16} />,
  },
  {
    id: 2,
    label: "Review",
    icon: <FaCheckCircle size={16} />,
  },
  {
    id: 3,
    label: "Payment",
    icon: <MdPayments size={16} />,
  },
];


/* =========================================================
   RAZORPAY LOADER
========================================================= */

const loadRazorpay = () => {
  return new Promise((resolve) => {

    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (typeof window.Razorpay === "function") {
      resolve(true);
      return;
    }

    const SCRIPT_SRC =
      "https://checkout.razorpay.com/v1/checkout.js";

    const existingScript =
      document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

    const finish = () => {
      resolve(
        typeof window.Razorpay === "function"
      );
    };

    if (existingScript) {

      existingScript.addEventListener(
        "load",
        finish,
        { once: true }
      );

      existingScript.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      setTimeout(() => {

        if (
          typeof window.Razorpay === "function"
        ) {
          resolve(true);
        }

      }, 500);

      setTimeout(() => {

        if (
          typeof window.Razorpay !== "function"
        ) {
          console.error(
            "❌ Razorpay Checkout script did not become available."
          );

          resolve(false);
        }

      }, 8000);

      return;
    }

    const script =
      document.createElement("script");

    script.src = SCRIPT_SRC;
    script.async = true;

    script.onload = () => {

      console.log(
        "✅ Razorpay script loaded"
      );

      resolve(
        typeof window.Razorpay === "function"
      );

    };

    script.onerror = () => {

      console.error(
        "❌ Failed to load Razorpay Checkout script"
      );

      resolve(false);

    };

    document.body.appendChild(script);

  });
};


const CheckoutStepperSkeleton = () => (
  <div className="w-full px-3 py-3 sm:px-5 sm:py-4 lg:px-8">
    <div className="mx-auto w-full max-w-4xl">
      <div className="relative flex items-start justify-between">

        {[1, 2, 3].map((item, index) => (
          <React.Fragment key={item}>

            {/* Skeleton step */}
            <div className="relative z-10 flex min-w-0 flex-1 flex-col items-center">

              {/* Circle */}
              <div
                className="
                  relative h-11 w-11
                  animate-pulse
                  rounded-full
                  bg-slate-200
                  ring-1 ring-slate-100
                  sm:h-12 sm:w-12
                "
              >
                {/* Soft inner highlight */}
                <div
                  className="
                    absolute inset-2
                    rounded-full
                    bg-slate-100
                  "
                />
              </div>

              {/* Text skeleton */}
              <div className="mt-2 flex w-full flex-col items-center gap-1.5">

                <div
                  className="
                    h-2.5
                    w-12
                    animate-pulse
                    rounded-full
                    bg-slate-200
                    sm:w-14
                  "
                />

                <div
                  className="
                    h-3
                    w-14
                    animate-pulse
                    rounded-full
                    bg-slate-200
                    sm:w-20
                  "
                />
              </div>
            </div>

            {/* Connector skeleton */}
            {index < 2 && (
              <div
                className="
                  relative
                  mx-1
                  mt-[22px]
                  h-[3px]
                  flex-1
                  overflow-hidden
                  rounded-full
                  bg-slate-200
                  sm:mx-2
                  sm:mt-6
                "
              >
                <span
                  className="
                    absolute inset-y-0
                    -left-1/2
                    w-1/2
                    animate-[checkoutSkeletonShimmer_1.5s_ease-in-out_infinite]
                    rounded-full
                    bg-gradient-to-r
                    from-transparent
                    via-white
                    to-transparent
                  "
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  </div>
);

/* =========================================================
   CART COMPONENT
========================================================= */

const Cart = ({
  location,
  getLocation,
  onLocationChange,
}) => {

  const {
    cartItem,
    removeFromCart,
    increaseQty,
    decreaseQty,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL;


  /* =======================================================
     BASIC STATE
  ======================================================= */

  const [step, setStep] =
    useState(() => {
      try {
        const raw = sessionStorage.getItem("odicart_checkout_return");
        const parsed = raw ? JSON.parse(raw) : null;

        if (parsed?.path === "/cart" && Number(parsed?.step) === 2) {
          sessionStorage.removeItem("odicart_checkout_return");
          return 2;
        }
      } catch (_) {}

      return 1;
    });

  const [paymentType, setPaymentType] =
    useState(null);

  const [selectedItem, setSelectedItem] =
    useState(null);


  /* =======================================================
     MODALS
  ======================================================= */

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const {
    isOpen: isInstrOpen,
    onOpen: onInstrOpen,
    onClose: onInstrClose,
  } = useDisclosure();

  const {
    isOpen: isCodConfirmOpen,
    onOpen: onCodConfirmOpen,
    onClose: onCodConfirmClose,
  } = useDisclosure();


  /* =======================================================
     USER
  ======================================================= */

  const [user, setUser] =
    useState(null);


  /* =======================================================
     TOKEN
  ======================================================= */

  const [token, setToken] =
    useState(
      localStorage.getItem("token")
    );


  /* =======================================================
     CART UI HYDRATION
     Shows a short skeleton while the cart UI settles.
  ======================================================= */

  const [cartUiReady, setCartUiReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCartUiReady(true);
    }, 650);

    return () => window.clearTimeout(timer);
  }, []);


  useEffect(() => {

    const syncToken = () => {

      setToken(
        localStorage.getItem("token")
      );

    };

    window.addEventListener(
      "storage",
      syncToken
    );

    syncToken();

    return () => {

      window.removeEventListener(
        "storage",
        syncToken
      );

    };

  }, []);


  /* =======================================================
     LOAD USER
  ======================================================= */

  useEffect(() => {

    if (!token) {
      return;
    }

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

        if (res.status === 401) {

          localStorage.removeItem(
            "token"
          );

          setUser(null);

          toast.error(
            "Session expired"
          );

          navigate("/sign-in");

          return;
        }

        const data =
          await res.json();

        if (data.success) {

          setUser(
            data.user
          );

        }

      } catch (error) {

        console.error(
          "FETCH USER ERROR:",
          error
        );

      }

    };

    fetchUser();

  }, [
    token,
    BACKEND_URL,
    navigate,
  ]);


  useEffect(() => {
    if (!user?.email) return;

    setAddress((prev) => ({
      ...prev,
      email: user.email,
    }));
  }, [user?.email]);


  /* =======================================================
     ADDRESS
  ======================================================= */

  const createEmptyAddress = () => ({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
    houseNumber: "",
    buildingName: "",
    floor: "",
    street: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    area: "",
    village: "",
    postOffice: "",
    block: "",
    city: "",
    district: "",
    state: "",
    postcode: "",
    country: "India",
    latitude: "",
    longitude: "",
    deliveryInstructions: "",
    deliveryPreference: "",
  });

  const [address, setAddress] = useState(createEmptyAddress());

  /* =======================================================
     SAVED DELIVERY ADDRESSES
  ======================================================= */

  const [savedAddresses, setSavedAddresses] =
    useState([]);

  const [selectedAddressId, setSelectedAddressId] =
    useState(null);

  const [addressLoading, setAddressLoading] =
    useState(false);

  const [addressesLoaded, setAddressesLoaded] =
    useState(false);

  const [addressSaving, setAddressSaving] =
    useState(false);

  const [postalLookupLoading, setPostalLookupLoading] =
    useState(false);

  const postalLookupTimerRef = useRef(null);
  const postalLookupRequestRef = useRef(0);

  const [editingAddressId, setEditingAddressId] =
    useState(null);

  const [showAddressForm, setShowAddressForm] =
    useState(false);

  // React Native-style checkout address sheet:
  // list -> select, or list -> add/edit -> save & select.
  const [addressSelectorOpen, setAddressSelectorOpen] =
    useState(false);

  const [addressLabel, setAddressLabel] =
    useState("Home");

  const ADDRESS_URL =
    `${BACKEND_URL}/api/addresses`;

  const redirectToSavedAddresses = () => {
    try {
      sessionStorage.setItem(
        "odicart_checkout_return",
        JSON.stringify({
          path: "/cart",
          step: 2,
        })
      );
    } catch (_) {}

    navigate("/account/addresses/add");
  };


  /* =======================================================
     SAVED ADDRESS HELPERS
  ======================================================= */

  const normalizeSavedAddress = (item) => {
    const source = item?.address || item || {};

    return {
      ...item,
      _id: item?._id || item?.id,
      label: item?.label || "Home",
      fullName: item?.fullName || item?.name || source?.fullName || "",
      phone: item?.phone || source?.phone || "",
      alternatePhone: item?.alternatePhone || source?.alternatePhone || "",
      houseNumber: item?.houseNumber || source?.houseNumber || "",
      buildingName: item?.buildingName || source?.buildingName || "",
      floor: item?.floor || source?.floor || "",
      street: item?.street || source?.street || "",
      addressLine1:
        item?.addressLine1 ||
        source?.addressLine1 ||
        item?.street ||
        source?.street ||
        "",
      addressLine2: item?.addressLine2 || source?.addressLine2 || "",
      landmark: item?.landmark || source?.landmark || "",
      area: item?.area || source?.area || "",
      village: item?.village || source?.village || "",
      postOffice: item?.postOffice || source?.postOffice || "",
      block: item?.block || source?.block || "",
      city: item?.city || source?.city || "",
      district: item?.district || source?.district || "",
      state: item?.state || source?.state || "",
      postalCode:
        item?.postalCode ||
        item?.postcode ||
        source?.postalCode ||
        source?.postcode ||
        "",
      country: item?.country || source?.country || "India",
      deliveryInstructions:
        item?.deliveryInstructions ||
        source?.deliveryInstructions ||
        "",
      location: item?.location || source?.location || {},
      isDefault: item?.isDefault === true,
      isDeleted: item?.isDeleted === true,
    };
  };


  const loadSavedAddresses = async () => {

    if (!token) return;

    try {

      setAddressLoading(true);

      const res = await fetch(ADDRESS_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Failed to load saved addresses"
        );
      }

      const list = Array.isArray(data.addresses)
        ? data.addresses
        : Array.isArray(data.data)
        ? data.data
        : [];

      const normalized = list
        .filter((item) => item?.isDeleted !== true)
        .map(normalizeSavedAddress);
      setSavedAddresses(normalized);

      const defaultAddress =
        normalized.find((item) => item.isDefault) ||
        normalized[0];

      if (defaultAddress) {
        fillAddressFromSaved(defaultAddress);
      }

    } catch (error) {

      console.error("LOAD SAVED ADDRESSES ERROR:", error);

    } finally {

      setAddressLoading(false);
      setAddressesLoaded(true);

    }

  };


  useEffect(() => {
    loadSavedAddresses();
  }, [token, ADDRESS_URL]);

  useEffect(() => {
    if (
      step === 2 &&
      token &&
      addressesLoaded &&
      !addressLoading &&
      savedAddresses.length === 0
    ) {
      // Keep checkout self-contained: show the selector modal first.
      // The user can then choose Add address.
      setAddressSelectorOpen(true);
      setShowAddressForm(false);
    }
  }, [
    step,
    token,
    addressLoading,
    addressesLoaded,
    savedAddresses.length,
  ]);


  const fillAddressFromSaved = (item) => {
    const saved = normalizeSavedAddress(item);

    if (!saved._id) {
      toast.error("This address cannot be selected.");
      return;
    }

    setSelectedAddressId(String(saved._id));
    setEditingAddressId(null);
    setAddressLabel(saved.label || "Home");

    setAddress({
      name: saved.fullName || "",
      email: user?.email || "",
      phone: String(saved.phone || "").replace(/\D/g, "").slice(0, 10),
      alternatePhone: String(saved.alternatePhone || "").replace(/\D/g, "").slice(0, 10),
      houseNumber: saved.houseNumber || "",
      buildingName: saved.buildingName || "",
      floor: saved.floor || "",
      street: saved.street || "",
      addressLine1: saved.addressLine1 || "",
      addressLine2: saved.addressLine2 || "",
      landmark: saved.landmark || "",
      area: saved.area || "",
      village: saved.village || "",
      postOffice: saved.postOffice || "",
      block: saved.block || "",
      city: saved.city || "",
      district: saved.district || "",
      state: saved.state || "",
      postcode: String(saved.postalCode || "").replace(/\D/g, "").slice(0, 6),
      country: saved.country || "India",
      latitude: saved.location?.latitude ?? "",
      longitude: saved.location?.longitude ?? "",
      deliveryInstructions: saved.deliveryInstructions || "",
      deliveryPreference: saved.deliveryInstructions || "",
    });

    setServiceability((prev) => ({
      ...prev,
      checked: false,
      postalCode: String(saved.postalCode || ""),
      serviceableItems: [],
      unavailableItems: [],
      message: "",
    }));

    setShowAddressForm(false);
  };


  const startNewAddress = () => {
    // Open the dedicated Add Address page, then return to checkout step 2.
    try {
      sessionStorage.setItem(
        "odicart_checkout_return",
        JSON.stringify({
          path: "/cart",
          step: 2,
        })
      );
    } catch (_) {}

    setAddressSelectorOpen(false);
    setShowAddressForm(false);
    setEditingAddressId(null);

    navigate("/account/addresses/add");
  };


  const startEditAddress = (item) => {
    const saved = normalizeSavedAddress(item);

    if (!saved._id) {
      toast.error("This address cannot be edited.");
      return;
    }

    setSelectedAddressId(String(saved._id));
    setEditingAddressId(String(saved._id));
    setAddressLabel(saved.label || "Home");
    setAddress({
      name: saved.fullName || "",
      email: user?.email || "",
      phone: String(saved.phone || "").replace(/\D/g, "").slice(0, 10),
      alternatePhone: String(saved.alternatePhone || "").replace(/\D/g, "").slice(0, 10),
      houseNumber: saved.houseNumber || "",
      buildingName: saved.buildingName || "",
      floor: saved.floor || "",
      street: saved.street || "",
      addressLine1: saved.addressLine1 || "",
      addressLine2: saved.addressLine2 || "",
      landmark: saved.landmark || "",
      area: saved.area || "",
      village: saved.village || "",
      postOffice: saved.postOffice || "",
      block: saved.block || "",
      city: saved.city || "",
      district: saved.district || "",
      state: saved.state || "",
      postcode: String(saved.postalCode || "").replace(/\D/g, "").slice(0, 6),
      country: saved.country || "India",
      latitude: saved.location?.latitude ?? "",
      longitude: saved.location?.longitude ?? "",
      deliveryInstructions: saved.deliveryInstructions || "",
      deliveryPreference: saved.deliveryInstructions || "",
    });
    setShowAddressForm(true);
    setAddressSelectorOpen(true);
  };


  const openAddressSelector = () => {
    setShowAddressForm(false);
    setAddressSelectorOpen(true);
  };

  const handleSelectAddressFromModal = (item) => {
    fillAddressFromSaved(item);
    setAddressSelectorOpen(false);
    toast.success("Delivery address selected");
  };


  const saveCurrentAddress = async () => {

    if (!token) {
      toast.error("Please login first");
      return false;
    }

    if (!validateDelivery()) {
      return false;
    }

    const existingAddress = savedAddresses.find(
      (item) => String(item._id) === String(editingAddressId)
    );

    const payload = {
      label: addressLabel || "Home",
      fullName: String(address.name || "").trim(),
      phone: String(address.phone || "").trim(),
      alternatePhone: String(address.alternatePhone || "").trim(),

      houseNumber: String(address.houseNumber || "").trim(),
      buildingName: String(address.buildingName || "").trim(),
      floor: String(address.floor || "").trim(),
      street: String(address.street || "").trim(),

      addressLine1: String(
        address.addressLine1 || address.street || ""
      ).trim(),
      addressLine2: String(address.addressLine2 || "").trim(),
      landmark: String(address.landmark || "").trim(),
      area: String(address.area || "").trim(),
      village: String(address.village || "").trim(),

      postOffice: String(address.postOffice || "").trim(),
      block: String(address.block || "").trim(),
      city: String(address.city || "").trim(),
      district: String(address.district || "").trim(),
      state: String(address.state || "").trim(),
      postalCode: String(address.postcode || "").trim(),
      country: String(address.country || "India").trim() || "India",

      deliveryInstructions: String(
        address.deliveryInstructions || ""
      ).trim(),

      location: {
        latitude:
          address.latitude !== "" &&
          address.latitude !== null &&
          address.latitude !== undefined
            ? Number(address.latitude)
            : null,
        longitude:
          address.longitude !== "" &&
          address.longitude !== null &&
          address.longitude !== undefined
            ? Number(address.longitude)
            : null,
      },

      // First address becomes default. When editing, preserve its current state.
      isDefault: editingAddressId
        ? existingAddress?.isDefault === true
        : savedAddresses.length === 0,
    };

    try {

      setAddressSaving(true);

      const isEditing = Boolean(editingAddressId);
      const url = isEditing
        ? `${ADDRESS_URL}/${editingAddressId}`
        : ADDRESS_URL;

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Failed to save address"
        );
      }

      const returnedAddress =
        data.address || data.data || null;

      const savedAddressId = returnedAddress
        ? normalizeSavedAddress(returnedAddress)._id
        : editingAddressId;

      if (returnedAddress) {
        const normalized = normalizeSavedAddress(returnedAddress);
        setSavedAddresses((prev) => {
          const exists = prev.some(
            (item) => String(item._id) === String(normalized._id)
          );
          return exists
            ? prev.map((item) =>
                String(item._id) === String(normalized._id)
                  ? normalized
                  : item
              )
            : [...prev, normalized];
        });
        setSelectedAddressId(String(normalized._id));
      }

      await loadSavedAddresses();

      // loadSavedAddresses selects the default for initial checkout;
      // after an explicit Save/Edit, RN-style checkout keeps the edited
      // address selected for this order.
      if (savedAddressId) {
        setSelectedAddressId(String(savedAddressId));
      }

      setEditingAddressId(null);
      setShowAddressForm(false);
      setAddressSelectorOpen(true);
      toast.success(
        isEditing
          ? "Address updated successfully"
          : "Address saved successfully"
      );
      return true;

    } catch (error) {

      console.error("SAVE ADDRESS ERROR:", error);
      toast.error(
        error.message || "Failed to save address"
      );
      return false;

    } finally {
      setAddressSaving(false);
    }
  };



  /* =======================================================
     POSTAL CODE → ADDRESS AUTO UPDATE + AUTO SAVE
  ======================================================= */

  const handlePostalCodeChange = (event) => {
    const value = String(event?.target?.value || "")
      .replace(/[^0-9]/g, "")
      .slice(0, 6);

    setAddress((prev) => ({
      ...prev,
      postcode: value,
    }));

    setServiceability((prev) => ({
      ...prev,
      checked: false,
      postalCode: value,
      serviceableItems: [],
      unavailableItems: [],
      message: "",
    }));

    if (postalLookupTimerRef.current) {
      clearTimeout(postalLookupTimerRef.current);
    }

    if (value.length !== 6) {
      setPostalLookupLoading(false);
      return;
    }

    const requestId = ++postalLookupRequestRef.current;

    postalLookupTimerRef.current = setTimeout(async () => {
      try {
        setPostalLookupLoading(true);

        const response = await fetch(
          `https://api.postalpincode.in/pincode/${value}`
        );

        const data = await response.json().catch(() => null);

        if (requestId !== postalLookupRequestRef.current) return;

        const result = Array.isArray(data) ? data[0] : null;
        const postOffice = result?.PostOffice?.[0];

        if (
          !response.ok ||
          result?.Status !== "Success" ||
          !postOffice
        ) {
          throw new Error(
            result?.Message ||
            "No address found for this PIN code"
          );
        }

        // Keep the checkout fields aligned with the saved Address model.
        // A PIN lookup should only replace fields that the PIN service can
        // reliably provide. Manual address lines / landmark are preserved.
        const updatedAddress = {
          ...address,
          postcode: value,
          area: postOffice.Name || "",
          village: postOffice.Block || address.village || "",
          postOffice: postOffice.Name || address.postOffice || "",
          block: postOffice.Block || address.block || "",
          city:
            postOffice.Block ||
            postOffice.Division ||
            postOffice.Region ||
            "",
          district: postOffice.District || "",
          state: postOffice.State || "",
          country: postOffice.Country || "India",
        };

        setAddress((prev) => ({
          ...prev,
          postcode: value,
          area: postOffice.Name || "",
          village: postOffice.Block || prev.village || "",
          postOffice: postOffice.Name || prev.postOffice || "",
          block: postOffice.Block || prev.block || "",
          city:
            postOffice.Block ||
            postOffice.Division ||
            postOffice.Region ||
            "",
          district: postOffice.District || "",
          state: postOffice.State || "",
          country: postOffice.Country || "India",
        }));

        if (selectedAddressId && token) {
          const currentSavedAddress = savedAddresses.find(
            (item) => String(item._id) === String(selectedAddressId)
          );

          const payload = {
            label: addressLabel || "Home",
            fullName: String(updatedAddress.name || "").trim(),
            phone: String(updatedAddress.phone || "").trim(),
            alternatePhone: String(updatedAddress.alternatePhone || "").trim(),
            houseNumber: String(updatedAddress.houseNumber || "").trim(),
            buildingName: String(updatedAddress.buildingName || "").trim(),
            floor: String(updatedAddress.floor || "").trim(),
            street: String(updatedAddress.street || "").trim(),
            addressLine1: String(
              updatedAddress.addressLine1 || updatedAddress.street || ""
            ).trim(),
            addressLine2: String(updatedAddress.addressLine2 || "").trim(),
            landmark: String(updatedAddress.landmark || "").trim(),
            area: String(updatedAddress.area || "").trim(),
            village: String(updatedAddress.village || "").trim(),
            postOffice: String(updatedAddress.postOffice || "").trim(),
            block: String(updatedAddress.block || "").trim(),
            city: String(updatedAddress.city || "").trim(),
            district: String(updatedAddress.district || "").trim(),
            state: String(updatedAddress.state || "").trim(),
            postalCode: value,
            country: String(updatedAddress.country || "India").trim() || "India",
            deliveryInstructions: String(
              updatedAddress.deliveryInstructions || ""
            ).trim(),
            location: {
              latitude:
                updatedAddress.latitude !== "" &&
                updatedAddress.latitude !== null &&
                updatedAddress.latitude !== undefined
                  ? Number(updatedAddress.latitude)
                  : null,
              longitude:
                updatedAddress.longitude !== "" &&
                updatedAddress.longitude !== null &&
                updatedAddress.longitude !== undefined
                  ? Number(updatedAddress.longitude)
                  : null,
            },
            isDefault: currentSavedAddress?.isDefault === true,
          };

          const saveResponse = await fetch(
            `${ADDRESS_URL}/${selectedAddressId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            }
          );

          const saveData = await saveResponse
            .json()
            .catch(() => ({}));

          if (
            requestId !== postalLookupRequestRef.current
          ) {
            return;
          }

          if (!saveResponse.ok) {
            throw new Error(
              saveData.message ||
              saveData.error ||
              "Address details found, but saving failed"
            );
          }

          setSavedAddresses((prev) =>
            prev.map((item) =>
              String(item._id) ===
              String(selectedAddressId)
                ? {
                    ...item,
                    ...normalizeSavedAddress(
                      saveData.address ||
                      saveData.data ||
                      payload
                    ),
                    postalCode: value,
                    area: updatedAddress.area,
                    city: updatedAddress.city,
                    district: updatedAddress.district,
                    state: updatedAddress.state,
                    country: updatedAddress.country,
                  }
                : item
            )
          );

          toast.success(`Address updated for PIN ${value}`);
        } else {
          toast.success(`Address found for PIN ${value}`);
        }
      } catch (error) {
        if (requestId === postalLookupRequestRef.current) {
          console.error("POSTAL CODE LOOKUP ERROR:", error);
          toast.error(
            error?.message ||
            "Unable to find address for this PIN code"
          );
        }
      } finally {
        if (requestId === postalLookupRequestRef.current) {
          setPostalLookupLoading(false);
        }
      }
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (postalLookupTimerRef.current) {
        clearTimeout(postalLookupTimerRef.current);
      }
    };
  }, []);


  const deleteSavedAddress = async (id) => {

    if (!id || !token) return;

    try {

      const res = await fetch(
        `${ADDRESS_URL}/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Failed to delete address"
        );
      }

      setSavedAddresses((prev) =>
        prev.filter(
          (item) => String(item._id) !== String(id)
        )
      );

      if (String(selectedAddressId) === String(id)) {
        const remaining = savedAddresses.filter(
          (item) => String(item._id) !== String(id) && item?.isDeleted !== true
        );

        const nextAddress =
          remaining.find((item) => item.isDefault) || remaining[0] || null;

        if (nextAddress) {
          fillAddressFromSaved(nextAddress);
        } else {
          setSelectedAddressId(null);
          setAddress(createEmptyAddress());
        }
      }

      toast.success("Address deleted");

    } catch (error) {
      console.error("DELETE ADDRESS ERROR:", error);
      toast.error(
        error.message || "Failed to delete address"
      );
    }
  };


  const setDefaultSavedAddress = async (id) => {

    if (!id || !token) return;

    try {

      const res = await fetch(
        `${ADDRESS_URL}/${id}/default`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Failed to set default address"
        );
      }

      setSavedAddresses((prev) =>
        prev.map((item) => ({
          ...item,
          isDefault: String(item._id) === String(id),
        }))
      );

      setSelectedAddressId(String(id));
      toast.success("Default address updated");

    } catch (error) {
      console.error("DEFAULT ADDRESS ERROR:", error);
      toast.error(
        error.message || "Failed to set default address"
      );
    }
  };


  /* =======================================================
     LOCATION → ADDRESS
  ======================================================= */

  useEffect(() => {

    if (!location) {
      return;
    }

    const firstName =
      user?.firstName || "";

    const lastName =
      user?.lastName || "";


    const detectedStreet =
      location.addressLine1 ||
      location.road ||
      location.street ||
      location.address ||
      "";


    const detectedCity =
      location.city ||
      location.town ||
      location.village ||
      location.municipality ||
      "";


    const detectedDistrict =
      location.district ||
      location.city_district ||
      location.county ||
      "";


    setAddress((prev) => ({

      ...prev,

      name:
        prev.name ||
        `${firstName} ${lastName}`.trim(),

      email:
        prev.email ||
        user?.email ||
        "",

      phone:
        prev.phone ||
        user?.phone ||
        "",

      street:
        prev.street ||
        detectedStreet ||
        "",

      addressLine1:
        prev.addressLine1 ||
        detectedStreet ||
        "",

      addressLine2:
        prev.addressLine2 ||
        location.addressLine2 ||
        "",

      landmark:
        prev.landmark ||
        location.landmark ||
        "",

      area:
        prev.area ||
        location.area ||
        location.suburb ||
        location.neighbourhood ||
        location.residential ||
        "",

      city:
        prev.city ||
        detectedCity ||
        "",

      district:
        prev.district ||
        detectedDistrict ||
        "",

      state:
        prev.state ||
        location.state ||
        "",

      postcode:
        prev.postcode ||
        location.postcode ||
        location.postalCode ||
        "",

      country:
        prev.country ||
        location.country ||
        "India",

      latitude:
        location.latitude ??
        prev.latitude ??
        "",

      longitude:
        location.longitude ??
        prev.longitude ??
        "",

      deliveryPreference:
        prev.deliveryPreference ||
        "",

    }));

  }, [
    location,
    user,
  ]);


  /* =======================================================
     COUPON
  ======================================================= */

  const [couponCode, setCouponCode] =
    useState("");

  const [couponDiscount, setCouponDiscount] =
    useState(0);

  const [finalTotal, setFinalTotal] =
    useState(0);

  const [couponError, setCouponError] =
    useState("");

  const [couponSuccess, setCouponSuccess] =
    useState("");

  const [couponLoading, setCouponLoading] =
    useState(false);


  /* =======================================================
     SERVICEABILITY
  ======================================================= */

  const [
    serviceability,
    setServiceability,
  ] = useState({

    checking: false,

    checked: false,

    postalCode: "",

    serviceableItems: [],

    unavailableItems: [],

    message: "",

  });


  const [
    removingUnavailable,
    setRemovingUnavailable,
  ] = useState(null);


  const SERVICEABILITY_URL =
    `${BACKEND_URL}/api/serviceability/cart`;


  /* =======================================================
     MONEY
  ======================================================= */

  const roundMoney = (value) => {

    return Math.round(
      (
        Number(value || 0) +
        Number.EPSILON
      ) * 100
    ) / 100;

  };


  /* =======================================================
     ITEM BASE AMOUNT
  ======================================================= */

  const getItemBaseAmount = (
    item
  ) => {

    return roundMoney(
      Number(item?.price || 0) *
      Number(item?.quantity || 1)
    );

  };


  /* =======================================================
     SELECTED VARIANT
  ======================================================= */

  const getSelectedVariant = (
    item
  ) => {

    const variants =
      item?.product?.variants;

    if (
      !Array.isArray(variants) ||
      variants.length === 0
    ) {
      return item?.variant ||
        item?.selectedVariant ||
        null;
    }

    const sku =
      String(
        item?.variantSku ||
        item?.variant?.sku ||
        item?.selectedVariant?.sku ||
        ""
      );

    if (sku) {
      const matched =
        variants.find(
          (variant) =>
            String(variant?.sku || "") ===
            sku
        );

      if (matched) {
        return matched;
      }
    }

    return (
      item?.variant ||
      item?.selectedVariant ||
      variants.find(
        (variant) =>
          variant?.isActive !== false
      ) ||
      variants[0] ||
      null
    );

  };


  /* =======================================================
     ITEM TAX
     Tax is calculated AFTER product discount
  ======================================================= */

  const getItemTax = (
    item
  ) => {

    const baseAmount =
      getItemBaseAmount(item);

    const discount =
      getItemDiscount(item);

    const taxableAmount =
      Math.max(
        0,
        baseAmount - discount
      );

    const variant =
      getSelectedVariant(item);

    // IMPORTANT:
    // Product variant `tax` is a percentage.
    // Example: tax = 18 means 18%.
    const taxPercentage =
      Number(
        item?.taxPercentage ??
        variant?.taxPercentage ??
        variant?.tax ??
        item?.product?.taxPercentage ??
        item?.product?.shipping?.taxPercentage ??
        0
      );

    return roundMoney(
      taxableAmount *
      taxPercentage /
      100
    );

  };


  /* =======================================================
     ITEM DISCOUNT
  ======================================================= */

  const getItemDiscount = (
    item
  ) => {

    const baseAmount =
      getItemBaseAmount(item);

    // Direct line-level discount amount.
    const discountAmount =
      item?.discountAmount ??
      item?.product?.discountAmount ??
      item?.product?.offer?.amount;

    if (
      discountAmount !== undefined &&
      discountAmount !== null &&
      discountAmount !== ""
    ) {

      return roundMoney(
        Math.min(
          Math.max(
            0,
            Number(discountAmount)
          ),
          baseAmount
        )
      );

    }

    const variant =
      getSelectedVariant(item);

    const discountPercentage =
      Number(
        item?.discountPercentage ??
        variant?.discountPercentage ??
        variant?.discount ??
        item?.product?.discountPercentage ??
        item?.product?.offer?.value ??
        0
      );

    return roundMoney(
      Math.min(
        baseAmount,
        baseAmount *
          Math.max(0, discountPercentage) /
          100
      )
    );

  };


  /* =======================================================
     SUBTOTAL
  ======================================================= */

  const totalPrice = roundMoney(

    cartItem.reduce(
      (total, item) => {

        return (
          total +
          getItemBaseAmount(item)
        );

      },
      0
    )

  );


  /* =======================================================
     TAX
  ======================================================= */

  const itemTax = roundMoney(

    cartItem.reduce(
      (total, item) => {

        return (
          total +
          getItemTax(item)
        );

      },
      0
    )

  );


  /* =======================================================
     PRODUCT DISCOUNT
  ======================================================= */

  const itemDiscount = roundMoney(

    cartItem.reduce(
      (total, item) => {

        return (
          total +
          getItemDiscount(item)
        );

      },
      0
    )

  );


  /* =======================================================
     BACKEND PRICING BASE
     Do NOT reduce the frontend price by discount.
     Product/coupon discounts are calculated by the backend.
  ======================================================= */

  const subtotalAfterDiscount =
    totalPrice;


  /* =======================================================
     SHIPPING / HANDLING
  ======================================================= */

  const shippingCharge = 0;


  /* =======================================================
     BEFORE COUPON
  ======================================================= */

  const amountBeforeCoupon =
    roundMoney(

      subtotalAfterDiscount +
      itemTax +
      shippingCharge

    );


  /* =======================================================
     FRONTEND BASE TOTAL

     IMPORTANT:
     The frontend must NOT subtract coupon/product discounts.
     The backend is the source of truth for the final payable
     amount. `finalTotal` is updated from the backend response
     when a coupon is applied.
  ======================================================= */

  const calculatedTotal =
    amountBeforeCoupon;


  /* =======================================================
     KEEP TOTAL UPDATED
  ======================================================= */

  useEffect(() => {

    setFinalTotal(
      calculatedTotal
    );

  }, [
    calculatedTotal,
  ]);


  /* =======================================================
     APPLY COUPON
  ======================================================= */

  const applyCoupon = async () => {

    const code =
      String(
        couponCode || ""
      ).trim();


    if (!code) {

      setCouponError(
        "Please enter a coupon code."
      );

      setCouponSuccess("");

      return;
    }


    try {

      setCouponLoading(true);

      setCouponError("");

      setCouponSuccess("");


      const res =
        await fetch(
          `${BACKEND_URL}/api/coupons/apply`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {}),
            },

            body:
              JSON.stringify({

                code,

                total:
                  subtotalAfterDiscount,

              }),

          }
        );


      const data =
        await res.json();


      console.log(
        "COUPON STATUS:",
        res.status
      );

      console.log(
        "COUPON RESPONSE:",
        data
      );


      if (!res.ok) {

        setCouponDiscount(0);

        setFinalTotal(
          amountBeforeCoupon
        );

        setCouponError(
          data.message ||
          "Failed to apply coupon"
        );

        toast.error(
          data.message ||
          "Failed to apply coupon"
        );

        return;
      }


      const discount =
        Number(
          data.discount || 0
        );


      setCouponDiscount(
        discount
      );


      /*
       * Prefer backend's finalTotal
       * when supplied.
       */

      if (
        data.finalTotal !== undefined
      ) {

        setFinalTotal(
          roundMoney(
            data.finalTotal
          )
        );

      } else {

        // Backend should always return finalTotal.
        // Never calculate it here by subtracting the discount.
        setFinalTotal(
          amountBeforeCoupon
        );

      }


      setCouponError("");

      setCouponSuccess(
        data.message ||
        "Coupon Applied Successfully"
      );


      toast.success(
        data.message ||
        "Coupon Applied Successfully"
      );


    } catch (error) {

      console.error(
        "COUPON ERROR:",
        error
      );

      setCouponDiscount(0);

      setFinalTotal(
        amountBeforeCoupon
      );

      setCouponError(
        error.message ||
        "Something went wrong."
      );


    } finally {

      setCouponLoading(false);

    }

  };


  /* =======================================================
     SERVICEABILITY CHECK
  ======================================================= */

  const checkServiceability =
    async () => {

      const postalCode =
        String(
          address.postcode || ""
        ).trim();


      if (
        !/^[1-9][0-9]{5}$/.test(
          postalCode
        )
      ) {

        toast.error(
          "Enter a valid 6-digit PIN code first"
        );

        setServiceability({
          checking: false,
          checked: false,
          postalCode: "",
          serviceableItems: [],
          unavailableItems: [],
          message: "",
        });

        return false;
      }


      if (!cartItem.length) {

        toast.error(
          "Your cart is empty"
        );

        return false;
      }


      try {

        setServiceability(
          (prev) => ({

            ...prev,

            checking: true,

            checked: false,

            postalCode,

            serviceableItems: [],

            unavailableItems: [],

            message: "",

          })
        );


        const res =
          await fetch(
            SERVICEABILITY_URL,
            {
              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

                ...(token
                  ? {
                      Authorization:
                        `Bearer ${token}`,
                    }
                  : {}),

              },

              body:
                JSON.stringify({

                  postalCode,

                  items:
                    cartItem.map(
                      (item) => ({

                        productId:
                          item.productId,

                        variantSku:
                          item.variantSku ||
                          "",

                        quantity:
                          Number(
                            item.quantity || 1
                          ),

                        sellerId:
                          item.sellerId ||
                          null,

                      })
                    ),

                }),

            }
          );


        const data =
          await res.json()
            .catch(() => ({}));


        if (
          !res.ok ||
          data.success === false
        ) {

          throw new Error(

            data.message ||
            data.error ||
            "Unable to check delivery availability"

          );

        }


        const unavailable =
          Array.isArray(
            data.unavailableItems
          )
            ? data.unavailableItems

            : Array.isArray(
                data.items
              )

              ? data.items.filter(
                  (item) =>
                    item.serviceable ===
                    false
                )

              : [];


        const available =
          Array.isArray(
            data.serviceableItems
          )
            ? data.serviceableItems

            : Array.isArray(
                data.items
              )

              ? data.items.filter(
                  (item) =>
                    item.serviceable !==
                    false
                )

              : [];


        setServiceability({

          checking: false,

          checked: true,

          postalCode,

          serviceableItems:
            available,

          unavailableItems:
            unavailable,

          message:
            data.message || "",

        });


        if (
          unavailable.length > 0
        ) {

          setStep(1);


          toast.warning(

            `${unavailable.length} item${
              unavailable.length > 1
                ? "s are"
                : " is"
            } not deliverable to ${postalCode}`

          );

          return false;
        }


        toast.success(
          `All items are deliverable to ${postalCode}`
        );


        return true;


      } catch (error) {

        console.error(
          "SERVICEABILITY ERROR:",
          error
        );


        setServiceability(
          (prev) => ({

            ...prev,

            checking: false,

            checked: false,

            postalCode,

            serviceableItems: [],

            unavailableItems: [],

            message:
              error.message ||
              "Unable to check delivery availability",

          })
        );


        toast.error(
          error.message ||
          "Unable to check delivery availability"
        );


        return false;

      }

    };


  /* =======================================================
     REMOVE UNAVAILABLE ITEM
  ======================================================= */

  const handleRemoveUnavailable =
    async (item) => {

      const productId =
        item?.productId?._id ||
        item?.productId ||
        item?._id ||
        item?.product?._id;


      if (!productId) {

        toast.error(
          "Unable to identify this cart item"
        );

        return;
      }


      const requestedVariantSku =
        item?.variantSku ||
        item?.variant?.sku ||
        "";


      /*
       * Find the actual cart item.
       *
       * This prevents:
       *
       * variantSku: ""
       *
       * being sent when the real cart
       * item has a SKU.
       */

      const cartProduct =
        cartItem.find(
          (cart) => {

            if (
              String(
                cart.productId
              ) !==
              String(productId)
            ) {

              return false;

            }


            if (
              !requestedVariantSku
            ) {

              return true;

            }


            return (
              String(
                cart.variantSku || ""
              ) ===
              String(
                requestedVariantSku
              )
            );

          }
        );


      if (!cartProduct) {

        toast.error(
          "Product is no longer in your cart"
        );

        return;
      }


      const variantSku =
        requestedVariantSku ||
        cartProduct.variantSku ||
        "";


      const itemKey =
        `${productId}-${variantSku || "default"}`;


      setRemovingUnavailable(
        itemKey
      );


      try {

        console.log(
          "REMOVE UNAVAILABLE ITEM:",
          {
            productId,
            variantSku,
            cartProduct,
          }
        );


        await removeFromCart(
          productId,
          variantSku
        );


        /*
         * Cart changed, therefore the old
         * serviceability result is no longer
         * trusted.
         */

        setServiceability(
          (prev) => ({

            ...prev,

            checked: false,

            checking: false,

            serviceableItems: [],

            unavailableItems:
              prev.unavailableItems.filter(
                (u) => {

                  const uProductId =
                    u?.productId?._id ||
                    u?.productId ||
                    u?._id ||
                    u?.product?._id;


                  const uSku =
                    u?.variantSku ||
                    u?.variant?.sku ||
                    "";


                  if (
                    String(
                      uProductId
                    ) !==
                    String(productId)
                  ) {

                    return true;

                  }


                  if (
                    !uSku &&
                    !variantSku
                  ) {

                    return false;

                  }


                  return (
                    String(uSku || "") !==
                    String(variantSku || "")
                  );

                }
              ),

            message: "",

          })
        );


        toast.success(
          `${cartProduct.title || item?.title || "Product"} removed from cart`
        );


      } catch (error) {

        console.error(
          "REMOVE UNAVAILABLE ITEM ERROR:",
          error
        );


        toast.error(
          error?.message ||
          "Failed to remove product from cart"
        );


      } finally {

        setRemovingUnavailable(
          null
        );

      }

    };


  /* =======================================================
     CONTINUE TO PAYMENT
  ======================================================= */

  const handleContinueToPayment =
    async () => {

      if (!selectedAddressId) {
        toast.error(
          "Please select a saved delivery address first."
        );
        openAddressSelector();
        return;
      }

      if (!validateDelivery()) {
        return;
      }


      const postalCode =
        String(
          address.postcode || ""
        ).trim();


      const isFreshCheck =

        serviceability.checked &&

        serviceability.postalCode ===
          postalCode &&

        serviceability.unavailableItems
          .length === 0;


      if (!isFreshCheck) {

        const serviceable =
          await checkServiceability();


        if (!serviceable) {
          return;
        }

      }


      setStep(3);

    };


  /* =======================================================
     COMPLETE ORDER
  ======================================================= */

  const completeOrder =
    async (
      method = "Razorpay",
      paymentData = {}
    ) => {

      if (!selectedAddressId) {
        toast.error(
          "Please select a saved delivery address before placing the order."
        );
        openAddressSelector();
        return;
      }

      if (!token || !user) {

        toast.error(
          "Please login before placing an order"
        );

        return;
      }


      if (
        !user?.email ||
        !user.email.includes("@")
      ) {

        toast.error(
          "Please enter a valid email address"
        );

        return;
      }


      if (
        !Number.isFinite(
          Number(finalTotal)
        ) ||
        Number(finalTotal) <= 0
      ) {

        toast.error(
          "Invalid order total. Please refresh your cart."
        );

        return;
      }


      /*
       * Re-check serviceability.
       */

      const currentPostalCode =
        String(
          address.postcode || ""
        ).trim();


      const serviceableNow =

        serviceability.checked &&

        serviceability.postalCode ===
          currentPostalCode &&

        serviceability.unavailableItems
          .length === 0;


      if (!serviceableNow) {

        const ok =
          await checkServiceability();


        if (!ok) {

          setStep(1);

          return;

        }

      }


/* ===================================================
  BUILD  ORDER ITEMS
=================================================== */

const orderItems = cartItem.map((item) => {
  const quantity = Number(item?.quantity || 1);
  const price = Number(item?.price || 0);

  const grossAmount = roundMoney(
    price * quantity
  );

  /*
   * IMPORTANT:
   * Resolve variant data from the cart item.
   *
   * Your cart contains:
   *
   * variantSku: "MIN-NIA-30ML"
   *
   * but tax/discount may not exist directly
   * on the cart item.
   */

  const variants =
    item?.product?.variants ||
    item?.variants ||
    [];

  const selectedVariant =
    variants.find(
      (variant) =>
        String(variant?.sku || "") ===
        String(item?.variantSku || "")
    ) || null;

  /*
   * PRODUCT OFFER
   */

  const offerEnabled =
    item?.product?.offer?.enabled === true ||
    item?.offer?.enabled === true;

  const offerType =
    item?.product?.offer?.discountType ||
    item?.offer?.discountType ||
    "percentage";

  const offerValue = Number(
    item?.product?.offer?.value ??
    item?.offer?.value ??
    0
  );

  /*
   * VARIANT DISCOUNT
   */

  let discountPercentage = Number(
    selectedVariant?.discountPercentage ??
    item?.discountPercentage ??
    0
  );

  /*
   * Active product offer overrides
   * variant discount.
   */

  if (
    offerEnabled &&
    offerType === "percentage" &&
    offerValue > 0
  ) {
    discountPercentage = offerValue;
  }

  /*
   * DISCOUNT
   */

  let discountAmount = 0;

  if (discountPercentage > 0) {
    discountAmount =
      grossAmount *
      discountPercentage /
      100;
  }

  discountAmount = Math.min(
    roundMoney(discountAmount),
    grossAmount
  );

  /*
   * TAXABLE AMOUNT
   */

  const taxableAmount = Math.max(
    0,
    grossAmount - discountAmount
  );

  /*
   * TAX RATE
   *
   * IMPORTANT:
   * variant.tax = percentage.
   *
   * Example:
   * 18 => 18%
   */

  const taxRate = Number(
    selectedVariant?.tax ??
    item?.taxPercentage ??
    item?.tax ??
    item?.product?.tax ??
    0
  );

  const taxAmount = roundMoney(
    taxableAmount *
    taxRate /
    100
  );

  /*
   * FINAL ITEM TOTAL
   */

  const itemTotal = roundMoney(
    taxableAmount +
    taxAmount
  );

  const finalDiscount = roundMoney(
    discountAmount
  );

  const finalTax = roundMoney(
    taxAmount
  );

  console.log(
    "ITEM PRICE CALCULATION:",
    {
      title: item?.title,
      variantSku: item?.variantSku,

      price,
      quantity,

      grossAmount,

      discountPercentage,
      discountAmount: finalDiscount,

      taxableAmount,

      taxRate,
      taxAmount: finalTax,

      itemTotal,
    }
  );

  return {
    productId:
      item?.productId,

    sellerId:
      item?.sellerId || null,

    variantSku:
      item?.variantSku || "",

    attributes:
      item?.attributes || {},

    title:
      item?.title || "",

    slug:
      item?.slug || "",

    image:
      item?.image ||
      item?.thumbnail ||
      item?.images?.[0] ||
      "",

    brand:
      item?.brand || "",

    category:
      item?.category || "",

    price,

    quantity,

    /*
     * Store percentage separately.
     * This makes the payload easier to debug.
     */

    taxPercentage:
      taxRate,

    /*
     * Actual tax amount for this line.
     */

    tax:
      finalTax,

    /*
     * Actual discount amount for this line.
     */

    discount:
      finalDiscount,

    total:
      itemTotal,
  };
});

/* ===================================================
   ORDER LEVEL TOTALS
=================================================== */

const orderSubtotal = roundMoney(
  orderItems.reduce(
    (sum, item) => {
      const itemGross =
        Number(item.price || 0) *
        Number(item.quantity || 1);

      // Do not reduce product discount on the frontend.
      // Backend is responsible for discount calculation.
      return sum + itemGross;
    },
    0
  )
);


const orderTax = roundMoney(
  orderItems.reduce(
    (sum, item) =>
      sum +
      Number(item.tax || 0),
    0
  )
);


const orderShipping = roundMoney(
  Number(shippingCharge || 0)
);


const orderCouponDiscount = roundMoney(
  Number(couponDiscount || 0)
);


const orderTotalBeforeCoupon = roundMoney(
  orderSubtotal +
  orderTax +
  orderShipping
);


/*
 * IMPORTANT:
 * Never calculate the final payable amount by subtracting
 * couponDiscount on the frontend. The backend is the source
 * of truth. `finalTotal` contains the backend-calculated
 * payable amount after coupon/discount rules.
 */
const orderFinalTotal = roundMoney(
  Number(finalTotal || orderTotalBeforeCoupon)
);


console.log(
  "===================================="
);

console.log(
  "FINAL FRONTEND ORDER PRICING:"
);

console.log({
  subtotal: orderSubtotal,
  tax: orderTax,
  shippingCharge: orderShipping,
  couponDiscount: orderCouponDiscount,
  total: orderFinalTotal,
});

console.log(
  "===================================="
);




      /* ===================================================
         ORDER PAYLOAD
      =================================================== */

      const order = {

        userId:
          user._id,

        user:
          String(
            address.name || ""
          ).trim(),

        email:
          String(
            address.email || ""
          ).trim(),

        phone:
          address.phone
            ? `+91 ${address.phone}`
            : "",


        /* -----------------------------------------------
           DELIVERY ADDRESS
        ----------------------------------------------- */

        deliveryAddress: {

          customer: {

            fullName:
              String(
                address.name || ""
              ).trim(),

            phone:
              String(
                address.phone || ""
              ).trim(),

            email:
              String(
                address.email || ""
              ).trim(),

          },


          address: {

            addressLine1:
              String(
                address.addressLine1 ||
                address.street ||
                ""
              ).trim(),

            addressLine2:
              String(
                address.addressLine2 ||
                ""
              ).trim(),

            landmark:
              String(
                address.landmark ||
                ""
              ).trim(),

            area:
              String(
                address.area ||
                ""
              ).trim(),

            village:
              String(
                address.village ||
                ""
              ).trim(),

            city:
              String(
                address.city ||
                ""
              ).trim(),

            district:
              String(
                address.district ||
                ""
              ).trim(),

            state:
              String(
                address.state ||
                ""
              ).trim(),

            postalCode:
              String(
                address.postcode ||
                ""
              ).trim(),

            country:
              String(
                address.country ||
                "India"
              ).trim() ||
              "India",

          },


          location: {

            latitude:
              address.latitude !== "" &&
              address.latitude !== null &&
              address.latitude !== undefined

                ? Number(
                    address.latitude
                  )

                : undefined,

            longitude:
              address.longitude !== "" &&
              address.longitude !== null &&
              address.longitude !== undefined

                ? Number(
                    address.longitude
                  )

                : undefined,

          },


          preference: {

            deliveryPreference:
              String(
                address.deliveryPreference ||
                ""
              ),

          },

        },


        /* -----------------------------------------------
           PRICING
        ----------------------------------------------- */
subtotal:
  orderSubtotal,

shippingCharge:
  Number(shippingCharge || 0),

tax:
  orderTax,

couponCode:
  String(couponCode || "").trim(),

couponDiscount:
  Number(couponDiscount || 0),

total:
  orderFinalTotal,



        /* -----------------------------------------------
           PAYMENT
        ----------------------------------------------- */

        paymentMethod:
          method,

        paymentStatus:
          method === "COD"
            ? "Pending"
            : "Paid",

        razorpayOrderId:
          paymentData
            ?.razorpay_order_id ||
          "",

        razorpayPaymentId:
          paymentData
            ?.razorpay_payment_id ||
          "",

        razorpaySignature:
          paymentData
            ?.razorpay_signature ||
          "",


        status:
          method === "COD"
            ? "Confirmed"
            : "Processing",


        /* -----------------------------------------------
           ITEMS
        ----------------------------------------------- */

        items:
          orderItems,

      };


      console.log(
        "===================================="
      );

      console.log(
        "FINAL ORDER PAYLOAD:"
      );

      console.log(
        JSON.stringify(
          order,
          null,
          2
        )
      );

      console.log(
        "===================================="
      );


      try {

        /*
         * Save order.
         *
         * Keep this endpoint because it
         * already exists in your project.
         */

        const res =
          await fetch(
            `${BACKEND_URL}/api/save-order`,
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,

              },

              body:
                JSON.stringify(order),

            }
          );


        const data =
          await res.json()
            .catch(() => ({}));


        console.log(
          "SAVE ORDER STATUS:",
          res.status
        );

        console.log(
          "SAVE ORDER RESPONSE:",
          data
        );


        if (!res.ok) {

          throw new Error(

            data.message ||
            data.error ||
            "Failed to save order"

          );

        }


        /*
         * Success sound
         */

        try {

          const audio =
            new Audio(
              successmusic
            );

          audio.volume = 0.5;

          await audio.play()
            .catch(() => {});

        } catch (_) {}


        /*
         * Clear cart
         */

        if (
          typeof clearCart ===
          "function"
        ) {

          await clearCart();

        }


        toast.success(
          "Order placed successfully 🎉"
        );


        /*
         * Go to order history.
         */

        setTimeout(() => {

          navigate(
            "/account/orders"
          );

        }, 700);


      } catch (error) {

        console.error(
          "ORDER ERROR:",
          error
        );


        toast.error(
          error?.message ||
          "Failed to place order"
        );

      }

    };


  /* =======================================================
     RAZORPAY
  ======================================================= */

  const handleRazorpayPayment =
    async () => {

      try {

        if (
          !Number.isFinite(
            Number(finalTotal)
          ) ||
          Number(finalTotal) <= 0
        ) {

          toast.error(
            "Invalid order total. Please refresh your cart."
          );

          return;
        }


        const currentPostalCode =
          String(
            address.postcode || ""
          ).trim();


        const serviceableNow =

          serviceability.checked &&

          serviceability.postalCode ===
            currentPostalCode &&

          serviceability.unavailableItems
            .length === 0;


        if (!serviceableNow) {

          const ok =
            await checkServiceability();


          if (!ok) {

            setStep(1);

            return;

          }

        }


        /* -----------------------------------------------
           LOAD RAZORPAY
        ----------------------------------------------- */

        const razorpayLoaded =
          await loadRazorpay();


        if (
          !razorpayLoaded ||
          !window.Razorpay
        ) {

          toast.error(
            "Unable to load Razorpay. Please disable ad-blocker and try again."
          );

          return;
        }


        /* -----------------------------------------------
           CREATE RAZORPAY ORDER
        ----------------------------------------------- */

        const res =
          await fetch(
            `${BACKEND_URL}/api/create-order`,
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,

              },

              body:
                JSON.stringify({

                  amount:
                    Number(
                      finalTotal
                    ),

                }),

            }
          );


        const data =
          await res.json();


        console.log(
          "CREATE RAZORPAY RESPONSE:",
          data
        );


        if (!res.ok) {

          throw new Error(

            data.error ||
            data.message ||
            "Razorpay order creation failed"

          );

        }


        if (
          !data.order?.id
        ) {

          throw new Error(
            "Razorpay order ID missing"
          );

        }


        /* -----------------------------------------------
           RAZORPAY OPTIONS
        ----------------------------------------------- */

        const options = {

          key:
            import.meta.env
              .VITE_RAZORPAY_KEY,

          amount:
            data.order.amount,

          currency:
            data.order.currency ||
            "INR",

          name:
            "Odikart",

          description:
            "Order Payment",

          order_id:
            data.order.id,


          prefill: {

            name:
              address.name,

            email:
              user?.email || "",

            contact:
              address.phone
                ? `+91${address.phone}`
                : "",

          },


          notes: {

            postalCode:
              address.postcode,

          },


          handler:
            async (
              response
            ) => {

              console.log(
                "RAZORPAY PAYMENT RESPONSE:",
                response
              );


              try {

                /* -----------------------------------------
                   VERIFY PAYMENT
                ----------------------------------------- */

                const vRes =
                  await fetch(
                    `${BACKEND_URL}/api/verify-payment`,
                    {

                      method: "POST",

                      headers: {

                        "Content-Type":
                          "application/json",

                        Authorization:
                          `Bearer ${token}`,

                      },

                      body:
                        JSON.stringify(
                          response
                        ),

                    }
                  );


                const vData =
                  await vRes.json();


                console.log(
                  "VERIFY RESPONSE:",
                  vData
                );


                if (
                  !vRes.ok ||
                  !vData.success
                ) {

                  throw new Error(

                    vData.message ||
                    "Payment verification failed"

                  );

                }


                /* -----------------------------------------
                   SAVE ORDER
                ----------------------------------------- */

                await completeOrder(
                  "Razorpay",
                  response
                );


              } catch (error) {

                console.error(
                  "PAYMENT VERIFICATION ERROR:",
                  error
                );


                toast.error(
                  error.message ||
                  "Payment verification failed"
                );

              }

            },


          modal: {

            ondismiss: () => {

              console.log(
                "Razorpay payment window closed"
              );

            },

          },


          theme: {

            color:
              "#4F46E5",

          },

        };


        /* -----------------------------------------------
           OPEN RAZORPAY
        ----------------------------------------------- */

        const rzp =
          new window.Razorpay(
            options
          );


        rzp.on(
          "payment.failed",
          (response) => {

            console.error(
              "RAZORPAY PAYMENT FAILED:",
              response
            );


            toast.error(

              response.error
                ?.description ||
              "Payment failed"

            );

          }
        );


        rzp.open();


      } catch (error) {

        console.error(
          "RAZORPAY ERROR:",
          error
        );


        toast.error(
          error.message ||
          "Payment failed"
        );

      }

    };


  /* =======================================================
     DECREASE QUANTITY
  ======================================================= */

  const handleDecrease = (
    id,
    qty,
    variantSku
  ) => {

    if (qty === 1) {

      toast(
        "Remove item from cart?",
        {

          description:
            "Quantity will become 0.",

          action: {

            label: "Remove",

            onClick: async () => {

              try {

                await removeFromCart(
                  id,
                  variantSku
                );

                toast.success(
                  "Item removed"
                );

              } catch (error) {

                toast.error(
                  error.message ||
                  "Failed to remove item"
                );

              }

            },

          },

          cancel: {

            label:
              "Cancel",

          },

        }
      );

      return;
    }


    decreaseQty(
      id,
      variantSku
    );

  };


  /* =======================================================
     STEP 2 REVIEW → PLACE ORDER
  ======================================================= */

  const handlePlaceOrderFromReview = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a saved delivery address first.");
      redirectToSavedAddresses();
      return;
    }

    if (!validateDelivery()) {
      return;
    }

    if (!paymentType) {
      toast.warning("Please select a payment method");
      return;
    }

    const postalCode = String(address.postcode || "").trim();

    const freshServiceability =
      serviceability.checked &&
      serviceability.postalCode === postalCode &&
      serviceability.unavailableItems.length === 0;

    if (!freshServiceability) {
      const serviceable = await checkServiceability();
      if (!serviceable) return;
    }

    if (paymentType === "razorpay") {
      onInstrOpen();
    } else {
      onCodConfirmOpen();
    }
  };


  /* =======================================================
     VALIDATION
  ======================================================= */

  const canProceedStep1 =
    cartItem.length > 0;


  const canProceedStep2 =

    Boolean(selectedAddressId) &&

    String(
      address.name || ""
    ).trim() &&

    String(
      user?.email || ""
    ).includes("@") &&

    String(
      address.phone || ""
    ).length === 10 &&

    String(
      address.street ||
      address.addressLine1 ||
      ""
    ).trim() &&

    String(
      address.area || ""
    ).trim() &&

    String(
      address.city || ""
    ).trim() &&

    String(
      address.district || ""
    ).trim() &&

    String(
      address.state || ""
    ).trim() &&

    String(
      address.postcode || ""
    ).trim() &&

    String(
      address.country || ""
    ).trim();


  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      String(
        user?.email || ""
      ).trim()
    );


  const emailTouched =
    String(
      user?.email || ""
    ).length > 0;


  /* =======================================================
     DELIVERY VALIDATION
  ======================================================= */

  const validateDelivery = () => {

    if (!selectedAddressId && !showAddressForm) {
      toast.error(
        "Please select a saved delivery address first."
      );

      setAddressSelectorOpen(true);
      setShowAddressForm(true);

      return false;
    }

    if (
      !String(
        address.name || ""
      ).trim()
    ) {

      toast.error(
        "Full Name is required"
      );

      return false;
    }


    if (!emailValid) {

      toast.error(
        "Valid Email is required"
      );

      return false;
    }


    if (
      !/^\d{10}$/.test(
        String(
          address.phone || ""
        )
      )
    ) {

      toast.error(
        "Valid 10-digit Phone Number is required"
      );

      return false;
    }


    if (
      !String(
        address.street ||
        address.addressLine1 ||
        ""
      ).trim()
    ) {

      toast.error(
        "Street Address is required"
      );

      return false;
    }


    if (
      !String(
        address.area || ""
      ).trim()
    ) {

      toast.error(
        "Area / Locality is required"
      );

      return false;
    }


    if (
      !String(
        address.city || ""
      ).trim()
    ) {

      toast.error(
        "City is required"
      );

      return false;
    }


    if (
      !String(
        address.district || ""
      ).trim()
    ) {

      toast.error(
        "District is required"
      );

      return false;
    }


    if (
      !String(
        address.state || ""
      ).trim()
    ) {

      toast.error(
        "State is required"
      );

      return false;
    }


    if (
      !/^[1-9][0-9]{5}$/.test(
        String(
          address.postcode || ""
        ).trim()
      )
    ) {

      toast.error(
        "Valid 6-digit PIN code is required"
      );

      return false;
    }


    if (
      !String(
        address.country || ""
      ).trim()
    ) {

      toast.error(
        "Country is required"
      );

      return false;
    }


    return true;

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <>

      <style>{`

        :root {

          --ind:#4f46e5;

          --blue:#2563eb;

          --lt:#eef2ff;

          --bdr:
            rgba(99,102,241,0.15);

        }


        .cart-root * {
          font-family: Inter, Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .cart-serif {
          font-family: Inter, Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-style: normal;
        }


        .step-done {

          background:
            linear-gradient(
              135deg,
              var(--ind),
              var(--blue)
            );

          color:white;

          border-color:
            transparent;

        }


        .step-active {

          background:white;

          color:var(--ind);

          border-color:
            var(--ind);

          box-shadow:
            0 0 0 3px
            rgba(
              99,
              102,
              241,
              0.18
            );

        }


        .step-idle {

          background:#f9fafb;

          color:#9ca3af;

          border-color:#e5e7eb;

        }


        .connector-done {

          background:
            linear-gradient(
              90deg,
              var(--ind),
              var(--blue)
            );

        }


        .connector-idle {

          background:#e5e7eb;

        }


        .cart-card {

          background:
            rgba(
              255,
              255,
              255,
              0.82
            );

          backdrop-filter:
            blur(14px);

          border:
            1px solid
            rgba(
              99,
              102,
              241,
              0.12
            );

          border-radius:
            20px;

          box-shadow:
            0 4px 24px
            rgba(
              99,
              102,
              241,
              0.08
            );

          transition:
            transform .25s,
            box-shadow .25s,
            border-color .25s;

        }


        .cart-card:hover {

          transform:
            translateY(-2px);

          box-shadow:
            0 8px 32px
            rgba(
              99,
              102,
              241,
              0.14
            );

          border-color:
            rgba(
              99,
              102,
              241,
              0.25
            );

        }


        .f-input-bare {

          width:100%;

          background:#f8faff;

          border:
            1px solid
            rgba(
              99,
              102,
              241,
              0.18
            );

          border-radius:
            12px;

          padding:
            11px 14px;

          font-size:
            13px;

          color:
            #1e1b4b;

          transition:
            border-color .2s,
            box-shadow .2s;

        }


        .f-input-bare::placeholder {

          color:
            #a5b4fc;

        }


        .f-input-bare:focus {

          outline:none;

          background:white;

          border-color:
            #6366f1;

          box-shadow:
            0 0 0 3px
            rgba(
              99,
              102,
              241,
              0.14
            );

        }


        .f-input-bare.error {

          border-color:
            #f43f5e;

        }


        .f-input-bare.valid {

          border-color:
            #10b981;

        }


        .req-badge {

          display:inline-flex;

          align-items:center;

          font-size:9px;

          font-weight:700;

          letter-spacing:
            .06em;

          text-transform:
            uppercase;

          background:
            rgba(
              99,
              102,
              241,
              0.1
            );

          border:
            1px solid
            rgba(
              99,
              102,
              241,
              0.2
            );

          color:#6366f1;

          padding:
            1px 6px;

          border-radius:
            999px;

        }


        .opt-badge {

          display:inline-flex;

          align-items:center;

          font-size:9px;

          font-weight:600;

          background:#f8faff;

          border:
            1px solid
            #e5e7eb;

          color:#9ca3af;

          padding:
            1px 6px;

          border-radius:
            999px;

        }


        .btn-primary {

          background:
            linear-gradient(
              135deg,
              var(--ind),
              var(--blue)
            );

          color:white;

          font-weight:700;

          border-radius:
            14px;

          display:flex;

          align-items:center;

          justify-content:center;

          gap:8px;

          position:relative;

          overflow:hidden;

          transition:
            transform .2s,
            box-shadow .2s;

        }


        .btn-primary:hover:not(:disabled) {

          transform:
            translateY(-2px);

          box-shadow:
            0 10px 28px
            rgba(
              79,
              70,
              229,
              0.38
            );

        }


        .btn-primary:disabled {

          opacity:.45;

          cursor:not-allowed;

        }


        .review-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          box-shadow: 0 6px 24px rgba(15, 23, 42, 0.05);
        }

        .review-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .review-outline-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid #dbeafe;
          background: #eff6ff;
          color: #2563eb;
          font-size: 13px;
          font-weight: 700;
          transition: .2s ease;
        }

        .review-outline-btn:hover {
          background: #dbeafe;
          border-color: #bfdbfe;
        }

        .review-product {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border: 1px solid #eef2f7;
          background: #f8fafc;
          border-radius: 18px;
        }

        .review-input {
          width: 100%;
          min-height: 50px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 14px;
          padding: 0 15px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: .2s ease;
        }

        .review-input::placeholder { color: #94a3b8; }

        .review-input:focus {
          background: #fff;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, .10);
        }

        .review-apply-btn {
          min-height: 50px;
          min-width: 104px;
          padding: 0 20px;
          border: 0;
          border-radius: 14px;
          background: #2563eb;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          transition: .2s ease;
          box-shadow: 0 8px 18px rgba(37, 99, 235, .18);
        }

        .review-apply-btn:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .review-apply-btn:disabled { opacity: .55; cursor: not-allowed; }

        .review-payment-option {
          width: 100%;
          min-height: 82px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border-radius: 18px;
          border: 1.5px solid #e5e7eb;
          background: #fff;
          transition: .2s ease;
        }

        .review-payment-option:hover {
          border-color: #bfdbfe;
          background: #f8fbff;
        }

        .review-payment-active {
          border-color: #2563eb !important;
          background: #eff6ff !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, .08);
        }

        .payment-radio {
          width: 22px;
          height: 22px;
          border: 2px solid #cbd5e1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .review-payment-active .payment-radio { border-color: #2563eb; }

        .payment-radio-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #2563eb;
        }

        .payment-method-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .online-icon { background: #dbeafe; color: #2563eb; }
        .cod-icon { background: #fef3c7; color: #d97706; }

        .fixed-review-bar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 40;
          padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
          background: rgba(255,255,255,.94);
          backdrop-filter: blur(16px);
          border-top: 1px solid #e5e7eb;
          box-shadow: 0 -8px 28px rgba(15,23,42,.08);
        }

        .fixed-review-inner {
          width: min(1180px, 100%);
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .review-back-btn {
          min-height: 56px;
          min-width: 56px;
          padding: 0 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #475569;
          border-radius: 17px;
          font-size: 14px;
          font-weight: 700;
        }

        .review-total-mini {
          min-width: 160px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .review-total-mini span {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
        }

        .review-total-mini strong {
          color: #0f172a;
          font-size: 20px;
          line-height: 1.1;
          font-weight: 800;
        }

        .review-place-btn {
          flex: 1;
          min-height: 39px;
          border: 0;
          border-radius: 18px;
          background: #2563eb;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 800;
          box-shadow: 0 10px 24px rgba(37,99,235,.25);
          transition: .2s ease;
        }

        .review-place-btn:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
        .review-place-btn:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }

        @media (max-width: 640px) {
          .review-card { border-radius: 19px; padding: 16px !important; }
          .review-product { align-items: flex-start; gap: 10px; padding: 10px; }
          .review-product > div:last-child { margin-left: auto; }
          .review-total-mini { min-width: 0; flex: 0 0 auto; }
          .review-total-mini strong { font-size: 17px; }
          .review-total-mini span { font-size: 10px; }
          .review-back-btn { min-width: 50px; min-height: 54px; padding: 0 13px; }
          .review-place-btn { min-height: 39px; font-size: 14px; }
          .fixed-review-inner { gap: 9px; }
        }

        @keyframes shimmer {

          0% {
            background-position:
              -200% center;
          }

          100% {
            background-position:
              200% center;
          }

        }


        .btn-primary::after {

          content:'';

          position:absolute;

          inset:0;

          border-radius:
            inherit;

          background:
            linear-gradient(
              105deg,
              transparent 35%,
              rgba(
                255,
                255,
                255,
                .18
              ) 50%,
              transparent 65%
            );

          background-size:
            200% 100%;

          animation:
            shimmer 2.4s infinite;

        }


        .btn-secondary {

          background:#f0f4ff;

          border:
            1px solid
            rgba(
              99,
              102,
              241,
              .2
            );

          color:
            var(--ind);

          font-weight:600;

          border-radius:
            14px;

          display:flex;

          align-items:center;

          justify-content:center;

          gap:8px;

          transition:
            all .2s;

        }


        .btn-secondary:hover {

          background:
            #e0e7ff;

          border-color:
            rgba(
              99,
              102,
              241,
              .4
            );

          transform:
            translateY(-1px);

        }


        .qty-wrap {

          display:flex;

          align-items:center;

          gap:10px;

          background:
            #f8faff;

          border:
            1px solid
            rgba(
              99,
              102,
              241,
              .15
            );

          border-radius:
            12px;

          padding:
            6px 12px;

        }


        .qty-btn {

          width:28px;

          height:28px;

          border-radius:8px;

          display:flex;

          align-items:center;

          justify-content:center;

          background:white;

          border:
            1px solid
            rgba(
              99,
              102,
              241,
              .18
            );

          color:#6366f1;

          transition:
            all .18s;

          cursor:pointer;

        }


        .qty-btn:hover {

          background:
            #eef2ff;

          border-color:
            rgba(
              99,
              102,
              241,
              .4
            );

        }


        .s-row {

          display:flex;

          justify-content:
            space-between;

          align-items:center;

          font-size:13px;

          color:#6b7280;

        }


        @keyframes pageIn {

          from {

            opacity:0;

            transform:
              translateY(16px);

          }

          to {

            opacity:1;

            transform:
              translateY(0);

          }

        }


        .step-panel {

          animation:
            pageIn .4s
            cubic-bezier(
              .22,
              1,
              .36,
              1
            ) both;

        }


        @keyframes blobDrift {

          0%,100% {

            transform:
              translate(0,0)
              scale(1);

          }

          40% {

            transform:
              translate(
                18px,
                -16px
              )
              scale(1.05);

          }

          70% {

            transform:
              translate(
                -10px,
                10px
              )
              scale(.96);

          }

        }


        .blob {

          animation:
            blobDrift 10s
            ease-in-out infinite;

        }


        .blob2 {

          animation:
            blobDrift 13s
            ease-in-out infinite
            reverse;

        }


        @keyframes checkIn {

          from {

            opacity:0;

            transform:
              scale(.4);

          }

          to {

            opacity:1;

            transform:
              scale(1);

          }

        }


        .check-in {

          animation:
            checkIn .3s
            cubic-bezier(
              .34,
              1.56,
              .64,
              1
            ) both;

        }


        /* =========================================================
           MODERN ECOMMERCE POLISH
        ========================================================= */

        .cart-root {
          background:
            radial-gradient(circle at 8% 5%, rgba(99,102,241,.16), transparent 28%),
            radial-gradient(circle at 92% 20%, rgba(59,130,246,.10), transparent 26%),
            linear-gradient(180deg,#f8faff 0%,#f5f7fb 48%,#ffffff 100%) !important;
        }

        .cart-root::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(120deg,rgba(255,255,255,.65),transparent 45%);
        }

        .cart-trust-strip {
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:12px;
        }

        .cart-trust-item {
          display:flex;
          align-items:center;
          gap:11px;
          min-height:64px;
          padding:12px 14px;
          border:1px solid rgba(148,163,184,.16);
          border-radius:18px;
          background:rgba(255,255,255,.76);
          box-shadow:0 8px 30px rgba(15,23,42,.045);
          backdrop-filter:blur(14px);
        }

        .cart-trust-item > span {
          width:36px; height:36px; flex:none;
          display:flex; align-items:center; justify-content:center;
          border-radius:12px; background:#f1f5ff;
          font-size:16px;
        }

        .cart-trust-item strong { display:block; font-size:11px; color:#1e293b; }
        .cart-trust-item small { display:block; margin-top:2px; font-size:9px; color:#94a3b8; }

        .cart-item-card {
          position:relative;
          border-color:rgba(148,163,184,.16);
          background:rgba(255,255,255,.88);
          box-shadow:0 10px 35px rgba(15,23,42,.055);
        }

        .cart-item-card img {
          width:92px !important;
          height:92px !important;
          border-radius:16px !important;
          border-color:#eef2ff !important;
          background:#f8fafc;
          padding:3px;
        }

        .cart-item-card:hover {
          transform:translateY(-3px);
          box-shadow:0 18px 42px rgba(79,70,229,.10);
        }

        .cart-summary-card {
          position:sticky;
          top:20px;
          z-index:20;
          border-color:rgba(99,102,241,.18);
          background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(248,250,255,.94));
          box-shadow:0 18px 50px rgba(79,70,229,.10);
        }

        .cart-summary-card::before {
          content:'';
          position:absolute;
          left:0; right:0; top:0; height:3px;
          border-radius:20px 20px 0 0;
          background:linear-gradient(90deg,#4f46e5,#2563eb,#7c3aed);
        }

        .cart-root .step-panel > h2 {
          letter-spacing:-.025em;
        }

        .cart-root button {
          -webkit-tap-highlight-color:transparent;
        }

        @media (max-width: 767px) {
          .cart-trust-strip { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
          .cart-trust-item { min-height:58px; padding:9px 10px; border-radius:15px; }
          .cart-trust-item > span { width:31px; height:31px; border-radius:10px; font-size:14px; }
          .cart-trust-item strong { font-size:10px; }
          .cart-trust-item small { font-size:8px; }
          .cart-summary-card { position:relative; top:auto; }
          .cart-item-card img { width:76px !important; height:76px !important; }
        }

        /* =========================================================
           PREMIUM CART UI/UX — VISUAL ONLY
           Checkout/business logic intentionally untouched.
        ========================================================= */

        .cart-root {
          min-height:100dvh;
          background:
            radial-gradient(circle at 8% 0%, rgba(99,102,241,.18), transparent 25%),
            radial-gradient(circle at 95% 12%, rgba(14,165,233,.14), transparent 23%),
            radial-gradient(circle at 50% 100%, rgba(124,58,237,.07), transparent 32%),
            linear-gradient(180deg,#f7f9ff 0%,#f8fafc 52%,#ffffff 100%) !important;
        }

        .cart-root::after {
          content:"";
          position:absolute;
          inset:0;
          pointer-events:none;
          z-index:0;
          background:
            linear-gradient(115deg,rgba(255,255,255,.72),transparent 32%),
            radial-gradient(circle at 50% 18%,rgba(255,255,255,.55),transparent 38%);
        }

        .cart-root > .relative {
          max-width:1400px;
        }

        .cart-root .cart-serif {
          letter-spacing:-.045em;
        }

        /* Stepper */
        .cart-root .step-done,
        .cart-root .step-active,
        .cart-root .step-idle {
          position:relative;
          width:48px;
          height:48px;
          border-radius:16px;
          transition:all .28s cubic-bezier(.2,.8,.2,1);
        }

        .cart-root .step-done {
          background:linear-gradient(135deg,#4f46e5,#2563eb 55%,#7c3aed);
          box-shadow:0 12px 28px rgba(79,70,229,.24), inset 0 1px rgba(255,255,255,.35);
        }

        .cart-root .step-active {
          background:rgba(255,255,255,.96);
          border-color:#6366f1;
          color:#4f46e5;
          box-shadow:0 0 0 5px rgba(99,102,241,.10), 0 12px 30px rgba(79,70,229,.12);
        }

        .cart-root .step-active::after {
          content:"";
          position:absolute;
          inset:-7px;
          border:1px solid rgba(99,102,241,.18);
          border-radius:20px;
          animation:cartPulse 2.4s ease-in-out infinite;
        }

        .cart-root .step-idle {
          background:rgba(255,255,255,.78);
          border-color:#e2e8f0;
          box-shadow:0 5px 18px rgba(15,23,42,.04);
        }

        .cart-root .connector-done,
        .cart-root .connector-idle {
          height:4px;
          border-radius:999px;
        }

        /* Cards */
        .cart-root .cart-card,
        .cart-root .cart-item-card,
        .cart-root .cart-summary-card {
          position:relative;
          overflow:hidden;
          border-radius:24px;
        }

        .cart-root .cart-card::after,
        .cart-root .cart-item-card::after,
        .cart-root .cart-summary-card::after {
          content:"";
          position:absolute;
          top:-120%;
          left:-55%;
          width:35%;
          height:340%;
          pointer-events:none;
          transform:rotate(22deg);
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.58),transparent);
          opacity:0;
          transition:opacity .2s;
        }

        .cart-root .cart-card:hover::after,
        .cart-root .cart-item-card:hover::after,
        .cart-root .cart-summary-card:hover::after {
          opacity:1;
          animation:cartShine 1.15s ease;
        }

        .cart-root .cart-item-card {
          background:linear-gradient(145deg,rgba(255,255,255,.97),rgba(248,250,255,.92));
          border:1px solid rgba(148,163,184,.15);
          box-shadow:0 10px 34px rgba(15,23,42,.055);
        }

        .cart-root .cart-item-card:hover {
          transform:translateY(-4px);
          border-color:rgba(99,102,241,.24);
          box-shadow:0 22px 50px rgba(79,70,229,.13);
        }

        .cart-root .cart-item-card img {
          border-radius:20px !important;
          box-shadow:0 8px 24px rgba(15,23,42,.08);
          transition:transform .35s ease,box-shadow .35s ease;
        }

        .cart-root .cart-item-card:hover img {
          transform:scale(1.035);
          box-shadow:0 14px 30px rgba(79,70,229,.12);
        }

        /* Summary / price panel */
        .cart-root .cart-summary-card {
          background:linear-gradient(150deg,rgba(255,255,255,.98),rgba(245,247,255,.94));
          border:1px solid rgba(99,102,241,.17);
          box-shadow:0 22px 60px rgba(79,70,229,.12);
        }

        .cart-root .cart-summary-card::before {
          height:4px;
          background:linear-gradient(90deg,#4f46e5,#2563eb,#7c3aed,#4f46e5);
          background-size:220% 100%;
          animation:cartGradient 4s linear infinite;
        }

        /* Trust tiles */
        .cart-root .cart-trust-item {
          min-height:72px;
          border:1px solid rgba(148,163,184,.14);
          background:rgba(255,255,255,.74);
          box-shadow:0 10px 28px rgba(15,23,42,.045);
          transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;
        }

        .cart-root .cart-trust-item:hover {
          transform:translateY(-3px);
          border-color:rgba(99,102,241,.2);
          box-shadow:0 16px 36px rgba(79,70,229,.10);
        }

        .cart-root .cart-trust-item > span {
          background:linear-gradient(145deg,#eef2ff,#e0e7ff);
          box-shadow:inset 0 1px rgba(255,255,255,.9);
        }

        /* Buttons */
        .cart-root .btn-primary,
        .cart-root .btn-secondary {
          min-height:44px;
          border-radius:14px;
          transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease,background .2s ease;
        }

        .cart-root .btn-primary {
          background:linear-gradient(135deg,#4f46e5,#2563eb 55%,#7c3aed);
          box-shadow:0 12px 28px rgba(79,70,229,.22);
          position:relative;
          overflow:hidden;
        }

        .cart-root .btn-primary::after {
          content:"";
          position:absolute;
          top:0;
          bottom:0;
          left:-70%;
          width:45%;
          transform:skewX(-20deg);
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);
          pointer-events:none;
        }

        .cart-root .btn-primary:hover {
          transform:translateY(-2px);
          box-shadow:0 18px 36px rgba(79,70,229,.28);
        }

        .cart-root .btn-primary:hover::after {
          animation:cartButtonShine .8s ease;
        }

        .cart-root .btn-secondary {
          background:rgba(255,255,255,.9);
          border:1px solid #e2e8f0;
          color:#475569;
          box-shadow:0 7px 20px rgba(15,23,42,.045);
        }

        .cart-root .btn-secondary:hover {
          transform:translateY(-2px);
          border-color:#c7d2fe;
          color:#4f46e5;
          background:#f8faff;
          box-shadow:0 12px 28px rgba(79,70,229,.09);
        }

        /* Quantity controls */
        .cart-root .qty-btn {
          width:38px !important;
          height:38px !important;
          border-radius:12px !important;
          border:1px solid #e2e8f0 !important;
          background:#fff !important;
          box-shadow:0 5px 15px rgba(15,23,42,.045);
          transition:all .2s ease;
        }

        .cart-root .qty-btn:hover {
          border-color:#a5b4fc !important;
          background:#eef2ff !important;
          color:#4f46e5 !important;
          transform:translateY(-1px);
        }

        /* Inputs */
        .cart-root .f-input-bare {
          min-height:48px;
          border-radius:14px;
          background:rgba(248,250,255,.9);
          border:1px solid #e2e8f0;
          box-shadow:inset 0 1px 2px rgba(15,23,42,.02);
          transition:border-color .2s,box-shadow .2s,background .2s;
        }

        .cart-root .f-input-bare:focus {
          background:#fff;
          border-color:#818cf8;
          box-shadow:0 0 0 4px rgba(99,102,241,.10),0 8px 22px rgba(79,70,229,.06);
          outline:none;
        }

        /* Empty cart */
        .cart-root .step-one-panel > div:first-child img,
        .cart-root img[alt="Empty Cart"] {
          filter:drop-shadow(0 18px 30px rgba(79,70,229,.12));
        }

        /* Mobile */
        @media (max-width:767px) {
          .cart-root > .relative {
            padding-left:12px;
            padding-right:12px;
            padding-top:24px;
          }

          .cart-root .cart-trust-item {
            min-height:60px;
            border-radius:16px;
          }

          .cart-root .cart-card,
          .cart-root .cart-item-card,
          .cart-root .cart-summary-card {
            border-radius:20px;
          }

          .cart-root .step-done,
          .cart-root .step-active,
          .cart-root .step-idle {
            width:42px;
            height:42px;
            border-radius:14px;
          }

          .cart-root .connector-done,
          .cart-root .connector-idle {
            margin-left:8px;
            margin-right:8px;
          }
        }

        @keyframes cartShine {
          from { transform:translateX(0) rotate(22deg); }
          to { transform:translateX(420%) rotate(22deg); }
        }

        @keyframes cartButtonShine {
          from { left:-70%; }
          to { left:135%; }
        }

        @keyframes cartGradient {
          0% { background-position:0% 50%; }
          100% { background-position:220% 50%; }
        }

        @keyframes cartPulse {
          0%,100% { opacity:.45; transform:scale(.98); }
          50% { opacity:1; transform:scale(1.02); }
        }

        @media (prefers-reduced-motion:reduce) {
          .cart-root *,
          .cart-root *::before,
          .cart-root *::after {
            animation-duration:.01ms !important;
            animation-iteration-count:1 !important;
            scroll-behavior:auto !important;
            transition-duration:.01ms !important;
          }
        }

\n        /* =========================================================\n           MODERN CART UI + SKELETON\n        ========================================================= */\n        .modern-cart-page {\n          position: relative;\n          padding-bottom: 20px;\n        }\n\n        .modern-cart-head {\n          display:flex; align-items:center; justify-content:space-between; gap:16px;\n          margin-bottom:22px;\n        }\n        .modern-icon-btn {\n          width:42px; height:42px; border-radius:14px; border:1px solid #e8edf5;\n          background:#fff; color:#334155; display:flex; align-items:center; justify-content:center;\n          box-shadow:0 5px 18px rgba(15,23,42,.06); transition:.2s ease; flex:none;\n        }\n        .modern-icon-btn:hover { transform:translateY(-1px); border-color:#c7d2fe; color:#4f46e5; }\n        .modern-cart-title { font-size:clamp(24px,3vw,32px); line-height:1.05; font-weight:850; letter-spacing:-.04em; color:#0f172a; margin:0; }\n        .modern-cart-subtitle { margin-top:5px; color:#94a3b8; font-size:12px; font-weight:550; }\n        .modern-count-pill { padding:5px 9px; border-radius:999px; background:#eef2ff; border:1px solid #e0e7ff; color:#4f46e5; font-size:11px; font-weight:800; }\n        .modern-orders-btn {\n          min-height:42px; padding:0 14px; border:1px solid #e7eaf0; border-radius:14px; background:#fff;\n          color:#475569; display:flex; align-items:center; gap:8px; font-size:12px; font-weight:800;\n          box-shadow:0 5px 18px rgba(15,23,42,.05); transition:.2s ease; flex:none;\n        }\n        .modern-orders-btn:hover { border-color:#c7d2fe; color:#4f46e5; transform:translateY(-1px); }\n\n        .modern-cart-layout { display:grid; grid-template-columns:minmax(0,1fr) 360px; gap:22px; align-items:start; }\n        .modern-cart-main { min-width:0; display:flex; flex-direction:column; gap:9px; }\n        .modern-assurance-card {\n          min-height:72px; display:flex; align-items:center; gap:12px; padding:14px 16px;\n          border:1px solid #dbeafe; border-radius:18px; background:linear-gradient(135deg,#f8fbff,#fff);\n          box-shadow:0 8px 28px rgba(37,99,235,.06);\n        }\n        .modern-assurance-icon { width:38px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; color:#10b981; flex:none; }\n        .modern-assurance-title { font-size:13px; font-weight:850; color:#0f172a; }\n        .modern-assurance-text { margin-top:2px; font-size:11px; color:#64748b; line-height:1.45; }\n        .modern-secure-badge { margin-left:auto; border-radius:999px; padding:5px 8px; background:#eff6ff; color:#2563eb; font-size:9px; font-weight:900; letter-spacing:.08em; }\n\n        .modern-items-card, .modern-summary-card {\n          background:rgba(255,255,255,.92); border:1px solid #e8edf4; border-radius:22px;\n          box-shadow:0 12px 40px rgba(15,23,42,.07);\n        }\n        .modern-items-card { padding:18px; }\n        .modern-section-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:2px 2px 14px; }\n        .modern-eyebrow { font-size:9px; font-weight:900; letter-spacing:.14em; color:#94a3b8; }\n        .modern-section-title { margin-top:3px; font-size:17px; font-weight:850; letter-spacing:-.02em; color:#0f172a; }\n        .modern-item-count { padding:5px 9px; border-radius:999px; background:#f8fafc; border:1px solid #eef2f7; color:#64748b; font-size:10px; font-weight:800; }\n        .modern-items-list { display:flex; flex-direction:column; }\n        .modern-product-row {\n          display:flex; gap:14px; padding:15px 2px; border-top:1px solid #f1f5f9; transition:.2s ease;\n        }\n        .modern-product-row:hover { background:#fbfdff; border-radius:16px; padding-left:8px; padding-right:8px; }\n        .modern-product-image-wrap { position:relative; width:92px; height:92px; border-radius:17px; overflow:hidden; background:#f8fafc; flex:none; }\n        .modern-product-image { width:100%; height:100%; object-fit:cover; display:block; transition:transform .35s ease; }\n        .modern-product-image-wrap:hover .modern-product-image { transform:scale(1.045); }\n        .modern-unavailable-badge { position:absolute; left:6px; bottom:6px; padding:4px 6px; border-radius:7px; background:#e11d48; color:#fff; font-size:8px; font-weight:900; }\n        .modern-product-info { min-width:0; flex:1; display:flex; flex-direction:column; justify-content:space-between; }\n        .modern-product-title { display:block; max-width:calc(100% - 35px); color:#172033; font-size:14px; line-height:1.35; font-weight:800; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }\n        .modern-product-title:hover { color:#4f46e5; }\n        .modern-variant { margin-top:4px; color:#94a3b8; font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }\n        .modern-delete-btn { width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#94a3b8; border:1px solid transparent; flex:none; transition:.2s ease; }\n        .modern-delete-btn:hover { color:#e11d48; background:#fff1f2; border-color:#ffe4e6; }\n        .modern-product-bottom { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; margin-top:10px; }\n        .modern-product-price { color:#111827; font-size:16px; font-weight:900; letter-spacing:-.02em; }\n        .modern-product-note { margin-top:3px; display:flex; align-items:center; gap:4px; color:#10b981; font-size:9px; font-weight:750; }\n        .modern-qty-control { height:36px; display:flex; align-items:center; gap:2px; padding:3px; border:1px solid #e5e7eb; border-radius:11px; background:#fff; box-shadow:0 3px 10px rgba(15,23,42,.04); }\n        .modern-qty-control button { width:29px; height:29px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#475569; transition:.15s ease; }\n        .modern-qty-control button:hover { background:#eef2ff; color:#4f46e5; }\n        .modern-qty-control span { width:24px; text-align:center; color:#0f172a; font-size:12px; font-weight:900; }\n\n        .modern-add-products { width:100%; margin-top:10px; min-height:62px; padding:10px 12px; display:flex; align-items:center; gap:10px; border:1px dashed #cbd5e1; border-radius:16px; background:#fafcff; color:#334155; transition:.2s ease; }\n        .modern-add-products:hover { border-color:#a5b4fc; background:#f5f7ff; color:#4f46e5; }\n        .modern-add-products strong { display:block; font-size:12px; font-weight:850; }\n        .modern-add-products small { display:block; margin-top:2px; font-size:10px; color:#94a3b8; }\n        .modern-add-icon { width:36px; height:36px; border-radius:11px; background:#eef2ff; color:#4f46e5; display:flex; align-items:center; justify-content:center; flex:none; }\n\n        .modern-cart-summary { position:sticky; top:20px; }\n        .modern-summary-card { padding:20px; }\n        .modern-summary-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-bottom:15px; border-bottom:1px solid #f1f5f9; }\n        .modern-summary-head h3 { margin-top:3px; font-size:18px; font-weight:900; letter-spacing:-.025em; color:#0f172a; text-transform:capitalize; }\n        .modern-summary-bag { width:42px; height:42px; border-radius:14px; display:flex; align-items:center; justify-content:center; background:#eef2ff; color:#4f46e5; }\n        .modern-summary-rows { padding:15px 0; display:flex; flex-direction:column; gap:11px; }\n        .modern-summary-rows > div { display:flex; justify-content:space-between; gap:12px; font-size:12px; }\n        .modern-summary-rows span { color:#64748b; }\n        .modern-summary-rows strong { color:#334155; font-weight:800; }\n        .modern-summary-rows .free { color:#10b981; }\n        .modern-savings-note { display:flex; align-items:flex-start; gap:8px; padding:10px 11px; border-radius:13px; background:#ecfdf5; border:1px solid #d1fae5; color:#047857; font-size:10px; line-height:1.45; font-weight:700; }\n        .modern-total-row { margin-top:15px; padding-top:15px; border-top:1px dashed #e2e8f0; display:flex; align-items:flex-end; justify-content:space-between; gap:10px; }\n        .modern-total-row span { display:block; color:#475569; font-size:11px; font-weight:800; }\n        .modern-total-row small { display:block; margin-top:3px; color:#94a3b8; font-size:9px; }\n        .modern-total-row strong { color:#111827; font-size:25px; line-height:1; font-weight:950; letter-spacing:-.045em; }\n        .modern-trust-row { display:flex; flex-wrap:wrap; gap:7px 12px; margin:14px 0; color:#64748b; font-size:9px; font-weight:700; }\n        .modern-trust-row span { display:flex; align-items:center; gap:5px; }\n        .modern-trust-row svg:first-child { color:#10b981; }\n        .modern-checkout-btn { width:100%; min-height:50px; border:0; border-radius:15px; background:linear-gradient(135deg,#4f46e5,#2563eb); color:#fff; display:flex; align-items:center; justify-content:center; gap:9px; font-size:13px; font-weight:900; box-shadow:0 12px 25px rgba(37,99,235,.22); transition:.2s ease; }\n        .modern-checkout-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 15px 30px rgba(37,99,235,.28); }\n        .modern-checkout-btn:disabled { opacity:.45; cursor:not-allowed; box-shadow:none; }\n        .modern-checkout-caption { margin-top:9px; text-align:center; color:#94a3b8; font-size:9px; line-height:1.45; }\n\n        .modern-unavailable-card { padding:16px; border:1px solid #fecdd3; border-radius:18px; background:linear-gradient(135deg,#fff7f8,#fff); }\n        .modern-warning-icon { width:38px; height:38px; border-radius:12px; background:#fff1f2; color:#e11d48; display:flex; align-items:center; justify-content:center; flex:none; }\n        .modern-warning-title { color:#9f1239; font-size:13px; font-weight:900; }\n        .modern-warning-text { margin-top:3px; color:#be123c; font-size:10px; line-height:1.45; }\n        .modern-unavailable-item { display:flex; align-items:center; gap:10px; padding:11px; border-radius:13px; background:#fff; border:1px solid #ffe4e6; }\n        .modern-remove-btn { height:32px; padding:0 9px; border-radius:9px; background:#fff1f2; color:#be123c; border:1px solid #fecdd3; display:flex; align-items:center; gap:5px; font-size:9px; font-weight:850; flex:none; }\n        .modern-change-pin { margin-top:10px; width:100%; min-height:38px; border-radius:11px; background:#eff6ff; color:#2563eb; border:1px solid #dbeafe; display:flex; align-items:center; justify-content:center; gap:7px; font-size:10px; font-weight:850; }\n\n        .modern-mobile-checkout { display:none; }\n\n        /* Skeleton */\n        .modern-cart-skeleton { width:100%; }\n        .skeleton { position:relative; overflow:hidden; background:#e9eef5; border-radius:10px; }\n        .skeleton::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg,transparent,rgba(255,255,255,.72),transparent); animation:modernSkeletonShimmer 1.35s infinite; }\n        .modern-cart-skeleton .modern-cart-head { min-height:48px; }\n        .skeleton-back { width:42px; height:42px; border-radius:14px; flex:none; }\n        .skeleton-title { width:190px; height:25px; }\n        .skeleton-order { width:84px; height:42px; border-radius:14px; }\n        .modern-skeleton-product { min-height:122px; display:flex; gap:14px; padding:15px 0; border-top:1px solid #f1f5f9; }\n        .skeleton-assurance { height:72px; border-radius:18px; margin-bottom:0; }\n        .skeleton-product-image { width:92px; height:92px; border-radius:17px; flex:none; }\n        .skeleton-product-copy { flex:1; padding-top:4px; }\n        .skeleton-line { height:12px; margin-bottom:10px; }\n        .w-80 { width:80%; } .w-55 { width:55%; } .w-35 { width:35%; }\n        .skeleton-qty { width:88px; height:34px; margin-left:auto; border-radius:11px; }\n        .modern-skeleton-summary { min-height:290px; padding:20px; border:1px solid #e8edf4; border-radius:22px; box-shadow:0 12px 40px rgba(15,23,42,.05); }\n        .skeleton-summary-head { width:65%; height:25px; margin-bottom:24px; }\n        .skeleton-summary-line { width:100%; height:13px; margin-bottom:15px; }\n        .skeleton-summary-total { width:48%; height:30px; margin:22px 0 20px auto; }\n        .skeleton-summary-button { width:100%; height:50px; border-radius:15px; }\n        @keyframes modernSkeletonShimmer { 100% { transform:translateX(100%); } }\n\n        @media (max-width: 900px) {\n          .modern-cart-layout { grid-template-columns:1fr; }\n          .modern-cart-summary { position:static; }\n        }\n\n        @media (max-width: 767px) {\n          .modern-cart-page { padding-bottom:122px; }\n          .modern-cart-head { margin-bottom:14px; }\n          .modern-cart-subtitle { font-size:10px; }\n          .modern-orders-btn { width:40px; height:40px; min-height:40px; padding:0; justify-content:center; border-radius:12px; }\n          .modern-orders-btn span { display:none; }\n          .modern-cart-layout { gap:12px; }\n          .modern-assurance-card { min-height:62px; padding:11px 12px; border-radius:15px; }\n          .modern-assurance-icon { width:34px; height:34px; border-radius:10px; }\n          .modern-assurance-text { font-size:9px; }\n          .modern-secure-badge { display:none; }\n          .modern-items-card { padding:13px; border-radius:18px; }\n          .modern-section-title { font-size:15px; }\n          .modern-product-row { gap:10px; padding:13px 0; }\n          .modern-product-image-wrap, .skeleton-product-image { width:76px; height:76px; border-radius:14px; }\n          .modern-product-title { font-size:12px; }\n          .modern-product-price { font-size:14px; }\n          .modern-product-bottom { margin-top:7px; }\n          .modern-qty-control { height:32px; }\n          .modern-qty-control button { width:25px; height:25px; }\n          .modern-qty-control span { width:21px; }\n          .modern-summary-card { padding:15px; border-radius:18px; }\n          .modern-summary-head h3 { font-size:16px; }\n          .modern-total-row strong { font-size:22px; }\n          .modern-checkout-btn, .modern-checkout-caption { display:none; }\n          .modern-mobile-checkout {\n            position:fixed; left:0; right:0; bottom:0; z-index:95; min-height:72px;\n            padding:10px 14px calc(10px + env(safe-area-inset-bottom)); border:1px solid rgba(226,232,240,.92); border-radius:22px 22px 0 0;\n            background:rgba(255,255,255,.96); backdrop-filter:blur(18px); box-shadow:0 12px 38px rgba(15,23,42,.16);\n            display:flex; align-items:center; justify-content:space-between; gap:12px;\n          }\n          .modern-mobile-checkout span { display:block; color:#94a3b8; font-size:9px; font-weight:750; }\n          .modern-mobile-checkout strong { display:block; margin-top:2px; color:#0f172a; font-size:17px; font-weight:950; }\n          .modern-mobile-checkout button { min-height:45px; padding:0 17px; border:0; border-radius:13px; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; gap:7px; font-size:12px; font-weight:900; box-shadow:0 8px 18px rgba(37,99,235,.22); }\n          .modern-mobile-checkout button:disabled { opacity:.45; box-shadow:none; }\n          .modern-skeleton-summary { min-height:250px; }\n          .skeleton-title { width:135px; }\n          .skeleton-order { width:40px; }\n        }\n\n        @media (prefers-reduced-motion: reduce) {\n          .skeleton::after { animation:none; }\n          .modern-icon-btn, .modern-orders-btn, .modern-checkout-btn, .modern-product-image { transition:none; }\n        }\n        /* =========================================================
           FIXED BOTTOM ACTION DOCKS — MODERN APP UX
           Content scrolls normally; only the active step action
           stays fixed at the bottom.
        ========================================================= */

        .payment-action-dock {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 110;
          padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
          background: rgba(255,255,255,.88);
          border-top: 1px solid rgba(148,163,184,.18);
          box-shadow: 0 -12px 35px rgba(15,23,42,.10);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
        }

        .payment-action-inner {
          width: min(100%, 980px);
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .payment-action-dock button {
          min-height: 54px;
          border-radius: 17px;
        }

        .fixed-review-bar {
          padding-bottom: env(safe-area-inset-bottom);
          background: rgba(255,255,255,.90);
          backdrop-filter: blur(22px);
          border-radius: 30px 30px 0 0;
          -webkit-backdrop-filter: blur(22px);
        }

        .modern-mobile-checkout {
          padding-bottom: calc(9px + env(safe-area-inset-bottom));
          background: rgba(255,255,255,.90);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
        }

        @media (max-width: 767px) {
          .payment-action-dock {
            padding-left: 10px;
            padding-right: 10px;
            padding-top: 8px;
          }

          .payment-action-inner {
            gap: 9px;
          }

          .payment-action-inner button {
            min-height: 50px;
            border-radius: 15px;
          }

          .payment-action-inner button:first-child {
            flex: 0 0 30%;
          }

          .payment-action-inner button:last-child {
            flex: 1;
          }

          .step-panel.pb-32 {
            padding-bottom: 130px !important;
          }
        }

        @media (min-width: 768px) {
          .payment-action-dock {
            padding-left: 24px;
            padding-right: 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .payment-action-dock *,
          .modern-mobile-checkout * {
            transition: none !important;
            animation: none !important;
          }
        }


        /* =========================================================
           📍 REACT NATIVE STYLE ADDRESS SELECTOR
           Modal + card selection + skeleton + shine animations.
        ========================================================= */

        /* =========================================================
           PLAY STORE / MATERIAL-STYLE ADDRESS UI
           Compact typography, clear hierarchy, touch-first controls.
        ========================================================= */
        .address-selector-modal,
        .address-selector-modal * {
          font-family:
            "Roboto",
            "Google Sans",
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        .address-selector-modal {
          width: min(100% - 24px, 620px) !important;
          max-width: 620px !important;
          margin: 12px auto !important;
        }

        .address-selector-shell {
          max-height: min(88vh, 760px) !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 22px !important;
          background: #fff !important;
          box-shadow:
            0 18px 55px rgba(15, 23, 42, .16),
            0 3px 12px rgba(15, 23, 42, .07) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          animation: addressModalIn .28s cubic-bezier(.2,.8,.2,1) both;
        }

        .address-modal-shine {
          display: none !important;
        }

        .address-selector-header {
          min-height: 68px;
          padding: 14px 16px !important;
          background: #fff;
          border-bottom: 1px solid #edf0f3 !important;
        }

        .address-selector-heading {
          gap: 12px;
        }

        .address-selector-icon {
          width: 40px;
          height: 40px;
          flex-basis: 40px;
          border-radius: 50%;
          color: #1a73e8;
          background: #e8f0fe;
          border: 0;
          box-shadow: none;
          animation: none;
        }

        .address-selector-heading h3 {
          font-size: 18px;
          line-height: 24px;
          letter-spacing: -.15px;
          font-weight: 500;
          color: #202124;
        }

        .address-selector-heading p {
          margin-top: 2px;
          font-size: 12px;
          line-height: 17px;
          color: #5f6368;
          font-weight: 400;
        }

        .address-add-btn {
          height: 38px;
          padding: 0 13px;
          border-radius: 20px;
          color: #1a73e8;
          background: #e8f0fe;
          box-shadow: none;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: .05px;
        }

        .address-add-btn::after,
        .address-save-btn::after,
        .address-footer-done::after {
          display: none !important;
        }

        .address-add-btn:hover {
          background: #dbe8fd;
          transform: none;
        }

        .address-selector-body {
          padding: 12px !important;
          background: #f8f9fa;
          scrollbar-width: thin;
        }

        .address-choice-list {
          gap: 9px;
        }

        .address-choice-card {
          border: 1px solid #dadce0;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 1px 3px rgba(60,64,67,.12);
          animation: addressCardIn .25s ease both;
        }

        .address-choice-card::after {
          display: none !important;
        }

        .address-choice-card:hover {
          transform: none;
          border-color: #b7c5d9;
          box-shadow: 0 2px 7px rgba(60,64,67,.14);
        }

        .address-choice-card.selected {
          border: 2px solid #1a73e8;
          background: #fff;
          box-shadow: 0 2px 8px rgba(26,115,232,.12);
        }

        .address-choice-main {
          gap: 12px;
          padding: 14px 14px 11px;
        }

        .address-choice-radio {
          width: 20px;
          height: 20px;
          flex-basis: 20px;
          margin-top: 1px;
          border: 2px solid #9aa0a6;
          box-shadow: none !important;
        }

        .address-choice-card.selected .address-choice-radio {
          border-color: #1a73e8;
          box-shadow: none !important;
        }

        .address-choice-radio span {
          width: 10px;
          height: 10px;
          background: #1a73e8;
          animation: none;
        }

        .address-choice-content {
          gap: 5px;
        }

        .address-choice-top {
          gap: 7px;
        }

        .address-choice-top strong {
          font-size: 14px;
          line-height: 20px;
          font-weight: 500;
          color: #202124;
        }

        .address-default-badge {
          height: 20px;
          padding: 0 8px;
          border-radius: 10px;
          background: #e6f4ea;
          color: #137333;
          font-size: 10px;
          line-height: 20px;
          font-weight: 500;
        }

        .address-choice-name {
          gap: 6px;
          color: #3c4043;
          font-size: 12px;
          line-height: 18px;
          font-weight: 400;
        }

        .address-choice-name svg {
          color: #5f6368;
          flex: 0 0 auto;
        }

        .address-choice-text {
          color: #5f6368;
          font-size: 12px;
          line-height: 18px;
          font-weight: 400;
        }

        .address-choice-check {
          width: 22px;
          min-width: 22px;
          color: #1a73e8;
        }

        .address-choice-actions {
          justify-content: flex-start;
          gap: 4px;
          padding: 0 12px 12px 46px;
          border-top: 1px solid #f1f3f4;
          padding-top: 8px;
        }

        .address-choice-actions button.address-action-btn {
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 9px;
          border: 0;
          border-radius: 16px;
          background: transparent;
          color: #5f6368;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .05px;
        }

        .address-choice-actions button.address-action-btn:hover {
          background: #f1f3f4;
          color: #202124;
          transform: none;
        }

        .address-choice-actions button.address-action-btn svg {
          color: currentColor;
        }

        .address-choice-actions button.address-action-btn.danger {
          color: #b3261e;
        }

        .address-choice-actions button.address-action-btn.danger:hover {
          background: #fce8e6;
          color: #b3261e;
        }

        .address-empty-state {
          width: 100%;
          min-height: 112px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 1px dashed #c7cdd4;
          border-radius: 16px;
          background: #fff;
          color: #202124;
          text-align: left;
          cursor: pointer;
          transition: background .18s ease, border-color .18s ease;
        }

        .address-empty-state:hover {
          background: #f8fbff;
          border-color: #8ab4f8;
        }

        .address-empty-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #1a73e8;
          background: #e8f0fe;
        }

        .address-empty-state strong {
          display: block;
          font-size: 14px;
          line-height: 20px;
          font-weight: 500;
        }

        .address-empty-state small {
          display: block;
          margin-top: 3px;
          color: #5f6368;
          font-size: 11px;
          line-height: 16px;
        }

        .address-selector-footer {
          min-height: 64px;
          padding: 10px 12px calc(10px + env(safe-area-inset-bottom)) !important;
          background: #fff;
          border-top: 1px solid #edf0f3 !important;
        }

        .address-footer-add,
        .address-footer-done {
          min-height: 40px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: .05px;
        }

        .address-footer-add {
          padding: 0 14px;
          color: #1a73e8;
          background: #e8f0fe;
        }

        .address-footer-add:hover {
          background: #dbe8fd;
          transform: none;
        }

        .address-footer-done {
          min-width: 142px;
          padding: 0 17px;
          color: #fff;
          background: #1a73e8;
          box-shadow: 0 2px 5px rgba(26,115,232,.22);
        }

        .address-footer-done:hover {
          background: #1769d1;
          transform: none;
        }

        .address-form-enter {
          background: #fff;
          border-radius: 16px;
          padding: 4px;
        }

        .address-form-labels {
          margin-bottom: 14px;
        }

        .address-label-chip {
          height: 36px;
          min-width: 78px;
          border-radius: 18px;
          font-size: 12px;
          font-weight: 500;
        }

        .address-field > span {
          font-size: 11px;
          line-height: 16px;
          font-weight: 500;
          color: #3c4043;
        }

        .address-field input,
        .address-field textarea {
          border: 1px solid #dadce0;
          border-radius: 10px;
          background: #fff;
          font-size: 13px;
          line-height: 20px;
          color: #202124;
        }

        .address-field input {
          height: 44px;
        }

        .address-field input:focus,
        .address-field textarea:focus {
          border-color: #1a73e8;
          box-shadow: 0 0 0 2px rgba(26,115,232,.12);
        }

        .address-pin-hint {
          color: #174ea6;
          background: #e8f0fe;
          border: 0;
          border-radius: 10px;
          font-size: 11px;
        }

        .address-form-actions {
          margin-top: 16px;
          padding-top: 12px;
        }

        .address-cancel-btn,
        .address-save-btn {
          min-height: 42px;
          border-radius: 21px;
          font-size: 12px;
          font-weight: 500;
        }

        .address-cancel-btn {
          color: #5f6368;
          background: #f1f3f4;
          border: 0;
        }

        .address-save-btn {
          background: #1a73e8;
          box-shadow: 0 2px 5px rgba(26,115,232,.22);
        }

        @media (max-width: 520px) {
          .address-selector-modal {
            width: calc(100% - 16px) !important;
            max-width: none !important;
          }

          .address-selector-shell {
            max-height: 92vh !important;
            border-radius: 20px !important;
          }

          .address-selector-header {
            padding: 13px 14px !important;
          }

          .address-selector-heading h3 {
            font-size: 17px;
          }

          .address-add-btn {
            width: 40px;
            padding: 0;
            border-radius: 50%;
          }

          .address-add-btn span {
            display: none;
          }

          .address-selector-body {
            padding: 9px !important;
          }

          .address-choice-main {
            padding: 13px 12px 10px;
          }

          .address-choice-actions {
            padding-left: 43px;
            overflow-x: auto;
          }

          .address-choice-actions button.address-action-btn span {
            display: none;
          }

          .address-choice-actions button.address-action-btn {
            width: 36px;
            padding: 0;
            border-radius: 50%;
          }

          .address-selector-footer {
            gap: 7px !important;
          }

          .address-footer-add,
          .address-footer-done {
            flex: 1;
            min-width: 0;
          }

          .address-footer-add span {
            white-space: nowrap;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .address-selector-shell,
          .address-choice-card,
          .address-selector-icon,
          .address-modal-shine,
          .address-choice-radio span {
            animation: none !important;
          }
        }

        .address-selector-modal {
          width:min(100% - 20px, 680px) !important;
          max-width:680px !important;
          margin:auto !important;
        }

        .address-selector-shell {
          position:relative !important;
          overflow:hidden !important;
          max-height:min(88vh, 820px) !important;
          border:1px solid rgba(255,255,255,.9) !important;
          border-radius:26px !important;
          background:rgba(255,255,255,.90) !important;
          box-shadow:0 30px 100px rgba(49,46,129,.28), inset 0 1px 0 rgba(255,255,255,.95) !important;
          backdrop-filter:blur(28px) saturate(155%) !important;
          -webkit-backdrop-filter:blur(28px) saturate(155%) !important;
          animation:addressModalIn .38s cubic-bezier(.16,1,.3,1) both;
        }

        .address-modal-shine {
          position:absolute;
          top:-40%;
          left:-28%;
          width:28%;
          height:180%;
          z-index:0;
          pointer-events:none;
          transform:rotate(20deg);
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.72),transparent);
          filter:blur(8px);
          animation:addressModalShine 5.5s ease-in-out infinite;
        }

        .address-selector-header,
        .address-selector-body,
        .address-selector-footer {
          position:relative;
          z-index:1;
        }

        .address-selector-header {
          display:flex !important;
          align-items:center !important;
          justify-content:space-between !important;
          gap:12px !important;
          padding:17px 18px !important;
          border-bottom:1px solid rgba(148,163,184,.16) !important;
        }

        .address-selector-heading {
          display:flex;
          align-items:center;
          gap:11px;
          min-width:0;
        }

        .address-selector-icon {
          width:42px;
          height:42px;
          flex:0 0 42px;
          border-radius:14px;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#4f46e5;
          background:linear-gradient(135deg,#eef2ff,#ecfeff);
          border:1px solid rgba(99,102,241,.14);
          box-shadow:0 8px 22px rgba(79,70,229,.12), inset 0 1px 0 #fff;
          animation:addressIconPulse 2.8s ease-in-out infinite;
        }

        .address-selector-heading h3 {
          margin:0;
          font-size:15px;
          line-height:1.25;
          font-weight:800;
          color:#0f172a;
        }

        .address-selector-heading p {
          margin:4px 0 0;
          font-size:11px;
          line-height:1.3;
          color:#64748b;
        }

        .address-add-btn,
        .address-footer-add,
        .address-footer-done,
        .address-save-btn,
        .address-cancel-btn {
          border:0;
          cursor:pointer;
          transition:transform .2s ease, box-shadow .2s ease, background .2s ease, opacity .2s ease;
        }

        .address-add-btn {
          display:inline-flex;
          align-items:center;
          gap:6px;
          flex:0 0 auto;
          height:38px;
          padding:0 12px;
          border-radius:12px;
          color:#fff;
          font-size:12px;
          font-weight:800;
          background:linear-gradient(135deg,#7c3aed,#2563eb,#06b6d4);
          box-shadow:0 9px 24px rgba(79,70,229,.24);
          position:relative;
          overflow:hidden;
        }

        .address-add-btn::after,
        .address-save-btn::after,
        .address-footer-done::after {
          content:"";
          position:absolute;
          inset:0 auto 0 -65%;
          width:38%;
          transform:skewX(-18deg);
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.72),transparent);
          animation:addressButtonShine 3.4s ease-in-out infinite;
          pointer-events:none;
        }

        .address-add-btn:hover,
        .address-save-btn:hover,
        .address-footer-done:hover {
          transform:translateY(-1px);
        }

        .address-selector-body {
          padding:14px !important;
          overflow-y:auto !important;
          overscroll-behavior:contain;
          scrollbar-width:thin;
        }

        .address-list-enter,
        .address-form-enter {
          animation:addressContentIn .3s cubic-bezier(.2,.8,.2,1) both;
        }

        .address-choice-list {
          display:grid;
          gap:10px;
        }

        .address-choice-card {
          position:relative;
          overflow:hidden;
          border:1px solid rgba(148,163,184,.22);
          border-radius:18px;
          background:rgba(255,255,255,.72);
          box-shadow:0 8px 25px rgba(15,23,42,.05), inset 0 1px 0 rgba(255,255,255,.9);
          transition:transform .22s ease, border-color .22s ease, box-shadow .22s ease, background .22s ease;
          animation:addressCardIn .35s both;
        }

        .address-choice-card:nth-child(2){animation-delay:.045s}
        .address-choice-card:nth-child(3){animation-delay:.09s}
        .address-choice-card:nth-child(4){animation-delay:.135s}
        .address-choice-card:nth-child(5){animation-delay:.18s}

        .address-choice-card::after {
          content:"";
          position:absolute;
          top:-110%;
          left:-45%;
          width:25%;
          height:320%;
          transform:rotate(24deg);
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.82),transparent);
          pointer-events:none;
          animation:addressCardShine 6.5s ease-in-out infinite;
        }

        .address-choice-card:hover {
          transform:translateY(-2px);
          box-shadow:0 14px 34px rgba(79,70,229,.11);
          border-color:rgba(99,102,241,.28);
        }

        .address-choice-card.selected {
          border-color:rgba(79,70,229,.48);
          background:linear-gradient(135deg,rgba(238,242,255,.96),rgba(236,254,255,.82));
          box-shadow:0 14px 38px rgba(79,70,229,.14), inset 0 1px 0 rgba(255,255,255,.95);
        }

        .address-choice-main {
          width:100%;
          display:flex;
          align-items:flex-start;
          gap:11px;
          padding:14px;
          border:0;
          background:transparent;
          color:inherit;
          text-align:left;
          cursor:pointer;
          position:relative;
          z-index:1;
        }

        .address-choice-radio {
          width:20px;
          height:20px;
          flex:0 0 20px;
          margin-top:1px;
          border-radius:50%;
          border:1.5px solid #cbd5e1;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#fff;
          transition:.2s ease;
        }

        .address-choice-card.selected .address-choice-radio {
          border-color:#4f46e5;
          box-shadow:0 0 0 4px rgba(79,70,229,.10);
        }

        .address-choice-radio span {
          width:9px;
          height:9px;
          border-radius:50%;
          background:linear-gradient(135deg,#7c3aed,#2563eb);
          animation:addressRadioPop .22s cubic-bezier(.2,1.6,.4,1) both;
        }

        .address-choice-content {
          min-width:0;
          flex:1;
          display:flex;
          flex-direction:column;
          gap:6px;
        }

        .address-choice-top {
          display:flex;
          align-items:center;
          flex-wrap:wrap;
          gap:7px;
        }

        .address-choice-top strong {
          font-size:13px;
          color:#0f172a;
        }

        .address-default-badge {
          display:inline-flex;
          align-items:center;
          height:20px;
          padding:0 7px;
          border-radius:999px;
          background:#dcfce7;
          color:#15803d;
          font-size:9px;
          font-weight:800;
        }

        .address-choice-name {
          display:flex;
          align-items:center;
          gap:5px;
          color:#475569;
          font-size:10.5px;
          font-weight:600;
        }

        .address-choice-text {
          color:#64748b;
          font-size:11px;
          line-height:1.55;
          overflow-wrap:anywhere;
        }

        .address-choice-check {
          width:22px;
          min-width:22px;
          color:#10b981;
          display:flex;
          justify-content:flex-end;
        }

        .address-choice-actions {
          position:relative;
          z-index:2;
          display:flex;
          justify-content:flex-end;
          align-items:center;
          gap:5px;
          padding:0 11px 10px 45px;
        }

        .address-choice-actions button {
          border:0;
          background:rgba(248,250,252,.9);
          color:#475569;
          padding:6px 8px;
          border-radius:8px;
          font-size:9.5px;
          font-weight:700;
          cursor:pointer;
          transition:.18s ease;
        }

        .address-choice-actions button:hover {
          background:#eef2ff;
          color:#4338ca;
          transform:translateY(-1px);
        }

        .address-choice-actions button.danger:hover {
          background:#fef2f2;
          color:#dc2626;
        }

        .address-form-labels {
          display:flex;
          gap:7px;
          margin-bottom:12px;
        }

        .address-label-chip {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:6px;
          min-width:78px;
          height:34px;
          padding:0 10px;
          border-radius:11px;
          border:1px solid #e2e8f0;
          background:#fff;
          color:#64748b;
          font-size:11px;
          font-weight:800;
          cursor:pointer;
          transition:.2s ease;
        }

        .address-label-chip.active {
          color:#4338ca;
          border-color:#c7d2fe;
          background:#eef2ff;
          box-shadow:0 7px 18px rgba(79,70,229,.10);
        }

        .address-form-grid {
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:10px;
        }

        .address-field {
          display:flex;
          flex-direction:column;
          gap:6px;
          min-width:0;
        }

        .address-field-wide {
          grid-column:1/-1;
        }

        .address-field > span {
          color:#334155;
          font-size:10px;
          font-weight:800;
        }

        .address-field > span em {
          color:#94a3b8;
          font-style:normal;
          font-weight:600;
          margin-left:3px;
        }

        .address-field input {
          width:100%;
          height:42px;
          padding:0 12px;
          border:1px solid #e2e8f0;
          border-radius:11px;
          outline:none;
          background:rgba(255,255,255,.86);
          color:#0f172a;
          font-size:12px;
          transition:border-color .2s ease, box-shadow .2s ease, background .2s ease;
          box-sizing:border-box;
        }

        .address-field input:focus {
          border-color:#818cf8;
          background:#fff;
          box-shadow:0 0 0 4px rgba(99,102,241,.10);
        }

        .address-pin-wrap {
          position:relative;
        }

        .address-pin-wrap input {
          padding-right:45px;
        }

        .address-pin-loader {
          position:absolute;
          top:50%;
          right:12px;
          transform:translateY(-50%);
          display:flex;
          gap:3px;
        }

        .address-pin-loader span {
          width:4px;
          height:4px;
          border-radius:50%;
          background:#6366f1;
          animation:addressDots .8s ease-in-out infinite;
        }

        .address-pin-loader span:nth-child(2){animation-delay:.12s}
        .address-pin-loader span:nth-child(3){animation-delay:.24s}

        .address-pin-hint {
          margin-top:10px;
          display:flex;
          align-items:flex-start;
          gap:7px;
          padding:10px 11px;
          border-radius:11px;
          color:#4338ca;
          background:rgba(238,242,255,.78);
          border:1px solid #e0e7ff;
          font-size:10px;
          line-height:1.45;
        }

        .address-form-actions {
          display:flex;
          justify-content:flex-end;
          gap:8px;
          margin-top:14px;
          padding-top:13px;
          border-top:1px solid #eef2f7;
        }

        .address-cancel-btn,
        .address-save-btn {
          min-height:42px;
          padding:0 14px;
          border-radius:12px;
          font-size:11px;
          font-weight:800;
          position:relative;
          overflow:hidden;
        }

        .address-cancel-btn {
          color:#64748b;
          background:#f8fafc;
          border:1px solid #e2e8f0;
        }

        .address-save-btn {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:7px;
          color:#fff;
          background:linear-gradient(135deg,#7c3aed,#2563eb,#06b6d4);
          box-shadow:0 10px 25px rgba(79,70,229,.23);
        }

        .address-save-btn:disabled,
        .address-cancel-btn:disabled,
        .address-footer-done:disabled {
          opacity:.55;
          cursor:not-allowed;
          transform:none !important;
        }

        .address-btn-spinner {
          width:13px;
          height:13px;
          border:2px solid rgba(255,255,255,.38);
          border-top-color:#fff;
          border-radius:50%;
          animation:addressSpin .65s linear infinite;
        }

        .address-selector-footer {
          display:flex !important;
          justify-content:space-between !important;
          gap:8px !important;
          padding:12px 14px calc(12px + env(safe-area-inset-bottom)) !important;
          border-top:1px solid rgba(148,163,184,.16) !important;
        }

        .address-footer-add,
        .address-footer-done {
          min-height:40px;
          padding:0 13px;
          border-radius:11px;
          font-size:11px;
          font-weight:800;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:6px;
          position:relative;
          overflow:hidden;
        }

        .address-footer-add {
          color:#4338ca;
          background:#eef2ff;
        }

        .address-footer-done {
          color:#fff;
          background:linear-gradient(135deg,#7c3aed,#2563eb,#06b6d4);
          box-shadow:0 9px 23px rgba(79,70,229,.20);
        }

        .address-empty-state {
          width:100%;
          display:flex;
          align-items:center;
          gap:12px;
          padding:17px;
          border-radius:18px;
          border:1.5px dashed #c7d2fe;
          background:linear-gradient(135deg,rgba(238,242,255,.78),rgba(236,254,255,.68));
          color:#334155;
          text-align:left;
          cursor:pointer;
          transition:.22s ease;
        }

        .address-empty-state:hover {
          transform:translateY(-2px);
          box-shadow:0 14px 30px rgba(79,70,229,.10);
        }

        .address-empty-icon {
          width:44px;
          height:44px;
          flex:0 0 44px;
          border-radius:14px;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#4f46e5;
          background:#fff;
          box-shadow:0 8px 20px rgba(79,70,229,.10);
        }

        .address-empty-state strong,
        .address-empty-state small {
          display:block;
        }

        .address-empty-state strong {
          font-size:12px;
          font-weight:800;
          color:#0f172a;
        }

        .address-empty-state small {
          margin-top:4px;
          font-size:10px;
          line-height:1.4;
          color:#64748b;
        }

        .address-loading-list {
          display:grid;
          gap:10px;
        }

        .address-loading-card {
          display:flex;
          align-items:flex-start;
          gap:11px;
          padding:15px;
          border-radius:18px;
          border:1px solid #e5e7eb;
          background:rgba(248,250,252,.78);
        }

        .address-loading-avatar,
        .address-loading-dot,
        .address-loading-line {
          position:relative;
          overflow:hidden;
          background:#e2e8f0;
        }

        .address-loading-avatar {
          width:20px;
          height:20px;
          flex:0 0 20px;
          border-radius:50%;
        }

        .address-loading-dot {
          width:18px;
          height:18px;
          border-radius:50%;
        }

        .address-loading-line {
          height:9px;
          border-radius:5px;
        }

        .address-loading-avatar::after,
        .address-loading-dot::after,
        .address-loading-line::after {
          content:"";
          position:absolute;
          inset:0 auto 0 -80%;
          width:55%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.8),transparent);
          animation:addressSkeletonShine 1.35s ease-in-out infinite;
        }

        @media (max-width:640px) {
          .address-selector-modal {
            width:calc(100% - 12px) !important;
            max-width:none !important;
            margin:6px auto !important;
          }

          .address-selector-shell {
            max-height:92vh !important;
            border-radius:23px !important;
          }

          .address-selector-header {
            padding:14px !important;
          }

          .address-selector-body {
            padding:11px !important;
          }

          .address-form-grid {
            grid-template-columns:1fr;
          }

          .address-field-wide {
            grid-column:auto;
          }

          .address-form-labels {
            overflow-x:auto;
            padding-bottom:2px;
          }

          .address-label-chip {
            min-width:74px;
          }

          .address-choice-actions {
            padding-left:45px;
            justify-content:flex-start;
            flex-wrap:wrap;
          }

          .address-form-actions,
          .address-selector-footer {
            flex-direction:column;
          }

          .address-cancel-btn,
          .address-save-btn,
          .address-footer-add,
          .address-footer-done {
            width:100%;
          }
        }


        .address-field textarea {
          width:100%;
          resize:vertical;
          min-height:78px;
          border:1px solid #dbe3ef;
          border-radius:12px;
          padding:10px 11px;
          outline:none;
          background:rgba(255,255,255,.92);
          color:#0f172a;
          font-size:11px;
          line-height:1.45;
          transition:.2s ease;
        }

        .address-field textarea:focus {
          border-color:#818cf8;
          box-shadow:0 0 0 3px rgba(99,102,241,.10);
        }

        .address-char-count {
          display:block;
          margin-top:4px;
          text-align:right;
          color:#94a3b8;
          font-size:9px;
        }

        .address-selector-shell::before {
          content:"";
          position:absolute;
          inset:0;
          pointer-events:none;
          border-radius:inherit;
          background:linear-gradient(115deg,transparent 0%,rgba(255,255,255,.16) 35%,rgba(255,255,255,.5) 47%,transparent 60%);
          background-size:240% 100%;
          animation:addressShellSweep 7s ease-in-out infinite;
          z-index:0;
        }

        .address-save-btn::after,
        .address-footer-done::after,
        .address-add-btn::after {
          content:"";
          position:absolute;
          top:-50%;
          left:-80%;
          width:45%;
          height:200%;
          transform:rotate(20deg);
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);
          animation:addressButtonShine 3.8s ease-in-out infinite;
          pointer-events:none;
        }

        @keyframes addressShellSweep {
          0%,55% { background-position:160% 0; opacity:0; }
          70% { opacity:.9; }
          100% { background-position:-30% 0; opacity:0; }
        }

        @keyframes addressModalIn {
          from { opacity:0; transform:translateY(18px) scale(.965); }
          to { opacity:1; transform:translateY(0) scale(1); }
        }

        @keyframes addressContentIn {
          from { opacity:0; transform:translateY(8px); }
          to { opacity:1; transform:translateY(0); }
        }

        @keyframes addressCardIn {
          from { opacity:0; transform:translateY(10px) scale(.985); }
          to { opacity:1; transform:translateY(0) scale(1); }
        }

        @keyframes addressRadioPop {
          from { transform:scale(.25); opacity:0; }
          to { transform:scale(1); opacity:1; }
        }

        @keyframes addressIconPulse {
          0%,100% { transform:scale(1); box-shadow:0 8px 22px rgba(79,70,229,.12), inset 0 1px 0 #fff; }
          50% { transform:scale(1.035); box-shadow:0 11px 28px rgba(79,70,229,.20), inset 0 1px 0 #fff; }
        }

        @keyframes addressModalShine {
          0%,55% { left:-35%; opacity:0; }
          70% { opacity:.65; }
          100% { left:135%; opacity:0; }
        }

        @keyframes addressCardShine {
          0%,58% { left:-45%; opacity:0; }
          72% { opacity:.65; }
          100% { left:135%; opacity:0; }
        }

        @keyframes addressButtonShine {
          0%,55% { left:-65%; opacity:0; }
          72% { left:125%; opacity:1; }
          100% { left:135%; opacity:0; }
        }

        @keyframes addressSkeletonShine {
          0% { left:-80%; }
          100% { left:130%; }
        }

        @keyframes addressDots {
          0%,80%,100% { opacity:.25; transform:translateY(0); }
          40% { opacity:1; transform:translateY(-2px); }
        }

        @keyframes addressSpin {
          to { transform:rotate(360deg); }
        }

        @media (prefers-reduced-motion:reduce) {
          .address-selector-shell,
          .address-list-enter,
          .address-form-enter,
          .address-choice-card,
          .address-selector-icon,
          .address-modal-shine,
          .address-choice-card::after,
          .address-add-btn::after,
          .address-save-btn::after,
          .address-footer-done::after,
          .address-loading-avatar::after,
          .address-loading-dot::after,
          .address-loading-line::after {
            animation:none !important;
          }
        }

        /* =========================================================
           ✨ ANIME SHINE / TAILWIND-FIRST CART THEME
        ========================================================= */
        .anime-cart-page { isolation:isolate; }
        .anime-step-panel { position:relative; animation:animePanelFade .5s cubic-bezier(.2,.8,.2,1) both; }
        .anime-orb { animation:animeOrbFloat 9s ease-in-out infinite alternate; }
        .anime-orb-b { animation-delay:-3s; }
        .anime-orb-c { animation-delay:-6s; }
        .anime-sweep { animation:animeSweep 6s ease-in-out infinite; }
        .anime-star {
          color:#8b5cf6;
          font-size:22px;
          text-shadow:0 0 10px rgba(139,92,246,.65),0 0 26px rgba(236,72,153,.30);
          animation:animeSparkle 2.2s ease-in-out infinite;
        }

        .anime-cart-page .modern-assurance-card,
        .anime-cart-page .modern-items-card,
        .anime-cart-page .modern-summary-card,
        .anime-cart-page .review-card,
        .anime-cart-page .modern-unavailable-card {
          border-color:rgba(255,255,255,.82) !important;
          background:rgba(255,255,255,.72) !important;
          box-shadow:0 18px 60px rgba(76,29,149,.10), inset 0 1px 0 rgba(255,255,255,.95) !important;
          backdrop-filter:blur(22px) saturate(135%);
          -webkit-backdrop-filter:blur(22px) saturate(135%);
        }

        .anime-cart-page .modern-items-card,
        .anime-cart-page .modern-summary-card,
        .anime-cart-page .review-card { overflow:hidden; }

        .anime-cart-page .modern-assurance-card::after,
        .anime-cart-page .modern-items-card::after,
        .anime-cart-page .modern-summary-card::after,
        .anime-cart-page .review-card::after {
          content:"";
          position:absolute;
          top:-100%; left:-45%; width:28%; height:300%;
          transform:rotate(24deg);
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);
          pointer-events:none;
          animation:animeCardShine 7s ease-in-out infinite;
        }

        .anime-cart-page .modern-product-image-wrap {
          box-shadow:0 12px 30px rgba(79,70,229,.16);
          outline:1px solid rgba(255,255,255,.9);
        }

        .anime-cart-page .modern-checkout-btn,
        .anime-cart-page .modern-mobile-checkout button,
        .anime-cart-page .review-place-btn,
        .anime-cart-page .payment-action-inner button:last-child {
          background:linear-gradient(135deg,#7c3aed 0%,#2563eb 52%,#06b6d4 100%) !important;
          width:3
          box-shadow:0 12px 34px rgba(79,70,229,.32), inset 0 1px 0 rgba(255,255,255,.35) !important;
          position:relative;
          overflow:hidden;
        }

        .anime-cart-page .modern-checkout-btn::after,
        .anime-cart-page .modern-mobile-checkout button::after,
        .anime-cart-page .review-place-btn::after,
        .anime-cart-page .payment-action-inner button:last-child::after {
          content:"";
          position:absolute;
          top:0; bottom:0; left:-55%; width:34%;
          transform:skewX(-18deg);
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.60),transparent);
          animation:animeButtonShine 3.2s ease-in-out infinite;
          pointer-events:none;
        }

        /* The page scrolls; only the current step's CTA dock is fixed. */
        .anime-cart-page .modern-mobile-checkout,
        .anime-cart-page .fixed-review-bar,
        .anime-cart-page .payment-action-dock {
          position:fixed !important;
          left:0 !important;
          right:0 !important;
          bottom:0 !important;
          width:100% !important;
          z-index:999 !important;
          border-top:1px solid rgba(255,255,255,.86) !important;
          background:rgba(255,255,255,.78) !important;
          box-shadow:0 -18px 60px rgba(76,29,149,.18) !important;
          backdrop-filter:blur(26px) saturate(160%);
          -webkit-backdrop-filter:blur(26px) saturate(160%);
        }
        .anime-cart-page .modern-mobile-checkout {
          border-radius:24px 24px 0 0 !important;
          padding-bottom:calc(12px + env(safe-area-inset-bottom)) !important;
        }
        .anime-cart-page .fixed-review-bar,
        .anime-cart-page .payment-action-dock {
          padding-bottom:env(safe-area-inset-bottom) !important;
        }
        .anime-cart-page .fixed-review-inner,
        .anime-cart-page .payment-action-inner {
          width:min(100%,1120px);
          margin:0 auto;
          padding:10px 14px;
        }
        .anime-cart-page .payment-action-inner { display:flex; align-items:center; gap:12px; }
        .anime-cart-page .payment-action-inner button { min-height:52px; border-radius:17px; }

        /* Extra scroll room so the fixed dock never covers the final card. */
        .anime-cart-page .modern-cart-page,
        .anime-cart-page .step-panel { padding-bottom:155px !important; }

        /* IMPORTANT: do not apply transform/filter/contain to any ancestor
           of the bottom dock. A transformed ancestor makes position:fixed
           behave like position:absolute instead of viewport-fixed. */
        .anime-cart-page .anime-step-panel {
          transform:none !important;
          filter:none !important;
          perspective:none !important;
          contain:none !important;
          will-change:auto !important;
        }

        /* True viewport-fixed checkout docks. */
        .anime-cart-page .modern-mobile-checkout,
        .anime-cart-page .fixed-review-bar,
        .anime-cart-page .payment-action-dock {
          position:fixed !important;
          inset:auto 0 0 0 !important;
          width:100vw !important;
          max-width:100vw !important;
          margin:0 !important;
          z-index:2147483000 !important;
          box-sizing:border-box !important;
        }

        @keyframes animePanelFade {
          from { opacity:0; }
          to { opacity:1; }
        }
        @keyframes animeOrbFloat {
          from { transform:translate3d(-10px,-8px,0) scale(.96); }
          to { transform:translate3d(20px,18px,0) scale(1.08); }
        }
        @keyframes animeSweep {
          0%,55% { transform:translateX(-80%) rotate(12deg); opacity:0; }
          70% { opacity:.55; }
          100% { transform:translateX(430%) rotate(12deg); opacity:0; }
        }
        @keyframes animeSparkle {
          0%,100% { opacity:.30; transform:scale(.72) rotate(0deg); }
          50% { opacity:1; transform:scale(1.2) rotate(18deg); }
        }
        @keyframes animeCardShine {
          0%,58% { left:-45%; opacity:0; }
          70% { opacity:.72; }
          100% { left:135%; opacity:0; }
        }
        @keyframes animeButtonShine {
          0%,58% { left:-55%; }
          78%,100% { left:135%; }
        }

        @media (max-width:767px) {
          .anime-cart-page .fixed-review-inner,
          .anime-cart-page .payment-action-inner { padding:9px 10px; gap:8px; }
          .anime-cart-page .payment-action-inner button { min-height:50px; border-radius:15px; }
          .anime-cart-page .modern-mobile-checkout { min-height:78px !important; }
          .anime-cart-page .modern-cart-page,
          .anime-cart-page .step-panel { padding-bottom:165px !important; }
        }

        @media (prefers-reduced-motion:reduce) {
          .anime-orb,.anime-sweep,.anime-star,.anime-step-panel,
          .anime-cart-page .modern-assurance-card::after,
          .anime-cart-page .modern-items-card::after,
          .anime-cart-page .modern-summary-card::after,
          .anime-cart-page .review-card::after,
          .anime-cart-page .modern-checkout-btn::after,
          .anime-cart-page .modern-mobile-checkout button::after,
          .anime-cart-page .review-place-btn::after,
          .anime-cart-page .payment-action-inner button:last-child::after { animation:none !important; }
        }


        /* =========================================================
           INDEPENDENT CART NAVBAR
           This navbar is page-level and does not change with checkout step.
        ========================================================= */
        .cart-independent-navbar {
          position: sticky;
          top: 0;
          z-index: 80;
          border-bottom: 1px solid rgba(255,255,255,.72);
          background: rgba(255,255,255,.72);
          backdrop-filter: blur(22px) saturate(150%);
          -webkit-backdrop-filter: blur(22px) saturate(150%);
          box-shadow: 0 10px 35px rgba(79,70,229,.08);
        }
        .cart-independent-navbar::after {
          content:"";
          position:absolute;
          left:0;
          right:0;
          bottom:-1px;
          height:1px;
          background:linear-gradient(90deg,transparent,rgba(99,102,241,.25),rgba(34,211,238,.25),transparent);
        }
        .cart-nav-inner {
          width:100%;
          max-width:1280px;
          margin:0 auto;
          min-height:68px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:18px;
          padding:10px 16px;
        }
        .cart-nav-brand {
          display:flex;
          align-items:center;
          gap:10px;
          flex-shrink:0;
        }
        .cart-nav-logo {
          width:42px;
          height:42px;
          border-radius:14px;
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          background:linear-gradient(135deg,#7c3aed,#2563eb,#06b6d4);
          box-shadow:0 10px 25px rgba(79,70,229,.28);
          position:relative;
          overflow:hidden;
        }
        .cart-nav-logo::after {
          content:"";
          position:absolute;
          inset:-80% 35%;
          transform:rotate(25deg);
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);
          animation:cartNavShine 3.2s ease-in-out infinite;
        }
        .cart-nav-brand-text {
          font-weight:900;
          letter-spacing:-.04em;
          font-size:18px;
          color:#172554;
          line-height:1;
        }
        .cart-nav-brand-sub {
          display:block;
          margin-top:3px;
          font-size:9px;
          font-weight:700;
          letter-spacing:.12em;
          text-transform:uppercase;
          color:#94a3b8;
        }
        .cart-nav-links {
          display:flex;
          align-items:center;
          justify-content:center;
          gap:6px;
          flex:1;
        }
        .cart-nav-link {
          position:relative;
          display:inline-flex;
          align-items:center;
          gap:7px;
          min-height:42px;
          padding:9px 13px;
          border-radius:14px;
          border:1px solid transparent;
          color:#64748b;
          font-size:13px;
          font-weight:800;
          transition:all .2s ease;
          background:transparent;
        }
        .cart-nav-link:hover {
          color:#4f46e5;
          background:rgba(238,242,255,.78);
          border-color:rgba(129,140,248,.18);
          transform:translateY(-1px);
        }
        .cart-nav-link.active {
          color:#4f46e5;
          background:linear-gradient(135deg,rgba(238,242,255,.95),rgba(224,231,255,.72));
          border-color:rgba(129,140,248,.22);
          box-shadow:0 7px 18px rgba(79,70,229,.10);
        }
        .cart-nav-link.active::after {
          content:"";
          position:absolute;
          left:20%;
          right:20%;
          bottom:-7px;
          height:3px;
          border-radius:999px;
          background:linear-gradient(90deg,#7c3aed,#2563eb,#06b6d4);
          box-shadow:0 0 12px rgba(99,102,241,.55);
        }
        .cart-nav-cart {
          position:relative;
        }
        .cart-nav-badge {
          position:absolute;
          top:-2px;
          right:-1px;
          min-width:18px;
          height:18px;
          padding:0 5px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:999px;
          background:linear-gradient(135deg,#fb7185,#ef4444);
          color:white;
          font-size:9px;
          font-weight:900;
          border:2px solid white;
          box-shadow:0 4px 12px rgba(239,68,68,.25);
        }
        .cart-nav-account {
          display:flex;
          align-items:center;
          gap:8px;
          padding:7px 11px 7px 7px;
          border:1px solid rgba(226,232,240,.95);
          background:rgba(255,255,255,.82);
          border-radius:999px;
          color:#475569;
          font-size:12px;
          font-weight:800;
          box-shadow:0 7px 20px rgba(15,23,42,.05);
          transition:all .2s ease;
        }
        .cart-nav-account:hover {
          border-color:rgba(129,140,248,.35);
          color:#4f46e5;
          transform:translateY(-1px);
        }
        .cart-nav-account-icon {
          width:32px;
          height:32px;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          background:linear-gradient(135deg,#eef2ff,#cffafe);
          color:#4f46e5;
        }
        @keyframes cartNavShine {
          0%,55% { transform:translateX(-180%) rotate(25deg); }
          75%,100% { transform:translateX(300%) rotate(25deg); }
        }
        @media (max-width:767px) {
          .cart-independent-navbar {
            position:sticky;
          }
          .cart-nav-inner {
            min-height:64px;
            padding:8px 10px;
            gap:7px;
          }
          .cart-nav-brand-text,
          .cart-nav-brand-sub,
          .cart-nav-account-text {
            display:none;
          }
          .cart-nav-brand {
            width:44px;
          }
          .cart-nav-links {
            gap:3px;
          }
          .cart-nav-link {
            width:54px;
            min-height:46px;
            padding:7px 3px;
            flex-direction:column;
            justify-content:center;
            gap:3px;
            font-size:9px;
            border-radius:13px;
          }
          .cart-nav-link.active::after {
            left:22%;
            right:22%;
            bottom:-5px;
          }
          .cart-nav-account {
            width:44px;
            height:44px;
            padding:5px;
            justify-content:center;
          }
          .cart-nav-account-icon {
            width:32px;
            height:32px;
          }
        }


        /* =========================================================
           FIXED CHECKOUT TOP NAVBAR
           Same header stays visible on Cart / Review / Payment.

           FONT SIZE IS EASY TO ADJUST HERE:
             --cart-top-title-size   = main "Your cart"
             --cart-top-subtitle-size = "1 item ready to go"
             --cart-top-clear-size   = "Clear"
           ========================================================= */
        :root {
          --cart-top-navbar-height: 64px;
          --cart-top-title-size: 20px;
          --cart-top-subtitle-size: 11px;
          --cart-top-clear-size: 12px;
        }

        .cart-top-navbar {
          position:fixed;
          top:0;
          left:0;
          right:0;
          z-index:2147482000;
          width:100%;
          display:block;
          background:rgba(255,255,255,.96);
          border-bottom:1px solid rgba(226,232,240,.9);
          box-shadow:0 8px 28px rgba(15,23,42,.07);
          backdrop-filter:blur(22px) saturate(150%);
          -webkit-backdrop-filter:blur(22px) saturate(150%);
        }

        .cart-top-navbar-inner {
          width:100%;
          min-height:var(--cart-top-navbar-height);
          padding:10px 16px;
          display:grid;
          grid-template-columns:52px minmax(0,1fr) auto;
          align-items:center;
          gap:12px;
        }

        .cart-top-back {
          width:52px;
          height:52px;
          border:0;
          border-radius:17px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#f5f8fc;
          color:#17243a;
          box-shadow:inset 0 0 0 1px rgba(226,232,240,.55);
          transition:transform .18s ease,background .18s ease;
          flex-shrink:0;
        }

        .cart-top-back:active {
          transform:scale(.94);
          background:#edf3fa;
        }

        .cart-top-title {
          min-width:0;
          overflow:hidden;
        }

        .cart-top-title h1 {
          margin:0;
          color:#14213a;
          font-size:var(--cart-top-title-size);
          line-height:1.05;
          font-weight:900;
          letter-spacing:-.045em;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }

        .cart-top-title p {
          margin:5px 0 0;
          color:#91a0b7;
          font-size:var(--cart-top-subtitle-size);
          line-height:1.1;
          font-weight:500;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }

        .cart-top-clear {
          min-width:78px;
          height:48px;
          padding:0 12px;
          border:0;
          border-radius:16px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          background:#fff3f4;
          color:#ef3038;
          box-shadow:inset 0 0 0 1px rgba(254,205,211,.45);
          font-size:var(--cart-top-clear-size);
          font-weight:850;
          transition:transform .18s ease,background .18s ease;
          flex-shrink:0;
        }

        .cart-top-clear:active {
          transform:scale(.95);
          background:#ffe8ea;
        }

        .cart-top-clear:disabled {
          opacity:.45;
          cursor:not-allowed;
        }

        /* Because the navbar is fixed, reserve its space in every checkout step. */
        .cart-root {
          padding-top:var(--cart-top-navbar-height) !important;
        }

        /* Step 2 / Step 3 can never hide underneath the fixed header. */
        .cart-root .step-panel,
        .cart-root .modern-cart-page {
          scroll-margin-top:calc(var(--cart-top-navbar-height) + 12px);
        }

        @media (min-width:768px) {
          :root {
            --cart-top-navbar-height:72px;
            --cart-top-title-size:24px;
            --cart-top-subtitle-size:12px;
            --cart-top-clear-size:13px;
          }

          .cart-top-navbar-inner {
            max-width:1280px;
            min-height:var(--cart-top-navbar-height);
            margin:0 auto;
            padding:12px 24px;
          }

          .cart-top-back {
            width:50px;
            height:50px;
          }
        }

        @media (max-width:430px) {
          :root {
            --cart-top-navbar-height:64px;
            --cart-top-title-size:12px;
            --cart-top-subtitle-size:11px;
            --cart-top-clear-size:12px;
          }

          .cart-top-navbar-inner {
            min-height:var(--cart-top-navbar-height);
            padding:9px 16px;
            grid-template-columns:50px minmax(0,1fr) auto;
            gap:11px;
          }

          .cart-top-back {
            width:50px;
            height:50px;
            border-radius:16px;
          }

          .cart-top-clear {
            min-width:76px;
            height:46px;
            border-radius:15px;
            padding:0 10px;
          }
        }

        @media (max-width:360px) {
          :root {
            --cart-top-navbar-height:60px;
            --cart-top-title-size:18px;
            --cart-top-subtitle-size:10px;
            --cart-top-clear-size:11px;
          }

          .cart-top-navbar-inner {
            padding-left:10px;
            padding-right:10px;
            grid-template-columns:44px minmax(0,1fr) auto;
            gap:7px;
          }

          .cart-top-back {
            width:44px;
            height:44px;
            border-radius:14px;
          }

          .cart-top-clear {
            min-width:68px;
            height:42px;
            padding:0 8px;
          }

          .cart-top-clear svg {
            width:18px;
            height:18px;
          }

          .cart-top-back {
            width:39px;
            height:39px;
          }

          .cart-top-title h1 {
            font-size:15px;
          }

          .cart-top-title p {
            font-size:9px;
          }

          .cart-top-clear {
            min-width:69px;
            height:39px;
            gap:3px;
            font-size:13px;
          }
        }


      `}</style>



      {/* =========================================================
          INDEPENDENT CART TOP NAVBAR
          Mobile header matching the provided design.
      ========================================================= */}
      <nav
        className="cart-top-navbar"
        aria-label="Cart navigation"
      >
        <div className="cart-top-navbar-inner">
          <button
            type="button"
            className="cart-top-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <IoArrowBack size={24} strokeWidth={2.2} />
          </button>

          <div className="cart-top-title">
            <h1>
              {step === 1 ? "Your cart" : step === 2 ? "Review order" : "Payment"}
            </h1>
            <p>
              {step === 1
                ? `${cartItem.length} ${cartItem.length === 1 ? "item" : "items"} ready to go`
                : step === 2
                ? "Check your delivery details"
                : "Choose your payment method"}
            </p>
          </div>

          <button
            type="button"
            className="cart-top-clear"
            onClick={onDeleteOpen}
            disabled={cartItem.length === 0}
            aria-label="Clear cart"
          >
            <FaRegTrashAlt size={16} />
            <span>Clear</span>
          </button>
        </div>
      </nav>

      {/* ===================================================
          ROOT
      =================================================== */}

      <div
        className="
          cart-root anime-cart-page min-h-screen mb-9 sm:mb-0 relative overflow-x-hidden
          bg-gradient-to-br from-violet-50 via-white to-cyan-50
          text-slate-900 selection:bg-violet-200 selection:text-violet-950
        "
      >


        {/* ANIME SHINE BACKGROUND — Tailwind utility layers */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-fuchsia-300/30 blur-3xl anime-orb anime-orb-a" />
          <div className="absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl anime-orb anime-orb-b" />
          <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-violet-300/25 blur-3xl anime-orb anime-orb-c" />
          <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(circle,_#7c3aed_1px,_transparent_1px)] [background-size:24px_24px]" />
          <div className="anime-sweep absolute -inset-y-20 -left-1/3 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/80 to-transparent blur-2xl" />
          <span className="anime-star absolute left-[12%] top-[18%]">✦</span>
          <span className="anime-star absolute right-[15%] top-[32%] text-cyan-400">✧</span>
          <span className="anime-star absolute left-[8%] bottom-[22%] text-fuchsia-400">✦</span>
        </div>

        {/* =========================================================
            INDEPENDENT PAGE NAVBAR
            This stays the same for Cart / Review / Payment.
        ========================================================= */}
        {/* <nav className="cart-independent-navbar" aria-label="Main navigation">
          <div className="cart-nav-inner">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="cart-nav-brand"
              aria-label="Go to home"
            >
              <span className="cart-nav-logo">
                <GiShoppingBag size={20} />
              </span>
              <span>
                <span className="cart-nav-brand-text">Odikart</span>
                <span className="cart-nav-brand-sub">Shop smarter</span>
              </span>
            </button>

            <div className="cart-nav-links">
              <button type="button" onClick={() => navigate("/")} className="cart-nav-link">
                <FaHome size={15} />
                <span>Home</span>
              </button>

              <button type="button" onClick={() => navigate("/products")} className="cart-nav-link">
                <FaThLarge size={14} />
                <span>Categories</span>
              </button>

              <button type="button" onClick={() => navigate("/cart")} className="cart-nav-link active cart-nav-cart">
                <GiShoppingBag size={16} />
                <span>Cart</span>
                {cartItem.length > 0 && (
                  <span className="cart-nav-badge">
                    {cartItem.length > 99 ? "99+" : cartItem.length}
                  </span>
                )}
              </button>

              <button type="button" onClick={() => navigate("/wishlist")} className="cart-nav-link">
                <FaHeart size={14} />
                <span>Wishlist</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate(token ? "/account" : "/sign-in")}
              className="cart-nav-account"
            >
              <span className="cart-nav-account-icon">
                <FaUserCircle size={18} />
              </span>
              <span className="cart-nav-account-text">
                {user?.firstName ? user.firstName : "Account"}
              </span>
            </button>
          </div>
        </nav> */}

        <div
          className="relative z-10 mx-auto w-full max-w-7xl px-3 py-3 sm:px-5 sm:py-8 lg:px-8"
        >


          {/* =================================================
              EMPTY CART
          ================================================= */}

{/* =========================================================
    EMPTY CART — PROFESSIONAL APP UI
========================================================= */}

{cartItem.length === 0 && step === 1 && (
  <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8 sm:px-6">

    {/* =====================================================
        BACKGROUND
    ===================================================== */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="
          absolute
          left-1/2
          top-1/2
          h-[280px]
          w-[280px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-blue-100/40
          blur-[90px]
          sm:h-[380px]
          sm:w-[380px]
        "
      />
    </div>


    {/* =====================================================
        CONTENT
    ===================================================== */}
    <div className="relative z-10 w-full max-w-md text-center">

      {/* ===================================================
          EMPTY CART VISUAL
      =================================================== */}
      <div className="mb-7 flex justify-center sm:mb-8">

        <div
          className="
            relative
            flex
            h-28
            w-28
            items-center
            justify-center
            rounded-full
            bg-slate-50
            ring-1
            ring-slate-200
            shadow-[0_12px_40px_rgba(15,23,42,0.08)]
            sm:h-32
            sm:w-32
          "
        >

          {/* soft glow */}
          <div
            className="
              absolute
              inset-2
              rounded-full
              bg-blue-50
            "
          />

          {/* cart */}
          <div
            className="
              relative
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-white
              text-blue-600
              shadow-[0_8px_25px_rgba(15,23,42,0.10)]
              ring-1
              ring-slate-100
              sm:h-[72px]
              sm:w-[72px]
            "
          >
            <GiShoppingBag
              size={34}
              strokeWidth={1.5}
            />
          </div>

          {/* small status dot */}
          <span
            className="
              absolute
              right-1
              top-2
              flex
              h-7
              w-7
              items-center
              justify-center
              rounded-full
              border-2
              border-white
              bg-blue-600
              text-white
              shadow-md
            "
          >
            <AiOutlinePlus size={13} />
          </span>

        </div>

      </div>


      {/* ===================================================
          HEADING
      =================================================== */}
      <div>

        <h1
          className="
            text-[25px]
            font-bold
            tracking-[-0.035em]
            text-slate-900
            sm:text-[30px]
          "
        >
          Your cart is empty
        </h1>

        <p
          className="
            mx-auto
            mt-2.5
            max-w-sm
            text-[13px]
            leading-5
            text-slate-500
            sm:mt-3
            sm:text-sm
            sm:leading-6
          "
        >
          Browse our products and add something you love
          to your cart.
        </p>

      </div>


      {/* ===================================================
          PRIMARY ACTION
      =================================================== */}
 <div className="mt-7 flex flex-row gap-3 sm:mt-8">

  {/* PRIMARY ACTION */}
  <button
    type="button"
    onClick={() => navigate("/products")}
    className="
      group
      relative
      inline-flex
      h-12
      min-w-0
      flex-1
      items-center
      justify-center
      gap-2
      overflow-hidden
      rounded-xl
      bg-blue-600
      px-4
      text-sm
      font-semibold
      text-white
      shadow-[0_6px_20px_rgba(37,99,235,0.25)]
      transition-all
      duration-200
      hover:bg-blue-700
      hover:shadow-[0_8px_25px_rgba(37,99,235,0.32)]
      active:scale-[0.98]
      sm:h-[50px]
      sm:px-6
    "
  >
    {/* Shine */}
    <span
      className="
        pointer-events-none
        absolute
        inset-y-0
        -left-1/2
        w-1/3
        -skew-x-12
        bg-gradient-to-r
        from-transparent
        via-white/20
        to-transparent
        transition-all
        duration-700
        group-hover:left-[130%]
      "
    />

    <GiShoppingBag
      size={17}
      className="relative z-10 shrink-0"
    />

    <span className="relative z-10 truncate">
      Continue Shopping
    </span>

    <IoArrowForward
      size={17}
      className="
        relative
        z-10
        shrink-0
        transition-transform
        duration-200
        group-hover:translate-x-0.5
      "
    />
  </button>


  {/* SECONDARY ACTION */}
  <button
    type="button"
    onClick={() => navigate("/order-history")}
    className="
      inline-flex
      h-12
      flex-1
      min-w-0
      items-center
      justify-center
      gap-2
      rounded-xl
      border
      border-slate-200
      bg-white
      px-4
      text-xs
      font-semibold
      text-slate-600
      shadow-sm
      transition-all
      duration-200
      hover:border-slate-300
      hover:bg-slate-50
      hover:text-slate-900
      active:scale-[0.98]
      sm:h-[50px]
      sm:px-5
    "
  >
    <FaHistory
      size={13}
      className="shrink-0"
    />

    <span className="truncate">
      View My Orders
    </span>
  </button>

</div>

      {/* ===================================================
          TRUST INFORMATION
      =================================================== */}
      <div
        className="
          mx-auto
          mt-7
          flex
          max-w-sm
          items-center
          justify-center
          gap-4
          border-t
          border-slate-100
          pt-5
          sm:mt-8
          sm:pt-6
        "
      >

        {/* Secure */}
        <div className="flex items-center gap-1.5">

          <div
            className="
              flex
              h-6
              w-6
              items-center
              justify-center
              rounded-full
              bg-emerald-50
              text-emerald-600
            "
          >
            <FaShieldAlt size={10} />
          </div>

          <span
            className="
              text-[9px]
              font-medium
              text-slate-500
              sm:text-[10px]
            "
          >
            Secure checkout
          </span>

        </div>


        {/* Divider */}
        <span className="h-4 w-px bg-slate-200" />


        {/* Delivery */}
        <div className="flex items-center gap-1.5">

          <div
            className="
              flex
              h-6
              w-6
              items-center
              justify-center
              rounded-full
              bg-blue-50
              text-blue-600
            "
          >
            <FaCheckCircle size={10} />
          </div>

          <span
            className="
              text-[9px]
              font-medium
              text-slate-500
              sm:text-[10px]
            "
          >
            Easy ordering
          </span>

        </div>

      </div>


      {/* ===================================================
          SMALL HELPER TEXT
      =================================================== */}
      <p
        className="
          mt-5
          text-[9px]
          text-slate-400
          sm:text-[10px]
        "
      >
        Add products to get started with your order.
      </p>

    </div>

  </div>
)}
          {/* =================================================
              WIZARD
          ================================================= */}

          {(cartItem.length > 0 ||
            step > 1) && (

            <>

              {/* =============================================
                  STEPPER
              ============================================= */}
{!cartUiReady ? (
  <CheckoutStepperSkeleton />
) : (
  <div className="w-full px-3 py-3 sm:px-5 sm:py-4 lg:px-8">
    <div className="mx-auto w-full max-w-4xl">

      <div className="relative flex items-start justify-between">

        {STEPS.map((s, i) => {
          const isCompleted = s.id < step;
          const isActive = s.id === step;
          const isUpcoming = s.id > step;

          return (
            <React.Fragment key={s.id}>

              {/* STEP */}
              <div className="relative z-10 flex min-w-0 flex-1 flex-col items-center">

                <button
                  type="button"
                  onClick={() => {
                    if (isCompleted) {
                      setStep(s.id);
                    }
                  }}
                  disabled={isUpcoming}
                  aria-label={`${s.label} step`}
                  className={`
                    group relative flex h-11 w-11 sm:h-12 sm:w-12
                    items-center justify-center rounded-full
                    transition-all duration-300 ease-out
                    focus:outline-none
                    focus-visible:ring-4
                    focus-visible:ring-blue-500/20

                    ${
                      isCompleted
                        ? `
                          bg-emerald-500
                          text-white
                          shadow-[0_6px_20px_rgba(16,185,129,0.28)]
                          hover:scale-105
                        `
                        : isActive
                        ? `
                          scale-105
                          bg-blue-600
                          text-white
                          shadow-[0_8px_28px_rgba(37,99,235,0.35)]
                        `
                        : `
                          border
                          border-slate-200
                          bg-white
                          text-slate-400
                          shadow-sm
                        `
                    }

                    ${
                      isUpcoming
                        ? "cursor-not-allowed opacity-80"
                        : "cursor-pointer"
                    }
                  `}
                >

                  {/* Active glow */}
                  {isActive && (
                    <>
                      <span
                        className="
                          absolute inset-[-5px]
                          animate-ping
                          rounded-full
                          border border-blue-400/30
                        "
                      />

                      <span
                        className="
                          absolute inset-[-3px]
                          rounded-full
                          border-2 border-blue-500/20
                        "
                      />
                    </>
                  )}

                  {/* Active shine */}
                  {isActive && (
                    <span
                      className="
                        pointer-events-none
                        absolute inset-0
                        overflow-hidden
                        rounded-full
                      "
                    >
                      <span
                        className="
                          absolute
                          -left-12
                          top-0
                          h-full
                          w-8
                          rotate-[20deg]
                          bg-gradient-to-r
                          from-transparent
                          via-white/50
                          to-transparent
                          animate-[checkoutShine_2.5s_ease-in-out_infinite]
                        "
                      />
                    </span>
                  )}

                  {/* Icon */}
                  <span className="relative z-10 flex items-center justify-center">
                    {isCompleted ? (
                      <FaCheck
                        size={16}
                        strokeWidth={2.8}
                      />
                    ) : (
                      s.icon
                    )}
                  </span>
                </button>

                {/* Step text */}
                <div className="mt-2 text-center">

                  <span
                    className={`
                      block text-[10px] font-semibold
                      uppercase tracking-[0.04em]
                      transition-colors duration-300
                      sm:text-[11px]

                      ${
                        isCompleted
                          ? "text-emerald-600"
                          : isActive
                          ? "text-blue-600"
                          : "text-slate-400"
                      }
                    `}
                  >
                    {isCompleted
                      ? "Completed"
                      : `Step ${s.id}`}
                  </span>

                  <span
                    className={`
                      mt-0.5 block
                      whitespace-nowrap
                      text-xs font-medium
                      transition-all duration-300
                      sm:text-sm

                      ${
                        isActive
                          ? "font-semibold text-slate-900"
                          : isCompleted
                          ? "text-slate-700"
                          : "text-slate-400"
                      }
                    `}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <span
                    className="
                      mt-1.5 h-0.5 w-8
                      rounded-full
                      bg-blue-600
                      shadow-[0_0_8px_rgba(37,99,235,0.45)]
                    "
                  />
                )}
              </div>

              {/* CONNECTOR */}
              {i < STEPS.length - 1 && (
                <div
                  className="
                    relative
                    mx-1
                    mt-[22px]
                    h-[3px]
                    flex-1
                    overflow-hidden
                    rounded-full
                    bg-slate-200
                    sm:mx-2
                    sm:mt-6
                  "
                >

                  {/* Completed */}
                  <span
                    className={`
                      absolute inset-y-0 left-0
                      rounded-full
                      bg-gradient-to-r
                      from-emerald-500
                      to-emerald-400
                      transition-all duration-700 ease-out

                      ${
                        step > s.id
                          ? "w-full"
                          : "w-0"
                      }
                    `}
                  />

                  {/* Active shine */}
                  {step === s.id && (
                    <span
                      className="
                        absolute inset-y-0 left-0
                        w-1/2
                        rounded-full
                        bg-gradient-to-r
                        from-transparent
                        via-blue-400
                        to-transparent
                        animate-[checkoutConnectorShine_2s_ease-in-out_infinite]
                      "
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  </div>
)}
              {/* =================================================
                  STEP 1 — CART / MODERN MOBILE-FIRST EXPERIENCE
              ================================================= */}

              {step === 1 && (
                <div className="step-panel step-one-panel modern-cart-page anime-step-panel">

                  {!cartUiReady ? (
                    /* ===================== SKELETON ===================== */
                    <div className="modern-cart-skeleton" aria-hidden="true">
                      <div className="modern-cart-head">
                        <div className="skeleton skeleton-back" />
                        <div className="skeleton skeleton-title" />
                        <div className="skeleton skeleton-order" />
                      </div>

                      <div className="modern-cart-layout">
                        <div className="modern-cart-main">
                          <div className="skeleton skeleton-assurance" />
                          {[1, 2, 3].map((n) => (
                            <div className="modern-skeleton-product" key={n}>
                              <div className="skeleton skeleton-product-image" />
                              <div className="skeleton-product-copy">
                                <div className="skeleton skeleton-line w-80" />
                                <div className="skeleton skeleton-line w-55" />
                                <div className="skeleton skeleton-line w-35" />
                                <div className="skeleton skeleton-qty" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="modern-skeleton-summary">
                          <div className="skeleton skeleton-summary-head" />
                          <div className="skeleton skeleton-summary-line" />
                          <div className="skeleton skeleton-summary-line" />
                          <div className="skeleton skeleton-summary-line" />
                          <div className="skeleton skeleton-summary-total" />
                          <div className="skeleton skeleton-summary-button" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* ===================== HEADER ===================== */}
                      {/* <div className="modern-cart-head">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="modern-icon-btn"
                            aria-label="Go back"
                          >
                            <IoArrowBack size={18} />
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="modern-cart-title">My Cart</h2>
                              <span className="modern-count-pill">
                                {cartItem.length} {cartItem.length === 1 ? "item" : "items"}
                              </span>
                            </div>
                            <p className="modern-cart-subtitle">Review your items before delivery.</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate("/order-history")}
                          className="modern-orders-btn"
                        >
                          <FaHistory size={13} />
                          <span>Orders</span>
                        </button>
                      </div> */}

                      <div className="modern-cart-layout">
                        {/* ===================== LEFT ===================== */}
                        <div className="modern-cart-main">

                          <div className="modern-assurance-card">
                            <div className="modern-assurance-icon"><FaCheckCircle size={16} /></div>
                            <div className="min-w-0">
                              <p className="modern-assurance-title">You're almost there</p>
                              <p className="modern-assurance-text">Free delivery • Secure checkout • Easy order tracking</p>
                            </div>
                            <span className="modern-secure-badge">SECURE</span>
                          </div>

                          {/* ================= UNAVAILABLE ================= */}
                          {serviceability.checked && serviceability.unavailableItems.length > 0 && (
                            <div className="modern-unavailable-card">
                              <div className="flex items-start gap-3">
                                <div className="modern-warning-icon"><FaRegTrashAlt size={15} /></div>
                                <div className="min-w-0 flex-1">
                                  <p className="modern-warning-title">Some items need your attention</p>
                                  <p className="modern-warning-text">These products cannot be delivered to PIN {serviceability.postalCode}.</p>
                                </div>
                              </div>

                              <div className="space-y-2.5 mt-4">
                                {serviceability.unavailableItems.map((unavailable, index) => {
                                  const productId =
                                    unavailable?.productId?._id ||
                                    unavailable?.productId ||
                                    unavailable?._id ||
                                    unavailable?.product?._id;
                                  const backendVariantSku = unavailable?.variantSku || unavailable?.variant?.sku || "";
                                  const cartProduct = cartItem.find((cart) => {
                                    if (String(cart.productId) !== String(productId)) return false;
                                    if (!backendVariantSku) return true;
                                    return String(cart.variantSku || "") === String(backendVariantSku);
                                  });
                                  const variantSku = backendVariantSku || cartProduct?.variantSku || "";
                                  const itemKey = `${productId}-${variantSku || "default"}`;
                                  const title = unavailable?.title || unavailable?.name || unavailable?.product?.title || unavailable?.product?.name || cartProduct?.title || "Unavailable product";
                                  return (
                                    <div key={`${itemKey}-${index}`} className="modern-unavailable-item">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-bold text-sm text-slate-800 truncate">{title}</p>
                                        {variantSku && <p className="text-[11px] text-slate-400 mt-0.5">Variant: {variantSku}</p>}
                                        <p className="text-xs text-rose-600 font-medium mt-1">❌ {unavailable?.reason || "Not serviceable to this PIN"}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveUnavailable({ ...unavailable, productId, variantSku })}
                                        disabled={removingUnavailable === itemKey}
                                        className="modern-remove-btn"
                                      >
                                        <FaRegTrashAlt size={11} />
                                        {removingUnavailable === itemKey ? "Removing" : "Remove"}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setServiceability((prev) => ({ ...prev, checked: false, checking: false, serviceableItems: [], unavailableItems: [], message: "" }));
                                  setStep(2);
                                  toast.info("Change your PIN code to check delivery availability.");
                                }}
                                className="modern-change-pin"
                              >
                                <MdMyLocation size={14} /> Change PIN code
                              </button>
                            </div>
                          )}

                          {/* ===================== ITEMS ===================== */}
                          <section className="modern-items-card">
                            <div className="modern-section-head">
                              <div>
                                <p className="modern-eyebrow">YOUR ITEMS</p>
                                <h3 className="modern-section-title">Ready to checkout</h3>
                              </div>
                              <span className="modern-item-count">{cartItem.length} {cartItem.length === 1 ? "item" : "items"}</span>
                            </div>

                            <div className="modern-items-list">
                              {cartItem.map((item) => {
                                const itemUnavailable = serviceability.unavailableItems.some((u) => {
                                  const uProductId = u?.productId?._id || u?.productId || u?._id || u?.product?._id;
                                  const uSku = u?.variantSku || u?.variant?.sku || "";
                                  return String(uProductId) === String(item.productId) && (!uSku || String(uSku) === String(item.variantSku || ""));
                                });

                                return (
                                  <article
                                    key={`${item.productId}-${item.variantSku || "default"}`}
                                    className={`modern-product-row ${itemUnavailable ? "modern-product-unavailable" : ""}`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/products/${item.productId}`)}
                                      className="modern-product-image-wrap"
                                      aria-label={`View ${item.title || "product"}`}
                                    >
                                      <img
                                        src={item.image || item.thumbnail || item.images?.[0] || ""}
                                        alt={item.title || "Product"}
                                        className="modern-product-image"
                                        loading="lazy"
                                      />
                                      {itemUnavailable && <span className="modern-unavailable-badge">Unavailable</span>}
                                    </button>

                                    <div className="modern-product-info">
                                      <div className="flex items-start justify-between gap-2">
                                        <button
                                          type="button"
                                          onClick={() => navigate(`/products/${item.productId}`)}
                                          className="modern-product-title text-left"
                                        >
                                          {item.title || "Product"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedItem({ productId: item.productId, variantSku: item.variantSku || "" });
                                            onDeleteOpen();
                                          }}
                                          className="modern-delete-btn"
                                          aria-label="Remove item"
                                        >
                                          <FaRegTrashAlt size={13} />
                                        </button>
                                      </div>

                                      {item.variantSku && (
                                        <p className="modern-variant">SKU: {item.variantSku}</p>
                                      )}

                                      <div className="modern-product-bottom">
                                        <div>
                                          <p className="modern-product-price">₹{Number(item.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                          <p className="modern-product-note"><FaCheckCircle size={10} /> Free delivery</p>
                                        </div>

                                        <div className="modern-qty-control" aria-label="Quantity controls">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDecrease(item.productId, item.quantity, item.variantSku);
                                            }}
                                            aria-label="Decrease quantity"
                                          >
                                            <AiOutlineMinus size={12} />
                                          </button>
                                          <span>{item.quantity}</span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              increaseQty(item.productId, item.variantSku);
                                            }}
                                            aria-label="Increase quantity"
                                          >
                                            <AiOutlinePlus size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>

                            <button type="button" onClick={() => navigate("/products")} className="modern-add-products">
                              <span className="modern-add-icon"><AiOutlinePlus size={16} /></span>
                              <span className="text-left flex-1">
                                <strong>Add more products</strong>
                                <small>Keep shopping and discover more</small>
                              </span>
                              <IoArrowForward size={18} />
                            </button>
                          </section>
                        </div>

                        {/* ===================== SUMMARY ===================== */}
                        <aside className="modern-cart-summary">
                          <div className="modern-summary-card">
                            <div className="modern-summary-head">
                              <div>
                                <p className="modern-eyebrow">ORDER SUMMARY</p>
                                <h3>Price details</h3>
                              </div>
                              <div className="modern-summary-bag"><GiShoppingBag size={18} /></div>
                            </div>

                            <div className="modern-summary-rows">
                              <div><span>Items</span><strong>₹{Number(subtotalAfterDiscount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                              {/* <div><span>Tax</span><strong>₹{Number(itemTax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div> */}
                              <div><span>Delivery</span><strong className="free">FREE</strong></div>
                            </div>

                            <div className="modern-savings-note">
                              <FaCheckCircle size={13} />
                              <span>Offer prices are applied automatically at checkout.</span>
                            </div>

                            <div className="modern-total-row">
                              <div>
                                <span>Total payable</span>
                                <small>Inclusive of applicable charges</small>
                              </div>
                              <strong>₹{Number(finalTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                            </div>

                            <div className="modern-trust-row">
                              <span><FaShieldAlt size={12} /> Secure checkout</span>
                              <span><FaCheckCircle size={12} /> Free delivery</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (!canProceedStep1) return;
                                if (serviceability.checked && serviceability.unavailableItems.length > 0) {
                                  toast.warning("Remove unavailable products or change your PIN code first.");
                                  return;
                                }
                                setStep(2);
                              }}
                              disabled={!canProceedStep1 || (serviceability.checked && serviceability.unavailableItems.length > 0)}
                              className="modern-checkout-btn"
                            >
                              <span>Continue to delivery</span>
                              <IoArrowForward size={18} />
                            </button>

                            <p className="modern-checkout-caption">You can review your address and payment method next.</p>
                          </div>
                        </aside>
                      </div>

                      {/* MOBILE STICKY CHECKOUT */}
                      <div className="modern-mobile-checkout">
                        <div>
                          <span>Total</span>
                          <strong>₹{Number(finalTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!canProceedStep1) return;
                            if (serviceability.checked && serviceability.unavailableItems.length > 0) {
                              toast.warning("Remove unavailable products or change your PIN code first.");
                              return;
                            }
                            setStep(2);
                          }}
                          disabled={!canProceedStep1 || (serviceability.checked && serviceability.unavailableItems.length > 0)}
                        >
                          Continue <IoArrowForward size={17} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* =================================================
                  STEP 2 — REVIEW
              ================================================= */}

              {step === 2 && (
                <div className="step-panel anime-step-panel space-y-5 pb-36">

                  {/* REVIEW HEADER */}
               <div className="flex items-center justify-between gap-3 sm:gap-4">
  {/* Left side */}
  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
    {/* Icon */}
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 sm:h-11 sm:w-11 sm:rounded-2xl">
      <FaCheckCircle
        className="text-blue-600"
        size={16}
      />
    </div>

    {/* Heading */}
    <div className="min-w-0">
      <h2 className="text-[17px] font-bold leading-tight tracking-[-0.02em] text-slate-900 sm:text-xl md:text-2xl lg:text-[26px]">
        Review your order
      </h2>

      <p className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:text-xs md:text-sm">
        Check your details before placing the order.
      </p>
    </div>
  </div>

  {/* Secure checkout */}
  <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700 sm:flex sm:px-3 sm:py-2 sm:text-xs">
    <FaShieldAlt size={11} />
    <span>Secure checkout</span>
  </div>
</div>
                  {/* DELIVERY ADDRESS */}
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5 md:p-6">
  {/* =========================================================
      DELIVERY ADDRESS HEADER
  ========================================================= */}
  <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 sm:h-10 sm:w-10 sm:rounded-2xl">
        <FaMapMarkerAlt size={14} className="sm:hidden" />
        <FaMapMarkerAlt size={16} className="hidden sm:block" />
      </div>

      {/* Title */}
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold leading-5 tracking-[-0.01em] text-slate-900 sm:text-[17px] sm:leading-6 md:text-lg lg:text-xl">
          Delivery Address
        </h3>

        <p className="mt-0.5 text-[10px] leading-[15px] text-slate-500 sm:text-[11px] sm:leading-4 md:text-xs lg:text-sm">
          Where should we deliver your order?
        </p>
      </div>
    </div>

    {/* Change button */}
    <button
      type="button"
      onClick={openAddressSelector}
      className="
        shrink-0
        rounded-xl
        border border-slate-200
        bg-white
        px-2.5 py-1.5
        text-[10px]
        font-semibold
        text-blue-600
        shadow-sm
        transition-all
        duration-200
        hover:border-blue-200
        hover:bg-blue-50
        active:scale-[0.97]
        sm:px-3
        sm:py-1.5
        sm:text-[11px]
        md:px-3.5
        md:py-2
        md:text-xs
      "
    >
      Change
    </button>
  </div>

  {/* =========================================================
      ADDRESS CONTENT
  ========================================================= */}
  {addressLoading ? (
    /* =======================================================
       ADDRESS SKELETON
    ======================================================== */
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        {/* Avatar skeleton */}
        <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-200 sm:h-10 sm:w-10" />

        <div className="min-w-0 flex-1 space-y-2.5">
          {/* Name skeleton */}
          <div className="h-3.5 w-28 rounded-full bg-slate-200 sm:h-4 sm:w-36" />

          {/* Address skeleton */}
          <div className="h-2.5 w-full max-w-md rounded-full bg-slate-100 sm:h-3" />

          <div className="h-2.5 w-4/5 max-w-sm rounded-full bg-slate-100 sm:h-3" />

          {/* Contact skeleton */}
          <div className="flex flex-wrap gap-3 pt-1">
            <div className="h-2.5 w-20 rounded-full bg-slate-100 sm:h-3 sm:w-24" />
            <div className="h-2.5 w-28 rounded-full bg-slate-100 sm:h-3 sm:w-32" />
          </div>
        </div>

        {/* Check skeleton */}
        <div className="h-5 w-5 shrink-0 rounded-full bg-slate-200" />
      </div>
    </div>
  ) : selectedAddressId ? (
    /* =======================================================
       SELECTED ADDRESS
    ======================================================== */
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-white p-3.5 shadow-sm sm:p-4">
      <div className="flex items-start gap-3">
        {/* User icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white shadow-sm sm:h-10 sm:w-10">
          <FaUser className="text-blue-600" size={13} />
        </div>

        {/* Address information */}
        <div className="min-w-0 flex-1">
          {/* Name + Address label */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <p className="text-[12px] font-bold leading-5 text-slate-900 sm:text-[13px] md:text-sm lg:text-base">
              {address.name || "Customer"}
            </p>

            <span className="rounded-full border border-blue-100 bg-white px-2 py-0.5 text-[8px] font-bold text-blue-700 sm:px-2.5 sm:py-1 sm:text-[9px] md:text-[10px]">
              {savedAddresses.find(
                (item) =>
                  String(item._id) === String(selectedAddressId)
              )?.label || "Address"}
            </span>
          </div>

          {/* Address */}
          <p className="mt-1.5 text-[10px] leading-[1.65] text-slate-600 sm:mt-2 sm:text-[11px] sm:leading-5 md:text-xs lg:text-sm lg:leading-6">
            {address.street || address.addressLine1}

            {address.addressLine2
              ? `, ${address.addressLine2}`
              : ""}

            {address.area
              ? `, ${address.area}`
              : ""}

            {address.city
              ? `, ${address.city}`
              : ""}

            {address.district
              ? `, ${address.district}`
              : ""}

            {address.state
              ? `, ${address.state}`
              : ""}

            {address.postcode
              ? ` - ${address.postcode}`
              : ""}
          </p>

          {/* Contact information */}
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5 text-[9px] leading-4 text-slate-500 sm:mt-3 sm:gap-x-4 sm:text-[10px] md:text-xs">
            {/* Phone */}
            <span className="inline-flex items-center gap-1.5">
              <BsTelephoneFill
                size={9}
                className="shrink-0 text-blue-500 sm:h-[10px] sm:w-[10px]"
              />

              <span>
                +91 {address.phone || ""}
              </span>
            </span>

            {/* Email */}
            {(address.email || user?.email) && (
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                <FaEnvelope
                  size={9}
                  className="shrink-0 text-blue-500 sm:h-[10px] sm:w-[10px]"
                />

                <span className="truncate">
                  {address.email || user?.email || ""}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Selected indicator */}
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 sm:h-6 sm:w-6">
          <FaCheckCircle
            className="text-emerald-500"
            size={15}
          />
        </div>
      </div>
    </div>
  ) : (
    /* =======================================================
       NO ADDRESS
    ======================================================== */
    <button
      type="button"
      onClick={openAddressSelector}
      className="
        group
        w-full
        rounded-2xl
        border
        border-dashed
        border-blue-200
        bg-blue-50/40
        p-4
        text-left
        transition-all
        duration-200
        hover:border-blue-300
        hover:bg-blue-50
        active:scale-[0.99]
        sm:p-5
      "
    >
      <div className="flex items-center gap-3">
        {/* Plus icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white shadow-sm sm:h-11 sm:w-11">
          <AiOutlinePlus
            className="text-blue-600"
            size={20}
          />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold leading-5 text-slate-900 sm:text-[13px] md:text-sm lg:text-base">
            Add delivery address
          </p>

          <p className="mt-0.5 text-[9px] leading-4 text-slate-500 sm:text-[10px] md:text-xs">
            Add an address to continue
          </p>
        </div>

        {/* Arrow */}
        <IoArrowForward
          className="shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
          size={18}
        />
      </div>
    </button>
  )}

  {/* =========================================================
      DELIVERY SERVICEABILITY
  ========================================================= */}
  {serviceability.checked &&
    serviceability.unavailableItems.length === 0 && (
      <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5 sm:gap-3 sm:p-3.5">
        {/* Success icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <FaCheckCircle
            className="text-emerald-500"
            size={15}
          />
        </div>

        {/* Text */}
        <div className="min-w-0">
          <p className="text-[10px] font-bold leading-4 text-emerald-700 sm:text-[11px] md:text-xs lg:text-sm">
            Delivery available
          </p>

          <p className="mt-0.5 text-[8px] leading-4 text-emerald-600 sm:text-[9px] md:text-[10px] lg:text-xs">
            This order can be delivered to PIN{" "}
            <span className="font-bold">
              {serviceability.postalCode}
            </span>
          </p>
        </div>
      </div>
    )}
</section>

                  {/* ORDER SUMMARY */}
             <section className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5 md:p-6">
  {/* =========================================================
      CARD SHINE EFFECT
  ========================================================= */}
  <div
    className="
      pointer-events-none
      absolute
      inset-y-0
      -left-1/2
      z-20
      w-1/3
      -skew-x-12
      bg-gradient-to-r
      from-transparent
      via-white/60
      to-transparent
      opacity-0
      transition-opacity
      duration-300
      group-hover:animate-[shine_2.5s_ease-in-out_infinite]
      group-hover:opacity-100
    "
  />

  {/* =========================================================
      ORDER SUMMARY HEADER
  ========================================================= */}
  <div className="relative z-10 mb-4 flex items-center justify-between gap-3 sm:mb-5">
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      {/* Icon */}
      <div
        className="
          relative
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          overflow-hidden
          rounded-xl
          border
          border-indigo-100
          bg-indigo-50
          text-indigo-600
          sm:h-10
          sm:w-10
          sm:rounded-2xl
        "
      >
        {/* Icon shine */}
        <span
          className="
            pointer-events-none
            absolute
            inset-y-0
            -left-full
            w-1/2
            -skew-x-12
            bg-gradient-to-r
            from-transparent
            via-white/70
            to-transparent
            group-hover:animate-[iconShine_1.8s_ease-in-out_infinite]
          "
        />

        <FaShoppingBag
          size={14}
          className="relative z-10 sm:hidden"
        />

        <FaShoppingBag
          size={16}
          className="relative z-10 hidden sm:block"
        />
      </div>

      {/* Title */}
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold leading-5 tracking-[-0.01em] text-slate-900 sm:text-[17px] sm:leading-6 md:text-lg lg:text-xl">
          Order Summary
        </h3>

        <p className="mt-0.5 text-[10px] leading-[15px] text-slate-500 sm:text-[11px] sm:leading-4 md:text-xs lg:text-sm">
          {cartItem.length} item
          {cartItem.length !== 1 ? "s" : ""} in your order
        </p>
      </div>
    </div>
  </div>

  {/* =========================================================
      PRODUCTS
  ========================================================= */}
  <div className="relative z-10 space-y-2.5 sm:space-y-3">
    {cartItem.map((item, index) => {
      const variant = getSelectedVariant(item);

      const image =
        item?.image ||
        item?.thumbnail ||
        item?.images?.[0] ||
        variant?.image ||
        variant?.images?.[0] ||
        "";

      const qty = Number(item?.quantity || 1);

      const lineTotal = getItemBaseAmount(item);

      const sku =
        item?.variantSku ||
        variant?.sku ||
        "";

      return (
        <div
          key={`${item?.productId || item?._id || index}-${sku || "default"}`}
          className="
            group/product
            relative
            flex
            items-start
            gap-3
            overflow-hidden
            rounded-2xl
            border
            border-slate-100
            bg-slate-50/60
            p-2.5
            transition-all
            duration-300
            hover:-translate-y-[1px]
            hover:border-indigo-100
            hover:bg-white
            hover:shadow-md
            sm:gap-3.5
            sm:p-3
            md:p-3.5
          "
        >
          {/* =================================================
              PRODUCT ROW SHINE
          ================================================== */}
          <span
            className="
              pointer-events-none
              absolute
              inset-y-0
              -left-1/2
              z-20
              w-1/3
              -skew-x-12
              bg-gradient-to-r
              from-transparent
              via-white/50
              to-transparent
              opacity-0
              group-hover/product:animate-[shine_1.8s_ease-in-out]
              group-hover/product:opacity-100
            "
          />

          {/* =================================================
              PRODUCT IMAGE
          ================================================== */}
          <div
            className="
              relative
              h-[68px]
              w-[68px]
              shrink-0
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              shadow-sm
              sm:h-20
              sm:w-20
              sm:rounded-2xl
              md:h-24
              md:w-24
            "
          >
            {image ? (
              <img
                src={image}
                alt={item?.title || item?.name || "Product"}
                className="
                  h-full
                  w-full
                  object-cover
                  transition-transform
                  duration-500
                  group-hover/product:scale-105
                "
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <FaShoppingBag
                  size={18}
                  className="sm:hidden"
                />

                <FaShoppingBag
                  size={22}
                  className="hidden sm:block"
                />
              </div>
            )}

            {/* Image gloss */}
            <span
              className="
                pointer-events-none
                absolute
                inset-0
                -translate-x-full
                bg-gradient-to-r
                from-transparent
                via-white/30
                to-transparent
                group-hover/product:animate-[imageShine_1.4s_ease-in-out]
              "
            />
          </div>

          {/* =================================================
              PRODUCT INFORMATION
          ================================================== */}
          <div className="min-w-0 flex-1 py-0.5">
            {/* Product name */}
            <p className="truncate text-[12px] font-bold leading-5 text-slate-900 sm:text-[13px] md:text-sm lg:text-base">
              {item?.title ||
                item?.name ||
                "Product"}
            </p>

            {/* SKU */}
            {sku && (
              <p className="mt-0.5 truncate text-[9px] leading-4 text-slate-500 sm:text-[10px] md:text-xs">
                SKU: {sku}
              </p>
            )}

            {/* Quantity + Variant */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Quantity */}
              <span
                className="
                  rounded-full
                  border
                  border-slate-200
                  bg-white
                  px-2
                  py-0.5
                  text-[8px]
                  font-semibold
                  leading-4
                  text-slate-600
                  transition-colors
                  group-hover/product:border-indigo-100
                  group-hover/product:text-indigo-600
                  sm:px-2.5
                  sm:py-1
                  sm:text-[10px]
                "
              >
                Qty: {qty}
              </span>

              {/* Variant attributes */}
              {variant?.attributes &&
                Object.entries(variant.attributes)
                  .slice(0, 2)
                  .map(([key, value]) => (
                    <span
                      key={key}
                      className="
                        max-w-[120px]
                        truncate
                        text-[8px]
                        leading-4
                        text-slate-500
                        transition-colors
                        group-hover/product:text-slate-600
                        sm:max-w-[160px]
                        sm:text-[10px]
                        md:text-[11px]
                      "
                    >
                      {key}: {String(value)}
                    </span>
                  ))}
            </div>
          </div>

          {/* =================================================
              PRICE
          ================================================== */}
          <div className="shrink-0 self-center text-right">
            <p className="text-[13px] font-bold leading-5 text-blue-600 transition-transform duration-300 group-hover/product:scale-[1.03] sm:text-sm md:text-base lg:text-lg">
              ₹
              {Number(lineTotal || 0).toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </p>

            <p className="mt-0.5 whitespace-nowrap text-[8px] leading-4 text-slate-400 sm:text-[9px] md:text-[10px] lg:text-[11px]">
              ₹
              {Number(item?.price || 0).toLocaleString(
                "en-IN"
              )}{" "}
              × {qty}
            </p>
          </div>
        </div>
      );
    })}
  </div>

  {/* =========================================================
      SHINE KEYFRAMES
      Tailwind arbitrary animation
  ========================================================= */}
  <style>{`
    @keyframes shine {
      0% {
        transform: translateX(-180%) skewX(-12deg);
      }

      100% {
        transform: translateX(520%) skewX(-12deg);
      }
    }

    @keyframes iconShine {
      0% {
        transform: translateX(-180%) skewX(-12deg);
      }

      100% {
        transform: translateX(420%) skewX(-12deg);
      }
    }

    @keyframes imageShine {
      0% {
        transform: translateX(-150%) skewX(-12deg);
      }

      100% {
        transform: translateX(300%) skewX(-12deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
</section>

                  {/* COUPON */}
<section className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5 md:p-6">
  {/* =========================================================
      MAIN CARD SHINE
  ========================================================= */}
  <div
    className="
      pointer-events-none
      absolute
      inset-y-0
      -left-1/2
      z-20
      w-1/3
      -skew-x-12
      bg-gradient-to-r
      from-transparent
      via-white/50
      to-transparent
      opacity-0
      group-hover:animate-[couponShine_2.2s_ease-in-out]
      group-hover:opacity-100
    "
  />

  {/* =========================================================
      COUPON HEADER
  ========================================================= */}
  <div className="relative z-10 mb-4 flex items-center gap-2.5 sm:mb-5 sm:gap-3">
    {/* Icon */}
    <div
      className="
        group/icon
        relative
        flex
        h-9
        w-9
        shrink-0
        items-center
        justify-center
        overflow-hidden
        rounded-xl
        border
        border-emerald-100
        bg-emerald-50
        text-emerald-600
        shadow-sm
        sm:h-10
        sm:w-10
        sm:rounded-2xl
      "
    >
      {/* Icon shine */}
      <span
        className="
          pointer-events-none
          absolute
          inset-y-0
          -left-full
          w-1/2
          -skew-x-12
          bg-gradient-to-r
          from-transparent
          via-white/80
          to-transparent
          group-hover/icon:animate-[couponIconShine_1.6s_ease-in-out]
        "
      />

      <FaHistory
        size={14}
        className="relative z-10 sm:hidden"
      />

      <FaHistory
        size={16}
        className="relative z-10 hidden sm:block"
      />
    </div>

    {/* Title */}
    <div className="min-w-0">
      <h3 className="text-[15px] font-bold leading-5 tracking-[-0.01em] text-slate-900 sm:text-[17px] sm:leading-6 md:text-lg lg:text-xl">
        Apply Coupon
      </h3>

      <p className="mt-0.5 text-[10px] leading-[15px] text-slate-500 sm:text-[11px] sm:leading-4 md:text-xs lg:text-sm">
        Use a valid coupon to save on your order
      </p>
    </div>
  </div>

  {/* =========================================================
      COUPON INPUT + BUTTON
  ========================================================= */}
  <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2.5">
    {/* Input */}
    <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl">
      <input
        value={couponCode}
        onChange={(e) => {
          setCouponCode(e.target.value.toUpperCase());
          setCouponError("");
          setCouponSuccess("");
        }}
        placeholder="Enter coupon code"
        autoComplete="off"
        spellCheck={false}
        className={`
          h-11
          w-full
          rounded-xl
          border
          bg-white
          px-3
          text-[12px]
          font-medium
          tracking-wide
          text-slate-900
          outline-none
          placeholder:text-slate-400
          transition-all
          duration-200
          focus:ring-2
          sm:h-12
          sm:px-3.5
          sm:text-[13px]
          md:text-sm
          ${
            couponError
              ? "border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-rose-100"
              : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
          }
        `}
      />

      {/* Input shine */}
      {!couponError && !couponLoading && (
        <span
          className="
            pointer-events-none
            absolute
            inset-y-0
            -left-1/2
            z-10
            w-1/3
            -skew-x-12
            bg-gradient-to-r
            from-transparent
            via-white/40
            to-transparent
            opacity-0
            group-hover:animate-[couponInputShine_2s_ease-in-out]
            group-hover:opacity-100
          "
        />
      )}
    </div>

    {/* Apply button */}
    <button
      type="button"
      onClick={applyCoupon}
      disabled={couponLoading}
      className="
        group/apply
        relative
        flex
        h-11
        shrink-0
        items-center
        justify-center
        overflow-hidden
        rounded-xl
        bg-emerald-600
        px-5
        text-[11px]
        font-bold
        text-white
        shadow-sm
        transition-all
        duration-200
        hover:bg-emerald-700
        hover:shadow-md
        active:scale-[0.98]
        disabled:cursor-not-allowed
        disabled:opacity-60
        sm:h-12
        sm:min-w-[100px]
        sm:px-6
        sm:text-xs
        md:text-sm
      "
    >
      {/* Button shine */}
      {!couponLoading && (
        <span
          className="
            pointer-events-none
            absolute
            inset-y-0
            -left-full
            w-1/2
            -skew-x-12
            bg-gradient-to-r
            from-transparent
            via-white/30
            to-transparent
            group-hover/apply:animate-[couponButtonShine_1.3s_ease-in-out]
          "
        />
      )}

      {couponLoading ? (
        <span className="relative z-10 flex items-center gap-2">
          <span
            className="
              h-3.5
              w-3.5
              animate-spin
              rounded-full
              border-2
              border-white/40
              border-t-white
            "
          />

          <span>Applying...</span>
        </span>
      ) : (
        <span className="relative z-10">
          Apply
        </span>
      )}
    </button>
  </div>

  {/* =========================================================
      COUPON ERROR
  ========================================================= */}
  {couponError && (
    <div className="relative z-10 mt-2.5 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2.5">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[9px] font-bold text-rose-600">
        !
      </span>

      <p className="text-[10px] font-medium leading-4 text-rose-600 sm:text-[11px] md:text-xs">
        {couponError}
      </p>
    </div>
  )}

  {/* =========================================================
      COUPON SUCCESS
  ========================================================= */}
  {couponSuccess && (
    <div
      className="
        group/success
        relative
        mt-3
        overflow-hidden
        rounded-2xl
        border
        border-emerald-100
        bg-emerald-50/70
        p-3
        sm:p-3.5
      "
    >
      {/* Success shine */}
      <span
        className="
          pointer-events-none
          absolute
          inset-y-0
          -left-1/2
          z-10
          w-1/3
          -skew-x-12
          bg-gradient-to-r
          from-transparent
          via-white/60
          to-transparent
          group-hover/success:animate-[couponSuccessShine_1.8s_ease-in-out]
        "
      />

      <div className="relative z-20 flex items-center justify-between gap-3">
        {/* Success information */}
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Check icon */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm sm:h-9 sm:w-9">
            <FaCheckCircle
              className="text-emerald-500"
              size={15}
            />
          </div>

          {/* Text */}
          <div className="min-w-0">
            <p className="text-[11px] font-bold leading-4 text-emerald-700 sm:text-xs md:text-sm">
              Coupon applied
            </p>

            <p className="mt-0.5 truncate text-[9px] leading-4 text-emerald-600 sm:text-[10px] md:text-xs">
              {couponSuccess}
            </p>
          </div>
        </div>

        {/* Discount */}
        <span className="shrink-0 text-[12px] font-bold text-emerald-700 sm:text-sm md:text-base">
          -₹
          {Number(couponDiscount || 0).toFixed(2)}
        </span>
      </div>
    </div>
  )}

  {/* =========================================================
      SHINE ANIMATIONS
  ========================================================= */}
  <style>{`
    @keyframes couponShine {
      0% {
        transform: translateX(-180%) skewX(-12deg);
      }

      100% {
        transform: translateX(520%) skewX(-12deg);
      }
    }

    @keyframes couponIconShine {
      0% {
        transform: translateX(-180%) skewX(-12deg);
      }

      100% {
        transform: translateX(420%) skewX(-12deg);
      }
    }

    @keyframes couponInputShine {
      0% {
        transform: translateX(-180%) skewX(-12deg);
      }

      100% {
        transform: translateX(520%) skewX(-12deg);
      }
    }

    @keyframes couponButtonShine {
      0% {
        transform: translateX(-180%) skewX(-12deg);
      }

      100% {
        transform: translateX(420%) skewX(-12deg);
      }
    }

    @keyframes couponSuccessShine {
      0% {
        transform: translateX(-180%) skewX(-12deg);
      }

      100% {
        transform: translateX(520%) skewX(-12deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
</section>
                  {/* PAYMENT METHOD */}
                <section className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5 md:p-6">
  {/* =========================================================
      PAYMENT HEADER
  ========================================================= */}
  <div className="mb-4 flex items-center gap-2.5 sm:mb-5 sm:gap-3">
    {/* Icon */}
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 sm:h-10 sm:w-10 sm:rounded-2xl">
      <MdPayments size={16} />
    </div>

    {/* Heading */}
    <div className="min-w-0">
      <h3 className="text-[15px] font-bold leading-5 tracking-[-0.01em] text-slate-900 sm:text-[17px] sm:leading-6 md:text-lg lg:text-xl">
        Payment Method
      </h3>

      <p className="mt-0.5 text-[10px] leading-[15px] text-slate-500 sm:text-[11px] sm:leading-4 md:text-xs lg:text-sm">
        Choose how you want to pay
      </p>
    </div>
  </div>

  {/* =========================================================
      PAYMENT METHODS
  ========================================================= */}
  <div className="space-y-2.5 sm:space-y-3">

    {/* =======================================================
        CASH ON DELIVERY
    ======================================================== */}
    <button
      type="button"
      onClick={() => setPaymentType("cod")}
      className={`
        group
        relative
        flex
        w-full
        items-center
        gap-2.5
        overflow-hidden
        rounded-2xl
        border
        p-3
        text-left
        transition-all
        duration-200
        sm:gap-3
        sm:p-3.5
        ${
          paymentType === "cod"
            ? "border-blue-300 bg-blue-50/60 shadow-sm"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        }
      `}
    >
      {/* Radio */}
      <div
        className={`
          flex
          h-5
          w-5
          shrink-0
          items-center
          justify-center
          rounded-full
          border-2
          transition-all
          ${
            paymentType === "cod"
              ? "border-blue-600"
              : "border-slate-300"
          }
        `}
      >
        {paymentType === "cod" && (
          <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
        )}
      </div>

      {/* Wallet icon */}
      <div
        className={`
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          border
          sm:h-10
          sm:w-10
          ${
            paymentType === "cod"
              ? "border-blue-100 bg-white text-blue-600"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }
        `}
      >
        <FaWallet size={16} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold leading-5 text-slate-900 sm:text-[13px] md:text-sm">
          Cash on Delivery
        </p>

        <p className="mt-0.5 text-[9px] leading-4 text-slate-500 sm:text-[10px] md:text-xs">
          Pay after your order arrives
        </p>
      </div>

      {/* Available */}
      <span className="hidden shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600 sm:block sm:text-[10px]">
        Available
      </span>
    </button>

    {/* =======================================================
        ONLINE PAYMENT
    ======================================================== */}
   <button
  type="button"
  onClick={() => setPaymentType("razorpay")}
  className={`
    group relative w-full overflow-hidden rounded-2xl border p-3 text-left
    transition-all duration-300
    sm:p-3.5
    ${
      paymentType === "razorpay"
        ? "border-blue-300 bg-blue-50/60 shadow-sm"
        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
    }
  `}
>
  {/* =========================================================
      MAIN PAYMENT ROW
  ========================================================== */}
  <div className="flex items-center gap-2.5 sm:gap-3">

    {/* Radio */}
    <div
      className={`
        flex h-5 w-5 shrink-0 items-center justify-center rounded-full
        border-2 transition-all duration-200
        ${
          paymentType === "razorpay"
            ? "border-blue-600 bg-white"
            : "border-slate-300 bg-white"
        }
      `}
    >
      {paymentType === "razorpay" && (
        <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
      )}
    </div>

    {/* Payment icon */}
    <div
      className={`
        flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
        border transition-all duration-200
        sm:h-10 sm:w-10
        ${
          paymentType === "razorpay"
            ? "border-blue-100 bg-white text-blue-600 shadow-sm"
            : "border-slate-200 bg-slate-50 text-slate-500"
        }
      `}
    >
      <FaCreditCard size={16} />
    </div>

    {/* Payment text */}
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">

        <p className="text-[12px] font-bold leading-5 text-slate-900 sm:text-[13px] md:text-sm">
          Pay Online
        </p>

        <span
          className="
            rounded-full border border-emerald-100 bg-emerald-50
            px-1.5 py-0.5 text-[8px] font-bold text-emerald-700
            sm:px-2 sm:text-[9px]
          "
        >
          Secure
        </span>
      </div>

      <p className="mt-0.5 text-[9px] leading-4 text-slate-500 sm:text-[10px] md:text-xs">
        UPI, Cards, Wallets & Netbanking
      </p>
    </div>

    {/* Razorpay */}
    <span
      className="
        hidden shrink-0 text-[10px] font-semibold text-blue-600
        sm:block sm:text-xs
      "
    >
      Razorpay
    </span>
  </div>

  {/* =========================================================
      UPI PAYMENT SECTION
  ========================================================== */}
  {paymentType === "razorpay" && (
    <div
      className="
        mt-3 border-t border-blue-100 pt-3
        sm:mt-3.5 sm:pt-3.5
      "
    >

      {/* UPI Header */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-800 sm:text-[11px] md:text-xs">
            UPI payment
          </p>

          <p className="mt-0.5 text-[8px] leading-4 text-slate-400 sm:text-[9px]">
            Choose your preferred UPI app
          </p>
        </div>

        <span
          className="
            shrink-0 rounded-full border border-blue-100 bg-white
            px-2 py-1 text-[8px] font-semibold text-blue-600
            shadow-sm sm:text-[9px]
          "
        >
          Powered by Razorpay
        </span>
      </div>

      {/* =====================================================
          UPI APPS
      ====================================================== */}
      <div
        className="
          grid grid-cols-2 gap-2
          sm:grid-cols-4
        "
      >

        {/* =================================================
            GOOGLE PAY
        ================================================== */}
        <div
          className="
            group/upi relative flex min-w-0 items-center gap-2
            rounded-xl border border-slate-200 bg-white
            p-2.5 shadow-sm
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-blue-200
            hover:bg-blue-50/40
            hover:shadow-md
            sm:flex-col sm:justify-center
            sm:gap-1.5 sm:p-2.5
          "
        >
          {/* Logo */}
          <div
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              overflow-hidden rounded-xl border border-slate-100
              bg-white shadow-sm
              sm:h-11 sm:w-11
            "
          >
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6tucpYR1Cc-cRxWHxcXqr6QCGVE8__0Hbas0WV-k_dg&s"
              alt="Google Pay"
              className="h-7 w-7 object-contain sm:h-8 sm:w-8"
              loading="lazy"
              draggable="false"
            />
          </div>

          {/* Name */}
          <div className="min-w-0 flex-1 sm:w-full sm:text-center">
            <p className="truncate text-[10px] font-semibold text-slate-700 sm:text-[9px] md:text-[10px]">
              Google Pay
            </p>

            <p className="mt-0.5 text-[8px] text-slate-400 sm:hidden">
              UPI
            </p>
          </div>
        </div>

        {/* =================================================
            PHONEPE
        ================================================== */}
        <div
          className="
            group/upi relative flex min-w-0 items-center gap-2
            rounded-xl border border-slate-200 bg-white
            p-2.5 shadow-sm
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-purple-200
            hover:bg-purple-50/40
            hover:shadow-md
            sm:flex-col sm:justify-center
            sm:gap-1.5 sm:p-2.5
          "
        >
          {/* Logo */}
          <div
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              overflow-hidden rounded-xl border border-purple-100
              bg-purple-50 shadow-sm
              sm:h-11 sm:w-11
            "
          >
            <img
              src="https://cdn.simpleicons.org/phonepe"
              alt="PhonePe"
              className="h-7 w-7 object-contain sm:h-8 sm:w-8"
              loading="lazy"
              draggable="false"
            />
          </div>

          {/* Name */}
          <div className="min-w-0 flex-1 sm:w-full sm:text-center">
            <p className="truncate text-[10px] font-semibold text-slate-700 sm:text-[9px] md:text-[10px]">
              PhonePe
            </p>

            <p className="mt-0.5 text-[8px] text-slate-400 sm:hidden">
              UPI
            </p>
          </div>
        </div>

        {/* =================================================
            PAYTM
        ================================================== */}
        <div
          className="
            group/upi relative flex min-w-0 items-center gap-2
            rounded-xl border border-slate-200 bg-white
            p-2.5 shadow-sm
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-sky-200
            hover:bg-sky-50/40
            hover:shadow-md
            sm:flex-col sm:justify-center
            sm:gap-1.5 sm:p-2.5
          "
        >
          {/* Logo */}
          <div
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              overflow-hidden rounded-xl border border-sky-100
              bg-white shadow-sm
              sm:h-11 sm:w-11
            "
          >
            <img
              src="https://images.seeklogo.com/logo-png/50/2/paytm-logo-png_seeklogo-501241.png"
              alt="Paytm"
              className="h-7 w-7 object-contain sm:h-8 sm:w-8"
              loading="lazy"
              draggable="false"
            />
          </div>

          {/* Name */}
          <div className="min-w-0 flex-1 sm:w-full sm:text-center">
            <p className="truncate text-[10px] font-semibold text-slate-700 sm:text-[9px] md:text-[10px]">
              Paytm
            </p>

            <p className="mt-0.5 text-[8px] text-slate-400 sm:hidden">
              UPI
            </p>
          </div>
        </div>

        {/* =================================================
            AMAZON PAY
        ================================================== */}
        <div
          className="
            group/upi relative flex min-w-0 items-center gap-2
            rounded-xl border border-slate-200 bg-white
            p-2.5 shadow-sm
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-orange-200
            hover:bg-orange-50/40
            hover:shadow-md
            sm:flex-col sm:justify-center
            sm:gap-1.5 sm:p-2.5
          "
        >
          {/* Logo */}
          <div
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              overflow-hidden rounded-xl border border-orange-100
              bg-white shadow-sm
              sm:h-11 sm:w-11
            "
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/d/de/Amazon_icon.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original"
              alt="Amazon Pay"
              className="h-7 w-7 object-contain sm:h-8 sm:w-8"
              loading="lazy"
              draggable="false"
            />
          </div>

          {/* Name */}
          <div className="min-w-0 flex-1 sm:w-full sm:text-center">
            <p className="truncate text-[10px] font-semibold text-slate-700 sm:text-[9px] md:text-[10px]">
              Amazon Pay
            </p>

            <p className="mt-0.5 text-[8px] text-slate-400 sm:hidden">
              UPI
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          SUPPORTED PAYMENT METHODS
      ====================================================== */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">

        <span
          className="
            rounded-full border border-slate-100 bg-slate-50
            px-2 py-1 text-[8px] font-medium text-slate-500
            sm:text-[9px]
          "
        >
          UPI
        </span>

        <span
          className="
            rounded-full border border-slate-100 bg-slate-50
            px-2 py-1 text-[8px] font-medium text-slate-500
            sm:text-[9px]
          "
        >
          Cards
        </span>

        <span
          className="
            rounded-full border border-slate-100 bg-slate-50
            px-2 py-1 text-[8px] font-medium text-slate-500
            sm:text-[9px]
          "
        >
          Wallets
        </span>

        <span
          className="
            rounded-full border border-slate-100 bg-slate-50
            px-2 py-1 text-[8px] font-medium text-slate-500
            sm:text-[9px]
          "
        >
          Netbanking
        </span>
      </div>

      {/* =====================================================
          SECURITY INFORMATION
      ====================================================== */}
      <div
        className="
          mt-3 flex items-start gap-2 rounded-xl
          border border-emerald-100 bg-emerald-50/60
          px-2.5 py-2.5
          sm:items-center
        "
      >
        {/* Check icon */}
        <div
          className="
            flex h-6 w-6 shrink-0 items-center justify-center
            rounded-full bg-white shadow-sm
          "
        >
          <FaCheckCircle
            className="text-emerald-500"
            size={12}
          />
        </div>

        {/* Text */}
        <p
          className="
            text-[9px] leading-4 text-emerald-700
            sm:text-[10px]
          "
        >
          Your payment is processed securely through Razorpay.
          Available UPI apps and payment methods may vary depending
          on the customer's device and Razorpay Checkout.
        </p>
      </div>

    </div>
  )}
</button>

    {/* =======================================================
        PAYMENT TRUST MESSAGE
    ======================================================== */}
    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
        <FaShieldAlt
          className="text-emerald-500"
          size={13}
        />
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-semibold text-slate-700 sm:text-[10px] md:text-xs">
          Secure payment
        </p>

        <p className="text-[8px] leading-4 text-slate-500 sm:text-[9px] md:text-[10px]">
          Payments are securely processed by Razorpay.
        </p>
      </div>
    </div>
  </div>
</section>
                  {/* PRICE DETAILS */}
                {/* =========================================================
    PRICE DETAILS — MODERN ECOMMERCE UI
========================================================= */}

<style>{`
  @keyframes priceCardShine {
    0% {
      transform: translateX(-140%) skewX(-18deg);
      opacity: 0;
    }
    15% {
      opacity: 0;
    }
    35% {
      opacity: 0.75;
    }
    55% {
      opacity: 0;
    }
    100% {
      transform: translateX(180%) skewX(-18deg);
      opacity: 0;
    }
  }

  @keyframes priceAmountShine {
    0%,
    70%,
    100% {
      background-position: 200% center;
    }
    85% {
      background-position: -200% center;
    }
  }

  @keyframes priceBadgeShine {
    0% {
      transform: translateX(-140%) skewX(-18deg);
    }
    35%,
    100% {
      transform: translateX(180%) skewX(-18deg);
    }
  }

  .price-card-shine {
    animation: priceCardShine 4.8s ease-in-out infinite;
  }

  .price-amount-shine {
    background: linear-gradient(
      110deg,
      #0f172a 0%,
      #0f172a 38%,
      #2563eb 46%,
      #60a5fa 50%,
      #2563eb 54%,
      #0f172a 62%,
      #0f172a 100%
    );
    background-size: 250% auto;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: priceAmountShine 4.5s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .price-card-shine,
    .price-amount-shine {
      animation: none;
    }
  }
`}</style>

<section
  className="
    group relative w-full overflow-hidden
    rounded-2xl border border-slate-200
    bg-white p-3.5 shadow-sm
    transition-all duration-300
    hover:border-slate-300
    hover:shadow-md
    sm:rounded-3xl sm:p-5
    md:p-6
  "
>
  {/* =======================================================
      CARD SHINE
  ======================================================== */}
  <div
    className="
      pointer-events-none absolute inset-y-0
      -left-[45%] z-0 w-[28%]
      rotate-0
      bg-gradient-to-r
      from-transparent
      via-white/70
      to-transparent
      blur-[2px]
      price-card-shine
    "
  />

  {/* =======================================================
      HEADER
  ======================================================== */}
  <div
    className="
      relative z-10 mb-4 flex items-center
      justify-between gap-3
      sm:mb-5
    "
  >
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">

      {/* Price icon */}
      <div
        className="
          relative flex h-9 w-9 shrink-0
          items-center justify-center
          overflow-hidden rounded-xl
          border border-blue-100
          bg-blue-50 text-blue-600
          sm:h-10 sm:w-10
          sm:rounded-2xl
        "
      >
        <span
          className="
            pointer-events-none absolute inset-y-0
            -left-full w-1/2
            rotate-12
            bg-gradient-to-r
            from-transparent
            via-white/80
            to-transparent
            transition-transform duration-700
            group-hover:left-[130%]
          "
        />

        <span className="relative z-10 text-[15px] font-black sm:text-base">
          ₹
        </span>
      </div>

      {/* Heading */}
      <div className="min-w-0">
        <h3
          className="
            text-[15px] font-bold leading-5
            tracking-[-0.01em] text-slate-900
            sm:text-[17px] sm:leading-6
            md:text-lg lg:text-xl
          "
        >
          Price Details
        </h3>

        <p
          className="
            mt-0.5 text-[9px] leading-4
            text-slate-500
            sm:text-[10px]
            md:text-xs
          "
        >
          Complete breakdown of your order
        </p>
      </div>
    </div>

    {/* Item count */}
    <span
      className="
        shrink-0 rounded-full
        border border-slate-200
        bg-slate-50
        px-2.5 py-1
        text-[8px] font-semibold
        text-slate-500
        sm:px-3 sm:py-1.5
        sm:text-[9px]
        md:text-[10px]
      "
    >
      {cartItem.length} item{cartItem.length !== 1 ? "s" : ""}
    </span>
  </div>

  {/* =======================================================
      PRICE BREAKDOWN
  ======================================================== */}
  <div className="relative z-10 space-y-2.5 sm:space-y-3">

    {/* Items */}
    <div
      className="
        flex items-center justify-between
        gap-4 rounded-xl px-2 py-1
        transition-colors duration-200
        hover:bg-slate-50
        sm:px-2.5
      "
    >
      <span
        className="
          text-[10px] font-medium
          text-slate-500
          sm:text-[11px]
          md:text-xs
        "
      >
        Items
      </span>

      <span
        className="
          whitespace-nowrap text-[11px]
          font-semibold text-slate-800
          sm:text-xs md:text-sm
        "
      >
        ₹
        {Number(totalPrice || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </div>

    {/* Product discount */}
    <div
      className="
        flex items-center justify-between
        gap-4 rounded-xl px-2 py-1
        transition-colors duration-200
        hover:bg-emerald-50/50
        sm:px-2.5
      "
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="
            flex h-5 w-5 shrink-0
            items-center justify-center
            rounded-full bg-emerald-50
            text-[10px] font-bold
            text-emerald-600
            sm:h-6 sm:w-6
          "
        >
          %
        </span>

        <span
          className="
            truncate text-[10px]
            font-medium text-slate-500
            sm:text-[11px] md:text-xs
          "
        >
          Product discount
        </span>
      </div>

      <span
        className="
          shrink-0 whitespace-nowrap
          text-[11px] font-bold
          text-emerald-600
          sm:text-xs md:text-sm
        "
      >
        -₹{Number(itemDiscount || 0).toFixed(2)}
      </span>
    </div>

    {/* Coupon discount */}
    <div
      className="
        flex items-center justify-between
        gap-4 rounded-xl px-2 py-1
        transition-colors duration-200
        hover:bg-emerald-50/50
        sm:px-2.5
      "
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="
            flex h-5 w-5 shrink-0
            items-center justify-center
            rounded-full bg-emerald-50
            text-[9px] font-black
            text-emerald-600
            sm:h-6 sm:w-6
          "
        >
          %
        </span>

        <span
          className="
            truncate text-[10px]
            font-medium text-slate-500
            sm:text-[11px] md:text-xs
          "
        >
          Coupon discount
        </span>
      </div>

      <span
        className="
          shrink-0 whitespace-nowrap
          text-[11px] font-bold
          text-emerald-600
          sm:text-xs md:text-sm
        "
      >
        -₹{Number(couponDiscount || 0).toFixed(2)}
      </span>
    </div>

    {/* Delivery */}
    <div
      className="
        flex items-center justify-between
        gap-4 rounded-xl px-2 py-1
        transition-colors duration-200
        hover:bg-emerald-50/50
        sm:px-2.5
      "
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="
            flex h-5 w-5 shrink-0
            items-center justify-center
            rounded-full bg-emerald-50
            text-emerald-600
            sm:h-6 sm:w-6
          "
        >
          <FaCheckCircle size={11} />
        </span>

        <span
          className="
            text-[10px] font-medium
            text-slate-500
            sm:text-[11px] md:text-xs
          "
        >
          Delivery
        </span>
      </div>

      <span
        className="
          rounded-full border
          border-emerald-100
          bg-emerald-50
          px-2 py-0.5
          text-[8px] font-bold
          text-emerald-600
          sm:px-2.5 sm:py-1
          sm:text-[9px]
          md:text-[10px]
        "
      >
        FREE
      </span>
    </div>

    {/* Tax */}
    <div
      className="
        flex items-center justify-between
        gap-4 rounded-xl px-2 py-1
        transition-colors duration-200
        hover:bg-slate-50
        sm:px-2.5
      "
    >
      <span
        className="
          text-[10px] font-medium
          text-slate-500
          sm:text-[11px]
          md:text-xs
        "
      >
        Tax
      </span>

      <span
        className="
          whitespace-nowrap text-[11px]
          font-semibold text-slate-800
          sm:text-xs md:text-sm
        "
      >
        ₹{Number(itemTax || 0).toFixed(2)}
      </span>
    </div>
  </div>

  {/* =======================================================
      DIVIDER
  ======================================================== */}
  <div className="relative z-10 my-4 sm:my-5">
    <div className="border-t border-dashed border-slate-200" />
  </div>

  {/* =======================================================
      TOTAL
  ======================================================== */}
  <div
    className="
      relative z-10 overflow-hidden
      rounded-md border-blue-100
      bg-gradient-to-br
      from-blue-50/80
      via-white
      to-slate-50
      p-3.5
      sm:p-4
    "
  >
    {/* Inner shine */}
    <div
      className="
        pointer-events-none absolute inset-y-0
        -left-[60%] w-[35%]
        skew-x-[-18deg]
        bg-gradient-to-r
        from-transparent
        via-white/70
        to-transparent
        transition-transform duration-1000
        group-hover:left-[140%]
      "
    />

    <div className="relative z-10 flex items-end justify-between gap-3">

      {/* Total amount */}
      <div className="min-w-0">
        <p
          className="
            text-[8px] font-bold uppercase
            tracking-[0.12em] text-slate-400
            sm:text-[9px]
            md:text-[10px]
          "
        >
          Total Amount
        </p>

        <p
          className="
            price-amount-shine
            mt-0.5 truncate
            text-[24px] font-black
            leading-tight tracking-[-0.03em]
            sm:text-[28px]
            md:text-[30px]
            lg:text-[32px]
          "
        >
          ₹
          {Number(finalTotal || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Free delivery badge */}
      <div
        className="
          relative shrink-0 overflow-hidden
          rounded-full border border-emerald-100
          bg-emerald-50
          px-2.5 py-1.5
          sm:px-3 sm:py-2
        "
      >
        {/* Badge shine */}
        <span
          className="
            pointer-events-none absolute inset-y-0
            -left-1/2 w-1/2
            skew-x-[-18deg]
            bg-gradient-to-r
            from-transparent
            via-white/70
            to-transparent
            price-card-shine
          "
        />

        <span
          className="
            relative z-10 flex items-center
            gap-1.5 text-[8px]
            font-bold text-emerald-700
            sm:text-[9px]
            md:text-[10px]
          "
        >
          <FaCheckCircle
            className="shrink-0 text-emerald-500"
            size={11}
          />

          <span className="hidden xs:inline sm:inline">
            Free delivery
          </span>

          <span className="xs:hidden sm:hidden">
            FREE
          </span>
        </span>
      </div>
    </div>

    {/* Small reassurance */}
    <div
      className="
        relative z-10 mt-2.5
        flex items-center gap-1.5
        border-t border-blue-100/70
        pt-2.5
      "
    >
      <FaCheckCircle
        className="shrink-0 text-emerald-500"
        size={10}
      />

      <p
        className="
          text-[8px] leading-4
          text-slate-500
          sm:text-[9px]
          md:text-[10px]
        "
      >
        Final payable amount
      </p>
    </div>
  </div>
</section>

                  {/* SECURITY NOTE */}
               {/* =========================================================
    SECURE CHECKOUT TRUST BAR
========================================================= */}
<div
  className="
    group relative mx-auto flex w-full max-w-2xl
    items-center justify-center overflow-hidden
    rounded-xl border border-emerald-100
    bg-emerald-50/60
    px-3 py-2.5
    shadow-sm
    sm:rounded-2xl sm:px-4 sm:py-3
  "
>
  {/* Animated shine */}
  <span
    className="
      pointer-events-none absolute inset-y-0
      -left-1/2 w-1/3
      -skew-x-12
      bg-gradient-to-r
      from-transparent
      via-white/70
      to-transparent
      opacity-0
      transition-all duration-1000
      group-hover:left-[120%]
      group-hover:opacity-100
    "
  />

  {/* Shield */}
  <span
    className="
      relative z-10 flex h-6 w-6
      shrink-0 items-center justify-center
      rounded-full border border-emerald-100
      bg-white shadow-sm
      sm:h-7 sm:w-7
    "
  >
    <FaShieldAlt
      className="text-emerald-500"
      size={11}
    />
  </span>

  {/* Text */}
  <div className="relative z-10 ml-2 min-w-0 text-center">
    <p
      className="
        text-[9px] font-semibold
        leading-4 text-emerald-700
        sm:text-[10px]
        md:text-[11px]
      "
    >
      Secure Checkout
    </p>

    <p
      className="
        text-[8px] leading-3.5
        text-slate-500
        sm:text-[9px]
        md:text-[10px]
      "
    >
      Your order details are protected and securely processed.
    </p>
  </div>

  {/* Verified indicator */}
  <span
    className="
      relative z-10 ml-2 hidden
      shrink-0 items-center gap-1
      rounded-full border border-emerald-100
      bg-white px-2 py-1
      text-[8px] font-bold
      text-emerald-600
      sm:flex
    "
  >
    <FaCheckCircle size={9} />
    Protected
  </span>
</div>
                  {/* ACTIONS */}
                {/* =========================================================
    MODERN REVIEW ACTION BAR
========================================================= */}

<style>{`
  @keyframes reviewCtaShine {
    0% {
      transform: translateX(-140%) skewX(-18deg);
      opacity: 0;
    }
    15% {
      opacity: 0;
    }
    35% {
      opacity: 0.75;
    }
    55% {
      opacity: 0;
    }
    100% {
      transform: translateX(180%) skewX(-18deg);
      opacity: 0;
    }
  }

  @keyframes reviewTotalGlow {
    0%,
    100% {
      opacity: 0.55;
    }
    50% {
      opacity: 1;
    }
  }

  .review-cta-shine {
    animation: reviewCtaShine 3.8s ease-in-out infinite;
  }

  .review-total-glow {
    animation: reviewTotalGlow 2.5s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .review-cta-shine,
    .review-total-glow {
      animation: none;
    }
  }
`}</style>

<div
  className="
    fixed inset-x-0 bottom-0 z-[9999]
    w-full rounded-2xl
    border-t border-slate-200/80
    bg-white/90
    shadow-[0_-8px_35px_rgba(15,23,42,0.12)]
    backdrop-blur-2xl
    supports-[backdrop-filter]:bg-white/75
  "
  style={{
    paddingBottom: "env(safe-area-inset-bottom)",
  }}
>
  {/* =======================================================
      TOP SHINE LINE
  ======================================================== */}
  <div
    className="
      pointer-events-none absolute inset-x-0 top-0
      h-px overflow-hidden
      bg-gradient-to-r
      from-transparent
      via-blue-200
      to-transparent rounded-2xl
    "
  >
    <span
      className="
        absolute inset-y-0 left-[-30%]
        w-[30%]
        bg-gradient-to-r
        from-transparent
        via-blue-500/70
        to-transparent
        review-cta-shine
      "
    />
  </div>
{/* =========================================================
    MODERN REVIEW CHECKOUT ACTION DOCK
========================================================= */}

<style>{`
  @keyframes reviewDockShine {
    0% {
      transform: translateX(-180%) skewX(-18deg);
      opacity: 0;
    }

    15% {
      opacity: 0;
    }

    35% {
      opacity: 0.8;
    }

    55% {
      opacity: 0;
    }

    100% {
      transform: translateX(220%) skewX(-18deg);
      opacity: 0;
    }
  }

  @keyframes reviewDockGlow {
    0%,
    100% {
      opacity: 0.45;
      transform: scale(0.95);
    }

    50% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes reviewDockBorder {
    0%,
    100% {
      opacity: 0.4;
    }

    50% {
      opacity: 1;
    }
  }

  @keyframes reviewDockArrow {
    0%,
    100% {
      transform: translateX(0);
    }

    50% {
      transform: translateX(3px);
    }
  }

  .review-dock-shine {
    animation: reviewDockShine 3.6s ease-in-out infinite;
  }

  .review-dock-glow {
    animation: reviewDockGlow 2.4s ease-in-out infinite;
  }

  .review-dock-border {
    animation: reviewDockBorder 2.8s ease-in-out infinite;
  }

  .review-dock-arrow {
    animation: reviewDockArrow 1.8s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .review-dock-shine,
    .review-dock-glow,
    .review-dock-border,
    .review-dock-arrow {
      animation: none;
    }
  }
`}</style>

<div
  className="
    mx-auto flex w-full max-w-7xl
    items-center gap-2
    px-2.5 py-2
    sm:gap-3 sm:px-5 sm:py-3
    lg:gap-4 lg:px-8
  "
>
  {/* =======================================================
      BACK BUTTON
  ======================================================== */}
  <button
    type="button"
    onClick={() => setStep(1)}
    className="
      group
      relative
      flex
      h-11
      w-11
      shrink-0
      items-center
      justify-center
      overflow-hidden
      rounded-xl
      border
      border-slate-200
      bg-white
      text-slate-600
      shadow-sm
      transition-all
      duration-200

      hover:border-slate-300
      hover:bg-slate-50
      hover:text-slate-900
      hover:shadow-md

      active:scale-95

      sm:h-12
      sm:w-auto
      sm:gap-2
      sm:px-4

      md:h-[52px]
      md:px-5
    "
    aria-label="Go back to cart"
  >
    {/* Button shine */}
    <span
      className="
        pointer-events-none
        absolute
        inset-y-0
        -left-1/2
        w-1/3
        -skew-x-12
        bg-gradient-to-r
        from-transparent
        via-white/80
        to-transparent
        opacity-0
        transition-all
        duration-700
        group-hover:left-[130%]
        group-hover:opacity-100
      "
    />

    <IoArrowBack
      size={17}
      className="
        relative
        z-10
        shrink-0
        transition-transform
        duration-200
        group-hover:-translate-x-0.5
      "
    />

    <span
      className="
        relative
        z-10
        hidden
        text-[11px]
        font-bold
        sm:inline
        md:text-xs
      "
    >
      Back
    </span>
  </button>

  {/* =======================================================
      TOTAL CARD
  ======================================================== */}
  <div
    className="
      group/total
      relative
      min-w-0
      flex-1
      overflow-hidden
      rounded-xl
      border
      border-slate-200
      bg-white
      px-3
      py-2
      shadow-sm
      transition-all
      duration-300

      hover:border-slate-300
      hover:shadow-md

      sm:rounded-2xl
      sm:px-4
      sm:py-2.5

      md:px-5
      md:py-3
    "
  >
    {/* =====================================================
        TOTAL CARD SHINE
    ====================================================== */}
    <span
      className="
        pointer-events-none
        absolute
        inset-y-0
        -left-1/2
        w-1/3
        -skew-x-12
        bg-gradient-to-r
        from-transparent
        via-white/80
        to-transparent
        opacity-60
        review-dock-shine
      "
    />

    {/* Soft blue glow */}
    <span
      className="
        pointer-events-none
        absolute
        -right-10
        -top-10
        h-20
        w-20
        rounded-full
        bg-blue-100/40
        blur-2xl
      "
    />

    <div
      className="
        relative
        z-10
        flex
        min-w-0
        items-center
        justify-between
        gap-2
      "
    >
      {/* Total information */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p
            className="
              truncate
              text-[7px]
              font-bold
              uppercase
              tracking-[0.13em]
              text-slate-400

              sm:text-[8px]
              md:text-[9px]
            "
          >
            Total Amount
          </p>

          {/* Animated status dot */}
          <span
            className="
              hidden
              h-1.5
              w-1.5
              rounded-full
              bg-emerald-500
              shadow-[0_0_9px_rgba(16,185,129,0.65)]
              review-dock-glow
              sm:block
            "
          />
        </div>

        <div className="mt-0.5 flex items-baseline gap-1.5">
          <strong
            className="
              truncate
              text-[15px]
              font-black
              leading-5
              tracking-[-0.025em]
              text-slate-900

              sm:text-lg
              md:text-xl
              lg:text-[22px]
            "
          >
            ₹
            {Number(finalTotal || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>

          <span
            className="
              hidden
              text-[8px]
              font-medium
              text-slate-400
              sm:inline
              md:text-[9px]
            "
          >
            incl. taxes
          </span>
        </div>
      </div>

      {/* ===================================================
          SECURE BADGE
      ==================================================== */}
      <div
        className="
          hidden
          shrink-0
          items-center
          gap-1.5
          rounded-full
          border
          border-emerald-100
          bg-emerald-50
          px-2
          py-1
          text-[8px]
          font-bold
          text-emerald-700

          sm:flex
          md:px-2.5
          md:py-1.5
          md:text-[9px]
        "
      >
        <FaShieldAlt
          size={9}
          className="
            text-emerald-500
            review-dock-glow
          "
        />

        <span>Secure</span>
      </div>
    </div>
  </div>

  {/* =======================================================
      MAIN CTA
  ======================================================== */}
  <button
    type="button"
    onClick={handlePlaceOrderFromReview}
    disabled={
      !selectedAddressId ||
      !cartItem.length ||
      serviceability.checking
    }
    className="
      group/cta
      relative
      flex
      h-11
      min-w-[126px]
      shrink-0
      items-center
      justify-center
      gap-2
      overflow-hidden
      rounded-xl

      bg-gradient-to-r
      from-blue-600
      via-blue-600
      to-indigo-600

      px-4

      text-[10px]
      font-bold
      text-white

      shadow-[0_7px_22px_rgba(37,99,235,0.30)]

      transition-all
      duration-300

      hover:-translate-y-0.5
      hover:from-blue-600
      hover:via-indigo-600
      hover:to-violet-600
      hover:shadow-[0_10px_30px_rgba(37,99,235,0.38)]

      active:translate-y-0
      active:scale-[0.97]

      disabled:cursor-not-allowed
      disabled:translate-y-0
      disabled:from-slate-400
      disabled:via-slate-400
      disabled:to-slate-500
      disabled:opacity-60
      disabled:shadow-none

      sm:h-12
      sm:min-w-[160px]
      sm:px-5
      sm:text-xs

      md:h-[52px]
      md:min-w-[180px]
      md:px-6
      md:text-sm

      lg:min-w-[195px]
    "
  >
    {/* =====================================================
        CTA MOVING SHINE
    ====================================================== */}
    <span
      className="
        pointer-events-none
        absolute
        inset-y-0
        -left-1/2
        w-1/3
        -skew-x-12
        bg-gradient-to-r
        from-transparent
        via-white/35
        to-transparent
        review-dock-shine
      "
    />

    {/* =====================================================
        TOP HIGHLIGHT
    ====================================================== */}
    <span
      className="
        pointer-events-none
        absolute
        inset-x-3
        top-0
        h-px
        bg-gradient-to-r
        from-transparent
        via-white/70
        to-transparent
      "
    />

    {/* =====================================================
        OUTER GLOW
    ====================================================== */}
    <span
      className="
        pointer-events-none
        absolute
        -inset-1
        rounded-2xl
        border
        border-white/10
        review-dock-border
      "
    />

    {/* =====================================================
        BUTTON CONTENT
    ====================================================== */}
    {serviceability.checking ? (
      <>
        <span
          className="
            relative
            z-10
            whitespace-nowrap
          "
        >
          Checking...
        </span>

        <span
          className="
            relative
            z-10
            h-3.5
            w-3.5
            animate-spin
            rounded-full
            border-2
            border-white/35
            border-t-white
          "
        />
      </>
    ) : (
      <>
        <span
          className="
            relative
            z-10
            whitespace-nowrap
          "
        >
          {paymentType === "cod"
            ? "Place Order"
            : "Continue"}
        </span>

        <IoArrowForward
          size={18}
          className="
            relative
            z-10
            shrink-0
            review-dock-arrow
          "
        />
      </>
    )}
  </button>
</div>
</div>
                </div>
              )}

              {/* =================================================
                  STEP 3 — PAYMENT
              ================================================= */}

              {step === 3 && (

                <div
                  className="step-panel anime-step-panel space-y-6 pb-36"
                >

                  {/* HEADER */}

                  <div>

                    <h2
                      className="
                        text-3xl
                        font-black
                        tracking-tight
                        text-slate-900
                      "
                    >
                      Payment
                    </h2>


                    <p
                      className="
                        text-slate-500
                        text-sm
                        mt-1
                      "
                    >
                      Complete your purchase securely
                    </p>

                  </div>


                  {/* =================================================
                      SUMMARY
                  ================================================= */}

                  <div
                    className="
                      relative
                      overflow-hidden
                      rounded-3xl
                      border
                      border-white/20
                      bg-white/70
                      backdrop-blur-xl
                      shadow-xl
                      p-6
                    "
                  >

                    <div
                      className="
                        absolute
                        top-0
                        right-0
                        w-40
                        h-40
                        bg-indigo-200
                        rounded-full
                        blur-3xl
                        opacity-30
                      "
                    />


                    <div
                      className="
                        relative
                        flex
                        flex-col
                        sm:flex-row
                        items-start
                        justify-between
                        gap-5
                      "
                    >

                      <div
                        className="
                          space-y-4
                        "
                      >

                        <div>

                          <p
                            className="
                              text-xs
                              font-bold
                              uppercase
                              tracking-[0.25em]
                              text-indigo-500
                              mb-3
                            "
                          >
                            Order Summary
                          </p>


                          <div
                            className="
                              flex
                              items-center
                              gap-2
                            "
                          >

                            <div
                              className="
                                w-11
                                h-11
                                rounded-2xl
                                bg-indigo-100
                                flex
                                items-center
                                justify-center
                              "
                            >

                              <FaShoppingBag
                                className="
                                  text-indigo-600
                                "
                              />

                            </div>


                            <div>

                              <p
                                className="
                                  font-bold
                                  text-slate-800
                                "
                              >

                                {cartItem.length} item
                                {cartItem.length !== 1
                                  ? "s"
                                  : ""}

                              </p>


                              <p
                                className="
                                  text-xs
                                  text-slate-400
                                "
                              >
                                Ready for checkout
                              </p>

                            </div>

                          </div>

                        </div>


                        <div
                          className="
                            flex
                            items-center
                            gap-3
                          "
                        >

                          <div
                            className="
                              w-9
                              h-9
                              rounded-xl
                              bg-slate-100
                              flex
                              items-center
                              justify-center
                            "
                          >

                            <FaEnvelope
                              className="
                                text-slate-500
                                text-sm
                              "
                            />

                          </div>


                          <div>

                            <p
                              className="
                                text-[11px]
                                uppercase
                                tracking-wide
                                text-slate-400
                                font-semibold
                              "
                            >
                              Email
                            </p>


                            <p
                              className="
                                text-sm
                                font-medium
                                text-slate-700
                              "
                            >
                              {address.email}
                            </p>

                          </div>

                        </div>


                        <div
                          className="
                            flex
                            items-start
                            gap-3
                          "
                        >

                          <div
                            className="
                              w-9
                              h-9
                              rounded-xl
                              bg-slate-100
                              flex
                              items-center
                              justify-center
                            "
                          >

                            <FaMapMarkerAlt
                              className="
                                text-slate-500
                                text-sm
                              "
                            />

                          </div>


                          <div>

                            <p
                              className="
                                text-[11px]
                                uppercase
                                tracking-wide
                                text-slate-400
                                font-semibold
                              "
                            >
                              Delivery Address
                            </p>


                            <p
                              className="
                                text-sm
                                font-medium
                                text-slate-700
                                leading-relaxed
                              "
                            >

                              {address.street},{" "}
                              {address.area},{" "}
                              {address.city},{" "}
                              {address.state}{" "}
                              {address.postcode}

                            </p>

                          </div>

                        </div>

                      </div>


                      {/* TOTAL */}

                      <div
                        className="
                          text-left
                          sm:text-right
                        "
                      >

                        <p
                          className="
                            text-xs
                            uppercase
                            tracking-wide
                            text-slate-400
                            font-semibold
                          "
                        >
                          Total Amount
                        </p>


                        <div
                          className="
                            mt-2
                            inline-flex
                            items-center
                            rounded-2xl
                            bg-gradient-to-r
                            from-indigo-600
                            to-violet-600
                            px-5
                            py-3
                            shadow-lg
                          "
                        >

                          <FaRupeeSign
                            className="
                              text-white
                              mr-1
                            "
                            size={14}
                          />


                          <span
                            className="
                              text-2xl
                              font-black
                              text-white
                              tracking-tight
                            "
                          >
                            ₹
                            {Number(
                              finalTotal || 0
                            ).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>


                  {/* =================================================
                      COUPON
                  ================================================= */}

                  <div
                    className="
                      cart-card
                      p-5
                      space-y-3
                    "
                  >

                    <h3
                      className="
                        font-bold
                        text-slate-800
                      "
                    >
                      Apply Coupon
                    </h3>


                    <div
                      className="
                        flex
                        gap-3
                      "
                    >

                      <input
                        value={
                          couponCode
                        }
                        onChange={(e) => {

                          setCouponCode(
                            e.target.value.toUpperCase()
                          );

                          setCouponError("");

                          setCouponSuccess("");

                        }}
                        placeholder="Enter Coupon Code"
                        className={`
                          f-input-bare
                          flex-1

                          ${
                            couponError
                              ? "border-red-500"
                              : couponSuccess
                              ? "border-green-500"
                              : ""
                          }
                        `}
                      />


                      <button
                        onClick={
                          applyCoupon
                        }
                        disabled={
                          couponLoading
                        }
                        className="
                          btn-primary
                          px-6
                          disabled:opacity-50
                        "
                      >

                        {couponLoading
                          ? "Applying..."
                          : "Apply"}

                      </button>

                    </div>


                    {couponError && (

                      <div
                        className="
                          mt-4
                          flex
                          items-start
                          gap-3
                          rounded-2xl
                          border
                          border-red-200
                          bg-red-50
                          px-4
                          py-4
                        "
                      >

                        <div
                          className="
                            text-red-500
                            text-xl
                          "
                        >
                          ❌
                        </div>


                        <div>

                          <h4
                            className="
                              font-semibold
                              text-red-700
                            "
                          >
                            Coupon Not Applied
                          </h4>


                          <p
                            className="
                              text-sm
                              text-red-600
                              mt-1
                            "
                          >
                            {couponError}
                          </p>

                        </div>

                      </div>

                    )}


                    {couponSuccess &&
                      couponDiscount > 0 && (

                      <div
                        className="
                          rounded-xl
                          bg-green-50
                          border
                          border-green-200
                          p-3
                        "
                      >

                        <div
                          className="
                            text-green-700
                            font-semibold
                          "
                        >
                          🎉 {couponSuccess}
                        </div>


                        <div
                          className="
                            text-sm
                            mt-2
                          "
                        >
                          Discount: ₹
                          {Number(
                            couponDiscount
                          ).toFixed(2)}
                        </div>

                      </div>

                    )}

                  </div>


                  {/* =================================================
                      PAYMENT OPTIONS
                  ================================================= */}

                  <div
                    className="
                      space-y-4
                    "
                  >

                    {/* ONLINE */}

                    <button
                      onClick={() =>
                        setPaymentType(
                          "razorpay"
                        )
                      }
                      className={`
                        group
                        relative
                        overflow-hidden
                        w-full
                        rounded-3xl
                        border
                        p-5
                        transition-all
                        duration-300

                        ${
                          paymentType ===
                          "razorpay"

                            ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100"

                            : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md"
                        }
                      `}
                    >

                      <div
                        className="
                          flex
                          items-center
                          justify-between
                        "
                      >

                        <div
                          className="
                            flex
                            items-center
                            gap-4
                          "
                        >

                          <div
                            className="
                              w-14
                              h-14
                              rounded-2xl
                              bg-gradient-to-br
                              from-indigo-500
                              to-violet-600
                              flex
                              items-center
                              justify-center
                              shadow-md
                            "
                          >

                            <FaCreditCard
                              className="
                                text-white
                                text-lg
                              "
                            />

                          </div>


                          <div
                            className="
                              text-left
                            "
                          >

                            <div
                              className="
                                flex
                                items-center
                                gap-2
                              "
                            >

                              <p
                                className="
                                  font-bold
                                  text-slate-800
                                  text-base
                                "
                              >
                                Pay Online
                              </p>


                              <span
                                className="
                                  px-2
                                  py-1
                                  rounded-full
                                  bg-green-100
                                  text-green-600
                                  text-[10px]
                                  font-bold
                                  uppercase
                                  tracking-wide
                                "
                              >
                                Recommended
                              </span>

                            </div>


                            <p
                              className="
                                text-sm
                                text-slate-500
                                mt-1
                              "
                            >
                              UPI, Cards, Wallets & Netbanking
                            </p>


                            <div
                              className="
                                flex
                                gap-2
                                mt-3
                              "
                            >

                              <span
                                className="
                                  px-2
                                  py-1
                                  rounded-full
                                  bg-indigo-100
                                  text-indigo-600
                                  text-[11px]
                                  font-semibold
                                "
                              >
                                Secure
                              </span>


                              <span
                                className="
                                  px-2
                                  py-1
                                  rounded-full
                                  bg-violet-100
                                  text-violet-600
                                  text-[11px]
                                  font-semibold
                                "
                              >
                                Instant
                              </span>


                              <span
                                className="
                                  px-2
                                  py-1
                                  rounded-full
                                  bg-sky-100
                                  text-sky-600
                                  text-[11px]
                                  font-semibold
                                "
                              >
                                Razorpay
                              </span>

                            </div>

                          </div>

                        </div>


                        <div
                          className={`
                            w-6
                            h-6
                            rounded-full
                            border-2
                            flex
                            items-center
                            justify-center

                            ${
                              paymentType ===
                              "razorpay"

                                ? "border-indigo-600"

                                : "border-slate-300"
                            }
                          `}
                        >

                          {paymentType ===
                            "razorpay" && (

                            <div
                              className="
                                w-3
                                h-3
                                rounded-full
                                bg-indigo-600
                              "
                            />

                          )}

                        </div>

                      </div>

                    </button>


                    {/* COD */}

                    <button
                      onClick={() =>
                        setPaymentType(
                          "cod"
                        )
                      }
                      className={`
                        group
                        relative
                        overflow-hidden
                        w-full
                        rounded-3xl
                        border
                        p-5
                        transition-all
                        duration-300

                        ${
                          paymentType ===
                          "cod"

                            ? "border-amber-400 bg-amber-50 shadow-lg shadow-amber-100"

                            : "border-slate-200 bg-white hover:border-amber-200 hover:shadow-md"
                        }
                      `}
                    >

                      <div
                        className="
                          flex
                          items-center
                          justify-between
                        "
                      >

                        <div
                          className="
                            flex
                            items-center
                            gap-4
                          "
                        >

                          <div
                            className="
                              w-14
                              h-14
                              rounded-2xl
                              bg-gradient-to-br
                              from-amber-400
                              to-orange-500
                              flex
                              items-center
                              justify-center
                              shadow-md
                            "
                          >

                            <FaWallet
                              className="
                                text-white
                                text-lg
                              "
                            />

                          </div>


                          <div
                            className="
                              text-left
                            "
                          >

                            <p
                              className="
                                font-bold
                                text-slate-800
                                text-base
                              "
                            >
                              Cash on Delivery
                            </p>


                            <p
                              className="
                                text-sm
                                text-slate-500
                                mt-1
                              "
                            >
                              Pay after receiving your order
                            </p>


                            <div
                              className="
                                mt-3
                              "
                            >

                              <span
                                className="
                                  px-2
                                  py-1
                                  rounded-full
                                  bg-amber-100
                                  text-amber-700
                                  text-[11px]
                                  font-semibold
                                "
                              >
                                3–5 Business Days
                              </span>

                            </div>

                          </div>

                        </div>


                        <div
                          className={`
                            w-6
                            h-6
                            rounded-full
                            border-2
                            flex
                            items-center
                            justify-center

                            ${
                              paymentType ===
                              "cod"

                                ? "border-amber-500"

                                : "border-slate-300"
                            }
                          `}
                        >

                          {paymentType ===
                            "cod" && (

                            <div
                              className="
                                w-3
                                h-3
                                rounded-full
                                bg-amber-500
                              "
                            />

                          )}

                        </div>

                      </div>

                    </button>

                  </div>


                  {/* =================================================
                      PAYMENT INFO
                  ================================================= */}

                  {paymentType && (

                    <div
                      className={`
                        rounded-3xl
                        p-5
                        border

                        ${
                          paymentType ===
                          "razorpay"

                            ? "bg-indigo-50 border-indigo-100"

                            : "bg-amber-50 border-amber-100"
                        }
                      `}
                    >

                      <p
                        className={`
                          font-bold
                          text-sm
                          mb-4

                          ${
                            paymentType ===
                            "razorpay"

                              ? "text-indigo-700"

                              : "text-amber-700"
                          }
                        `}
                      >

                        {paymentType ===
                        "razorpay"

                          ? "Secure Payment Instructions"

                          : "Cash on Delivery Details"}

                      </p>


                      <div
                        className="
                          space-y-3
                        "
                      >

                        {(
                          paymentType ===
                          "razorpay"

                            ? [

                                "Choose UPI, Card or Netbanking",

                                "Complete payment in Razorpay popup",

                                "Do not close payment window",

                                `Confirmation sent to ${user?.email || ""}`,

                              ]

                            : [

                                "Pay after delivery arrives",

                                "Delivery within 3–5 business days",

                                "Keep exact amount ready",

                                `Confirmation sent to ${user?.email || ""}`,

                              ]

                        ).map(
                          (text) => (

                            <div
                              key={text}
                              className="
                                flex
                                items-center
                                gap-3
                              "
                            >

                              <div
                                className={`
                                  w-6
                                  h-6
                                  rounded-full
                                  flex
                                  items-center
                                  justify-center

                                  ${
                                    paymentType ===
                                    "razorpay"

                                      ? "bg-indigo-100"

                                      : "bg-amber-100"
                                  }
                                `}
                              >

                                <FaCheckCircle
                                  size={11}
                                  className={
                                    paymentType ===
                                    "razorpay"

                                      ? "text-indigo-600"

                                      : "text-amber-600"
                                  }
                                />

                              </div>


                              <p
                                className="
                                  text-sm
                                  text-slate-700
                                  font-medium
                                "
                              >
                                {text}
                              </p>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}


                  {/* FOOTER */}

                  <div
                    className="
                      flex
                      items-center
                      justify-center
                      gap-2
                      text-sm
                      text-slate-400
                    "
                  >

                    <FaShieldAlt
                      className="
                        text-green-500
                      "
                    />

                    Secure checkout powered by Razorpay

                  </div>


                  {/* =================================================
                      ACTION BUTTONS
                  ================================================= */}

                  <div
                    className="
                      payment-action-dock
                    "
                  >
                    <div className="payment-action-inner">

                    <button
                      onClick={() =>
                        setStep(2)
                      }
                      className="
                        flex-1
                        h-14
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        hover:bg-slate-50
                        transition-all
                        font-semibold
                        text-slate-700
                        flex
                        items-center
                        justify-center
                        gap-2
                      "
                    >

                      <IoArrowBack />

                      Back

                    </button>


                    <button
                      onClick={() => {

                        if (!paymentType) {

                          toast.warning(
                            "Please select a payment method"
                          );

                          return;
                        }


                        if (
                          paymentType ===
                          "razorpay"
                        ) {

                          onInstrOpen();

                        } else {

                          onCodConfirmOpen();

                        }

                      }}
                      disabled={
                        !paymentType
                      }
                      className="
                        flex-[2]
                        h-14
                        rounded-2xl
                        bg-gradient-to-r
                        from-indigo-600
                        to-violet-600
                        hover:scale-[1.01]
                        active:scale-[0.99]
                        transition-all
                        text-white
                        font-bold
                        shadow-xl
                        shadow-indigo-200
                        flex
                        items-center
                        justify-center
                        gap-2
                        disabled:opacity-50
                      "
                    >

                      {paymentType ===
                      "cod"

                        ? "Confirm Order"

                        : "Proceed to Pay"}


                      <IoArrowForward />

                    </button>

                    </div>
                  </div>

                </div>

              )}

            </>

          )}

        </div>



 
        {/* =======================================================
            REACT NATIVE STYLE ADDRESS SELECTOR
            List -> select / add / edit, with animated sheet + shine.
        ======================================================= */}
      {/* =========================================================
    MODERN DELIVERY ADDRESS MODAL
========================================================= */}

<style>{`
  @keyframes addressModalShine {
    0% {
      transform: translateX(-180%) skewX(-18deg);
      opacity: 0;
    }

    15% {
      opacity: 0;
    }

    35% {
      opacity: 0.75;
    }

    55% {
      opacity: 0;
    }

    100% {
      transform: translateX(220%) skewX(-18deg);
      opacity: 0;
    }
  }

  @keyframes addressModalGlow {
    0%,
    100% {
      opacity: 0.45;
      transform: scale(0.96);
    }

    50% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes addressSkeletonShine {
    0% {
      transform: translateX(-120%);
    }

    100% {
      transform: translateX(220%);
    }
  }

  @keyframes addressPinPulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.12);
    }

    50% {
      box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.04);
    }
  }

  @keyframes addressSuccessPulse {
    0%,
    100% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.04);
    }
  }

  .address-modal-shine-animation {
    animation: addressModalShine 4.5s ease-in-out infinite;
  }

  .address-modal-glow {
    animation: addressModalGlow 2.8s ease-in-out infinite;
  }

  .address-skeleton-shine {
    animation: addressSkeletonShine 1.6s ease-in-out infinite;
  }

  .address-pin-pulse {
    animation: addressPinPulse 2s ease-in-out infinite;
  }

  .address-success-pulse {
    animation: addressSuccessPulse 2s ease-in-out infinite;
  }

  /* =========================================================
     MODERN ADDRESS FORM CONTROLS
     These classes were missing from the previous version.
  ========================================================= */
  .address-modern-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 7px;
    padding-left: 2px;
    color: #334155;
    font-size: 11px;
    line-height: 1.25;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .address-modern-label em {
    display: inline-flex;
    align-items: center;
    min-height: 17px;
    padding: 2px 6px;
    border: 1px solid #e2e8f0;
    border-radius: 9999px;
    background: #f8fafc;
    color: #94a3b8;
    font-size: 8px;
    line-height: 1;
    font-style: normal;
    font-weight: 700;
    letter-spacing: .02em;
  }

  .address-modern-input {
    position: relative;
    display: block;
    width: 100%;
    min-height: 46px;
    box-sizing: border-box;
    border: 1px solid #dbe3ee;
    border-radius: 14px;
    outline: none;
    background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
    padding: 11px 13px;
    color: #0f172a;
    font-family: inherit;
    font-size: 12px;
    line-height: 1.35;
    font-weight: 500;
    letter-spacing: -0.005em;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255,255,255,.9);
    transition: border-color .2s ease, box-shadow .2s ease, background .2s ease, transform .2s ease;
  }

  .address-modern-input::placeholder {
    color: #a8b3c2;
    opacity: 1;
    font-weight: 400;
  }

  .address-modern-input:hover {
    border-color: #bfccdc;
    background: #ffffff;
  }

  .address-modern-input:focus {
    border-color: #3b82f6;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(59,130,246,.10), 0 8px 24px rgba(37,99,235,.08), inset 0 1px 0 rgba(255,255,255,.95);
    transform: translateY(-1px);
  }

  .address-modern-input:disabled {
    cursor: not-allowed;
    background: #f8fafc;
    color: #94a3b8;
    opacity: .75;
  }

  .address-modern-input:-webkit-autofill {
    -webkit-text-fill-color: #0f172a;
    box-shadow: 0 0 0 1000px #ffffff inset, 0 0 0 3px rgba(59,130,246,.08);
    transition: background-color 9999s ease-out 0s;
  }

  textarea.address-modern-input {
    min-height: 88px;
    line-height: 1.5;
  }

  .address-modern-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 32px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: rgba(255,255,255,.92);
    padding: 6px 10px;
    color: #475569;
    font-size: 9px;
    line-height: 1;
    font-weight: 700;
    box-shadow: 0 1px 2px rgba(15,23,42,.03);
    transition: all .2s ease;
  }

  .address-modern-action:hover {
    border-color: #bfdbfe;
    background: #eff6ff;
    color: #2563eb;
    transform: translateY(-1px);
  }

  .address-modern-action:active {
    transform: scale(.97);
  }

  .address-modern-action-danger:hover {
    border-color: #fecaca;
    background: #fef2f2;
    color: #dc2626;
  }

  @media (min-width: 640px) {
    .address-modern-label {
      font-size: 12px;
      margin-bottom: 8px;
    }

    .address-modern-label em {
      font-size: 8px;
    }

    .address-modern-input {
      min-height: 48px;
      border-radius: 15px;
      padding: 12px 14px;
      font-size: 13px;
    }

    textarea.address-modern-input {
      min-height: 94px;
    }

    .address-modern-action {
      min-height: 34px;
      padding: 7px 11px;
      font-size: 10px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .address-modal-shine-animation,
    .address-modal-glow,
    .address-skeleton-shine,
    .address-pin-pulse,
    .address-success-pulse {
      animation: none;
    }
  }
`}</style>

<Modal
  isOpen={addressSelectorOpen}
  onClose={() => {
    if (!addressSaving) {
      setAddressSelectorOpen(false);
      setShowAddressForm(false);
      setEditingAddressId(null);
    }
  }}
  placement="center"
  backdrop="blur"
  hideCloseButton
  className="
    z-[9999]
    w-[calc(100%-16px)]
    max-w-[760px]
    sm:w-[calc(100%-32px)]
  "
  scrollBehavior="inside"
>
  <ModalContent
    className="
      relative
      max-h-[calc(100dvh-16px)]
      overflow-hidden
      rounded-[24px]
      border border-white/80
      bg-white
      shadow-[0_24px_80px_rgba(15,23,42,0.20)]
      sm:max-h-[calc(100dvh-32px)]
      sm:rounded-[28px]
    "
  >
    {() => (
      <>
        {/* ===================================================
            BACKGROUND DECORATION
        ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20
            h-48
            w-48
            rounded-full
            bg-blue-100/40
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-24
            -left-20
            h-52
            w-52
            rounded-full
            bg-indigo-100/30
            blur-3xl
          "
        />

        {/* ===================================================
            ANIMATED SHINE
        ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-y-0
            -left-[45%]
            z-20
            w-[25%]
            skew-x-[-18deg]
            bg-gradient-to-r
            from-transparent
            via-white/60
            to-transparent
            address-modal-shine-animation
          "
        />

        {/* ===================================================
            HEADER
        ==================================================== */}

        <ModalHeader
          className="
            relative
            z-30
            border-b
            border-slate-100
            bg-white/90
            px-4
            py-3.5
            backdrop-blur-xl
            sm:px-5
            sm:py-4
            md:px-6
          "
        >
          <div className="flex w-full items-center justify-between gap-3">

            {/* Header left */}
            <div className="flex min-w-0 items-center gap-3">

              {/* Animated icon */}
              <div
                className="
                  relative
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-2xl
                  border
                  border-blue-100
                  bg-gradient-to-br
                  from-blue-50
                  to-indigo-50
                  text-blue-600
                  shadow-sm
                  sm:h-11
                  sm:w-11
                "
              >
                <span
                  className="
                    pointer-events-none
                    absolute
                    inset-y-0
                    -left-full
                    w-1/2
                    skew-x-[-18deg]
                    bg-gradient-to-r
                    from-transparent
                    via-white
                    to-transparent
                    transition-all
                    duration-700
                    hover:left-[130%]
                  "
                />

                {showAddressForm ? (
                  <FaHome
                    size={16}
                    className="relative z-10 sm:hidden"
                  />
                ) : (
                  <FaMapMarkerAlt
                    size={16}
                    className="relative z-10 sm:hidden"
                  />
                )}

                {showAddressForm ? (
                  <FaHome
                    size={18}
                    className="relative z-10 hidden sm:block"
                  />
                ) : (
                  <FaMapMarkerAlt
                    size={18}
                    className="relative z-10 hidden sm:block"
                  />
                )}
              </div>

              {/* Header text */}
              <div className="min-w-0">
                <h3
                  className="
                    truncate
                    text-[15px]
                    font-bold
                    leading-5
                    tracking-[-0.015em]
                    text-slate-900
                    sm:text-[17px]
                    md:text-lg
                  "
                >
                  {showAddressForm
                    ? editingAddressId
                      ? "Edit delivery address"
                      : "Add delivery address"
                    : "Choose delivery address"}
                </h3>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-[9px]
                    leading-4
                    text-slate-500
                    sm:text-[10px]
                    md:text-xs
                  "
                >
                  {showAddressForm
                    ? "Save this address and use it for your order."
                    : savedAddresses.length
                      ? `${savedAddresses.length} saved address${
                          savedAddresses.length > 1 ? "es" : ""
                        }`
                      : "Select an address or add a new one"}
                </p>
              </div>
            </div>

            {/* Add button */}
            {!showAddressForm && (
              <button
                type="button"
                onClick={startNewAddress}
                className="
                  group
                  relative
                  flex
                  h-9
                  shrink-0
                  items-center
                  justify-center
                  gap-1.5
                  overflow-hidden
                  rounded-xl
                  border
                  border-blue-100
                  bg-blue-50
                  px-2.5
                  text-[9px]
                  font-bold
                  text-blue-700
                  shadow-sm
                  transition-all
                  duration-200
                  hover:border-blue-200
                  hover:bg-blue-100
                  active:scale-[0.97]
                  sm:h-10
                  sm:px-3
                  sm:text-[10px]
                  md:text-xs
                "
              >
                <span
                  className="
                    pointer-events-none
                    absolute
                    inset-y-0
                    -left-1/2
                    w-1/2
                    skew-x-[-18deg]
                    bg-gradient-to-r
                    from-transparent
                    via-white/70
                    to-transparent
                    transition-all
                    duration-700
                    group-hover:left-[130%]
                  "
                />

                <FiPlus
                  size={15}
                  strokeWidth={2.5}
                  className="relative z-10"
                />

                <span className="relative z-10">
                  Add address
                </span>
              </button>
            )}
          </div>
        </ModalHeader>

        {/* ===================================================
            BODY
        ==================================================== */}

        <ModalBody
          className="
            relative
            z-10
            max-h-[calc(100dvh-190px)]
            overflow-y-auto
            bg-slate-50/50
            px-3
            py-3
            scrollbar-thin
            sm:px-4
            sm:py-4
            md:px-5
            md:py-5
          "
        >
          {showAddressForm ? (
            /* =================================================
               ADDRESS FORM
            ================================================== */
            <div className="space-y-4">

              {/* Form intro */}
              <div
                className="
                  relative
                  overflow-hidden
                  rounded-2xl
                  border
                  border-blue-100
                  bg-gradient-to-br
                  from-blue-50/80
                  via-white
                  to-indigo-50/50
                  p-3
                  sm:p-4
                "
              >
                <span
                  className="
                    pointer-events-none
                    absolute
                    -right-10
                    -top-10
                    h-24
                    w-24
                    rounded-full
                    bg-blue-100/50
                    blur-2xl
                  "
                />

                <div className="relative z-10 flex items-center gap-2.5">
                  <div
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-white
                      text-blue-600
                      shadow-sm
                    "
                  >
                    <FaMapMarkerAlt size={13} />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        text-[10px]
                        font-bold
                        text-slate-800
                        sm:text-xs
                      "
                    >
                      {editingAddressId
                        ? "Update your delivery details"
                        : "Where should we deliver?"}
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[8px]
                        leading-4
                        text-slate-500
                        sm:text-[9px]
                        md:text-[10px]
                      "
                    >
                      Enter accurate details so your order reaches you safely.
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  ADDRESS TYPE
              ================================================== */}

              <div>
                <p
                  className="
                    mb-2
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.1em]
                    text-slate-400
                    sm:text-[10px]
                  "
                >
                  Address type
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {["Home", "Work", "Other"].map((label) => {
                    const active = addressLabel === label;

                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setAddressLabel(label)}
                        className={`
                          group relative flex items-center justify-center
                          gap-1.5 overflow-hidden rounded-xl border
                          px-2 py-2.5 text-[9px] font-bold
                          transition-all duration-200
                          active:scale-[0.98]
                          sm:gap-2 sm:py-3 sm:text-[10px]
                          ${
                            active
                              ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                          }
                        `}
                      >
                        {active && (
                          <span
                            className="
                              pointer-events-none
                              absolute
                              inset-y-0
                              -left-1/2
                              w-1/2
                              skew-x-[-18deg]
                              bg-gradient-to-r
                              from-transparent
                              via-white/70
                              to-transparent
                              address-modal-shine-animation
                            "
                          />
                        )}

                        <span className="relative z-10">
                          {label === "Home" ? (
                            <FaHome size={11} />
                          ) : label === "Work" ? (
                            <FaThLarge size={11} />
                          ) : (
                            <FaMapMarkerAlt size={11} />
                          )}
                        </span>

                        <span className="relative z-10">
                          {label}
                        </span>

                        {active && (
                          <FaCheckCircle
                            size={10}
                            className="
                              relative
                              z-10
                              text-blue-500
                            "
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* =================================================
                  FORM GRID
              ================================================== */}

              <div
                className="
                  grid
                  grid-cols-1
                  gap-3
                  sm:grid-cols-2
                  sm:gap-3.5
                "
              >

                {/* Full name */}
                <label className="group block">
                  <span className="address-modern-label">
                    Full name
                  </span>

                  <input
                    value={address.name || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter full name"
                    autoComplete="name"
                    className="address-modern-input"
                  />
                </label>

                {/* Phone */}
                <label className="group block">
                  <span className="address-modern-label">
                    Phone number
                  </span>

                  <input
                    value={address.phone || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        phone: e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10),
                      }))
                    }
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    autoComplete="tel"
                    className="address-modern-input"
                  />
                </label>

                {/* Alternate phone */}
                <label className="group block">
                  <span className="address-modern-label">
                    Alternate phone
                    <em>Optional</em>
                  </span>

                  <input
                    value={address.alternatePhone || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        alternatePhone: e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10),
                      }))
                    }
                    placeholder="Alternate number"
                    inputMode="numeric"
                    className="address-modern-input"
                  />
                </label>

                {/* House */}
                <label className="group block">
                  <span className="address-modern-label">
                    House / flat no.
                    <em>Optional</em>
                  </span>

                  <input
                    value={address.houseNumber || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        houseNumber: e.target.value,
                      }))
                    }
                    placeholder="House / flat number"
                    className="address-modern-input"
                  />
                </label>

                {/* Building */}
                <label className="group block">
                  <span className="address-modern-label">
                    Building / apartment
                    <em>Optional</em>
                  </span>

                  <input
                    value={address.buildingName || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        buildingName: e.target.value,
                      }))
                    }
                    placeholder="Building / apartment name"
                    className="address-modern-input"
                  />
                </label>

                {/* Floor */}
                <label className="group block">
                  <span className="address-modern-label">
                    Floor
                    <em>Optional</em>
                  </span>

                  <input
                    value={address.floor || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        floor: e.target.value,
                      }))
                    }
                    placeholder="Floor"
                    className="address-modern-input"
                  />
                </label>

                {/* Street */}
                <label className="group block sm:col-span-2">
                  <span className="address-modern-label">
                    Street / road
                    <em>Optional</em>
                  </span>

                  <input
                    value={address.street || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        street: e.target.value,
                        addressLine1:
                          e.target.value || prev.addressLine1,
                      }))
                    }
                    placeholder="Street / road name"
                    className="address-modern-input"
                  />
                </label>

                {/* Address line 1 */}
                <label className="group block sm:col-span-2">
                  <span className="address-modern-label">
                    Address line 1
                  </span>

                  <input
                    value={address.addressLine1 || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        addressLine1: e.target.value,
                      }))
                    }
                    placeholder="Main address / house details"
                    autoComplete="street-address"
                    className="address-modern-input"
                  />
                </label>

                {/* Address line 2 */}
                <label className="group block sm:col-span-2">
                  <span className="address-modern-label">
                    Address line 2
                    <em>Optional</em>
                  </span>

                  <input
                    value={address.addressLine2 || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        addressLine2: e.target.value,
                      }))
                    }
                    placeholder="Apartment, floor, additional details"
                    className="address-modern-input"
                  />
                </label>

                {/* Area */}
                <label className="group block">
                  <span className="address-modern-label">
                    Area / locality
                  </span>

                  <input
                    value={address.area || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        area: e.target.value,
                      }))
                    }
                    placeholder="Area / locality"
                    className="address-modern-input"
                  />
                </label>

                {/* Landmark */}
                <label className="group block">
                  <span className="address-modern-label">
                    Landmark
                    <em>Optional</em>
                  </span>

                  <input
                    value={address.landmark || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        landmark: e.target.value,
                      }))
                    }
                    placeholder="Nearby landmark"
                    className="address-modern-input"
                  />
                </label>

                {/* Village */}
                <label className="group block">
                  <span className="address-modern-label">
                    Village
                    <em>Optional</em>
                  </span>

                  <input
                    value={address.village || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        village: e.target.value,
                      }))
                    }
                    placeholder="Village"
                    className="address-modern-input"
                  />
                </label>

                {/* Post office */}
                <label className="group block">
                  <span className="address-modern-label">
                    Post office
                    <em>Auto</em>
                  </span>

                  <input
                    value={address.postOffice || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        postOffice: e.target.value,
                      }))
                    }
                    placeholder="Post office"
                    className="address-modern-input"
                  />
                </label>

                {/* Block */}
                <label className="group block">
                  <span className="address-modern-label">
                    Block
                    <em>Optional</em>
                  </span>

                  <input
                    value={address.block || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        block: e.target.value,
                      }))
                    }
                    placeholder="Block"
                    className="address-modern-input"
                  />
                </label>

                {/* City */}
                <label className="group block">
                  <span className="address-modern-label">
                    City / town
                  </span>

                  <input
                    value={address.city || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    placeholder="City / town"
                    className="address-modern-input"
                  />
                </label>

                {/* District */}
                <label className="group block">
                  <span className="address-modern-label">
                    District
                  </span>

                  <input
                    value={address.district || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        district: e.target.value,
                      }))
                    }
                    placeholder="District"
                    className="address-modern-input"
                  />
                </label>

                {/* State */}
                <label className="group block">
                  <span className="address-modern-label">
                    State
                  </span>

                  <input
                    value={address.state || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }))
                    }
                    placeholder="State"
                    className="address-modern-input"
                  />
                </label>

                {/* PIN */}
                <label className="group block">
                  <span className="address-modern-label">
                    PIN code
                  </span>

                  <div className="relative">
                    <input
                      value={address.postcode || ""}
                      onChange={handlePostalCodeChange}
                      placeholder="6-digit PIN"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="postal-code"
                      className="
                        address-modern-input
                        pr-11
                      "
                    />

                    {postalLookupLoading && (
                      <span
                        className="
                          absolute
                          right-3
                          top-1/2
                          flex
                          h-5
                          w-5
                          -translate-y-1/2
                          items-center
                          justify-center
                          rounded-full
                          bg-blue-50
                          address-pin-pulse
                        "
                        aria-label="Looking up PIN"
                      >
                        <span
                          className="
                            h-3
                            w-3
                            animate-spin
                            rounded-full
                            border-2
                            border-blue-200
                            border-t-blue-600
                          "
                        />
                      </span>
                    )}

                    {!postalLookupLoading &&
                      address.postcode?.length === 6 &&
                      (address.city ||
                        address.district ||
                        address.state) && (
                        <span
                          className="
                            absolute
                            right-3
                            top-1/2
                            flex
                            h-5
                            w-5
                            -translate-y-1/2
                            items-center
                            justify-center
                            rounded-full
                            bg-emerald-50
                            address-success-pulse
                          "
                        >
                          <FaCheckCircle
                            size={12}
                            className="text-emerald-500"
                          />
                        </span>
                      )}
                  </div>
                </label>

                {/* Delivery instructions */}
                <label className="group block sm:col-span-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="address-modern-label mb-0">
                      Delivery instructions
                      <em>Optional</em>
                    </span>

                    <span
                      className="
                        text-[8px]
                        font-medium
                        text-slate-400
                        sm:text-[9px]
                      "
                    >
                      {String(
                        address.deliveryInstructions || ""
                      ).length}
                      /500
                    </span>
                  </div>

                  <textarea
                    value={address.deliveryInstructions || ""}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        deliveryInstructions:
                          e.target.value.slice(0, 500),
                      }))
                    }
                    placeholder="Example: Call before delivery, leave at security, etc."
                    maxLength={500}
                    rows={3}
                    className="
                      address-modern-input
                      min-h-[82px]
                      resize-none
                      py-3
                    "
                  />
                </label>
              </div>

              {/* PIN information */}
              {address.postcode?.length === 6 && (
                <div
                  className="
                    flex
                    items-start
                    gap-2.5
                    rounded-2xl
                    border
                    border-blue-100
                    bg-blue-50/60
                    px-3
                    py-2.5
                    sm:items-center
                    sm:px-3.5
                    sm:py-3
                  "
                >
                  <div
                    className="
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-white
                      text-blue-600
                      shadow-sm
                    "
                  >
                    <MdMyLocation size={14} />
                  </div>

                  <p
                    className="
                      text-[9px]
                      leading-4
                      text-blue-700
                      sm:text-[10px]
                      md:text-[11px]
                    "
                  >
                    {postalLookupLoading
                      ? "Finding your PIN location..."
                      : address.city ||
                          address.district ||
                          address.state
                        ? "PIN details found. You can adjust the address if needed."
                        : "PIN entered. We'll check delivery availability before checkout."}
                  </p>
                </div>
              )}

              {/* =================================================
                  FORM ACTIONS
              ================================================== */}

              <div
                className="
                  sticky
                  bottom-0
                  z-20
                  -mx-3
                  flex
                  gap-2
                  border-t
                  border-slate-100
                  bg-white/95
                  px-3
                  pb-[calc(4px+env(safe-area-inset-bottom))]
                  pt-3
                  backdrop-blur-xl
                  sm:-mx-4
                  sm:px-4
                  md:-mx-5
                  md:px-5
                "
              >
                <button
                  type="button"
                  disabled={addressSaving}
                  onClick={() => {
                    setShowAddressForm(false);
                    setEditingAddressId(null);
                  }}
                  className="
                    group
                    flex
                    h-11
                    flex-1
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-3
                    text-[10px]
                    font-bold
                    text-slate-600
                    shadow-sm
                    transition-all
                    hover:bg-slate-50
                    active:scale-[0.98]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    sm:h-12
                    sm:text-xs
                  "
                >
                  Back to addresses
                </button>

                <button
                  type="button"
                  disabled={addressSaving}
                  onClick={async () => {
                    const saved = await saveCurrentAddress();

                    if (saved) {
                      setShowAddressForm(false);
                    }
                  }}
                  className="
                    group
                    relative
                    flex
                    h-11
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    overflow-hidden
                    rounded-xl
                    bg-gradient-to-r
                    from-blue-600
                    to-indigo-600
                    px-3
                    text-[10px]
                    font-bold
                    text-white
                    shadow-[0_7px_20px_rgba(37,99,235,0.25)]
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                    hover:shadow-[0_10px_25px_rgba(37,99,235,0.32)]
                    active:scale-[0.98]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    sm:h-12
                    sm:text-xs
                  "
                >
                  {/* Shine */}
                  <span
                    className="
                      pointer-events-none
                      absolute
                      inset-y-0
                      -left-1/2
                      w-1/3
                      skew-x-[-18deg]
                      bg-gradient-to-r
                      from-transparent
                      via-white/35
                      to-transparent
                      address-modal-shine-animation
                    "
                  />

                  {addressSaving ? (
                    <>
                      <span
                        className="
                          relative
                          z-10
                          h-3.5
                          w-3.5
                          animate-spin
                          rounded-full
                          border-2
                          border-white/40
                          border-t-white
                        "
                      />

                      <span className="relative z-10">
                        Saving...
                      </span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle
                        size={14}
                        className="relative z-10"
                      />

                      <span className="relative z-10">
                        {editingAddressId
                          ? "Update & Select"
                          : "Save & Select"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* =================================================
               SAVED ADDRESS LIST
            ================================================== */
            <div className="space-y-3">

              {addressLoading ? (
                /* =============================================
                   MODERN SKELETON
                ============================================== */
                <div className="space-y-2.5">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="
                        relative
                        overflow-hidden
                        rounded-2xl
                        border
                        border-slate-100
                        bg-white
                        p-3.5
                        shadow-sm
                        sm:p-4
                      "
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="
                            h-9
                            w-9
                            shrink-0
                            rounded-xl
                            bg-slate-200
                            sm:h-10
                            sm:w-10
                          "
                        />

                        <div className="min-w-0 flex-1 space-y-2.5">
                          <div className="h-3 w-24 rounded-full bg-slate-200" />

                          <div className="h-2.5 w-full rounded-full bg-slate-100" />

                          <div className="h-2.5 w-4/5 rounded-full bg-slate-100" />

                          <div className="h-2.5 w-2/5 rounded-full bg-slate-100" />
                        </div>

                        <div
                          className="
                            h-5
                            w-5
                            shrink-0
                            rounded-full
                            bg-slate-200
                          "
                        />
                      </div>

                      {/* Skeleton shine */}
                      <span
                        className="
                          pointer-events-none
                          absolute
                          inset-y-0
                          -left-1/2
                          w-1/3
                          skew-x-[-18deg]
                          bg-gradient-to-r
                          from-transparent
                          via-white/70
                          to-transparent
                          address-skeleton-shine
                        "
                      />
                    </div>
                  ))}
                </div>
              ) : savedAddresses.length ? (
                /* =============================================
                   ADDRESS CARDS
                ============================================== */
                <div className="space-y-2.5">
                  {savedAddresses.map((item) => {
                    const saved = normalizeSavedAddress(item);

                    const selected =
                      String(saved._id) ===
                      String(selectedAddressId);

                    return (
                      <div
                        key={saved._id}
                        className={`
                          group/address
                          relative
                          overflow-hidden
                          rounded-2xl
                          border
                          bg-white
                          shadow-sm
                          transition-all
                          duration-300
                          ${
                            selected
                              ? "border-blue-300 bg-blue-50/40 shadow-[0_5px_20px_rgba(37,99,235,0.10)]"
                              : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                          }
                        `}
                      >
                        {/* Selected glow */}
                        {selected && (
                          <div
                            className="
                              pointer-events-none
                              absolute
                              inset-0
                              bg-gradient-to-r
                              from-blue-50/70
                              via-transparent
                              to-indigo-50/40
                            "
                          />
                        )}

                        {/* Card shine */}
                        <span
                          className="
                            pointer-events-none
                            absolute
                            inset-y-0
                            -left-1/2
                            z-10
                            w-1/3
                            skew-x-[-18deg]
                            bg-gradient-to-r
                            from-transparent
                            via-white/60
                            to-transparent
                            opacity-0
                            transition-opacity
                            duration-300
                            group-hover/address:opacity-100
                            address-modal-shine-animation
                          "
                        />

                        {/* Main address */}
                        <button
                          type="button"
                          className="
                            relative
                            z-20
                            flex
                            w-full
                            items-start
                            gap-3
                            p-3.5
                            text-left
                            sm:p-4
                          "
                          onClick={() =>
                            handleSelectAddressFromModal(saved)
                          }
                        >
                          {/* Radio */}
                          <span
                            className={`
                              mt-0.5
                              flex
                              h-5
                              w-5
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              border-2
                              transition-all
                              ${
                                selected
                                  ? "border-blue-600 bg-blue-600"
                                  : "border-slate-300 bg-white"
                              }
                            `}
                          >
                            {selected && (
                              <span
                                className="
                                  h-2
                                  w-2
                                  rounded-full
                                  bg-white
                                "
                              />
                            )}
                          </span>

                          {/* Address content */}
                          <span className="min-w-0 flex-1">

                            {/* Top row */}
                            <span
                              className="
                                flex
                                flex-wrap
                                items-center
                                gap-1.5
                              "
                            >
                              <strong
                                className="
                                  text-[11px]
                                  font-bold
                                  text-slate-900
                                  sm:text-xs
                                  md:text-sm
                                "
                              >
                                {saved.label || "Address"}
                              </strong>

                              {saved.isDefault && (
                                <span
                                  className="
                                    rounded-full
                                    border
                                    border-emerald-100
                                    bg-emerald-50
                                    px-1.5
                                    py-0.5
                                    text-[7px]
                                    font-bold
                                    text-emerald-700
                                    sm:px-2
                                    sm:text-[8px]
                                  "
                                >
                                  Default
                                </span>
                              )}

                              {selected && (
                                <span
                                  className="
                                    rounded-full
                                    border
                                    border-blue-100
                                    bg-blue-50
                                    px-1.5
                                    py-0.5
                                    text-[7px]
                                    font-bold
                                    text-blue-700
                                    sm:px-2
                                    sm:text-[8px]
                                  "
                                >
                                  Selected
                                </span>
                              )}
                            </span>

                            {/* Name + phone */}
                            <span
                              className="
                                mt-1.5
                                flex
                                flex-wrap
                                items-center
                                gap-x-2
                                gap-y-1
                                text-[9px]
                                font-medium
                                text-slate-500
                                sm:text-[10px]
                              "
                            >
                              <span className="inline-flex items-center gap-1">
                                <FaUser
                                  size={9}
                                  className="text-blue-500"
                                />

                                {saved.fullName || "Customer"}
                              </span>

                              <span className="text-slate-300">
                                •
                              </span>

                              <span>
                                +91 {saved.phone || ""}
                              </span>
                            </span>

                            {/* Address */}
                            <span
                              className="
                                mt-2
                                block
                                text-[9px]
                                leading-[1.65]
                                text-slate-600
                                sm:text-[10px]
                                sm:leading-5
                                md:text-[11px]
                              "
                            >
                              {[
                                saved.houseNumber,
                                saved.buildingName,
                                saved.floor
                                  ? `Floor ${saved.floor}`
                                  : "",
                                saved.street,
                                saved.addressLine1,
                                saved.addressLine2,
                                saved.area,
                                saved.village,
                                saved.postOffice,
                                saved.block,
                                saved.city,
                                saved.district,
                                saved.state,
                              ]
                                .filter(Boolean)
                                .filter(
                                  (value, index, arr) =>
                                    arr.indexOf(value) === index
                                )
                                .join(", ")}

                              {saved.postalCode
                                ? ` - ${saved.postalCode}`
                                : ""}
                            </span>
                          </span>

                          {/* Check */}
                          <span
                            className={`
                              mt-0.5
                              flex
                              h-6
                              w-6
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              transition-all
                              ${
                                selected
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-slate-50 text-slate-300"
                              }
                            `}
                          >
                            {selected ? (
                              <FaCheckCircle
                                size={17}
                              />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-slate-300" />
                            )}
                          </span>
                        </button>

                        {/* =================================================
                            ACTIONS
                        ================================================== */}
                        <div
                          className="
                            relative
                            z-20
                            flex
                            items-center
                            justify-end
                            gap-1.5
                            border-t
                            border-slate-100
                            bg-slate-50/60
                            px-3
                            py-2
                            sm:px-4
                          "
                        >
                          {/* Edit */}
                          <button
                            type="button"
                            className="
                              address-modern-action
                            "
                            onClick={() =>
                              startEditAddress(saved)
                            }
                            aria-label={`Edit ${
                              saved.label || "address"
                            }`}
                            title="Edit address"
                          >
                            <FiEdit2
                              size={13}
                              strokeWidth={2.2}
                            />

                            <span>Edit</span>
                          </button>

                          {/* Default */}
                          {/* {!saved.isDefault && (
                            <button
                              type="button"
                              className="
                                address-modern-action
                              "
                              onClick={() =>
                                setDefaultSavedAddress(
                                  saved._id
                                )
                              }
                              aria-label={`Set ${
                                saved.label || "address"
                              } as default`}
                              title="Set as default"
                            >
                              <FiStar
                                size={13}
                                strokeWidth={2.2}
                              />

                              <span>Default</span>
                            </button>
                          )} */}

                          {/* Delete */}
                          <button
                            type="button"
                            className="
                              address-modern-action
                              address-modern-action-danger
                            "
                            onClick={async () => {
                              if (
                                window.confirm(
                                  "Delete this saved address?"
                                )
                              ) {
                                await deleteSavedAddress(
                                  saved._id
                                );
                              }
                            }}
                            aria-label={`Delete ${
                              saved.label || "address"
                            }`}
                            title="Delete address"
                          >
                            <FiTrash2
                              size={13}
                              strokeWidth={2.2}
                            />

                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* =============================================
                   EMPTY STATE
                ============================================== */
                <button
                  type="button"
                  onClick={startNewAddress}
                  className="
                    group
                    relative
                    flex
                    w-full
                    items-center
                    gap-3
                    overflow-hidden
                    rounded-2xl
                    border
                    border-dashed
                    border-blue-200
                    bg-gradient-to-br
                    from-blue-50/70
                    via-white
                    to-indigo-50/50
                    p-4
                    text-left
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:border-blue-300
                    hover:shadow-md
                    active:scale-[0.99]
                    sm:p-5
                  "
                >
                  {/* Shine */}
                  <span
                    className="
                      pointer-events-none
                      absolute
                      inset-y-0
                      -left-1/2
                      w-1/3
                      skew-x-[-18deg]
                      bg-gradient-to-r
                      from-transparent
                      via-white/70
                      to-transparent
                      address-modal-shine-animation
                    "
                  />

                  <span
                    className="
                      relative
                      z-10
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-blue-100
                      bg-white
                      text-blue-600
                      shadow-sm
                      sm:h-12
                      sm:w-12
                    "
                  >
                    <AiOutlinePlus size={22} />
                  </span>

                  <span className="relative z-10 min-w-0 flex-1">
                    <strong
                      className="
                        block
                        text-[11px]
                        font-bold
                        text-slate-900
                        sm:text-xs
                        md:text-sm
                      "
                    >
                      Add your first delivery address
                    </strong>

                    <small
                      className="
                        mt-0.5
                        block
                        text-[9px]
                        leading-4
                        text-slate-500
                        sm:text-[10px]
                        md:text-xs
                      "
                    >
                      Save your address once and use it for future orders.
                    </small>
                  </span>

                  <IoArrowForward
                    size={19}
                    className="
                      relative
                      z-10
                      shrink-0
                      text-slate-400
                      transition-transform
                      duration-200
                      group-hover:translate-x-1
                    "
                  />
                </button>
              )}
            </div>
          )}
        </ModalBody>

        {/* ===================================================
            FOOTER
        ==================================================== */}

        {!showAddressForm && savedAddresses.length > 0 && (
          <ModalFooter
            className="
              relative
              z-30
              flex
              items-center
              gap-2
              border-t
              border-slate-100
              bg-white/95
              px-3
              py-3
              backdrop-blur-xl
              sm:px-4
              sm:py-3.5
              md:px-5
            "
          >
            {/* Add address */}
            <button
              type="button"
              onClick={startNewAddress}
              className="
                group
                flex
                h-10
                flex-1
                items-center
                justify-center
                gap-1.5
                rounded-xl
                border
                border-slate-200
                bg-white
                px-2
                text-[9px]
                font-bold
                text-slate-600
                shadow-sm
                transition-all
                duration-200
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-700
                active:scale-[0.98]
                sm:h-11
                sm:text-[10px]
                md:text-xs
              "
            >
              <AiOutlinePlus
                size={14}
                className="
                  transition-transform
                  duration-200
                  group-hover:rotate-90
                "
              />

              <span>Add another address</span>
            </button>

            {/* Use address */}
            <button
              type="button"
              disabled={!selectedAddressId}
              onClick={() =>
                setAddressSelectorOpen(false)
              }
              className="
                group
                relative
                flex
                h-10
                flex-1
                items-center
                justify-center
                gap-1.5
                overflow-hidden
                rounded-xl
                bg-gradient-to-r
                from-blue-600
                to-indigo-600
                px-2
                text-[9px]
                font-bold
                text-white
                shadow-[0_6px_18px_rgba(37,99,235,0.24)]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:shadow-[0_9px_24px_rgba(37,99,235,0.30)]
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
                disabled:shadow-none
                sm:h-11
                sm:text-[10px]
                md:text-xs
              "
            >
              {/* Shine */}
              <span
                className="
                  pointer-events-none
                  absolute
                  inset-y-0
                  -left-1/2
                  w-1/3
                  skew-x-[-18deg]
                  bg-gradient-to-r
                  from-transparent
                  via-white/35
                  to-transparent
                  address-modal-shine-animation
                "
              />

              <FiCheck
                size={15}
                strokeWidth={2.7}
                className="relative z-10"
              />

              <span className="relative z-10">
                Use this address
              </span>
            </button>
          </ModalFooter>
        )}
      </>
    )}
  </ModalContent>
</Modal>
        {/* =======================================================
            DELETE MODAL
        ======================================================= */}

       {/* =========================================================
    MODERN REMOVE ITEM MODAL
========================================================= */}

<style>{`
  @keyframes deleteModalShine {
    0% {
      transform: translateX(-180%) skewX(-18deg);
      opacity: 0;
    }

    20% {
      opacity: 0;
    }

    40% {
      opacity: 0.65;
    }

    60% {
      opacity: 0;
    }

    100% {
      transform: translateX(220%) skewX(-18deg);
      opacity: 0;
    }
  }

  @keyframes deleteIconPulse {
    0%,
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.10);
    }

    50% {
      transform: scale(1.04);
      box-shadow: 0 0 0 7px rgba(239, 68, 68, 0.04);
    }
  }

  @keyframes deleteWarningGlow {
    0%,
    100% {
      opacity: 0.35;
    }

    50% {
      opacity: 0.8;
    }
  }

  .delete-modal-shine {
    animation: deleteModalShine 3.8s ease-in-out infinite;
  }

  .delete-icon-pulse {
    animation: deleteIconPulse 2.4s ease-in-out infinite;
  }

  .delete-warning-glow {
    animation: deleteWarningGlow 2s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .delete-modal-shine,
    .delete-icon-pulse,
    .delete-warning-glow {
      animation: none;
    }
  }
`}</style>

<Modal
  isOpen={isDeleteOpen}
  onClose={onDeleteClose}
  placement="center"
  backdrop="blur"
  hideCloseButton
>
  <ModalContent
    className="
      relative
      mx-3
      w-full
      max-w-[390px]
      overflow-hidden
      rounded-[24px]
      border
      border-slate-200
      bg-white
      shadow-[0_25px_70px_rgba(15,23,42,0.20)]
      sm:mx-auto
      sm:rounded-[28px]
    "
  >
    {() => (
      <>
        {/* ===================================================
            BACKGROUND GLOW
        ==================================================== */}
        <div
          className="
            pointer-events-none
            absolute
            -right-16
            -top-16
            h-36
            w-36
            rounded-full
            bg-red-100/50
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-20
            -left-16
            h-36
            w-36
            rounded-full
            bg-slate-100
            blur-3xl
          "
        />

        {/* ===================================================
            ANIMATED SHINE
        ==================================================== */}
        <span
          className="
            pointer-events-none
            absolute
            inset-y-0
            -left-[45%]
            z-20
            w-[25%]
            skew-x-[-18deg]
            bg-gradient-to-r
            from-transparent
            via-white/70
            to-transparent
            delete-modal-shine
          "
        />

        {/* ===================================================
            HEADER
        ==================================================== */}
        <ModalHeader
          className="
            relative
            z-10
            flex
            items-center
            gap-3
            border-b
            border-slate-100
            bg-white/90
            px-4
            py-4
            backdrop-blur-xl
            sm:px-5
            sm:py-5
          "
        >
          {/* Delete icon */}
          <div
            className="
              relative
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-red-100
              bg-red-50
              text-red-500
              shadow-sm
              delete-icon-pulse
              sm:h-11
              sm:w-11
            "
          >
            {/* Inner shine */}
            <span
              className="
                pointer-events-none
                absolute
                inset-0
                rounded-2xl
                bg-gradient-to-br
                from-white/60
                via-transparent
                to-transparent
              "
            />

            <FiTrash2
              size={18}
              strokeWidth={2.2}
              className="relative z-10"
            />
          </div>

          {/* Header text */}
          <div className="min-w-0">
            <h3
              className="
                text-[15px]
                font-bold
                leading-5
                tracking-[-0.015em]
                text-slate-900
                sm:text-[17px]
              "
            >
              Remove item?
            </h3>

            <p
              className="
                mt-0.5
                text-[9px]
                leading-4
                text-slate-500
                sm:text-[10px]
                md:text-xs
              "
            >
              This item will be removed from your cart.
            </p>
          </div>
        </ModalHeader>

        {/* ===================================================
            BODY
        ==================================================== */}
        <ModalBody
          className="
            relative
            z-10
            bg-slate-50/40
            px-4
            py-4
            sm:px-5
            sm:py-5
          "
        >
          {/* Warning card */}
          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              border
              border-red-100
              bg-gradient-to-br
              from-red-50/80
              via-white
              to-orange-50/40
              p-3.5
              sm:p-4
            "
          >
            {/* Warning glow */}
            <span
              className="
                pointer-events-none
                absolute
                -right-8
                -top-8
                h-20
                w-20
                rounded-full
                bg-red-100/60
                blur-2xl
                delete-warning-glow
              "
            />

            <div className="relative z-10 flex items-start gap-3">

              {/* Warning icon */}
              <div
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white
                  text-red-500
                  shadow-sm
                  sm:h-9
                  sm:w-9
                "
              >
                <span
                  className="
                    text-[13px]
                    font-black
                    sm:text-sm
                  "
                >
                  !
                </span>
              </div>

              {/* Message */}
              <div className="min-w-0">
                <p
                  className="
                    text-[10px]
                    font-bold
                    leading-4
                    text-slate-800
                    sm:text-[11px]
                    md:text-xs
                  "
                >
                  Are you sure you want to remove this item?
                </p>

                <p
                  className="
                    mt-1
                    text-[9px]
                    leading-[1.55]
                    text-slate-500
                    sm:text-[10px]
                  "
                >
                  The item will be removed from your cart. You can
                  add it again later if you change your mind.
                </p>
              </div>
            </div>
          </div>

          {/* Selected item preview */}
          {selectedItem && (
            <div
              className="
                mt-3
                flex
                items-center
                gap-2.5
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-2.5
                shadow-sm
                sm:p-3
              "
            >
              {/* Product image */}
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-xl
                  border
                  border-slate-100
                  bg-slate-50
                  sm:h-12
                  sm:w-12
                "
              >
                {(
                  selectedItem?.image ||
                  selectedItem?.thumbnail ||
                  selectedItem?.images?.[0]
                ) ? (
                  <img
                    src={
                      selectedItem?.image ||
                      selectedItem?.thumbnail ||
                      selectedItem?.images?.[0]
                    }
                    alt={
                      selectedItem?.title ||
                      selectedItem?.name ||
                      "Product"
                    }
                    className="
                      h-full
                      w-full
                      object-cover
                    "
                  />
                ) : (
                  <FaShoppingBag
                    size={16}
                    className="text-slate-300"
                  />
                )}
              </div>

              {/* Product information */}
              <div className="min-w-0 flex-1">
                <p
                  className="
                    truncate
                    text-[10px]
                    font-bold
                    text-slate-800
                    sm:text-[11px]
                    md:text-xs
                  "
                >
                  {selectedItem?.title ||
                    selectedItem?.name ||
                    "Selected item"}
                </p>

                <div
                  className="
                    mt-0.5
                    flex
                    items-center
                    gap-1.5
                    text-[8px]
                    text-slate-400
                    sm:text-[9px]
                  "
                >
                  <span>
                    Qty: {selectedItem?.quantity || 1}
                  </span>

                  {selectedItem?.variantSku && (
                    <>
                      <span>•</span>

                      <span className="truncate">
                        {selectedItem.variantSku}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Delete indicator */}
              <div
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-red-50
                  text-red-500
                "
              >
                <FiTrash2
                  size={12}
                  strokeWidth={2.2}
                />
              </div>
            </div>
          )}
        </ModalBody>

        {/* ===================================================
            FOOTER
        ==================================================== */}
        <ModalFooter
          className="
            relative
            z-10
            flex
            gap-2
            border-t
            border-slate-100
            bg-white/95
            px-4
            py-3
            backdrop-blur-xl
            sm:px-5
            sm:py-4
          "
        >
          {/* Cancel */}
          <Button
            variant="light"
            onPress={onDeleteClose}
            className="
              group
              h-10
              flex-1
              rounded-xl
              border
              border-slate-200
              bg-white
              px-3
              text-[10px]
              font-bold
              text-slate-600
              shadow-sm
              transition-all
              duration-200
              hover:border-slate-300
              hover:bg-slate-50
              hover:text-slate-800
              active:scale-[0.97]
              sm:h-11
              sm:text-xs
            "
          >
            Cancel
          </Button>

          {/* Remove */}
          <Button
            onPress={async () => {
              if (!selectedItem) {
                return;
              }

              try {
                await removeFromCart(
                  selectedItem.productId,
                  selectedItem.variantSku
                );

                /* Cart changed, invalidate serviceability */
                setServiceability((prev) => ({
                  ...prev,

                  checked: false,

                  serviceableItems: [],

                  unavailableItems:
                    prev.unavailableItems.filter((u) => {
                      const uProductId =
                        u?.productId?._id ||
                        u?.productId ||
                        u?._id ||
                        u?.product?._id;

                      const uSku =
                        u?.variantSku ||
                        u?.variant?.sku ||
                        "";

                      return !(
                        String(uProductId) ===
                          String(selectedItem.productId) &&
                        String(uSku || "") ===
                          String(
                            selectedItem.variantSku || ""
                          )
                      );
                    }),

                  message: "",
                }));

                toast.success("Item removed");

                onDeleteClose();
              } catch (error) {
                console.error(
                  "DELETE CART ITEM ERROR:",
                  error
                );

                toast.error(
                  error?.message ||
                    "Failed to remove item"
                );
              }
            }}
            className="
              group
              relative
              h-10
              flex-1
              overflow-hidden
              rounded-xl
              bg-gradient-to-r
              from-red-500
              to-rose-600
              px-3
              text-[10px]
              font-bold
              text-white
              shadow-[0_6px_18px_rgba(239,68,68,0.24)]
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:from-red-600
              hover:to-rose-700
              hover:shadow-[0_9px_24px_rgba(239,68,68,0.30)]
              active:scale-[0.97]
              sm:h-11
              sm:text-xs
            "
          >
            {/* =================================================
                BUTTON SHINE
            ================================================== */}
            <span
              className="
                pointer-events-none
                absolute
                inset-y-0
                -left-1/2
                w-1/3
                skew-x-[-18deg]
                bg-gradient-to-r
                from-transparent
                via-white/35
                to-transparent
                delete-modal-shine
              "
            />

            {/* Top highlight */}
            <span
              className="
                pointer-events-none
                absolute
                inset-x-2
                top-0
                h-px
                bg-gradient-to-r
                from-transparent
                via-white/60
                to-transparent
              "
            />

            <span
              className="
                relative
                z-10
                flex
                items-center
                justify-center
                gap-1.5
              "
            >
              <FiTrash2
                size={13}
                strokeWidth={2.3}
              />

              <span>
                Remove item
              </span>
            </span>
          </Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>


        {/* =======================================================
            RAZORPAY INSTRUCTION MODAL
        ======================================================= */}

     {/* =========================================================
    MODERN RAZORPAY PAYMENT INSTRUCTIONS MODAL
========================================================= */}

<style>{`
  @keyframes paymentModalShine {
    0% {
      transform: translateX(-180%) skewX(-18deg);
      opacity: 0;
    }

    15% {
      opacity: 0;
    }

    35% {
      opacity: 0.75;
    }

    55% {
      opacity: 0;
    }

    100% {
      transform: translateX(220%) skewX(-18deg);
      opacity: 0;
    }
  }

  @keyframes paymentIconGlow {
    0%,
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.08);
    }

    50% {
      transform: scale(1.035);
      box-shadow: 0 0 0 7px rgba(79, 70, 229, 0.04);
    }
  }

  @keyframes paymentSecureGlow {
    0%,
    100% {
      opacity: 0.45;
    }

    50% {
      opacity: 1;
    }
  }

  .payment-modal-shine {
    animation: paymentModalShine 4s ease-in-out infinite;
  }

  .payment-icon-glow {
    animation: paymentIconGlow 2.6s ease-in-out infinite;
  }

  .payment-secure-glow {
    animation: paymentSecureGlow 2s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .payment-modal-shine,
    .payment-icon-glow,
    .payment-secure-glow {
      animation: none;
    }
  }
`}</style>

<Modal
  isOpen={isInstrOpen}
  onClose={onInstrClose}
  placement="center"
  backdrop="blur"
  hideCloseButton
  className="z-[9999]"
>
  <ModalContent
    className="
      relative
      mx-3
      w-full
      max-w-[420px]
      overflow-hidden
      rounded-[24px]
      border
      border-indigo-100
      bg-white
      shadow-[0_25px_80px_rgba(15,23,42,0.20)]
      sm:mx-auto
      sm:rounded-[28px]
    "
  >
    {() => (
      <>
        {/* ===================================================
            BACKGROUND GLOWS
        ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            -right-16
            -top-16
            h-36
            w-36
            rounded-full
            bg-indigo-100/50
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-20
            -left-16
            h-40
            w-40
            rounded-full
            bg-blue-100/40
            blur-3xl
          "
        />

        {/* ===================================================
            TOP GRADIENT LINE
        ==================================================== */}

        <div
          className="
            relative
            z-30
            h-1
            overflow-hidden
            bg-gradient-to-r
            from-indigo-500
            via-blue-500
            to-cyan-400
          "
        >
          <span
            className="
              absolute
              inset-y-0
              -left-1/2
              w-1/3
              skew-x-[-18deg]
              bg-gradient-to-r
              from-transparent
              via-white
              to-transparent
              payment-modal-shine
            "
          />
        </div>

        {/* ===================================================
            GLOBAL MODAL SHINE
        ==================================================== */}

        <span
          className="
            pointer-events-none
            absolute
            inset-y-0
            -left-[45%]
            z-20
            w-[24%]
            skew-x-[-18deg]
            bg-gradient-to-r
            from-transparent
            via-white/60
            to-transparent
            payment-modal-shine
          "
        />

        {/* ===================================================
            HEADER
        ==================================================== */}

        <ModalHeader
          className="
            relative
            z-10
            border-b
            border-slate-100
            bg-white/90
            px-4
            py-4
            backdrop-blur-xl
            sm:px-5
            sm:py-5
          "
        >
          <div className="flex w-full items-center gap-3">

            {/* Payment icon */}
            <div
              className="
                relative
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-2xl
                border
                border-indigo-100
                bg-gradient-to-br
                from-indigo-50
                to-blue-50
                text-indigo-600
                shadow-sm
                payment-icon-glow
                sm:h-12
                sm:w-12
              "
            >
              <span
                className="
                  pointer-events-none
                  absolute
                  inset-y-0
                  -left-full
                  w-1/2
                  skew-x-[-18deg]
                  bg-gradient-to-r
                  from-transparent
                  via-white/80
                  to-transparent
                  transition-all
                  duration-700
                "
              />

              <MdPayments
                size={20}
                className="relative z-10"
              />
            </div>

            {/* Heading */}
            <div className="min-w-0 flex-1">
              <h3
                className="
                  text-[15px]
                  font-bold
                  leading-5
                  tracking-[-0.015em]
                  text-slate-900
                  sm:text-[17px]
                  md:text-lg
                "
              >
                Payment Instructions
              </h3>

              <p
                className="
                  mt-0.5
                  text-[9px]
                  leading-4
                  text-slate-500
                  sm:text-[10px]
                  md:text-xs
                "
              >
                Complete your payment securely to place the order.
              </p>
            </div>
          </div>
        </ModalHeader>

        {/* ===================================================
            BODY
        ==================================================== */}

        <ModalBody
          className="
            relative
            z-10
            space-y-3.5
            bg-slate-50/40
            px-4
            py-4
            sm:space-y-4
            sm:px-5
            sm:py-5
          "
        >

          {/* =================================================
              RAZORPAY BRAND CARD
          ================================================== */}

          <div
            className="
              group
              relative
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-3.5
              shadow-sm
              transition-all
              duration-300
              hover:border-indigo-200
              hover:shadow-md
              sm:p-4
            "
          >
            {/* Card shine */}
            <span
              className="
                pointer-events-none
                absolute
                inset-y-0
                -left-1/2
                w-1/3
                skew-x-[-18deg]
                bg-gradient-to-r
                from-transparent
                via-white/70
                to-transparent
                opacity-0
                group-hover:opacity-100
                payment-modal-shine
              "
            />

            <div className="relative z-10 flex items-center gap-3">

              {/* Razorpay logo */}
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-xl
                  border
                  border-slate-100
                  bg-white
                  shadow-sm
                  sm:h-12
                  sm:w-12
                "
              >
                <img
                  src={razorpayLogo}
                  alt="Razorpay"
                  className="
                    h-8
                    w-8
                    object-contain
                    sm:h-9
                    sm:w-9
                  "
                />
              </div>

              {/* Razorpay information */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p
                    className="
                      text-[11px]
                      font-bold
                      text-slate-900
                      sm:text-xs
                      md:text-sm
                    "
                  >
                    Razorpay Payment
                  </p>

                  <span
                    className="
                      rounded-full
                      border
                      border-emerald-100
                      bg-emerald-50
                      px-1.5
                      py-0.5
                      text-[7px]
                      font-bold
                      text-emerald-700
                      sm:text-[8px]
                    "
                  >
                    SECURE
                  </span>
                </div>

                <p
                  className="
                    mt-1
                    text-[8px]
                    leading-4
                    text-slate-500
                    sm:text-[9px]
                    md:text-[10px]
                  "
                >
                  UPI · Cards · Netbanking · Wallets
                </p>
              </div>

              {/* Secure icon */}
              <div
                className="
                  hidden
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-emerald-50
                  sm:flex
                "
              >
                <FaShieldAlt
                  size={12}
                  className="
                    text-emerald-500
                    payment-secure-glow
                  "
                />
              </div>
            </div>
          </div>

          {/* =================================================
              PAYMENT STEPS
          ================================================== */}

          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              border
              border-indigo-100
              bg-gradient-to-br
              from-indigo-50/80
              via-white
              to-blue-50/50
              p-3.5
              sm:p-4
            "
          >
            {/* Background glow */}
            <div
              className="
                pointer-events-none
                absolute
                -right-10
                -top-10
                h-24
                w-24
                rounded-full
                bg-indigo-100/60
                blur-2xl
              "
            />

            <div className="relative z-10">

              {/* Section title */}
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-lg
                    bg-white
                    text-indigo-600
                    shadow-sm
                  "
                >
                  <MdPayments size={14} />
                </div>

                <div>
                  <p
                    className="
                      text-[10px]
                      font-bold
                      text-slate-800
                      sm:text-[11px]
                    "
                  >
                    How to pay
                  </p>

                  <p
                    className="
                      text-[8px]
                      text-slate-400
                      sm:text-[9px]
                    "
                  >
                    Follow these simple steps
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2.5">
                {[
                  "Select UPI, Card, Netbanking or Wallet",
                  "Complete payment in the Razorpay checkout",
                  "Keep the payment window open until confirmation",
                  `Confirmation sent to ${user?.email || "your email"}`,
                ].map((text, index) => (
                  <div
                    key={text}
                    className="
                      flex
                      items-start
                      gap-2.5
                      rounded-xl
                      border
                      border-white/80
                      bg-white/75
                      px-2.5
                      py-2
                      shadow-sm
                    "
                  >
                    {/* Number */}
                    <span
                      className="
                        flex
                        h-5
                        w-5
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-indigo-50
                        text-[8px]
                        font-bold
                        text-indigo-600
                        sm:h-6
                        sm:w-6
                        sm:text-[9px]
                      "
                    >
                      {index + 1}
                    </span>

                    {/* Text */}
                    <span
                      className="
                        pt-0.5
                        text-[9px]
                        font-medium
                        leading-4
                        text-slate-600
                        sm:text-[10px]
                      "
                    >
                      {text}
                    </span>

                    {/* Check */}
                    <FaCheckCircle
                      size={11}
                      className="
                        ml-auto
                        mt-1
                        shrink-0
                        text-indigo-400
                      "
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* =================================================
              SECURITY STRIP
          ================================================== */}

          <div
            className="
              group
              relative
              overflow-hidden
              rounded-2xl
              border
              border-emerald-100
              bg-emerald-50/70
              px-3
              py-2.5
              sm:px-3.5
              sm:py-3
            "
          >
            {/* Shine */}
            <span
              className="
                pointer-events-none
                absolute
                inset-y-0
                -left-1/2
                w-1/3
                skew-x-[-18deg]
                bg-gradient-to-r
                from-transparent
                via-white/70
                to-transparent
                payment-modal-shine
              "
            />

            <div
              className="
                relative
                z-10
                flex
                items-center
                gap-2.5
              "
            >
              <div
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  shadow-sm
                  sm:h-8
                  sm:w-8
                "
              >
                <FaShieldAlt
                  size={12}
                  className="
                    text-emerald-500
                    payment-secure-glow
                  "
                />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-[9px]
                    font-bold
                    text-emerald-700
                    sm:text-[10px]
                    md:text-[11px]
                  "
                >
                  Secure payment
                </p>

                <p
                  className="
                    mt-0.5
                    text-[8px]
                    leading-4
                    text-emerald-600
                    sm:text-[9px]
                  "
                >
                  Your payment is securely processed by Razorpay.
                </p>
              </div>
            </div>
          </div>
        </ModalBody>

        {/* ===================================================
            FOOTER
        ==================================================== */}

        <ModalFooter
          className="
            relative
            z-10
            flex
            gap-2
            border-t
            border-slate-100
            bg-white/95
            px-4
            py-3
            backdrop-blur-xl
            sm:px-5
            sm:py-4
          "
        >
          {/* Cancel */}
          <Button
            variant="light"
            onPress={onInstrClose}
            className="
              h-10
              flex-1
              rounded-xl
              border
              border-slate-200
              bg-white
              px-3
              text-[10px]
              font-bold
              text-slate-600
              shadow-sm
              transition-all
              duration-200
              hover:border-slate-300
              hover:bg-slate-50
              active:scale-[0.97]
              sm:h-11
              sm:text-xs
            "
          >
            Cancel
          </Button>

          {/* Continue */}
          <Button
            onPress={() => {
              onInstrClose();
              handleRazorpayPayment();
            }}
            className="
              group
              relative
              h-10
              flex-1
              overflow-hidden
              rounded-xl
              border-0
              bg-gradient-to-r
              from-indigo-600
              via-blue-600
              to-indigo-600
              px-4
              text-[10px]
              font-bold
              text-white
              shadow-[0_7px_20px_rgba(79,70,229,0.28)]
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:shadow-[0_10px_28px_rgba(79,70,229,0.35)]
              active:scale-[0.97]
              sm:h-11
              sm:text-xs
            "
          >
            {/* Animated shine */}
            <span
              className="
                pointer-events-none
                absolute
                inset-y-0
                -left-1/2
                w-1/3
                skew-x-[-18deg]
                bg-gradient-to-r
                from-transparent
                via-white/35
                to-transparent
                payment-modal-shine
              "
            />

            {/* Top highlight */}
            <span
              className="
                pointer-events-none
                absolute
                inset-x-2
                top-0
                h-px
                bg-gradient-to-r
                from-transparent
                via-white/60
                to-transparent
              "
            />

            <span
              className="
                relative
                z-10
                flex
                items-center
                justify-center
                gap-1.5
              "
            >
              <span>Continue to Payment</span>

              <IoArrowForward
                size={15}
                className="
                  transition-transform
                  duration-200
                  group-hover:translate-x-0.5
                "
              />
            </span>
          </Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>


        {/* =======================================================
            COD CONFIRM MODAL
        ======================================================= */}

       {/* =========================================================
    MODERN COD CONFIRMATION MODAL
========================================================= */}

<style>{`
  @keyframes codModalShine {
    0% {
      transform: translateX(-180%) skewX(-18deg);
      opacity: 0;
    }

    15% {
      opacity: 0;
    }

    35% {
      opacity: 0.7;
    }

    55% {
      opacity: 0;
    }

    100% {
      transform: translateX(220%) skewX(-18deg);
      opacity: 0;
    }
  }

  @keyframes codIconPulse {
    0%,
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.10);
    }

    50% {
      transform: scale(1.04);
      box-shadow: 0 0 0 7px rgba(245, 158, 11, 0.04);
    }
  }

  @keyframes codGlow {
    0%,
    100% {
      opacity: 0.35;
    }

    50% {
      opacity: 0.8;
    }
  }

  .cod-modal-shine {
    animation: codModalShine 4s ease-in-out infinite;
  }

  .cod-icon-pulse {
    animation: codIconPulse 2.6s ease-in-out infinite;
  }

  .cod-glow {
    animation: codGlow 2.2s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .cod-modal-shine,
    .cod-icon-pulse,
    .cod-glow {
      animation: none;
    }
  }
`}</style>

<Modal
  isOpen={isCodConfirmOpen}
  onClose={onCodConfirmClose}
  placement="center"
  backdrop="blur"
  hideCloseButton
  className="z-[9999]"
>
  <ModalContent
    className="
      relative
      mx-3
      w-full
      max-w-[420px]
      overflow-hidden
      rounded-[24px]
      border
      border-amber-100
      bg-white
      shadow-[0_25px_80px_rgba(15,23,42,0.20)]
      sm:mx-auto
      sm:rounded-[28px]
    "
  >
    {() => (
      <>
        {/* ===================================================
            BACKGROUND GLOWS
        ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            -right-16
            -top-16
            h-36
            w-36
            rounded-full
            bg-amber-100/50
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-20
            -left-16
            h-40
            w-40
            rounded-full
            bg-orange-100/40
            blur-3xl
          "
        />

        {/* ===================================================
            TOP GRADIENT BAR
        ==================================================== */}

        <div
          className="
            relative
            z-30
            h-1
            overflow-hidden
            rounded-t-[24px]
            bg-gradient-to-r
            from-amber-400
            via-orange-400
            to-amber-500
          "
        >
          <span
            className="
              absolute
              inset-y-0
              -left-1/2
              w-1/3
              skew-x-[-18deg]
              bg-gradient-to-r
              from-transparent
              via-white
              to-transparent
              cod-modal-shine
            "
          />
        </div>

        {/* ===================================================
            GLOBAL SHINE
        ==================================================== */}

        <span
          className="
            pointer-events-none
            absolute
            inset-y-0
            -left-[45%]
            z-20
            w-[24%]
            skew-x-[-18deg]
            bg-gradient-to-r
            from-transparent
            via-white/60
            to-transparent
            cod-modal-shine
          "
        />

        {/* ===================================================
            HEADER
        ==================================================== */}

        <ModalHeader
          className="
            relative
            z-10
            border-b
            border-slate-100
            bg-white/90
            px-4
            py-4
            backdrop-blur-xl
            sm:px-5
            sm:py-5
          "
        >
          <div className="flex w-full items-center gap-3">

            {/* COD icon */}
            <div
              className="
                relative
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-2xl
                border
                border-amber-100
                bg-gradient-to-br
                from-amber-50
                to-orange-50
                text-amber-600
                shadow-sm
                cod-icon-pulse
                sm:h-12
                sm:w-12
              "
            >
              <span
                className="
                  pointer-events-none
                  absolute
                  inset-y-0
                  -left-full
                  w-1/2
                  skew-x-[-18deg]
                  bg-gradient-to-r
                  from-transparent
                  via-white/80
                  to-transparent
                "
              />

              <FaWallet
                size={19}
                className="relative z-10"
              />
            </div>

            {/* Heading */}
            <div className="min-w-0 flex-1">
              <h3
                className="
                  text-[15px]
                  font-bold
                  leading-5
                  tracking-[-0.015em]
                  text-slate-900
                  sm:text-[17px]
                  md:text-lg
                "
              >
                Confirm COD Order
              </h3>

              <p
                className="
                  mt-0.5
                  text-[9px]
                  leading-4
                  text-slate-500
                  sm:text-[10px]
                  md:text-xs
                "
              >
                Review your order before placing it.
              </p>
            </div>
          </div>
        </ModalHeader>

        {/* ===================================================
            BODY
        ==================================================== */}

        <ModalBody
          className="
            relative
            z-10
            space-y-3.5
            bg-slate-50/40
            px-4
            py-4
            sm:space-y-4
            sm:px-5
            sm:py-5
          "
        >

          {/* =================================================
              PAYMENT METHOD CARD
          ================================================== */}

          <div
            className="
              group
              relative
              overflow-hidden
              rounded-2xl
              border
              border-amber-100
              bg-gradient-to-br
              from-amber-50/80
              via-white
              to-orange-50/40
              p-3.5
              shadow-sm
              sm:p-4
            "
          >
            {/* Shine */}
            <span
              className="
                pointer-events-none
                absolute
                inset-y-0
                -left-1/2
                w-1/3
                skew-x-[-18deg]
                bg-gradient-to-r
                from-transparent
                via-white/70
                to-transparent
                cod-modal-shine
              "
            />

            <div className="relative z-10 flex items-center gap-3">

              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white
                  text-amber-500
                  shadow-sm
                  sm:h-10
                  sm:w-10
                "
              >
                <FaWallet size={15} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p
                    className="
                      text-[11px]
                      font-bold
                      text-slate-900
                      sm:text-xs
                      md:text-sm
                    "
                  >
                    Cash on Delivery
                  </p>

                  <span
                    className="
                      rounded-full
                      border
                      border-amber-100
                      bg-amber-50
                      px-1.5
                      py-0.5
                      text-[7px]
                      font-bold
                      text-amber-700
                      sm:text-[8px]
                    "
                  >
                    COD
                  </span>
                </div>

                <p
                  className="
                    mt-1
                    text-[8px]
                    leading-4
                    text-slate-500
                    sm:text-[9px]
                    md:text-[10px]
                  "
                >
                  Pay when your order is delivered.
                </p>
              </div>

              <FaCheckCircle
                size={17}
                className="
                  shrink-0
                  text-emerald-500
                  cod-glow
                "
              />
            </div>
          </div>

          {/* =================================================
              ORDER TOTAL
          ================================================== */}

          <div
            className="
              flex
              items-center
              justify-between
              gap-3
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-3.5
              py-3
              shadow-sm
              sm:px-4
            "
          >
            <div className="min-w-0">
              <p
                className="
                  text-[8px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-slate-400
                  sm:text-[9px]
                "
              >
                Amount to pay
              </p>

              <p
                className="
                  mt-0.5
                  text-[16px]
                  font-black
                  leading-5
                  tracking-[-0.02em]
                  text-slate-900
                  sm:text-lg
                "
              >
                ₹
                {Number(finalTotal || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div
              className="
                flex
                shrink-0
                items-center
                gap-1.5
                rounded-full
                border
                border-emerald-100
                bg-emerald-50
                px-2
                py-1
                text-[8px]
                font-bold
                text-emerald-700
                sm:px-2.5
                sm:py-1.5
                sm:text-[9px]
              "
            >
              <FaShieldAlt
                size={9}
                className="text-emerald-500"
              />

              Secure
            </div>
          </div>

          {/* =================================================
              EMAIL CONFIRMATION
          ================================================== */}

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-3.5
              py-3
              shadow-sm
              sm:px-4
            "
          >
            <div className="flex items-start gap-2.5">

              <div
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-indigo-50
                  text-indigo-500
                  sm:h-9
                  sm:w-9
                "
              >
                <FaEnvelope size={13} />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-[9px]
                    font-bold
                    text-slate-700
                    sm:text-[10px]
                    md:text-xs
                  "
                >
                  Order confirmation
                </p>

                <p
                  className="
                    mt-0.5
                    break-all
                    text-[8px]
                    leading-4
                    text-slate-500
                    sm:text-[9px]
                    md:text-[10px]
                  "
                >
                  Confirmation will be sent to{" "}
                  <span className="font-semibold text-indigo-600">
                    {address.email || user?.email || "your email"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              CASH REMINDER
          ================================================== */}

          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              border
              border-amber-200
              bg-amber-50/70
              px-3
              py-2.5
              sm:px-3.5
              sm:py-3
            "
          >
            <span
              className="
                pointer-events-none
                absolute
                inset-y-0
                -left-1/2
                w-1/3
                skew-x-[-18deg]
                bg-gradient-to-r
                from-transparent
                via-white/70
                to-transparent
                cod-modal-shine
              "
            />

            <div
              className="
                relative
                z-10
                flex
                items-center
                gap-2.5
              "
            >
              <div
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  text-amber-500
                  shadow-sm
                  sm:h-8
                  sm:w-8
                "
              >
                <FaWallet size={12} />
              </div>

              <div>
                <p
                  className="
                    text-[9px]
                    font-bold
                    text-amber-700
                    sm:text-[10px]
                    md:text-[11px]
                  "
                >
                  Keep cash ready
                </p>

                <p
                  className="
                    mt-0.5
                    text-[8px]
                    leading-4
                    text-amber-600
                    sm:text-[9px]
                  "
                >
                  Please keep the exact or required amount ready at delivery.
                </p>
              </div>
            </div>
          </div>

        </ModalBody>

        {/* ===================================================
            FOOTER
        ==================================================== */}

        <ModalFooter
          className="
            relative
            z-10
            flex
            gap-2
            border-t
            border-slate-100
            bg-white/95
            px-4
            py-3
            backdrop-blur-xl
            sm:px-5
            sm:py-4
          "
        >

          {/* Cancel */}
          <Button
            variant="light"
            onPress={onCodConfirmClose}
            className="
              h-10
              flex-1
              rounded-xl
              border
              border-slate-200
              bg-white
              px-3
              text-[10px]
              font-bold
              text-slate-600
              shadow-sm
              transition-all
              duration-200
              hover:border-slate-300
              hover:bg-slate-50
              active:scale-[0.97]
              sm:h-11
              sm:text-xs
            "
          >
            Cancel
          </Button>

          {/* Confirm */}
          <Button
            onPress={async () => {
              onCodConfirmClose();

              await completeOrder("COD");
            }}
            className="
              group
              relative
              h-10
              flex-1
              overflow-hidden
              rounded-xl
              border-0
              bg-gradient-to-r
              from-amber-500
              via-orange-500
              to-amber-500
              px-4
              text-[10px]
              font-bold
              text-white
              shadow-[0_7px_20px_rgba(245,158,11,0.28)]
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:shadow-[0_10px_28px_rgba(245,158,11,0.35)]
              active:scale-[0.97]
              sm:h-11
              sm:text-xs
            "
          >
            {/* CTA shine */}
            <span
              className="
                pointer-events-none
                absolute
                inset-y-0
                -left-1/2
                w-1/3
                skew-x-[-18deg]
                bg-gradient-to-r
                from-transparent
                via-white/40
                to-transparent
                cod-modal-shine
              "
            />

            {/* Top highlight */}
            <span
              className="
                pointer-events-none
                absolute
                inset-x-2
                top-0
                h-px
                bg-gradient-to-r
                from-transparent
                via-white/70
                to-transparent
              "
            />

            <span
              className="
                relative
                z-10
                flex
                items-center
                justify-center
                gap-1.5
              "
            >
              <FaCheckCircle size={13} />

              <span>
                Confirm Order
              </span>

              <IoArrowForward
                size={14}
                className="
                  transition-transform
                  duration-200
                  group-hover:translate-x-0.5
                "
              />
            </span>
          </Button>

        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>
      </div>

    </>

  );

};


export default Cart;
