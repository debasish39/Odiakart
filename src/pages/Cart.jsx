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
    label: "Delivery",
    icon: <AiFillEnvironment size={16} />,
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
     SUBTOTAL AFTER PRODUCT DISCOUNT
  ======================================================= */

  const subtotalAfterDiscount =
    roundMoney(
      Math.max(
        0,
        totalPrice -
        itemDiscount
      )
    );


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
     FINAL TOTAL
  ======================================================= */

  const calculatedTotal =
    roundMoney(

      Math.max(
        0,
        amountBeforeCoupon -
        Number(couponDiscount || 0)
      )

    );


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

        setFinalTotal(
          roundMoney(
            Math.max(
              0,
              amountBeforeCoupon -
              discount
            )
          )
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

      const itemDiscount =
        Number(item.discount || 0);

      return (
        sum +
        Math.max(
          0,
          itemGross - itemDiscount
        )
      );
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


const orderFinalTotal = roundMoney(
  Math.max(
    0,
    orderTotalBeforeCoupon -
      orderCouponDiscount
  )
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

        @import url(
          'https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
        );


        :root {

          --ind:#4f46e5;

          --blue:#2563eb;

          --lt:#eef2ff;

          --bdr:
            rgba(99,102,241,0.15);

        }


        .cart-root * {

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

        }


        .cart-serif {

          font-family:
            'Clash Display',
            sans-serif;

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

      `}</style>


      {/* ===================================================
          ROOT
      =================================================== */}

      <div
        className="
          cart-root
          min-h-screen
          mb-9
          sm:mb-0
          relative
          overflow-x-hidden
        "
        style={{
          background:
            "linear-gradient(135deg,#eef2ff 0%,#f0f4ff 40%,#ffffff 100%)",
        }}
      >


        {/* BACKGROUND BLOBS */}

        <div
          className="
            blob
            pointer-events-none
            fixed
            -top-32
            -left-32
            w-96
            h-96
            opacity-30
            blur-3xl
          "
          style={{
            background:
              "radial-gradient(circle,#c7d2fe,transparent)",
          }}
        />


        <div
          className="
            blob2
            pointer-events-none
            fixed
            -bottom-24
            -right-24
            w-80
            h-80
            opacity-20
            blur-3xl
          "
          style={{
            background:
              "radial-gradient(circle,#bfdbfe,transparent)",
          }}
        />


        <div
          className="
            pointer-events-none
            fixed
            inset-0
            opacity-[0.025]
          "
          style={{
            backgroundImage:
              "radial-gradient(circle,#4f46e5 1px,transparent 1px)",

            backgroundSize:
              "28px 28px",
          }}
        />


        <div
          className="
            relative
            z-10
            max-w-7xl
            mx-auto
            px-4
            py-10
          "
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
                className="
                  flex
                  items-center
                  justify-center
                  mb-10
                "
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
                  TRUST STRIP
              ================================================= */}

              <div className="cart-trust-strip mb-7">
                <div className="cart-trust-item"><span>🔒</span><div><strong>Secure checkout</strong><small>Your data is protected</small></div></div>
                <div className="cart-trust-item"><span>🚚</span><div><strong>Reliable delivery</strong><small>Track your order easily</small></div></div>
                <div className="cart-trust-item"><span>↩️</span><div><strong>Easy returns</strong><small>Simple return experience</small></div></div>
                <div className="cart-trust-item hidden sm:flex"><span>💳</span><div><strong>Safe payments</strong><small>Powered by Razorpay</small></div></div>
              </div>


              {/* =================================================
                  STEP 1 — CART
              ================================================= */}

              {step === 1 && (

                <div
                  className="
                    step-panel
                    step-one-panel
                    space-y-5
                  "
                >

                  {/* HEADER */}

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      mb-2
                    "
                  >

                    <h2
                      className="
                        cart-serif
                        text-2xl
                        font-bold
                        text-indigo-900
                      "
                    >

                      My Cart

                      <span
                        className="
                          text-indigo-400
                          text-lg
                        "
                      >
                        {" "}
                        ({cartItem.length})
                      </span>

                    </h2>


                    <button
                      onClick={() =>
                        navigate(
                          "/order-history"
                        )
                      }
                      className="
                        btn-secondary
                        px-4
                        py-2
                        text-xs
                      "
                    >

                      <FaHistory
                        size={14}
                      />

                      View Orders

                    </button>

                  </div>


                  {/* =================================================
                      UNAVAILABLE PRODUCTS
                  ================================================= */}

                  {serviceability.checked &&
                    serviceability
                      .unavailableItems
                      .length > 0 && (

                    <div
                      className="
                        rounded-2xl
                        border-2
                        border-rose-200
                        bg-rose-50
                        p-4
                        sm:p-5
                      "
                    >

                      <div
                        className="
                          flex
                          items-start
                          gap-3
                        "
                      >

                        <div
                          className="
                            w-10
                            h-10
                            rounded-xl
                            bg-rose-100
                            text-rose-600
                            flex
                            items-center
                            justify-center
                            flex-shrink-0
                          "
                        >

                          <FaRegTrashAlt
                            size={15}
                          />

                        </div>


                        <div
                          className="
                            flex-1
                            min-w-0
                          "
                        >

                          <p
                            className="
                              text-sm
                              sm:text-base
                              font-bold
                              text-rose-800
                            "
                          >
                            ⚠️ Some products cannot be delivered
                          </p>


                          <p
                            className="
                              text-xs
                              sm:text-sm
                              text-rose-600
                              mt-1
                            "
                          >

                            The following product(s)
                            cannot be delivered to PIN code{" "}

                            <strong>
                              {
                                serviceability.postalCode
                              }
                            </strong>

                          </p>


                          <p
                            className="
                              text-xs
                              text-rose-500
                              mt-1
                            "
                          >
                            You can remove the product
                            or change your delivery PIN.
                          </p>

                        </div>

                      </div>


                      <div
                        className="
                          mt-4
                          space-y-3
                        "
                      >

                        {serviceability
                          .unavailableItems
                          .map(
                            (
                              unavailable,
                              index
                            ) => {

                              const productId =
                                unavailable?.productId?._id ||
                                unavailable?.productId ||
                                unavailable?._id ||
                                unavailable?.product?._id;


                              const backendVariantSku =
                                unavailable?.variantSku ||
                                unavailable?.variant?.sku ||
                                "";


                              const cartProduct =
                                cartItem.find(
                                  (cart) => {

                                    if (
                                      String(
                                        cart.productId
                                      ) !==
                                      String(
                                        productId
                                      )
                                    ) {

                                      return false;

                                    }


                                    if (
                                      !backendVariantSku
                                    ) {

                                      return true;

                                    }


                                    return (
                                      String(
                                        cart.variantSku ||
                                        ""
                                      ) ===
                                      String(
                                        backendVariantSku
                                      )
                                    );

                                  }
                                );


                              const variantSku =
                                backendVariantSku ||
                                cartProduct?.variantSku ||
                                "";


                              const itemKey =
                                `${productId}-${variantSku || "default"}`;


                              const title =
                                unavailable?.title ||
                                unavailable?.name ||
                                unavailable?.product?.title ||
                                unavailable?.product?.name ||
                                cartProduct?.title ||
                                "Unavailable product";


                              const image =
                                unavailable?.image ||
                                unavailable?.thumbnail ||
                                unavailable?.product?.image ||
                                cartProduct?.image ||
                                "";


                              const reason =
                                unavailable?.message ||
                                unavailable?.reason ||
                                "This product cannot be delivered to your PIN code.";


                              return (

                                <div
                                  key={`${itemKey}-${index}`}
                                  className="
                                    rounded-xl
                                    border
                                    border-rose-100
                                    bg-white
                                    p-3
                                  "
                                >

                                  <div
                                    className="
                                      flex
                                      items-center
                                      gap-3
                                    "
                                  >

                                    {image ? (

                                      <img
                                        src={image}
                                        alt={title}
                                        className="
                                          w-16
                                          h-16
                                          rounded-lg
                                          object-cover
                                          border
                                          border-slate-100
                                          flex-shrink-0
                                        "
                                      />

                                    ) : (

                                      <div
                                        className="
                                          w-16
                                          h-16
                                          rounded-lg
                                          bg-slate-100
                                          flex
                                          items-center
                                          justify-center
                                          text-slate-400
                                          flex-shrink-0
                                        "
                                      >

                                        <GiShoppingBag
                                          size={20}
                                        />

                                      </div>

                                    )}


                                    <div
                                      className="
                                        flex-1
                                        min-w-0
                                      "
                                    >

                                      <p
                                        className="
                                          text-sm
                                          font-bold
                                          text-slate-800
                                          line-clamp-2
                                        "
                                      >
                                        {title}
                                      </p>


                                      {variantSku && (

                                        <p
                                          className="
                                            text-[11px]
                                            text-slate-400
                                            mt-1
                                          "
                                        >
                                          Variant:
                                          {" "}
                                          {variantSku}
                                        </p>

                                      )}


                                      <p
                                        className="
                                          text-xs
                                          text-rose-600
                                          font-medium
                                          mt-1
                                        "
                                      >
                                        ❌ {reason}
                                      </p>

                                    </div>

                                  </div>


                                  <div
                                    className="
                                      grid
                                      grid-cols-2
                                      gap-2
                                      mt-3
                                    "
                                  >

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveUnavailable(
                                          {
                                            ...unavailable,
                                            productId,
                                            variantSku,
                                          }
                                        )
                                      }
                                      disabled={
                                        removingUnavailable ===
                                        itemKey
                                      }
                                      className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-1.5
                                        rounded-xl
                                        bg-rose-600
                                        px-3
                                        py-2.5
                                        text-xs
                                        font-bold
                                        text-white
                                        hover:bg-rose-700
                                        transition-all
                                        disabled:opacity-50
                                        disabled:cursor-not-allowed
                                      "
                                    >

                                      <FaRegTrashAlt
                                        size={11}
                                      />

                                      {removingUnavailable ===
                                      itemKey
                                        ? "Removing..."
                                        : "Remove"}

                                    </button>


                                    <button
                                      type="button"
                                      onClick={() => {

                                        setServiceability(
                                          (prev) => ({

                                            ...prev,

                                            checked:
                                              false,

                                            checking:
                                              false,

                                            serviceableItems:
                                              [],

                                            unavailableItems:
                                              [],

                                            message:
                                              "",

                                          })
                                        );


                                        setStep(2);


                                        toast.info(
                                          "Change your PIN code to check delivery availability."
                                        );

                                      }}
                                      className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-1.5
                                        rounded-xl
                                        border
                                        border-indigo-200
                                        bg-indigo-50
                                        px-3
                                        py-2.5
                                        text-xs
                                        font-bold
                                        text-indigo-600
                                        hover:bg-indigo-100
                                        transition-all
                                      "
                                    >

                                      <MdMyLocation
                                        size={13}
                                      />

                                      Change PIN

                                    </button>

                                  </div>

                                </div>

                              );

                            }
                          )}

                      </div>


                      <div
                        className="
                          mt-4
                          rounded-xl
                          border
                          border-indigo-100
                          bg-indigo-50
                          px-3
                          py-3
                          text-xs
                          text-indigo-600
                        "
                      >
                        💡{" "}
                        <strong>
                          Tip:
                        </strong>{" "}
                        If you have another delivery
                        address, try its PIN code.
                        Otherwise, remove the unavailable product.
                      </div>

                    </div>

                  )}


                  {/* =================================================
                      CART ITEMS
                  ================================================= */}

                  {cartItem.map(
                    (item) => {

                      const itemUnavailable =
                        serviceability
                          .unavailableItems
                          .some(
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


                              return (

                                String(
                                  uProductId
                                ) ===
                                String(
                                  item.productId
                                ) &&

                                (
                                  !uSku ||

                                  String(
                                    uSku
                                  ) ===
                                  String(
                                    item.variantSku ||
                                    ""
                                  )
                                )

                              );

                            }
                          );


                      return (

                        <div
                          key={
                            `${item.productId}-${item.variantSku || "default"}`
                          }
                          className={`
                            cart-card
                            cart-item-card
                            flex
                            flex-col
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                            gap-4
                            p-4
                            sm:p-5

                            ${
                              itemUnavailable
                                ? "border-2 border-rose-300 bg-rose-50/40"
                                : ""
                            }
                          `}
                        >

                          <div
                            className="
                              flex
                              items-center
                              gap-4
                              flex-1
                              cursor-pointer
                            "
                            onClick={() =>
                              navigate(
                                `/products/${item.productId}`
                              )
                            }
                          >

                            <div
                              className="
                                relative
                                flex-shrink-0
                              "
                            >

                              <img
                                src={
                                  item.image ||
                                  item.thumbnail ||
                                  item.images?.[0] ||
                                  ""
                                }
                                alt={
                                  item.title
                                }
                                className="
                                  w-20
                                  h-20
                                  rounded-xl
                                  object-cover
                                  border
                                  border-indigo-100
                                "
                              />


                              {itemUnavailable && (

                                <span
                                  className="
                                    absolute
                                    -top-2
                                    -right-2
                                    rounded-full
                                    bg-rose-600
                                    px-2
                                    py-1
                                    text-[8px]
                                    font-extrabold
                                    text-white
                                    shadow-sm
                                  "
                                >
                                  NOT DELIVERABLE
                                </span>

                              )}

                            </div>


                            <div
                              className="
                                min-w-0
                              "
                            >

                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  text-slate-800
                                  line-clamp-2
                                  hover:text-indigo-600
                                  transition-colors
                                "
                              >
                                {item.title}
                              </p>


                              {itemUnavailable && (

                                <p
                                  className="
                                    text-xs
                                    font-semibold
                                    text-rose-600
                                    mt-1
                                  "
                                >
                                  ❌ Cannot be delivered to{" "}
                                  {
                                    serviceability.postalCode
                                  }
                                </p>

                              )}


                              <p
                                className="
                                  flex
                                  items-center
                                  text-indigo-600
                                  font-bold
                                  text-base
                                  mt-1
                                "
                              >

                                <FaRupeeSign
                                  size={11}
                                />

                                {Number(
                                  item.price || 0
                                ).toFixed(2)}

                              </p>

                            </div>

                          </div>


                          <div
                            className="
                              flex
                              items-center
                              gap-3
                              justify-end
                            "
                          >

                            <div
                              className="
                                qty-wrap
                              "
                            >

                              <button
                                className="
                                  qty-btn
                                "
                                onClick={(e) => {

                                  e.stopPropagation();

                                  handleDecrease(
                                    item.productId,
                                    item.quantity,
                                    item.variantSku
                                  );

                                }}
                              >

                                <AiOutlineMinus
                                  size={12}
                                />

                              </button>


                              <span
                                className="
                                  text-sm
                                  font-bold
                                  text-slate-800
                                  w-5
                                  text-center
                                "
                              >
                                {item.quantity}
                              </span>


                              <button
                                className="
                                  qty-btn
                                "
                                onClick={(e) => {

                                  e.stopPropagation();

                                  increaseQty(
                                    item.productId,
                                    item.variantSku
                                  );

                                }}
                              >

                                <AiOutlinePlus
                                  size={12}
                                />

                              </button>

                            </div>


                            <button
                              onClick={(e) => {

                                e.stopPropagation();


                                setSelectedItem({

                                  productId:
                                    item.productId,

                                  variantSku:
                                    item.variantSku ||
                                    "",

                                });


                                onDeleteOpen();

                              }}
                              className="
                                w-9
                                h-9
                                rounded-xl
                                flex
                                items-center
                                justify-center
                                border
                                border-slate-200
                                bg-white
                                text-slate-400
                                hover:border-red-400
                                hover:text-red-500
                                hover:bg-red-50
                                transition-all
                              "
                            >

                              <FaRegTrashAlt
                                size={13}
                              />

                            </button>

                          </div>

                        </div>

                      );

                    }
                  )}


                  {/* =================================================
                      ORDER SUMMARY
                  ================================================= */}

                  <div
                    className="
                      cart-card
                      cart-summary-card
                      p-5
                    "
                  >

                    <p
                      className="
                        text-xs
                        font-bold
                        tracking-widest
                        text-indigo-400
                        uppercase
                        mb-4
                      "
                    >
                      Order Summary
                    </p>


                    <div
                      className="
                        space-y-2.5
                      "
                    >

                      <div className="s-row">

                        <span>
                          🧾 Subtotal
                        </span>

                        <span
                          className="
                            font-semibold
                            text-slate-700
                          "
                        >
                          ₹
                          {subtotalAfterDiscount.toFixed(2)}
                        </span>

                      </div>


                      <div className="s-row">

                        <span>
                          🧾 Tax
                        </span>

                        <span
                          className="
                            font-semibold
                            text-slate-700
                          "
                        >
                          ₹
                          {itemTax.toFixed(2)}
                        </span>

                      </div>


                      <div className="s-row">

                        <span>
                          🏷️ Discount
                        </span>

                        <span
                          className="
                            font-semibold
                            text-emerald-600
                          "
                        >
                          -₹
                          {itemDiscount.toFixed(2)}
                        </span>

                      </div>


                      {couponDiscount > 0 && (

                        <div className="s-row">

                          <span>
                            🎟️ Coupon
                          </span>

                          <span
                            className="
                              font-semibold
                              text-emerald-600
                            "
                          >
                            -₹
                            {Number(
                              couponDiscount
                            ).toFixed(2)}
                          </span>

                        </div>

                      )}


                      <div className="s-row">

                        <span>
                          🚚 Delivery
                        </span>

                        <span
                          className="
                            text-green-600
                            font-semibold
                            text-xs
                          "
                        >
                          FREE
                        </span>

                      </div>


                      <div className="s-row">

                        <span
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >

                          <GiShoppingBag
                            size={13}
                          />

                          Handling

                        </span>


                        <span
                          className="
                            font-semibold
                            text-slate-700
                          "
                        >
                          ₹
                          {shippingCharge.toFixed(2)}
                        </span>

                      </div>


                      <div
                        className="
                          border-t
                          pt-3
                          flex
                          justify-between
                        "
                      >

                        <span
                          className="
                            font-bold
                            text-slate-800
                          "
                        >
                          Total
                        </span>


                        <span
                          className="
                            flex
                            items-center
                            font-extrabold
                            text-lg
                            text-indigo-600
                          "
                        >

                          <FaRupeeSign
                            size={13}
                            className="mr-1"
                          />

                          {Number(
                            finalTotal || 0
                          ).toFixed(2)}

                        </span>

                      </div>

                    </div>

                  </div>


                  {/* =================================================
                      CONTINUE
                  ================================================= */}

                  <button
                    onClick={() => {

                      if (
                        !canProceedStep1
                      ) {
                        return;
                      }


                      if (
                        serviceability.checked &&
                        serviceability
                          .unavailableItems
                          .length > 0
                      ) {

                        toast.warning(
                          "Remove unavailable products or change your PIN code first."
                        );

                        return;

                      }


                      setStep(2);

                    }}
                    disabled={

                      !canProceedStep1 ||

                      (
                        serviceability.checked &&
                        serviceability
                          .unavailableItems
                          .length > 0
                      )

                    }
                    className="
                      btn-primary
                      w-full
                      py-4
                      text-sm
                    "
                  >

                    <span
                      className="
                        relative
                        z-10
                      "
                    >

                      {
                        serviceability.checked &&
                        serviceability
                          .unavailableItems
                          .length > 0

                          ? "Remove unavailable products to continue"

                          : "Continue to Delivery"
                      }

                    </span>


                    <IoArrowForward
                      size={16}
                      className="
                        relative
                        z-10
                      "
                    />

                  </button>

                </div>

              )}


              {/* =================================================
                  STEP 2 — DELIVERY
              ================================================= */}

              {step === 2 && (

                <div
                  className="
                    step-panel
                  "
                >

                  <h2
                    className="
                      cart-serif
                      text-2xl
                      font-bold
                      text-indigo-900
                      mb-6
                    "
                  >

                    <span
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >

                      <AiFillEnvironment
                        className="
                          text-indigo-600
                        "
                      />

                      Delivery Information

                    </span>

                  </h2>


                  <div
                    className="
                      cart-card
                      p-6
                      sm:p-8
                      space-y-4
                    "
                  >

                    {/* HEADER */}

                    <div
                      className="
                        flex
                        items-center
                        gap-3
                        border-b
                        border-indigo-50
                        pb-4
                        mb-2
                      "
                    >

                      <div
                        className="
                          w-10
                          h-10
                          rounded-xl
                          bg-indigo-50
                          border
                          border-indigo-100
                          flex
                          items-center
                          justify-center
                          text-xl
                        "
                      >

                        <GiShoppingBag
                          className="
                            text-indigo-600
                          "
                          size={20}
                        />

                      </div>


                      <div>

                        <p
                          className="
                            font-bold
                            text-indigo-900
                            text-sm
                          "
                        >
                          Shipping Details
                        </p>


                        <p
                          className="
                            text-xs
                            text-slate-400
                          "
                        >
                          Where should we deliver?
                        </p>

                      </div>

                    </div>


                    {/* =================================================
                        SAVED DELIVERY ADDRESS — REQUIRED
                    ================================================= */}

                    {addressLoading ? (

                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 text-sm text-indigo-700">
                        Loading your saved delivery addresses...
                      </div>

                    ) : savedAddresses.length === 0 ? (

                      <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-5 space-y-4">

                        <div>
                          <p className="text-sm font-bold text-indigo-900">
                            Add a saved delivery address
                          </p>

                          <p className="text-xs text-slate-500 mt-1 leading-5">
                            Checkout uses a saved address so the delivery
                            location stays separate from your current pickup location.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={redirectToSavedAddresses}
                          className="btn-primary w-full py-3 text-sm"
                        >
                          Add Delivery Address →
                        </button>

                      </div>

                    ) : (

                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-indigo-900">
                              Select Delivery Address
                            </p>

                            <p className="text-xs text-slate-500 mt-0.5">
                              Select the saved address where this order should be delivered.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={redirectToSavedAddresses}
                            className="btn-secondary px-3 py-2 text-xs whitespace-nowrap"
                          >
                            Manage Addresses
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                          {savedAddresses.map((saved) => {

                            const active =
                              String(selectedAddressId) === String(saved._id);

                            return (
                              <div
                                key={saved._id}
                                className={`rounded-2xl border p-4 transition ${
                                  active
                                    ? "border-indigo-500 bg-white shadow-md"
                                    : "border-slate-200 bg-white hover:border-indigo-200"
                                }`}
                              >

                                <button
                                  type="button"
                                  onClick={() => fillAddressFromSaved(saved)}
                                  className="w-full text-left"
                                >

                                  <div className="flex items-start justify-between gap-3">

                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700">
                                        {saved.label || "Address"}
                                      </span>

                                      {saved.isDefault && (
                                        <span className="text-[10px] font-bold text-emerald-600">
                                          DEFAULT
                                        </span>
                                      )}
                                    </div>

                                    {active && (
                                      <FaCheckCircle className="text-indigo-600" />
                                    )}

                                  </div>

                                  <p className="text-sm font-bold text-slate-800 mt-3">
                                    {saved.fullName || "Customer"}
                                  </p>

                                  <p className="text-xs text-slate-500 mt-1 leading-5">
                                    {saved.addressLine1}
                                    {saved.addressLine2 ? `, ${saved.addressLine2}` : ""}
                                    {saved.area ? `, ${saved.area}` : ""}
                                    {saved.city ? `, ${saved.city}` : ""}
                                    {saved.district ? `, ${saved.district}` : ""}
                                    {saved.state ? `, ${saved.state}` : ""}
                                    {saved.postalCode ? ` - ${saved.postalCode}` : ""}
                                  </p>

                                  <p className="text-xs text-slate-500 mt-2">
                                    +91 {saved.phone || ""}
                                  </p>

                                </button>

                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">

                                  <button
                                    type="button"
                                    onClick={() => startEditAddress(saved)}
                                    className="text-xs font-semibold text-indigo-600 hover:underline"
                                  >
                                    Edit in Saved Addresses
                                  </button>

                                  {!saved.isDefault && (
                                    <button
                                      type="button"
                                      onClick={() => setDefaultSavedAddress(saved._id)}
                                      className="text-xs font-semibold text-emerald-600 hover:underline"
                                    >
                                      Set Default
                                    </button>
                                  )}

                                </div>

                              </div>
                            );
                          })}

                        </div>

                        {!selectedAddressId && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-700">
                            Please select an address before continuing.
                          </div>
                        )}

                      </div>

                    )}

                    {/* NAME */}

                    <div>

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          mb-1.5
                        "
                      >

                        <label
                          className="
                            text-xs
                            font-semibold
                            text-slate-600
                          "
                        >

                          <span
                            className="
                              flex
                              items-center
                              gap-1
                            "
                          >

                            <FaUser
                              className="
                                text-indigo-500
                              "
                              size={12}
                            />

                            Full Name

                          </span>

                        </label>


                        <span className="req-badge">
                          Required
                        </span>

                      </div>


                      <input
                        className="f-input-bare"
                        type="text"
                        placeholder="e.g. Bom Bhole"
                        value={
                          address.name
                        }
                        onChange={(e) =>
                          setAddress({
                            ...address,
                            name:
                              e.target.value,
                          })
                        }
                      />

                    </div>


                    {/* EMAIL */}

                    <div>

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          mb-1.5
                        "
                      >

                        <label
                          className="
                            text-xs
                            font-semibold
                            text-slate-600
                          "
                        >

                          <span
                            className="
                              flex
                              items-center
                              gap-1
                            "
                          >

                            <FaEnvelope
                              className="
                                text-indigo-500
                              "
                              size={12}
                            />

                            Email Address

                          </span>

                        </label>


                        <span className="req-badge">
                          Required
                        </span>


                        {emailTouched && (

                          <span
                            className={`
                              check-in
                              text-xs
                              font-semibold
                              flex
                              items-center
                              gap-1

                              ${
                                emailValid
                                  ? "text-emerald-600"
                                  : "text-rose-500"
                              }
                            `}
                          >

                            {emailValid
                              ? "✅ Valid"
                              : "❌ Invalid"}

                          </span>

                        )}

                      </div>


                      <input
                        className={`
                          f-input-bare

                          ${
                            emailTouched &&
                            !emailValid
                              ? "error"
                              : emailTouched &&
                                emailValid
                              ? "valid"
                              : ""
                          }
                        `}
                        type="email"
                        placeholder="Account email"
                        value={
                          address.email ||
                          ""
                        }
                        onChange={(e) =>
                          setAddress({
                            ...address,
                            email:
                              e.target.value,
                          })
                        }
                      />


                      {emailTouched &&
                        !emailValid && (

                          <p
                            className="
                              text-xs
                              text-rose-500
                              mt-1
                              font-medium
                            "
                          >
                            Please enter a valid email address
                          </p>

                        )}

                    </div>


                    {/* PHONE */}

                    <div>

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          mb-1.5
                        "
                      >

                        <label
                          className="
                            text-xs
                            font-semibold
                            text-slate-600
                          "
                        >

                          <span
                            className="
                              flex
                              items-center
                              gap-1
                            "
                          >

                            <BsTelephoneFill
                              className="
                                text-indigo-500
                              "
                              size={11}
                            />

                            Phone Number

                          </span>

                        </label>


                        <span className="req-badge">
                          Required
                        </span>

                      </div>


                      <div
                        className="
                          flex
                          items-center
                          f-input-bare
                          pr-0
                          pl-0
                          overflow-hidden
                        "
                      >

                        <span
                          className="
                            text-indigo-400
                            text-sm
                            font-bold
                            flex-shrink-0
                            border-r
                            border-indigo-100
                            mr-1
                            px-3
                          "
                        >
                          +91
                        </span>


                        <input
                          type="tel"
                          name="phone"
                          placeholder="10-digit mobile number"
                          maxLength="10"
                          inputMode="numeric"
                          value={
                            address.phone ||
                            ""
                          }
                          onChange={(e) => {

                            const value =
                              e.target.value
                                .replace(
                                  /[^0-9]/g,
                                  ""
                                )
                                .slice(
                                  0,
                                  10
                                );


                            setAddress({
                              ...address,
                              phone:
                                value,
                            });

                          }}
                          className="
                            flex-1
                            py-1
                            px-1
                            bg-transparent
                            text-slate-800
                            placeholder-indigo-200
                            focus:outline-none
                            text-sm
                          "
                        />

                      </div>

                    </div>


                    {/* STREET */}

                    <div>

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          mb-1.5
                        "
                      >

                        <label
                          className="
                            text-xs
                            font-semibold
                            text-slate-600
                          "
                        >

                          <span
                            className="
                              flex
                              items-center
                              gap-1
                            "
                          >

                            <FaMapMarkerAlt
                              className="
                                text-indigo-500
                              "
                              size={11}
                            />

                            Street Address

                          </span>

                        </label>


                        <span className="req-badge">
                          Required
                        </span>

                      </div>


                      <input
                        className="f-input-bare"
                        type="text"
                        placeholder="Street / City / Area"
                        value={
                          address.street ||
                          ""
                        }
                        onChange={(e) =>
                          setAddress({

                            ...address,

                            street:
                              e.target.value,

                            addressLine1:
                              e.target.value,

                          })
                        }
                      />

                    </div>


                    {/* ADDRESS LINE 2 */}

                    <div>

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          mb-1.5
                        "
                      >

                        <label
                          className="
                            text-xs
                            font-semibold
                            text-slate-600
                          "
                        >
                          Apartment / Flat / Building
                        </label>


                        <span className="opt-badge">
                          Optional
                        </span>

                      </div>


                      <input
                        className="f-input-bare"
                        type="text"
                        placeholder="Flat / Apartment / Building"
                        value={
                          address.addressLine2 ||
                          ""
                        }
                        onChange={(e) =>
                          setAddress({
                            ...address,
                            addressLine2:
                              e.target.value,
                          })
                        }
                      />

                    </div>


                    {/* AREA */}

                    <div>

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          mb-1.5
                        "
                      >

                        <label
                          className="
                            text-xs
                            font-semibold
                            text-slate-600
                          "
                        >
                          Area / Locality
                        </label>


                        <span className="req-badge">
                          Required
                        </span>

                      </div>


                      <input
                        className="f-input-bare"
                        type="text"
                        placeholder="e.g. Saheed Nagar"
                        value={
                          address.area ||
                          ""
                        }
                        onChange={(e) =>
                          setAddress({
                            ...address,
                            area:
                              e.target.value,
                          })
                        }
                      />

                    </div>


                    {/* VILLAGE */}

                    <div>

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          mb-1.5
                        "
                      >
                        <label
                          className="
                            text-xs
                            font-semibold
                            text-slate-600
                          "
                        >
                          Village
                        </label>

                        <span className="opt-badge">
                          Optional
                        </span>
                      </div>

                      <input
                        className="f-input-bare"
                        type="text"
                        placeholder="e.g. Village name"
                        value={address.village || ""}
                        onChange={(e) =>
                          setAddress({
                            ...address,
                            village: e.target.value,
                          })
                        }
                      />
                    </div>


                    {/* LANDMARK */}

                    <div>

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          mb-1.5
                        "
                      >

                        <label
                          className="
                            text-xs
                            font-semibold
                            text-slate-600
                          "
                        >
                          Landmark
                        </label>


                        <span className="opt-badge">
                          Optional
                        </span>

                      </div>


                      <input
                        className="f-input-bare"
                        type="text"
                        placeholder="e.g. Near XYZ Mall"
                        value={
                          address.landmark ||
                          ""
                        }
                        onChange={(e) =>
                          setAddress({
                            ...address,
                            landmark:
                              e.target.value,
                          })
                        }
                      />

                    </div>


                    {/* CITY + DISTRICT */}

                    <div
                      className="
                        grid
                        grid-cols-1
                        sm:grid-cols-2
                        gap-3
                      "
                    >

                      <div>

                        <div
                          className="
                            flex
                            items-center
                            gap-1.5
                            mb-1.5
                          "
                        >

                          <label
                            className="
                              text-xs
                              font-semibold
                              text-slate-600
                            "
                          >
                            City
                          </label>


                          <span className="req-badge">
                            Required
                          </span>

                        </div>


                        <input
                          className="f-input-bare"
                          type="text"
                          placeholder="e.g. Bhubaneswar"
                          value={
                            address.city ||
                            ""
                          }
                          onChange={(e) =>
                            setAddress({
                              ...address,
                              city:
                                e.target.value,
                            })
                          }
                        />

                      </div>


                      <div>

                        <div
                          className="
                            flex
                            items-center
                            gap-1.5
                            mb-1.5
                          "
                        >

                          <label
                            className="
                              text-xs
                              font-semibold
                              text-slate-600
                            "
                          >
                            District
                          </label>


                          <span className="req-badge">
                            Required
                          </span>

                        </div>


                        <input
                          className="f-input-bare"
                          type="text"
                          placeholder="e.g. Khordha"
                          value={
                            address.district ||
                            ""
                          }
                          onChange={(e) =>
                            setAddress({
                              ...address,
                              district:
                                e.target.value,
                            })
                          }
                        />

                      </div>

                    </div>


                    {/* STATE + PIN */}

                    <div
                      className="
                        grid
                        grid-cols-2
                        gap-3
                      "
                    >

                      <div>

                        <div
                          className="
                            flex
                            items-center
                            gap-1.5
                            mb-1.5
                          "
                        >

                          <label
                            className="
                              text-xs
                              font-semibold
                              text-slate-600
                            "
                          >

                            <span
                              className="
                                flex
                                items-center
                                gap-1
                              "
                            >

                              <MdLocationCity
                                className="
                                  text-indigo-500
                                "
                                size={13}
                              />

                              State

                            </span>

                          </label>


                          <span className="req-badge">
                            Required
                          </span>

                        </div>


                        <input
                          className="f-input-bare"
                          type="text"
                          placeholder="e.g. Odisha"
                          value={
                            address.state ||
                            ""
                          }
                          onChange={(e) =>
                            setAddress({
                              ...address,
                              state:
                                e.target.value,
                            })
                          }
                        />

                      </div>


                      <div>

                        <div
                          className="
                            flex
                            items-center
                            gap-1.5
                            mb-1.5
                          "
                        >

                          <label
                            className="
                              text-xs
                              font-semibold
                              text-slate-600
                            "
                          >

                            <span
                              className="
                                flex
                                items-center
                                gap-1
                              "
                            >

                              <MdMyLocation
                                className="
                                  text-indigo-500
                                "
                                size={13}
                              />

                              Post Code

                            </span>

                          </label>


                          <span className="req-badge">
                            Required
                          </span>

                        </div>


                        <input
                          className="f-input-bare"
                          type="text"
                          placeholder="e.g. 751001"
                          maxLength="6"
                          inputMode="numeric"
                          value={
                            address.postcode ||
                            ""
                          }
                          onChange={handlePostalCodeChange}
                        />

                        {postalLookupLoading && (
                          <p className="mt-1.5 text-xs text-indigo-600">
                            🔎 Finding address details for PIN {address.postcode}...
                          </p>
                        )}

                      </div>

                    </div>


                    {/* =================================================
                        SERVICEABILITY STATUS
                    ================================================= */}

                    {serviceability.checking && (

                      <div
                        className="
                          rounded-2xl
                          border
                          border-indigo-100
                          bg-indigo-50
                          px-4
                          py-3
                          text-sm
                          text-indigo-700
                        "
                      >
                        🚚 Checking delivery availability for PIN{" "}
                        {address.postcode}...
                      </div>

                    )}


                    {serviceability.checked &&
                      serviceability
                        .unavailableItems
                        .length === 0 && (

                      <div
                        className="
                          rounded-2xl
                          border
                          border-emerald-200
                          bg-emerald-50
                          px-4
                          py-3
                        "
                      >

                        <p
                          className="
                            text-sm
                            font-bold
                            text-emerald-700
                          "
                        >
                          ✅ Delivery available to{" "}
                          {
                            serviceability.postalCode
                          }
                        </p>


                        <p
                          className="
                            text-xs
                            text-emerald-600
                            mt-1
                          "
                        >
                          All products in your cart
                          can be delivered to this PIN code.
                        </p>

                      </div>

                    )}


                    {/* =================================================
                        CHECK DELIVERY BUTTON
                    ================================================= */}

                    <button
                      type="button"
                      onClick={
                        checkServiceability
                      }
                      disabled={
                        serviceability.checking ||
                        !/^[1-9][0-9]{5}$/.test(
                          String(
                            address.postcode ||
                            ""
                          )
                        )
                      }
                      className="
                        btn-secondary
                        w-full
                        py-3
                        text-sm
                        disabled:opacity-50
                      "
                    >

                      <MdMyLocation
                        size={16}
                      />

                      {serviceability.checking
                        ? "Checking..."
                        : serviceability.checked
                        ? "Check Again"
                        : "Check Delivery Availability"}

                    </button>


                    {/* COUNTRY */}

                    <div>

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          mb-1.5
                        "
                      >

                        <label
                          className="
                            text-xs
                            font-semibold
                            text-slate-600
                          "
                        >

                          <span
                            className="
                              flex
                              items-center
                              gap-1
                            "
                          >

                            <AiFillEnvironment
                              className="
                                text-indigo-500
                              "
                              size={13}
                            />

                            Country

                          </span>

                        </label>


                        <span className="req-badge">
                          Required
                        </span>

                      </div>


                      <input
                        className="f-input-bare"
                        type="text"
                        placeholder="e.g. India"
                        value={
                          address.country ||
                          "India"
                        }
                        onChange={(e) =>
                          setAddress({
                            ...address,
                            country:
                              e.target.value,
                          })
                        }
                      />

                    </div>


                    {/* DELIVERY ADDRESS MUST COME FROM SAVED ADDRESSES */}

                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                      Delivery address is taken only from the selected saved address.
                      Your current GPS location should be used only as the pickup location.
                    </div>

                  </div>


                  {/* =================================================
                      DELIVERY ACTIONS
                  ================================================= */}

                  <div
                    className="
                      flex
                      gap-3
                      mt-5
                    "
                  >

                    <button
                      onClick={() =>
                        setStep(1)
                      }
                      className="
                        btn-secondary
                        flex-1
                        py-4
                        text-sm
                      "
                    >

                      <IoArrowBack
                        size={15}
                      />

                      Back

                    </button>


                    <button
                      onClick={
                        handleContinueToPayment
                      }
                      disabled={
                        !canProceedStep2 ||
                        serviceability.checking
                      }
                      className="
                        btn-primary
                        flex-[2]
                        py-4
                        text-sm
                        disabled:opacity-50
                      "
                    >

                      <span
                        className="
                          relative
                          z-10
                        "
                      >
                        Continue to Payment
                      </span>


                      <IoArrowForward
                        size={15}
                        className="
                          relative
                          z-10
                        "
                      />

                    </button>

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 3 — PAYMENT
              ================================================= */}

              {step === 3 && (

                <div
                  className="
                    step-panel
                    space-y-6
                  "
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
                      flex
                      gap-4
                      pt-2
                    "
                  >

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
