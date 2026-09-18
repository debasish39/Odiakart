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
  FaThLarge,
} from "react-icons/fa";

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

  const [address, setAddress] =
    useState({

      name: "",

      email: "",

      phone: "",

      street: "",

      addressLine1: "",

      addressLine2: "",

      landmark: "",

      area: "",

      village: "",

      city: "",

      district: "",

      state: "",

      postcode: "",

      country: "India",

      latitude: "",

      longitude: "",

      deliveryPreference: "",

    });


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

    navigate("/account/addresses");
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
      fullName:
        item?.fullName ||
        item?.name ||
        source?.fullName ||
        "",
      phone:
        item?.phone ||
        source?.phone ||
        "",
      email:
        user?.email ||
        "",
      addressLine1:
        item?.addressLine1 ||
        item?.street ||
        source?.addressLine1 ||
        source?.street ||
        "",
      addressLine2:
        item?.addressLine2 ||
        source?.addressLine2 ||
        "",
      landmark:
        item?.landmark ||
        source?.landmark ||
        "",
      area:
        item?.area ||
        source?.area ||
        "",
      village:
        item?.village ||
        source?.village ||
        "",
      city:
        item?.city ||
        source?.city ||
        "",
      district:
        item?.district ||
        source?.district ||
        "",
      state:
        item?.state ||
        source?.state ||
        "",
      postalCode:
        item?.postalCode ||
        item?.postcode ||
        source?.postalCode ||
        source?.postcode ||
        "",
      country:
        item?.country ||
        source?.country ||
        "India",
      location:
        item?.location ||
        source?.location ||
        {},
      isDefault: item?.isDefault === true,
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

      const normalized = list.map(normalizeSavedAddress);
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
      redirectToSavedAddresses();
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

    setSelectedAddressId(String(saved._id));

    setEditingAddressId(null);
    setAddressLabel(saved.label || "Home");

    setAddress({
      name: saved.fullName || "",
      email: user?.email || "",
      phone: String(saved.phone || "").replace(/\D/g, "").slice(0, 10),
      street: saved.addressLine1 || "",
      addressLine1: saved.addressLine1 || "",
      addressLine2: saved.addressLine2 || "",
      landmark: saved.landmark || "",
      area: saved.area || "",
      village: saved.village || "",
      city: saved.city || "",
      district: saved.district || "",
      state: saved.state || "",
      postcode: String(saved.postalCode || "").replace(/\D/g, "").slice(0, 6),
      country: saved.country || "India",
      latitude: saved.location?.latitude ?? "",
      longitude: saved.location?.longitude ?? "",
      deliveryPreference: saved.deliveryPreference || "",
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
    redirectToSavedAddresses();
  };


  const startEditAddress = (item) => {
    const saved = normalizeSavedAddress(item);

    if (!saved._id) {
      redirectToSavedAddresses();
      return;
    }

    try {
      sessionStorage.setItem(
        "odicart_checkout_return",
        JSON.stringify({
          path: "/cart",
          step: 2,
        })
      );
    } catch (_) {}

    navigate(`/account/addresses/${saved._id}/edit`);
  };


  const saveCurrentAddress = async () => {

    if (!token) {
      toast.error("Please login first");
      return false;
    }

    if (!validateDelivery()) {
      return false;
    }

    const payload = {
      label: addressLabel || "Home",
      fullName: String(address.name || "").trim(),
      email: String(user?.email || "").trim(),
      phone: String(address.phone || "").trim(),
      addressLine1: String(
        address.addressLine1 || address.street || ""
      ).trim(),
      addressLine2: String(address.addressLine2 || "").trim(),
      landmark: String(address.landmark || "").trim(),
      area: String(address.area || "").trim(),
      village: String(address.village || "").trim(),
      city: String(address.city || "").trim(),
      district: String(address.district || "").trim(),
      state: String(address.state || "").trim(),
      postalCode: String(address.postcode || "").trim(),
      country: String(address.country || "India").trim(),
      location: {
        latitude:
          address.latitude !== "" &&
          address.latitude !== null &&
          address.latitude !== undefined
            ? Number(address.latitude)
            : undefined,
        longitude:
          address.longitude !== "" &&
          address.longitude !== null &&
          address.longitude !== undefined
            ? Number(address.longitude)
            : undefined,
      },
      isDefault: savedAddresses.length === 0,
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
      setEditingAddressId(null);
      setShowAddressForm(false);
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
          const payload = {
            label: addressLabel || "Home",
            fullName: String(updatedAddress.name || "").trim(),
            email: String(user?.email || "").trim(),
            phone: String(updatedAddress.phone || "").trim(),
            addressLine1: String(
              updatedAddress.addressLine1 ||
              updatedAddress.street ||
              ""
            ).trim(),
            addressLine2: String(
              updatedAddress.addressLine2 || ""
            ).trim(),
            landmark: String(
              updatedAddress.landmark || ""
            ).trim(),
            area: String(updatedAddress.area || "").trim(),
            village: String(updatedAddress.village || "").trim(),
            city: String(updatedAddress.city || "").trim(),
            district: String(
              updatedAddress.district || ""
            ).trim(),
            state: String(updatedAddress.state || "").trim(),
            postalCode: value,
            country: String(
              updatedAddress.country || "India"
            ).trim() || "India",
            location: {
              latitude:
                updatedAddress.latitude !== "" &&
                updatedAddress.latitude !== null &&
                updatedAddress.latitude !== undefined
                  ? Number(updatedAddress.latitude)
                  : undefined,
              longitude:
                updatedAddress.longitude !== "" &&
                updatedAddress.longitude !== null &&
                updatedAddress.longitude !== undefined
                  ? Number(updatedAddress.longitude)
                  : undefined,
            },
            isDefault:
              savedAddresses.find(
                (item) =>
                  String(item._id) ===
                  String(selectedAddressId)
              )?.isDefault === true,
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
        setSelectedAddressId(null);
        startNewAddress();
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
        redirectToSavedAddresses();
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
        redirectToSavedAddresses();
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
            "/order-history"
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

    if (!selectedAddressId) {
      toast.error(
        "Please select a saved delivery address first."
      );

      redirectToSavedAddresses();

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
          min-height: 58px;
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
          .review-place-btn { min-height: 54px; font-size: 14px; }
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
            width:54px;
            height:54px;
          }
        }

        @media (max-width:430px) {
          :root {
            --cart-top-navbar-height:64px;
            --cart-top-title-size:20px;
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
            width:46px;
            height:46px;
          }

          .cart-top-title h1 {
            font-size:23px;
          }

          .cart-top-title p {
            font-size:12px;
          }

          .cart-top-clear {
            min-width:68px;
            height:44px;
            gap:6px;
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

          {cartItem.length === 0 &&
            step === 1 && (

              <div
                className="
                  flex
                  flex-col
                  items-center
                  justify-center
                  min-h-[70vh]
                  text-center
                  step-panel
                "
              >

                <img
                  src={emptyCart}
                  alt="Empty Cart"
                  className="
                    w-56
                    mb-5
                    opacity-90
                  "
                />


                <h1
                  className="
                    cart-serif
                    text-3xl
                    sm:text-4xl
                    font-bold
                    text-indigo-700
                    mb-2
                  "
                >
                  Your cart feels lonely 🛒
                </h1>


                <p
                  className="
                    text-slate-500
                    max-w-sm
                    text-sm
                    leading-relaxed
                    mb-6
                  "
                >
                  You haven't added anything yet.
                  Explore and find something you love.
                </p>


                <div
                  className="
                    flex
                    flex-col
                    sm:flex-row
                    gap-3
                  "
                >

                  <button
                    onClick={() =>
                      navigate("/products")
                    }
                    className="
                      btn-primary
                      px-7
                      py-3
                      text-sm
                    "
                  >

                    <GiShoppingBag
                      size={16}
                    />

                    <span className="relative z-10">
                      Start Shopping
                    </span>

                  </button>


                  <button
                    onClick={() =>
                      navigate(
                        "/order-history"
                      )
                    }
                    className="
                      btn-secondary
                      px-7
                      py-3
                      text-sm
                    "
                  >

                    <FaHistory
                      size={14}
                    />

                    View Orders

                  </button>

                </div>


                <p
                  className="
                    text-xs
                    text-slate-400
                    mt-4
                  "
                >
                  🚚 Free delivery on all orders
                </p>

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

              <div
                className="mx-auto mb-3 flex w-full max-w-2xl items-center justify-center rounded-[2rem] border border-white/70 bg-white/55 px-4 py-4 shadow-[0_20px_60px_rgba(99,102,241,0.10)] backdrop-blur-xl sm:mb-9 sm:px-7"
              >

                {STEPS.map(
                  (s, i) => (

                    <React.Fragment
                      key={s.id}
                    >

                      <div
                        className="
                          flex
                          flex-col
                          items-center
                          gap-1.5
                        "
                      >

                        <button
                          onClick={() =>
                            s.id < step &&
                            setStep(s.id)
                          }
                          className={`
                            w-10
                            h-10
                            rounded-full
                            border-2
                            flex
                            items-center
                            justify-center
                            font-bold
                            text-sm
                            transition-all
                            duration-300

                            ${
                              s.id < step

                                ? "step-done cursor-pointer"

                                : s.id === step

                                ? "step-active"

                                : "step-idle cursor-default"
                            }
                          `}
                        >

                          {s.id < step ? (

                            <FaCheckCircle
                              size={16}
                            />

                          ) : (

                            s.icon

                          )}

                        </button>


                        <span
                          className={`
                            text-xs
                            font-semibold

                            ${
                              s.id === step

                                ? "text-indigo-600"

                                : s.id < step

                                ? "text-indigo-400"

                                : "text-slate-400"
                            }
                          `}
                        >
                          {s.label}
                        </span>

                      </div>


                      {i <
                        STEPS.length - 1 && (

                        <div
                          className={`
                            flex-1
                            h-0.5
                            mx-3
                            mb-4
                            rounded-full
                            transition-all
                            duration-500

                            ${
                              step >
                              i + 1

                                ? "connector-done"

                                : "connector-idle"
                            }
                          `}
                        />

                      )}

                    </React.Fragment>

                  )
                )}

              </div>

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
                              <div><span>Tax</span><strong>₹{Number(itemTax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
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
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                          <FaCheckCircle className="text-blue-600" size={18} />
                        </div>
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                            Review your order
                          </h2>
                          <p className="text-sm text-slate-500 mt-0.5">
                            Check your details before placing the order.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
                      <FaShieldAlt size={12} />
                      Secure checkout
                    </div>
                  </div>

                  {/* DELIVERY ADDRESS */}
                  <section className="review-card p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="review-icon bg-blue-50 text-blue-600">
                            <FaMapMarkerAlt size={15} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              Delivery Address
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Where should we deliver your order?
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={redirectToSavedAddresses}
                        className="review-outline-btn"
                      >
                        Change
                      </button>
                    </div>

                    {addressLoading ? (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-700">
                        Loading your saved delivery address...
                      </div>
                    ) : selectedAddressId ? (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 w-9 h-9 rounded-xl bg-white border border-blue-100 flex items-center justify-center flex-shrink-0">
                            <FaUser className="text-blue-600" size={13} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-slate-900">
                                {address.name || "Customer"}
                              </p>
                              <span className="rounded-full bg-white border border-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700">
                                {savedAddresses.find((item) => String(item._id) === String(selectedAddressId))?.label || "Address"}
                              </span>
                            </div>

                            <p className="text-sm text-slate-600 leading-6 mt-2">
                              {address.street || address.addressLine1}
                              {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                              {address.area ? `, ${address.area}` : ""}
                              {address.city ? `, ${address.city}` : ""}
                              {address.district ? `, ${address.district}` : ""}
                              {address.state ? `, ${address.state}` : ""}
                              {address.postcode ? ` - ${address.postcode}` : ""}
                            </p>

                            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1.5">
                                <BsTelephoneFill size={10} className="text-blue-500" />
                                +91 {address.phone || ""}
                              </span>
                              <span className="inline-flex items-center gap-1.5 min-w-0">
                                <FaEnvelope size={10} className="text-blue-500" />
                                <span className="truncate">{address.email || user?.email || ""}</span>
                              </span>
                            </div>
                          </div>

                          <FaCheckCircle className="text-emerald-500 flex-shrink-0" size={18} />
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={redirectToSavedAddresses}
                        className="w-full rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-5 text-left hover:bg-blue-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-white border border-blue-100 flex items-center justify-center">
                            <AiOutlinePlus className="text-blue-600" size={22} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-900">Add delivery address</p>
                            <p className="text-xs text-slate-500 mt-1">Add an address to continue</p>
                          </div>
                          <IoArrowForward className="text-slate-400" size={20} />
                        </div>
                      </button>
                    )}

                    {serviceability.checked && serviceability.unavailableItems.length === 0 && (
                      <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                          <FaCheckCircle className="text-emerald-500" size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-700">
                            Delivery available
                          </p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            This order can be delivered to PIN {serviceability.postalCode}.
                          </p>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* ORDER SUMMARY */}
                  <section className="review-card p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="review-icon bg-indigo-50 text-indigo-600">
                          <FaShoppingBag size={15} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Order Summary</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {cartItem.length} item{cartItem.length !== 1 ? "s" : ""} in your order
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
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
                        const sku = item?.variantSku || variant?.sku || "";

                        return (
                          <div
                            key={`${item?.productId || item?._id || index}-${sku || "default"}`}
                            className="review-product"
                          >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                              {image ? (
                                <img
                                  src={image}
                                  alt={item?.title || "Product"}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <FaShoppingBag size={22} />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 py-0.5">
                              <p className="font-bold text-slate-900 truncate">
                                {item?.title || item?.name || "Product"}
                              </p>
                              {sku && (
                                <p className="text-xs text-slate-500 mt-1 truncate">
                                  {sku}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                  Qty: {qty}
                                </span>
                                {variant?.attributes && Object.entries(variant.attributes).slice(0, 2).map(([key, value]) => (
                                  <span key={key} className="text-[11px] text-slate-500">
                                    {key}: {String(value)}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <p className="text-base sm:text-lg font-bold text-blue-600">
                                ₹{Number(lineTotal || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                ₹{Number(item?.price || 0).toLocaleString("en-IN")} × {qty}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* COUPON */}
                  <section className="review-card p-5 sm:p-6">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="review-icon bg-emerald-50 text-emerald-600">
                        <FaHistory size={15} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Apply Coupon</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Use a valid coupon to save on your order
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError("");
                          setCouponSuccess("");
                        }}
                        placeholder="Enter coupon code"
                        className={`review-input flex-1 ${couponError ? "border-rose-300" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={couponLoading}
                        className="review-apply-btn"
                      >
                        {couponLoading ? "Applying..." : "Apply"}
                      </button>
                    </div>

                    {couponError && (
                      <p className="text-xs font-medium text-rose-500 mt-2">
                        {couponError}
                      </p>
                    )}

                    {couponSuccess && (
                      <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <FaCheckCircle className="text-emerald-500" />
                          <div>
                            <p className="text-sm font-bold text-emerald-700">Coupon applied</p>
                            <p className="text-xs text-emerald-600 mt-0.5">{couponSuccess}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-emerald-700">
                          -₹{Number(couponDiscount || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </section>

                  {/* PAYMENT METHOD */}
                  <section className="review-card p-5 sm:p-6">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="review-icon bg-blue-50 text-blue-600">
                        <MdPayments size={17} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Payment Method</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Choose how you want to pay</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setPaymentType("cod")}
                        className={`review-payment-option ${paymentType === "cod" ? "review-payment-active" : ""}`}
                      >
                        <div className="payment-radio">
                          {paymentType === "cod" && <div className="payment-radio-dot" />}
                        </div>
                        <div className="payment-method-icon cod-icon">
                          <FaWallet size={17} />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-bold text-slate-900">Cash on Delivery</p>
                          <p className="text-xs text-slate-500 mt-1">Pay after your order arrives</p>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 hidden sm:block">Available</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentType("razorpay")}
                        className={`review-payment-option ${paymentType === "razorpay" ? "review-payment-active" : ""}`}
                      >
                        <div className="payment-radio">
                          {paymentType === "razorpay" && <div className="payment-radio-dot" />}
                        </div>
                        <div className="payment-method-icon online-icon">
                          <FaCreditCard size={17} />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-900">Pay Online</p>
                            <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Secure
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">UPI, Cards, Wallets & Netbanking</p>
                        </div>
                        <span className="text-xs font-semibold text-blue-600 hidden sm:block">Razorpay</span>
                      </button>
                    </div>
                  </section>

                  {/* PRICE DETAILS */}
                  <section className="review-card p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-900">Price Details</h3>
                      <span className="text-xs font-semibold text-slate-400">{cartItem.length} item{cartItem.length !== 1 ? "s" : ""}</span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Items</span>
                        <span className="font-semibold text-slate-800">₹{Number(totalPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Product discount</span>
                        <span className="font-semibold text-emerald-600">-₹{Number(itemDiscount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Coupon discount</span>
                        <span className="font-semibold text-emerald-600">-₹{Number(couponDiscount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Delivery</span>
                        <span className="font-bold text-emerald-600">FREE</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Tax</span>
                        <span className="font-semibold text-slate-800">₹{Number(itemTax || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="my-4 border-t border-slate-100" />

                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Amount</p>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                          ₹{Number(finalTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        Free delivery
                      </div>
                    </div>
                  </section>

                  {/* SECURITY NOTE */}
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500 py-1">
                    <FaShieldAlt className="text-emerald-500" />
                    <span>Your order details are protected and securely processed.</span>
                  </div>

                  {/* ACTIONS */}
                  <div className="fixed-review-bar">
                    <div className="fixed-review-inner">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="review-back-btn"
                      >
                        <IoArrowBack size={17} />
                        <span className="hidden sm:inline">Back</span>
                      </button>

                      <div className="review-total-mini">
                        <span>Total Amount</span>
                        <strong>₹{Number(finalTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </div>

                      <button
                        type="button"
                        onClick={handlePlaceOrderFromReview}
                        disabled={!selectedAddressId || !cartItem.length || serviceability.checking}
                        className="review-place-btn"
                      >
                        <span>
                          {paymentType === "cod" ? "Place Order" : "Continue"}
                        </span>
                        <IoArrowForward size={20} />
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
            DELETE MODAL
        ======================================================= */}

        <Modal
          isOpen={
            isDeleteOpen
          }
          onClose={
            onDeleteClose
          }
          placement="center"
          backdrop="blur"
          hideCloseButton
        >

          <ModalContent
            className="
              rounded-2xl
              border
              border-slate-200
              shadow-xl
              bg-white
              max-w-sm
              mx-auto
            "
          >

            {() => (

              <>

                <ModalHeader
                  className="
                    text-slate-800
                    font-bold
                    text-base
                    border-b
                    border-slate-100
                  "
                >
                  Remove Item
                </ModalHeader>


                <ModalBody
                  className="
                    text-slate-500
                    text-sm
                    py-4
                  "
                >
                  Are you sure you want to remove this item from your cart?
                </ModalBody>


                <ModalFooter
                  className="
                    gap-2
                    border-t
                    border-slate-100
                  "
                >

                  <Button
                    variant="light"
                    onPress={
                      onDeleteClose
                    }
                    className="
                      text-slate-500
                    "
                  >
                    Cancel
                  </Button>


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


                        /*
                         * Cart changed, invalidate
                         * serviceability.
                         */

                        setServiceability(
                          (prev) => ({

                            ...prev,

                            checked:
                              false,

                            serviceableItems:
                              [],

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


                                  return !(
                                    String(
                                      uProductId
                                    ) ===
                                    String(
                                      selectedItem.productId
                                    ) &&

                                    String(
                                      uSku || ""
                                    ) ===
                                    String(
                                      selectedItem.variantSku ||
                                      ""
                                    )
                                  );

                                }
                              ),

                            message:
                              "",

                          })
                        );


                        toast.success(
                          "Item removed"
                        );


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
                      bg-red-500
                      text-white
                      font-semibold
                      rounded-xl
                      hover:bg-red-600
                    "
                  >
                    Remove
                  </Button>

                </ModalFooter>

              </>

            )}

          </ModalContent>

        </Modal>


        {/* =======================================================
            RAZORPAY INSTRUCTION MODAL
        ======================================================= */}

        <Modal
          isOpen={
            isInstrOpen
          }
          onClose={
            onInstrClose
          }
          placement="center"
          backdrop="blur"
          hideCloseButton
          className="z-[9999]"
        >

          <ModalContent
            className="
              rounded-2xl
              border
              border-indigo-100
              shadow-xl
              bg-white
              max-w-sm
              mx-auto
            "
          >

            {() => (

              <>

                <div
                  className="
                    h-1
                    bg-gradient-to-r
                    from-indigo-500
                    to-blue-500
                    rounded-t-2xl
                  "
                />


                <ModalHeader
                  className="
                    flex
                    items-center
                    gap-2
                    text-slate-800
                    font-bold
                    text-sm
                    border-b
                    border-slate-100
                  "
                >

                  <MdPayments
                    className="
                      text-indigo-600
                    "
                    size={18}
                  />

                  Payment Instructions

                </ModalHeader>


                <ModalBody
                  className="
                    py-4
                    space-y-3
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >

                    <img
                      src={
                        razorpayLogo
                      }
                      alt="Razorpay"
                      className="
                        w-10
                        h-10
                        rounded-xl
                        border
                      "
                    />


                    <div>

                      <p
                        className="
                          font-bold
                          text-slate-800
                          text-sm
                        "
                      >
                        Razorpay Payment
                      </p>


                      <p
                        className="
                          text-xs
                          text-slate-400
                        "
                      >
                        UPI · Cards · Netbanking · Wallets
                      </p>

                    </div>

                  </div>


                  <div
                    className="
                      bg-indigo-50
                      border
                      border-indigo-100
                      rounded-xl
                      p-3
                      space-y-2
                    "
                  >

                    {[
                      "Select UPI / Card / Netbanking",

                      "Complete payment in Razorpay popup",

                      "Do not close the payment window",

                      `Confirmation sent to ${user?.email || ""}`,

                    ].map(
                      (text) => (

                        <div
                          key={text}
                          className="
                            flex
                            gap-2
                            text-xs
                            text-indigo-700
                          "
                        >

                          <FaCheckCircle
                            className="
                              text-indigo-500
                              mt-0.5
                              flex-shrink-0
                            "
                          />

                          {text}

                        </div>

                      )
                    )}

                  </div>


                  <div
                    className="
                      text-xs
                      bg-green-50
                      border
                      border-green-200
                      text-green-700
                      px-3
                      py-2
                      rounded-xl
                    "
                  >
                    🔒 Secure payment · Powered by Razorpay
                  </div>

                </ModalBody>


                <ModalFooter
                  className="
                    gap-2
                    border-t
                    border-slate-100
                  "
                >

                  <Button
                    variant="light"
                    onPress={
                      onInstrClose
                    }
                    className="
                      text-slate-500
                      text-sm
                    "
                  >
                    Cancel
                  </Button>


                  <Button
                    onPress={() => {

                      onInstrClose();

                      handleRazorpayPayment();

                    }}
                    className="
                      text-white
                      font-bold
                      rounded-xl
                      text-sm
                      px-6
                    "
                    style={{
                      background:
                        "linear-gradient(135deg,#4f46e5,#2563eb)",
                    }}
                  >
                    Continue →
                  </Button>

                </ModalFooter>

              </>

            )}

          </ModalContent>

        </Modal>


        {/* =======================================================
            COD CONFIRM MODAL
        ======================================================= */}

        <Modal
          isOpen={
            isCodConfirmOpen
          }
          onClose={
            onCodConfirmClose
          }
          placement="center"
          backdrop="blur"
          hideCloseButton
          className="z-[9999]"
        >

          <ModalContent
            className="
              rounded-2xl
              border
              border-amber-100
              shadow-xl
              bg-white
              max-w-sm
              mx-auto
            "
          >

            {() => (

              <>

                <div
                  className="
                    h-1
                    bg-gradient-to-r
                    from-amber-400
                    to-orange-400
                    rounded-t-2xl
                  "
                />


                <ModalHeader
                  className="
                    flex
                    items-center
                    gap-2
                    text-slate-800
                    font-bold
                    text-sm
                    border-b
                    border-slate-100
                  "
                >

                  <FaWallet
                    className="
                      text-amber-500
                    "
                  />

                  Confirm COD Order

                </ModalHeader>


                <ModalBody
                  className="
                    py-4
                    space-y-2
                  "
                >

                  <p
                    className="
                      text-sm
                      text-slate-600
                    "
                  >

                    You selected{" "}

                    <span
                      className="
                        font-bold
                        text-slate-800
                      "
                    >
                      Cash on Delivery
                    </span>

                    .

                  </p>


                  <p
                    className="
                      text-xs
                      text-slate-500
                    "
                  >

                    Confirmation will be sent to{" "}

                    <span
                      className="
                        text-indigo-600
                        font-semibold
                      "
                    >
                      {address.email}
                    </span>

                  </p>


                  <div
                    className="
                      bg-amber-50
                      border
                      border-amber-200
                      rounded-xl
                      px-3
                      py-2
                      text-xs
                      text-amber-700
                    "
                  >
                    💡 Keep cash ready at time of delivery
                  </div>

                </ModalBody>


                <ModalFooter
                  className="
                    gap-2
                    border-t
                    border-slate-100
                  "
                >

                  <Button
                    variant="light"
                    onPress={
                      onCodConfirmClose
                    }
                    className="
                      text-slate-500
                      text-sm
                    "
                  >
                    Cancel
                  </Button>


                  <Button
                    onPress={async () => {

                      onCodConfirmClose();

                      await completeOrder(
                        "COD"
                      );

                    }}
                    className="
                      text-white
                      font-bold
                      rounded-xl
                      text-sm
                      px-6
                      bg-amber-500
                      hover:bg-amber-600
                    "
                  >
                    Confirm Order
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
