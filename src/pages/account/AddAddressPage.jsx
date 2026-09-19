import React, { useEffect, useRef, useState } from "react";
import {
  FaHome,
  FaBriefcase,
  FaMapMarkerAlt,
  FaUser,
  FaPhoneAlt,
  FaCity,
  FaCheck,
  FaSave,
  FaArrowLeft,
  FaShieldAlt,
} from "react-icons/fa";
import { toast } from "sonner";
import { AccountShell, api } from "./AccountShell";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

/* ============================================================
   ADD ADDRESS PAGE
============================================================ */

export default function AddAddressPage() {
  const navigate = useNavigate();

  const [f, setF] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    alternatePhone: "",

    // Full Address model fields
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
    postalCode: "",
    country: "India",

    deliveryInstructions: "",
    location: {
      latitude: null,
      longitude: null,
    },
    isDefault: false,
  });

  const queryClient = useQueryClient();
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    setF((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (!f.fullName.trim()) {
      nextErrors.fullName = "Full name is required";
    }

    const phone = f.phone.replace(/\D/g, "");
    if (!f.phone.trim()) {
      nextErrors.phone = "Phone number is required";
    } else if (phone.length !== 10) {
      nextErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (!f.addressLine1.trim()) {
      nextErrors.addressLine1 = "Address is required";
    }

    if (!f.area.trim()) {
      nextErrors.area = "Area is required";
    }

    if (!f.city.trim()) {
      nextErrors.city = "City is required";
    }

    if (!f.district.trim()) {
      nextErrors.district = "District is required";
    }

    if (!f.state.trim()) {
      nextErrors.state = "State is required";
    }

    if (!/^[1-9][0-9]{5}$/.test(f.postalCode)) {
      nextErrors.postalCode = "Enter a valid 6-digit PIN code";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstField = Object.keys(nextErrors)[0];
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-field="${firstField}"]`)
          ?.focus();
      });
      return false;
    }

    return true;
  };

  const save = async () => {
    if (!validate()) return;

    const token = localStorage.getItem("token");

    // Prevent duplicate submissions while the request is in flight.
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);

    try {
      const response = await api("/api/addresses", {
        method: "POST",
        body: JSON.stringify({
          label: f.label,
          fullName: f.fullName.trim(),
          phone: f.phone.trim(),
          alternatePhone: f.alternatePhone.trim(),

          houseNumber: f.houseNumber.trim(),
          buildingName: f.buildingName.trim(),
          floor: f.floor.trim(),
          street: f.street.trim(),

          addressLine1: f.addressLine1.trim(),
          addressLine2: f.addressLine2.trim(),
          landmark: f.landmark.trim(),
          area: f.area.trim(),
          village: f.village.trim(),
          postOffice: f.postOffice.trim(),
          block: f.block.trim(),
          city: f.city.trim(),
          district: f.district.trim(),
          state: f.state.trim(),
          postalCode: f.postalCode.trim(),
          country: f.country || "India",

          deliveryInstructions: f.deliveryInstructions.trim(),

          location: {
            latitude:
              f.location?.latitude !== "" &&
              f.location?.latitude !== null &&
              f.location?.latitude !== undefined
                ? Number(f.location.latitude)
                : null,
            longitude:
              f.location?.longitude !== "" &&
              f.location?.longitude !== null &&
              f.location?.longitude !== undefined
                ? Number(f.location.longitude)
                : null,
          },

          isDefault: Boolean(f.isDefault),
        }),
      });

      // Keep the AddressesPage cache fresh when the user returns there.
      await queryClient.invalidateQueries({
        queryKey: ["addresses", token],
      });

      toast.success(
        response?.message || "Address saved successfully"
      );

      let checkoutReturn = false;

      try {
        const rawReturn = sessionStorage.getItem(
          "odicart_checkout_return"
        );

        const parsedReturn = rawReturn
          ? JSON.parse(rawReturn)
          : null;

        checkoutReturn =
          parsedReturn?.path === "/cart" &&
          Number(parsedReturn?.step) === 2;

        if (checkoutReturn) {
          sessionStorage.removeItem("odicart_checkout_return");
        }
      } catch (_) {
        checkoutReturn = false;
      }

      navigate(
        checkoutReturn
          ? "/cart"
          : "/account/addresses"
      );
    } catch (error) {
      console.error("Save address error:", error);

      toast.error(
        error?.message || "Failed to save address"
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <AddressForm
      title="Add new address"
      f={f}
      set={set}
      save={save}
      saving={saving}
      submit="Save address"
      errors={errors}
    />
  );
}

/* ============================================================
   REUSABLE ADDRESS FORM

   Can also be used by EditAddressPage.
============================================================ */

export function AddressForm({
  title,
  f,
  set,
  save,
  saving,
  submit,
  errors = {},
}) {
  const navigate = useNavigate();

  const pinInputRef = useRef(null);

  const [pinLoading, setPinLoading] = useState(false);
  const [postOffices, setPostOffices] = useState([]);

  /* ============================================================
     AUTO FOCUS PIN
  ============================================================ */

  useEffect(() => {
    const timer = setTimeout(() => {
      pinInputRef.current?.focus();
      pinInputRef.current?.select();
    }, 180);

    return () => clearTimeout(timer);
  }, []);

  /* ============================================================
     PIN LOOKUP
  ============================================================ */

  const fetchPinDetails = async (pin) => {
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      return;
    }

    setPinLoading(true);
    setPostOffices([]);

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pin}`
      );

      if (!response.ok) {
        throw new Error("PIN lookup failed");
      }

      const data = await response.json();

      if (
        !Array.isArray(data) ||
        !data[0] ||
        data[0].Status !== "Success" ||
        !Array.isArray(data[0].PostOffice) ||
        data[0].PostOffice.length === 0
      ) {
        toast.error("PIN code not found");

        set("area", "");
        set("city", "");
        set("district", "");
        set("state", "");

        return;
      }

      const offices = data[0].PostOffice;

      setPostOffices(offices);

      const firstOffice = offices[0];

      set("area", firstOffice.Name || "");

      set(
        "city",
        firstOffice.Block ||
          firstOffice.Division ||
          firstOffice.District ||
          ""
      );

      set("district", firstOffice.District || "");
      set("state", firstOffice.State || "");

      set(
        "country",
        firstOffice.Country || "India"
      );

      toast.success(
        offices.length > 1
          ? `${offices.length} locations found`
          : "Location found"
      );
    } catch (error) {
      console.error("PIN lookup error:", error);

      toast.error(
        "Unable to fetch PIN code details"
      );

      setPostOffices([]);
    } finally {
      setPinLoading(false);
    }
  };

  /* ============================================================
     PIN CHANGE
  ============================================================ */

  const handlePinChange = (value) => {
    const pin = value
      .replace(/\D/g, "")
      .slice(0, 6);

    set("postalCode", pin);

    if (pin.length < 6) {
      setPostOffices([]);

      set("area", "");
      set("city", "");
      set("district", "");
      set("state", "");

      return;
    }

    if (pin.length === 6) {
      fetchPinDetails(pin);
    }
  };

  /* ============================================================
     POST OFFICE SELECTION
  ============================================================ */

  const handlePostOfficeChange = (officeName) => {
    const selectedOffice = postOffices.find(
      (office) => office.Name === officeName
    );

    if (!selectedOffice) return;

    set(
      "area",
      selectedOffice.Name || ""
    );

    set(
      "city",
      selectedOffice.Block ||
        selectedOffice.Division ||
        selectedOffice.District ||
        ""
    );

    set(
      "district",
      selectedOffice.District || ""
    );

    set(
      "state",
      selectedOffice.State || ""
    );

    set(
      "country",
      selectedOffice.Country || "India"
    );
  };

  /* ============================================================
     ADDRESS TYPES
  ============================================================ */

  const addressTypes = [
    {
      value: "Home",
      icon: <FaHome />,
      description: "For your home",
    },
    {
      value: "Office",
      icon: <FaBriefcase />,
      description: "For your workplace",
    },
    {
      value: "Other",
      icon: <FaMapMarkerAlt />,
      description: "Other location",
    },
  ];

  const pinComplete =
    String(f.postalCode || "").length === 6;

  const locationFound =
    pinComplete &&
    !pinLoading &&
    Boolean(f.state);

  /* ============================================================
     UI
  ============================================================ */

  return (
    <AccountShell title={title}>
      <style>{`
        @keyframes addressPageIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes addressCardIn {
          from { opacity: 0; transform: translateY(14px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes addressFloat {
          0%,100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-5px,0); }
        }
        @keyframes addressPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,.18); }
          50% { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
        }
        @keyframes addressShine {
          0% { transform: translateX(-130%) skewX(-18deg); }
          55%,100% { transform: translateX(240%) skewX(-18deg); }
        }
        @keyframes addressSuccess {
          0% { transform: scale(.7); opacity: 0; }
          70% { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes addressSpin { to { transform: rotate(360deg); } }

        .address-page-motion { animation: addressPageIn .48s cubic-bezier(.22,1,.36,1) both; }
        .address-card-motion { animation: addressCardIn .55s cubic-bezier(.22,1,.36,1) both; }
        .address-float { animation: addressFloat 5s ease-in-out infinite; }
        .address-pulse { animation: addressPulse 2.2s ease-in-out infinite; }
        .address-success { animation: addressSuccess .35s cubic-bezier(.22,1,.36,1) both; }
        .address-spin { animation: addressSpin .7s linear infinite; }
        .address-shine::after {
          content: "";
          position: absolute;
          inset: -20%;
          width: 38%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
          transform: translateX(-130%) skewX(-18deg);
          animation: addressShine 3.6s ease-in-out infinite;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .address-page-motion,.address-card-motion,.address-float,.address-pulse,
          .address-success,.address-spin,.address-shine::after {
            animation: none !important;
          }
        }
      `}</style>

      <div className="address-page-motion w-full px-0 pb-28 pt-1 sm:px-1 sm:pb-10">
        <div className="relative mx-auto w-full max-w-3xl">


          {/* App header */}
       

          {/* PIN / location hero */}
          <section className="address-card-motion relative border-b border-slate-200/80 py-5 sm:py-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-indigo-200/30 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-70px] left-[-30px] h-40 w-40 rounded-full bg-violet-100/30 blur-3xl" />

            <div className="relative flex items-start gap-3">
              <div className="address-float flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_10px_24px_rgba(79,70,229,.24)]">
                <FaMapMarkerAlt size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-indigo-600">
                  Quick start
                </span>
                <h2 className="mt-0.5 text-[17px] font-extrabold tracking-[-.02em] text-slate-900 sm:text-lg">
                  Find your delivery location
                </h2>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:text-xs">
                  Enter your PIN and we'll fill the location details automatically.
                </p>
              </div>

              {locationFound && (
                <span className="address-success inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                  <FaCheck size={8} />
                  Found
                </span>
              )}
            </div>

            <div className="relative mt-4">
              <label className="mb-1.5 block text-[11px] font-bold text-slate-700">
                PIN code <span className="text-red-500">*</span>
              </label>

              <div className={`relative flex h-14 items-center overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                errors.postalCode
                  ? "border-red-400 bg-red-50/20 focus-within:border-red-500"
                  : locationFound
                    ? "border-emerald-300 shadow-[0_0_0_4px_rgba(16,185,129,.08)]"
                    : "border-indigo-200 shadow-[0_8px_28px_rgba(79,70,229,.07)] focus-within:border-indigo-500 focus-within:shadow-[0_0_0_4px_rgba(99,102,241,.10)]"
              }`}>
                <div className="flex w-12 shrink-0 items-center justify-center text-indigo-500">
                  <FaMapMarkerAlt size={14} />
                </div>

                <input
                  ref={pinInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  value={f.postalCode || ""}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="Enter 6-digit PIN"
                  aria-label="PIN code"
                  className="h-full min-w-0 flex-1 bg-transparent pr-12 text-[19px] font-extrabold tracking-[.18em] text-slate-900 outline-none placeholder:text-[12px] placeholder:font-semibold placeholder:tracking-normal placeholder:text-slate-400"
                />

                {pinLoading && (
                  <span className="address-spin absolute right-4 h-5 w-5 rounded-full border-2 border-indigo-100 border-t-indigo-600" />
                )}

                {locationFound && !pinLoading && (
                  <span className="address-success absolute right-3.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <FaCheck size={9} />
                  </span>
                )}
              </div>

              {errors.postalCode && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-500">
                  <span className="h-1 w-1 rounded-full bg-red-500" />
                  {errors.postalCode}
                </p>
              )}

              <div className="mt-2 flex items-center gap-2">
                <div className="grid flex-1 grid-cols-6 gap-1">
                  {[0,1,2,3,4,5].map((index) => (
                    <span
                      key={index}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        String(f.postalCode || "").length > index
                          ? "bg-indigo-500"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                  {pinLoading
                    ? "Finding location..."
                    : locationFound
                    ? `${f.city || f.area}, ${f.state}`
                    : "6 digits required"}
                </span>
              </div>
            </div>
          </section>

          {/* Address type */}
          <section className="address-card-motion border-b border-slate-200/80 py-5 sm:py-7">
            <SectionHeader number="01" title="Address type" description="Choose where this address belongs." />

            <div className="grid grid-cols-3 gap-2.5">
              {addressTypes.map((item) => {
                const active = f.label === item.value;
                return (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => set("label", item.value)}
                    className={`group relative flex min-h-[76px] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border px-2 py-3 text-center transition-all duration-300 active:scale-[.97] ${
                      active
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-[0_8px_22px_rgba(79,70,229,.10)]"
                        : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/40"
                    }`}
                  >
                    {active && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${
                      active ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                    }`}>
                      {React.cloneElement(item.icon, { size: 15 })}
                    </span>
                    <span className="text-[11px] font-extrabold">{item.value}</span>
                    <span className="hidden text-[9px] text-slate-400 sm:block">{item.description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Contact */}
          <section className="address-card-motion border-b border-slate-200/80 py-5 sm:py-7">
            <SectionHeader number="02" title="Contact details" description="Who should receive the delivery?" />
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Field fieldKey="fullName" error={errors.fullName} icon={<FaUser />} label="Full name" required value={f.fullName} onChange={(value) => set("fullName", value)} placeholder="Enter full name" autoComplete="name" />
              <Field fieldKey="phone" error={errors.phone} icon={<FaPhoneAlt />} label="Phone number" required value={f.phone} onChange={(value) => set("phone", value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit phone number" type="tel" inputMode="numeric" autoComplete="tel" />
              <Field icon={<FaPhoneAlt />} label="Alternate phone" value={f.alternatePhone} onChange={(value) => set("alternatePhone", value.replace(/\D/g, "").slice(0, 10))} placeholder="Optional" type="tel" inputMode="numeric" />
            </div>
          </section>

          {/* Address details */}
          <section className="address-card-motion border-b border-slate-200/80 py-5 sm:py-7">
            <SectionHeader number="03" title="Address details" description="Add your complete delivery address." />

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Field label="House / Flat / Door No." value={f.houseNumber} onChange={(value) => set("houseNumber", value)} placeholder="e.g. 12/A" autoComplete="address-line1" />
              <Field label="Building / Apartment" value={f.buildingName} onChange={(value) => set("buildingName", value)} placeholder="Building or apartment name" />
              <Field label="Floor" value={f.floor} onChange={(value) => set("floor", value)} placeholder="e.g. 2nd Floor" />
              <Field label="Street / Road" value={f.street} onChange={(value) => set("street", value)} placeholder="Street or road name" autoComplete="street-address" />
            </div>

            <Field fieldKey="addressLine1" error={errors.addressLine1} label="Address line 1" required value={f.addressLine1} onChange={(value) => set("addressLine1", value)} placeholder="Complete address line 1" autoComplete="street-address" />
            <Field label="Address line 2" value={f.addressLine2} onChange={(value) => set("addressLine2", value)} placeholder="Apartment, floor, block, etc. (optional)" />

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Field label="Landmark" value={f.landmark} onChange={(value) => set("landmark", value)} placeholder="Nearby landmark" />

              <div className="mb-4 min-w-0">
                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                  Area / Post <span className="text-red-500">*</span>
                </label>
                {postOffices.length > 1 ? (
                  <select
                    value={f.area || ""}
                    onChange={(e) => handlePostOfficeChange(e.target.value)}
                    className={`h-12 w-full rounded-xl border bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-all duration-200 ${
                      errors.area
                        ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                        : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    }` } data-field="area"
                  >
                    {postOffices.map((office) => (
                      <option key={`${office.Name}-${office.Pincode}`} value={office.Name}>
                        {office.Name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={f.area || ""}
                    onChange={(e) => set("area", e.target.value)}
                    placeholder="Locality / area"
                    autoComplete="address-line2"
                    className={`h-12 w-full rounded-xl border bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 ${
                      errors.area
                        ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                        : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    }`}
                    data-field="area"
                  />
                )}
              </div>

              <Field fieldKey="village" value={f.village} onChange={(value) => set("village", value)} placeholder="Enter village" />
              <Field label="Post office" value={f.postOffice} onChange={(value) => set("postOffice", value)} placeholder="Post office" />
              <Field label="Block" value={f.block} onChange={(value) => set("block", value)} placeholder="Block / development block" />
            </div>
          </section>

          {/* Location */}
          <section className="address-card-motion border-b border-slate-200/80 py-5 sm:py-7">
            <SectionHeader number="04" title="Location" description="These details are filled from your PIN." />

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Field fieldKey="city" error={errors.city} icon={<FaCity />} label="City" required value={f.city} onChange={(value) => set("city", value)} placeholder="Enter city" autoComplete="address-level2" />
              <Field fieldKey="district" error={errors.district} label="District" required value={f.district} onChange={(value) => set("district", value)} placeholder="Enter district" />
              <Field fieldKey="state" error={errors.state} label="State" required value={f.state} onChange={(value) => set("state", value)} placeholder="Enter state" autoComplete="address-level1" />

              <div className="mb-4 min-w-0">
                <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
                  PIN code <span className="text-red-500">*</span>
                </label>
                <div className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-600">
                  <FaMapMarkerAlt size={11} className="text-indigo-500" />
                  <span>{f.postalCode || "Waiting for PIN"}</span>
                  {locationFound && <FaCheck size={10} className="ml-auto text-emerald-500" />}
                </div>
                {errors.postalCode && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-500">
                    <span className="h-1 w-1 rounded-full bg-red-500" />
                    {errors.postalCode}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Instructions */}
          <section className="address-card-motion border-b border-slate-200/80 py-5 sm:py-7">
            <SectionHeader number="05" title="Delivery instructions" description="Optional notes for the delivery partner." />
            <label className="mb-1.5 block text-[11px] font-bold text-slate-600">Delivery instructions</label>
            <textarea
              value={f.deliveryInstructions || ""}
              maxLength={500}
              rows={4}
              onChange={(e) => set("deliveryInstructions", e.target.value)}
              placeholder="e.g. Call before delivery, leave at the security desk..."
              className="min-h-[108px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
            <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-slate-400">
              <span>Optional</span>
              <span>{String(f.deliveryInstructions || "").length}/500</span>
            </div>
          </section>

          {/* Country + default */}
          <section className="address-card-motion border-b border-slate-200/80 py-5 sm:py-7">
            <SectionHeader number="06" title="Final details" description="Confirm your country and default address preference." />
            <Field label="Country" required value={f.country || "India"} onChange={(value) => set("country", value)} placeholder="Country" autoComplete="country-name" />

            <label className={`group mt-1 flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-all duration-300 ${
              f.isDefault
                ? "border-indigo-200 bg-indigo-50/60"
                : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
            }`}>
              <input
                type="checkbox"
                checked={Boolean(f.isDefault)}
                onChange={(e) => set("isDefault", e.target.checked)}
                className="sr-only"
              />
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
                f.isDefault
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "border-slate-300 bg-white"
              }`}>
                {f.isDefault && <FaCheck size={10} />}
              </span>
              <span className="min-w-0">
                <strong className="block text-[13px] font-extrabold text-slate-800">
                  Make this my default address
                </strong>
                <small className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                  We'll use this address automatically during checkout.
                </small>
              </span>
            </label>
          </section>

          {/* Desktop actions */}
          <div className="mt-4 hidden items-center justify-end gap-2 sm:flex">
            <button
              type="button"
              disabled={saving}
              onClick={() => navigate("/account/addresses")}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving || pinLoading}
              onClick={save}
              className="address-shine relative flex h-12 min-w-[170px] items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(79,70,229,.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(79,70,229,.30)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="address-spin h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave size={13} />
                  {submit}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile bottom action dock */}
        <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200/80 bg-white/90 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_35px_rgba(15,23,42,.10)] backdrop-blur-xl sm:hidden">
          <div className="mx-auto flex max-w-3xl gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => navigate("/account/addresses")}
              className="h-12 flex-[.75] rounded-2xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600 transition-all active:scale-[.97] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving || pinLoading}
              onClick={save}
              className="address-shine relative flex h-12 flex-[1.5] items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-[13px] font-extrabold text-white shadow-[0_10px_25px_rgba(79,70,229,.24)] transition-all active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="address-spin h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave size={13} />
                  {submit}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AccountShell>
  );
}

/* ============================================================
   SECTION HEADER
============================================================ */


function SectionHeader({ number, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[9px] font-extrabold text-indigo-600">
        {number}
      </div>
      <div className="min-w-0">
        <h3 className="text-[15px] font-extrabold tracking-[-.01em] text-slate-900">
          {title}
        </h3>
        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  required = false,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  error = "",
  fieldKey,
}) {
  return (
    <div className="mb-4 min-w-0">
      <label className="mb-1.5 block text-[11px] font-bold text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400">
            {React.cloneElement(icon, { size: 11 })}
          </span>
        )}

        <input
          data-field={fieldKey}
          type={type}
          inputMode={inputMode}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={`h-12 w-full rounded-xl border bg-white text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 ${
            error
              ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
              : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          } ${
            icon ? "pl-9 pr-3" : "px-3"
          }`}
        />
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-500">
          <span className="h-1 w-1 shrink-0 rounded-full bg-red-500" />
          {error}
        </p>
      )}
    </div>
  );
}
