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
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    area: "",
    village: "",
    city: "",
    district: "",
    state: "",
    postalCode: "",
    country: "India",
    location: {
      latitude: null,
      longitude: null,
    },
    isDefault: false,
  });

  const queryClient = useQueryClient();
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => {
    setF((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validate = () => {
    if (!f.fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }

    if (!f.phone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }

    const phone = f.phone.replace(/\D/g, "");

    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }

    if (!f.addressLine1.trim()) {
      toast.error("Please enter your address");
      return false;
    }

    if (!f.area.trim()) {
      toast.error("Please enter your area");
      return false;
    }

    if (!f.city.trim()) {
      toast.error("Please enter your city");
      return false;
    }

    if (!f.district.trim()) {
      toast.error("Please enter your district");
      return false;
    }

    if (!f.state.trim()) {
      toast.error("Please enter your state");
      return false;
    }

    if (!/^[1-9][0-9]{5}$/.test(f.postalCode)) {
      toast.error("Please enter a valid 6-digit PIN code");
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
          addressLine1: f.addressLine1.trim(),
          addressLine2: f.addressLine2.trim(),
          landmark: f.landmark.trim(),
          area: f.area.trim(),
          village: f.village.trim(),
          city: f.city.trim(),
          district: f.district.trim(),
          state: f.state.trim(),
          postalCode: f.postalCode.trim(),
          country: f.country || "India",
          location: f.location,
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

      navigate("/account/addresses");
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
      <div className="address-app">

        {/* ======================================================
           MAIN CARD
        ====================================================== */}

        <main className="address-card mt-18">

          {/* ====================================================
             PIN HERO
          ==================================================== */}

          <section className="pin-hero">

            <div className="pin-hero-top">

              <div className="pin-icon">
                <FaMapMarkerAlt size={17} />
              </div>

              <div className="pin-copy">
                <span className="pin-eyebrow">
                  QUICK START
                </span>

                <h2>
                  Start with your PIN code
                </h2>

                <p>
                  We'll automatically find your
                  delivery location.
                </p>
              </div>

              {locationFound && (
                <div className="location-success">
                  <FaCheck size={9} />
                  Found
                </div>
              )}

            </div>

            <div className="pin-input-area">

              <label className="input-label">
                PIN code
                <span>*</span>
              </label>

              <div
                className={`pin-input-container ${
                  pinLoading ? "loading" : ""
                } ${
                  locationFound ? "success" : ""
                }`}
              >

                <div className="pin-input-icon">
                  <FaMapMarkerAlt size={14} />
                </div>

                <input
                  ref={pinInputRef}
                  className="pin-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  value={f.postalCode || ""}
                  onChange={(e) =>
                    handlePinChange(
                      e.target.value
                    )
                  }
                  placeholder="Enter 6-digit PIN"
                  aria-label="PIN code"
                />

                {pinLoading && (
                  <span className="input-spinner" />
                )}

                {locationFound && (
                  <span className="input-success">
                    <FaCheck size={9} />
                  </span>
                )}

              </div>

              <div className="pin-meta">

                <div className="pin-bars">
                  {[0, 1, 2, 3, 4, 5].map(
                    (index) => (
                      <span
                        key={index}
                        className={
                          String(
                            f.postalCode || ""
                          ).length > index
                            ? "filled"
                            : ""
                        }
                      />
                    )
                  )}
                </div>

                <span>
                  {pinLoading
                    ? "Finding your location..."
                    : locationFound
                    ? `${f.city || f.area}, ${f.state}`
                    : "6 digits required"}
                </span>

              </div>

            </div>

          </section>

          {/* ====================================================
             ADDRESS TYPE
          ==================================================== */}

          <section className="form-section">

            <SectionHeader
              number="01"
              title="Address type"
              description="Choose a label for this address."
            />

            <div className="address-types">

              {addressTypes.map((item) => {

                const active =
                  f.label === item.value;

                return (
                  <button
                    type="button"
                    key={item.value}
                    className={`address-type ${
                      active ? "active" : ""
                    }`}
                    onClick={() =>
                      set(
                        "label",
                        item.value
                      )
                    }
                  >

                    <span className="type-icon">
                      {item.icon}
                    </span>

                    <span className="type-text">
                      <strong>
                        {item.value}
                      </strong>

                      <small>
                        {item.description}
                      </small>
                    </span>

                    {active && (
                      <span className="type-selected">
                        <FaCheck size={8} />
                      </span>
                    )}

                  </button>
                );
              })}

            </div>

          </section>

          {/* ====================================================
             CONTACT
          ==================================================== */}

          <section className="form-section">

            <SectionHeader
              number="02"
              title="Contact details"
              description="Who should receive the delivery?"
            />

            <div className="form-grid">

              <Field
                icon={<FaUser />}
                label="Full name"
                required
                value={f.fullName}
                onChange={(value) =>
                  set("fullName", value)
                }
                placeholder="Enter full name"
                autoComplete="name"
              />

              <Field
                icon={<FaPhoneAlt />}
                label="Phone number"
                required
                value={f.phone}
                onChange={(value) =>
                  set(
                    "phone",
                    value
                      .replace(/\D/g, "")
                      .slice(0, 10)
                  )
                }
                placeholder="10-digit phone number"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
              />

              <Field
                icon={<FaPhoneAlt />}
                label="Alternate phone"
                value={f.alternatePhone}
                onChange={(value) =>
                  set(
                    "alternatePhone",
                    value
                      .replace(/\D/g, "")
                      .slice(0, 10)
                  )
                }
                placeholder="Optional"
                type="tel"
                inputMode="numeric"
              />

            </div>

          </section>

          {/* ====================================================
             ADDRESS
          ==================================================== */}

          <section className="form-section">

            <SectionHeader
              number="03"
              title="Address details"
              description="Add your complete delivery address."
            />

            <Field
              label="Address line 1"
              required
              value={f.addressLine1}
              onChange={(value) =>
                set("addressLine1", value)
              }
              placeholder="House / flat number, building, street"
              autoComplete="street-address"
            />

            <Field
              label="Address line 2"
              value={f.addressLine2}
              onChange={(value) =>
                set("addressLine2", value)
              }
              placeholder="Apartment, floor, block, etc. (optional)"
            />

            <div className="form-grid">

              <Field
                label="Landmark"
                value={f.landmark}
                onChange={(value) =>
                  set("landmark", value)
                }
                placeholder="Nearby landmark"
              />

              <div className="field">

                <label className="input-label">
                  Area / Post
                  <span>*</span>
                </label>

                {postOffices.length > 1 ? (

                  <div className="select-box">

                    <select
                      className="input"
                      value={f.area || ""}
                      onChange={(e) =>
                        handlePostOfficeChange(
                          e.target.value
                        )
                      }
                    >
                      {postOffices.map(
                        (office) => (
                          <option
                            key={`${office.Name}-${office.Pincode}`}
                            value={office.Name}
                          >
                            {office.Name}
                          </option>
                        )
                      )}
                    </select>

                  </div>

                ) : (

                  <input
                    className="input"
                    value={f.area || ""}
                    onChange={(e) =>
                      set(
                        "area",
                        e.target.value
                      )
                    }
                    placeholder="Locality / area"
                    autoComplete="address-line2"
                  />

                )}

              </div>

              <Field
                label="Village"
                value={f.village}
                onChange={(value) =>
                  set("village", value)
                }
                placeholder="Enter village"
              />

            </div>

          </section>

          {/* ====================================================
             LOCATION
          ==================================================== */}

          <section className="form-section">

            <SectionHeader
              number="04"
              title="Location"
              description="These details are filled from your PIN."
            />

            <div className="form-grid">

              <Field
                icon={<FaCity />}
                label="City"
                required
                value={f.city}
                onChange={(value) =>
                  set("city", value)
                }
                placeholder="Enter city"
                autoComplete="address-level2"
              />

              <Field
                label="District"
                required
                value={f.district}
                onChange={(value) =>
                  set("district", value)
                }
                placeholder="Enter district"
              />

              <Field
                label="State"
                required
                value={f.state}
                onChange={(value) =>
                  set("state", value)
                }
                placeholder="Enter state"
                autoComplete="address-level1"
              />

              <div className="field">

                <label className="input-label">
                  PIN code
                  <span>*</span>
                </label>

                <div className="readonly-location">
                  <FaMapMarkerAlt size={11} />

                  <span>
                    {f.postalCode ||
                      "Waiting for PIN"}
                  </span>

                  {locationFound && (
                    <FaCheck
                      className="readonly-check"
                      size={9}
                    />
                  )}
                </div>

              </div>

            </div>

          </section>

          {/* ====================================================
             COUNTRY
          ==================================================== */}

          <section className="form-section country-section">

            <SectionHeader
              number="05"
              title="Country"
              description="Where should this address be delivered?"
            />

            <Field
              label="Country"
              required
              value={f.country || "India"}
              onChange={(value) =>
                set("country", value)
              }
              placeholder="Country"
              autoComplete="country-name"
            />

          </section>

          {/* ====================================================
             DEFAULT
          ==================================================== */}

          <section className="default-section">

            <label className="default-card">

              <input
                type="checkbox"
                checked={Boolean(
                  f.isDefault
                )}
                onChange={(e) =>
                  set(
                    "isDefault",
                    e.target.checked
                  )
                }
              />

              <span className="checkbox">
                {f.isDefault && (
                  <FaCheck size={9} />
                )}
              </span>

              <span className="default-copy">

                <strong>
                  Make this my default address
                </strong>

                <small>
                  We'll use this address automatically
                  during checkout.
                </small>

              </span>

            </label>

          </section>

          {/* ====================================================
             ACTIONS
          ==================================================== */}

          <footer className="form-actions">

            <button
              type="button"
              className="cancel-button"
              disabled={saving}
              onClick={() =>
                navigate(
                  "/account/addresses"
                )
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="save-button"
              disabled={
                saving ||
                pinLoading
              }
              onClick={save}
            >

              {saving ? (
                <>
                  <span className="save-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave size={12} />
                  {submit}
                </>
              )}

            </button>

          </footer>

        </main>

      </div>

      {/* ========================================================
         STYLES
      ======================================================== */}

      <style>{`
        .address-app, .address-app * {
          box-sizing: border-box;
        }

        .address-app {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 10px 0 40px;
          color: #18181b;
        }

        /* ======================================================
           HEADER
        ====================================================== */

        .address-header {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 15px;
          width: 100%;
          margin-bottom: 20px;
        }

        .back-button {
          width: 42px;
          height: 42px;
          flex: none;
          display: grid;
          place-items: center;
          border: 1px solid #e7e7ec;
          border-radius: 13px;
          background: #fff;
          color: #71717a;
          cursor: pointer;
          transition: all .18s ease;
        }

        .back-button:hover {
          color: #4f46e5;
          border-color: #d9d7ff;
          background: #fafaff;
          transform: translateX(-2px);
        }

        .header-content {
          flex: 1;
          min-width: 0;
        }

        .header-eyebrow {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 4px;
          color: #6366f1;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6366f1;
          box-shadow:
            0 0 0 4px rgba(99,102,241,.1);
        }

        .header-content h1 {
          margin: 0 0 5px;
          color: #18181b;
          font-size: clamp(21px, 2.6vw, 27px);
          line-height: 1.15;
          font-weight: 850;
          letter-spacing: -.8px;
        }

        .header-content p {
          margin: 0;
          color: #8a8a93;
          font-size: 14px;
          line-height: 1.5;
        }

        .secure-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 11px;
          border: 1px solid #e4e4e9;
          border-radius: 999px;
          color: #71717a;
          background: #fff;
          font-size: 12px;
          font-weight: 800;
        }

        /* ======================================================
           MAIN CARD
        ====================================================== */

        .address-card {
          width: 100%;
          overflow: visible;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        /* ======================================================
           PIN HERO
        ====================================================== */

        .pin-hero {
          width: 100%;
          padding: 24px 28px;
          border: 1px solid #ededf1;
          border-radius: 18px;

          background:
            radial-gradient(
              circle at 90% 0%,
              rgba(99,102,241,.13),
              transparent 32%
            ),
            linear-gradient(
              135deg,
              #fafaff,
              #ffffff
            );
        }

        .pin-hero-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pin-icon {
          width: 42px;
          height: 42px;
          flex: none;
          display: grid;
          place-items: center;
          border: 1px solid #dedcff;
          border-radius: 13px;
          color: #4f46e5;
          background: #eeedff;
        }

        .pin-copy {
          flex: 1;
        }

        .pin-eyebrow {
          display: block;
          margin-bottom: 3px;
          color: #6366f1;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .1em;
        }

        .pin-copy h2 {
          margin: 0 0 3px;
          color: #27272a;
          font-size: 15px;
          font-weight: 850;
          letter-spacing: -.2px;
        }

        .pin-copy p {
          margin: 0;
          color: #85858d;
          font-size: 13px;
        }

        .location-success {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 9px;
          border-radius: 999px;
          color: #059669;
          background: #ecfdf5;
          font-size: 11px;
          font-weight: 850;
        }

        .pin-input-area {
          margin-top: 18px;
        }

        .input-label {
          display: block;
          margin-bottom: 6px;
          color: #45454d;
          font-size: 13px;
          font-weight: 800;
        }

        .input-label span {
          margin-left: 2px;
          color: #ef4444;
        }

        .pin-input-container {
          position: relative;
          display: flex;
          align-items: center;
          height: 56px;
          border: 1.5px solid #d9d7fa;
          border-radius: 14px;
          background: #fff;
          box-shadow:
            0 5px 20px rgba(79,70,229,.06);
          transition:
            border-color .18s ease,
            box-shadow .18s ease;
        }

        .pin-input-container:focus-within {
          border-color: #6366f1;
          box-shadow:
            0 0 0 4px rgba(99,102,241,.1),
            0 8px 25px rgba(79,70,229,.08);
        }

        .pin-input-container.success {
          border-color: #a7f3d0;
        }

        .pin-input-icon {
          width: 48px;
          display: grid;
          place-items: center;
          color: #6366f1;
          pointer-events: none;
        }

        .pin-input {
          width: 100%;
          height: 100%;
          padding: 0 50px 0 0;
          border: 0;
          outline: none;
          background: transparent;
          color: #18181b;
          font-family: inherit;
          font-size: 18px;
          font-weight: 850;
          letter-spacing: .18em;
        }

        .pin-input::placeholder {
          color: #b2b2ba;
          font-size: 13px;
          letter-spacing: 0;
          font-weight: 600;
        }

        .input-spinner {
          position: absolute;
          right: 17px;
          width: 17px;
          height: 17px;
          border: 2px solid #e5e5f5;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin .65s linear infinite;
        }

        .input-success {
          position: absolute;
          right: 15px;
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #fff;
          background: #10b981;
        }

        .pin-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 8px;
          color: #8b8b94;
          font-size: 11px;
          font-weight: 700;
        }

        .pin-bars {
          flex: 1;
          display: grid;
          grid-template-columns:
            repeat(6, minmax(0, 1fr));
          gap: 5px;
        }

        .pin-bars span {
          height: 3px;
          border-radius: 999px;
          background: #e7e7ed;
          transition: all .2s ease;
        }

        .pin-bars span.filled {
          background: #6366f1;
          transform: scaleY(1.25);
        }

        /* ======================================================
           SECTIONS
        ====================================================== */

        .form-section {
          width: 100%;
          padding: 28px 0;
          border-bottom: 1px solid #eeeef2;
        }

        .section-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 18px;
        }

        .section-number {
          width: 28px;
          height: 28px;
          flex: none;
          display: grid;
          place-items: center;
          border: 1px solid #e4e3f7;
          border-radius: 9px;
          color: #6366f1;
          background: #f7f6ff;
          font-size: 11px;
          font-weight: 900;
        }

        .section-header h3 {
          margin: 0 0 3px;
          color: #27272a;
          font-size: 13px;
          font-weight: 850;
        }

        .section-header p {
          margin: 0;
          color: #9999a1;
          font-size: 12px;
        }

        /* ======================================================
           ADDRESS TYPES
        ====================================================== */

        .address-types {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .address-type {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 70px;
          padding: 11px;
          border: 1px solid #e5e5ea;
          border-radius: 14px;
          background: #fff;
          text-align: left;
          cursor: pointer;
          transition: all .18s ease;
        }

        .address-type:hover {
          transform: translateY(-1px);
          border-color: #cfccf9;
          background: #fbfbff;
        }

        .address-type.active {
          border-color: #6366f1;
          background: #f8f7ff;
          box-shadow:
            0 0 0 3px rgba(99,102,241,.07);
        }

        .type-icon {
          width: 36px;
          height: 36px;
          flex: none;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: #777780;
          background: #f3f3f6;
          transition: all .18s ease;
        }

        .address-type.active .type-icon {
          color: #4f46e5;
          background: #e9e8ff;
        }

        .type-text {
          min-width: 0;
        }

        .type-text strong {
          display: block;
          margin-bottom: 3px;
          color: #34343b;
          font-size: 13px;
          font-weight: 850;
        }

        .type-text small {
          display: block;
          color: #9999a2;
          font-size: 11px;
        }

        .type-selected {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 17px;
          height: 17px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #fff;
          background: #4f46e5;
        }

        /* ======================================================
           FORM
        ====================================================== */

        .form-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 0 13px;
        }

        .field {
          min-width: 0;
          margin-bottom: 16px;
        }

        .input {
          width: 100%;
          height: 45px;
          padding: 0 12px;
          border: 1px solid #e1e2e7;
          border-radius: 11px;
          outline: none;
          background: #fff;
          color: #18181b;
          font-family: inherit;
          font-size: 14px;
          transition: all .17s ease;
        }

        .input:hover {
          border-color: #d2d3da;
        }

        .input:focus {
          border-color: #6366f1;
          box-shadow:
            0 0 0 3px rgba(99,102,241,.08);
        }

        .field-with-icon {
          position: relative;
        }

        .field-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          z-index: 1;
          display: grid;
          place-items: center;
          color: #9b9ba4;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .field-with-icon .input {
          padding-left: 35px;
        }

        .select-box {
          position: relative;
        }

        .select-box select {
          cursor: pointer;
          appearance: auto;
        }

        /* ======================================================
           READONLY LOCATION
        ====================================================== */

        .readonly-location {
          display: flex;
          align-items: center;
          gap: 7px;
          height: 45px;
          padding: 0 12px;
          border: 1px solid #ececf0;
          border-radius: 11px;
          color: #777780;
          background: #f8f8fa;
          font-size: 13px;
          font-weight: 750;
        }

        .readonly-location svg {
          color: #7774c7;
        }

        .readonly-check {
          margin-left: auto;
          color: #10b981 !important;
        }

        /* ======================================================
           DEFAULT
        ====================================================== */

        .default-section {
          width: 100%;
          padding: 22px 0;
          background:
            linear-gradient(
              90deg,
              #fafafa,
              #fff
            );
        }

        .default-card {
          display: flex;
          align-items: center;
          gap: 11px;
          cursor: pointer;
        }

        .default-card input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .checkbox {
          width: 21px;
          height: 21px;
          flex: none;
          display: grid;
          place-items: center;
          border: 1.5px solid #cfd0d7;
          border-radius: 6px;
          color: #fff;
          background: #fff;
          transition: all .16s ease;
        }

        .default-card input:checked + .checkbox {
          border-color: #4f46e5;
          background: #4f46e5;
        }

        .default-copy strong {
          display: block;
          margin-bottom: 3px;
          color: #34343b;
          font-size: 13px;
          font-weight: 850;
        }

        .default-copy small {
          display: block;
          color: #9999a1;
          font-size: 11px;
        }

        /* ======================================================
           ACTIONS
        ====================================================== */

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding: 22px 0 8px;
          background: transparent;
        }

        .cancel-button,
        .save-button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 18px;
          border-radius: 11px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
          transition: all .18s ease;
        }

        .cancel-button {
          min-width: 90px;
          border: 1px solid #e2e3e8;
          color: #666670;
          background: #fff;
        }

        .cancel-button:hover {
          background: #fafafa;
          border-color: #d4d5dc;
        }

        .save-button {
          min-width: 138px;
          border: 1px solid #4f46e5;
          color: #fff;
          background: #4f46e5;
          box-shadow:
            0 8px 20px rgba(79,70,229,.18);
        }

        .save-button:hover:not(:disabled) {
          transform: translateY(-1px);
          background: #4338ca;
          box-shadow:
            0 11px 26px rgba(79,70,229,.23);
        }

        .save-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .cancel-button:disabled,
        .save-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .save-spinner {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .65s linear infinite;
        }

        /* ======================================================
           MODERN UI / UX POLISH
        ====================================================== */

        .address-app .field:focus-within .input-label {
          color: #4f46e5;
        }

        .address-app .input::placeholder {
          color: #a1a1aa;
        }

        .address-app .input:hover {
          background: #fdfdff;
        }

        .address-app .address-type {
          box-shadow: 0 2px 8px rgba(24,24,40,.025);
        }

        .address-app .address-type.active {
          box-shadow:
            0 0 0 3px rgba(99,102,241,.07),
            0 8px 20px rgba(79,70,229,.07);
        }

        .address-app .default-card {
          width: 100%;
          padding: 13px 14px;
          border: 1px solid #e7e7ec;
          border-radius: 14px;
          background: #fff;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .address-app .default-card:hover {
          border-color: #d8d6fb;
          background: #fcfcff;
          box-shadow: 0 6px 18px rgba(24,24,40,.05);
        }

        .address-app .save-button {
          background: linear-gradient(135deg, #5b52e8, #4f46e5);
        }

        .address-app .save-button svg {
          transition: transform .18s ease;
        }

        .address-app .save-button:hover:not(:disabled) svg {
          transform: translateY(-1px);
        }

        /* ======================================================
           ACCESSIBILITY
        ====================================================== */

        .back-button:focus-visible,
        .address-type:focus-visible,
        .input:focus-visible,
        .pin-input:focus-visible,
        .save-button:focus-visible,
        .cancel-button:focus-visible {
          outline: 3px solid rgba(99,102,241,.16);
          outline-offset: 2px;
        }

        /* ======================================================
           ANIMATION
        ====================================================== */

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (
          prefers-reduced-motion: reduce
        ) {
          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }

        /* ======================================================
           TABLET
        ====================================================== */

        @media (max-width: 760px) {

          .address-app {
            padding-left: 8px;
            padding-right: 8px;
          }

          .address-types {
            grid-template-columns: 1fr;
          }

          .address-type {
            min-height: 60px;
          }

        }

        /* ======================================================
           MOBILE
        ====================================================== */

        @media (max-width: 600px) {

          .address-app {
            padding:
              0
              4px
              86px;
          }

          .address-header {
            gap: 10px;
            margin-bottom: 13px;
          }

          .back-button {
            width: 36px;
            height: 36px;
            border-radius: 11px;
          }

          .header-content h1 {
            font-size: 21px;
          }

          .header-content p {
            max-width: 270px;
            font-size: 12px;
          }

          .secure-badge {
            display: none;
          }

          .address-card {
            border-radius: 0;
          }

          .pin-hero {
            padding: 18px 14px;
            border-radius: 14px;
          }

          .pin-icon {
            width: 37px;
            height: 37px;
            border-radius: 11px;
          }

          .pin-copy h2 {
            font-size: 13px;
          }

          .pin-copy p {
            font-size: 12px;
          }

          .location-success {
            padding: 6px 8px;
          }

          .pin-input-container {
            height: 52px;
          }

          .pin-input {
            font-size: 16px;
          }

          .form-section {
            padding: 20px 0;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .address-type {
            min-height: 57px;
          }

          .default-section {
            padding: 17px 0;
          }

          .form-actions {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 100;
            display: grid;
            grid-template-columns: .8fr 1.5fr;
            gap: 8px;
            padding:
              9px
              max(
                9px,
                env(safe-area-inset-right)
              )
              calc(
                9px +
                env(safe-area-inset-bottom)
              )
              max(
                9px,
                env(safe-area-inset-left)
              );
            border-top: 1px solid #e6e6eb;
            background: rgba(255,255,255,.94);
            box-shadow:
              0 -8px 28px rgba(20,20,40,.08);
            backdrop-filter: blur(14px);
          }

          .cancel-button,
          .save-button {
            width: 100%;
            min-height: 45px;
          }

        }

        /* ======================================================
           SMALL MOBILE
        ====================================================== */

        .field .input::placeholder {
          color: #a1a1aa;
        }

        .field .input:disabled {
          background: #f7f7f9;
          cursor: not-allowed;
        }

        .address-type:active {
          transform: translateY(0);
        }

        .default-card {
          width: 100%;
          padding: 14px 15px;
          border: 1px solid #e7e7ec;
          border-radius: 14px;
          background: #fff;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .default-card:hover {
          border-color: #d8d6fb;
          background: #fcfcff;
          box-shadow: 0 6px 18px rgba(24,24,40,.05);
        }

        .default-card input:focus-visible + .checkbox {
          outline: 3px solid rgba(99,102,241,.16);
          outline-offset: 2px;
        }

        @media (max-width: 380px) {

          .header-content h1 {
            font-size: 19px;
          }

          .pin-copy p {
            max-width: 190px;
          }

          .pin-meta {
            align-items: flex-start;
            flex-direction: column;
            gap: 6px;
          }

          .pin-bars {
            width: 100%;
          }

          .form-section {
            padding-left: 0;
            padding-right: 0;
          }

          .section-number {
            width: 25px;
            height: 25px;
          }

        }

        /* ============================================================
           MOBILE APP TYPOGRAPHY — READABILITY
        ============================================================ */
        @media (max-width: 600px) {
          .address-page,
          .address-app { font-size: 15px; }

          .address-eyebrow,
          .header-eyebrow { font-size: 11px; }

          .address-hero h1,
          .header-content h1 {
            font-size: 25px;
            line-height: 1.2;
          }

          .address-hero p,
          .header-content p {
            font-size: 13px;
            line-height: 1.5;
          }

          .address-hero-action,
          .address-primary-btn,
          .save-button,
          .cancel-button {
            min-height: 44px;
            font-size: 13px;
          }

          .address-summary-main strong { font-size: 15px; }
          .address-summary-main span { font-size: 12px; line-height: 1.4; }
          .address-summary-badge { font-size: 11px; }

          .address-title-row h2 { font-size: 16px; }
          .address-default { font-size: 10px; }
          .address-contact { font-size: 12px; }

          .address-body p {
            font-size: 14px;
            line-height: 1.6;
          }

          .address-delivery-note { font-size: 11px; }

          .address-action {
            min-height: 38px;
            padding: 0 11px;
            font-size: 12px;
          }

          .address-empty-kicker { font-size: 11px; }
          .address-empty h2 { font-size: 21px; }

          .address-empty p {
            font-size: 13px;
            line-height: 1.6;
          }

          .address-empty-points span { font-size: 11px; }
          .address-tip-copy strong { font-size: 13px; }

          .address-tip-copy p {
            font-size: 12px;
            line-height: 1.5;
          }

          .pin-eyebrow { font-size: 10px; }

          .pin-copy h2 {
            font-size: 18px;
            line-height: 1.3;
          }

          .pin-copy p {
            font-size: 12px;
            line-height: 1.45;
          }

          .location-success { font-size: 10px; }
          .input-label { font-size: 13px; }
          .pin-input { font-size: 18px; }
          .pin-meta { font-size: 12px; }

          .form-section h3,
          .section-header h2 { font-size: 17px; }

          .section-header p {
            font-size: 12px;
            line-height: 1.45;
          }

          .address-type strong { font-size: 14px; }
          .address-type small { font-size: 11px; }

          .field label,
          .field .input-label { font-size: 13px; }

          .input,
          .field input,
          .field select,
          textarea {
            min-height: 46px;
            font-size: 15px;
          }

          .default-copy strong { font-size: 14px; }

          .default-copy small {
            font-size: 12px;
            line-height: 1.45;
          }

          .secure-badge { font-size: 11px; }
        }

        @media (max-width: 390px) {
          .address-hero h1,
          .header-content h1 { font-size: 23px; }

          .address-hero p,
          .header-content p { font-size: 12px; }

          .address-title-row h2 { font-size: 15px; }
          .address-body p { font-size: 13px; }
          .address-empty h2 { font-size: 20px; }
          .pin-copy h2 { font-size: 17px; }

          .input,
          .field input,
          .field select,
          textarea { font-size: 14px; }
        }

      `}
      </style>
    </AccountShell>
  );
}

/* ============================================================
   SECTION HEADER
============================================================ */

function SectionHeader({
  number,
  title,
  description,
}) {
  return (
    <div className="section-header">

      <div className="section-number">
        {number}
      </div>

      <div>
        <h3>{title}</h3>

        <p>{description}</p>
      </div>

    </div>
  );
}

/* ============================================================
   REUSABLE FIELD
============================================================ */

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
}) {
  return (
    <div className="field">

      <label className="input-label">
        {label}

        {required && (
          <span>*</span>
        )}
      </label>

      <div
        className={
          icon
            ? "field-with-icon"
            : ""
        }
      >

        {icon && (
          <span className="field-icon">
            {React.cloneElement(icon, {
              size: 11,
            })}
          </span>
        )}

        <input
          className="input"
          type={type}
          inputMode={inputMode}
          value={value || ""}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
        />

      </div>

    </div>
  );
}