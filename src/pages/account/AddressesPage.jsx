import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaMapMarkerAlt,
  FaTrash,
  FaEdit,
  FaHome,
  FaCheckCircle,
  FaChevronRight,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { AccountShell, api } from "./AccountShell";

export default function AddressesPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);

    api("/api/addresses")
      .then((d) => setItems(d.addresses || d.data || d || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!confirm("Delete this address?")) return;

    try {
      await api(`/api/addresses/${id}`, {
        method: "DELETE",
      });

      toast.success("Address deleted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <AccountShell
      title="My addresses"
      right={
        <button
          type="button"
          className="ok-icon-btn address-header-add"
          onClick={() => navigate("/account/addresses/add")}
          aria-label="Add a new address"
          title="Add address"
        >
          <FaPlus size={14} />
        </button>
      }
    >
      <div className="address-page">
        {/* HERO */}
        <section className="address-hero mt-18">
          <div className="address-hero-copy">
            <div className="address-eyebrow">
              <span className="address-eyebrow-dot" />
              Delivery locations
            </div>

            <h1>Where should we deliver?</h1>

            <p>
              Save your favourite delivery locations for a faster, smoother
              checkout experience.
            </p>
          </div>

          <button
            type="button"
            className="address-hero-action"
            onClick={() => navigate("/account/addresses/add")}
          >
            <span className="address-hero-action-icon">
              <FaPlus size={12} />
            </span>
            Add new address
          </button>
        </section>

        {/* SUMMARY */}
        <section className="address-summary">
          <div className="address-summary-main">
            <div className="address-summary-icon">
              <FaMapMarkerAlt size={15} />
            </div>

            <div>
              <strong>
                {items.length === 0
                  ? "No saved addresses"
                  : `${items.length} saved ${
                      items.length === 1 ? "address" : "addresses"
                    }`}
              </strong>

              <span>
                {items.length === 0
                  ? "Add one to make checkout quicker."
                  : "Choose your preferred location at checkout."}
              </span>
            </div>
          </div>

          {items.length > 0 && (
            <div className="address-summary-badge">
              <FaCheckCircle size={11} />
              Ready for checkout
            </div>
          )}
        </section>

        {/* LOADING */}
        {loading ? (
          <div className="address-list" aria-label="Loading addresses">
            {[1, 2, 3].map((item) => (
              <div
                className="address-card address-skeleton-card"
                key={item}
              >
                <div className="address-card-head">
                  <div className="skeleton-circle" />

                  <div className="skeleton-copy">
                    <div className="skeleton-line title" />
                    <div className="skeleton-line meta" />
                  </div>

                  <div className="skeleton-pill" />
                </div>

                <div className="skeleton-address">
                  <div className="skeleton-line wide" />
                  <div className="skeleton-line medium" />
                  <div className="skeleton-line small" />
                </div>

                <div className="skeleton-actions">
                  <div className="skeleton-button" />
                  <div className="skeleton-button" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* EMPTY STATE */
          <section className="address-empty">
            <div className="address-empty-visual">
              <div className="address-empty-orbit orbit-one" />
              <div className="address-empty-orbit orbit-two" />

              <div className="address-empty-pin">
                <FaMapMarkerAlt size={25} />
              </div>
            </div>

            <div className="address-empty-copy">
              <span className="address-empty-kicker">
                Nothing saved yet
              </span>

              <h2>Your delivery addresses live here</h2>

              <p>
                Add your home, work, or any other location. We’ll keep it
                ready whenever you need to place an order.
              </p>

              <button
                type="button"
                className="address-primary-btn"
                onClick={() => navigate("/account/addresses/add")}
              >
                <FaPlus size={12} />
                Add your first address
              </button>
            </div>

            <div className="address-empty-points">
              <span>
                <FaCheckCircle size={10} />
                Faster checkout
              </span>

              <span>
                <FaCheckCircle size={10} />
                Easy editing
              </span>

              <span>
                <FaCheckCircle size={10} />
                Securely saved
              </span>
            </div>
          </section>
        ) : (
          <>
            {/* ADDRESS LIST */}
            <div className="address-list">
              {items.map((a) => {
                const id = a._id || a.id;

                const addressText = [
                  a.addressLine1,
                  a.addressLine2,
                  a.landmark,
                  a.area,
                  a.city,
                  a.district,
                  a.state,
                  a.pincode || a.pinCode,
                ]
                  .filter(Boolean)
                  .join(", ");

                const label = a.label || a.type || "Address";
                const contactName = a.fullName || a.name || "";

                return (
                  <article className="address-card" key={id}>
                    <div className="address-card-accent" />

                    {/* CARD HEADER */}
                    <div className="address-card-head">
                      <div className="address-type-icon">
                        <FaHome size={15} />
                      </div>

                      <div className="address-main-info">
                        <div className="address-title-row">
                          <h2>{label}</h2>

                          {a.isDefault && (
                            <span className="address-default">
                              <FaCheckCircle size={9} />
                              Default
                            </span>
                          )}
                        </div>

                        {(contactName || a.phone) && (
                          <div className="address-contact">
                            {contactName && (
                              <span>{contactName}</span>
                            )}

                            {contactName && a.phone && (
                              <i aria-hidden="true" />
                            )}

                            {a.phone && <span>{a.phone}</span>}
                          </div>
                        )}
                      </div>

                      {/* EDIT ICON */}
                      <button
                        type="button"
                        className="address-more"
                        onClick={() =>
                          navigate(`/account/addresses/${id}/edit`)
                        }
                        aria-label={`Edit ${label}`}
                        title="Edit address"
                      >
                        <FaEdit size={12} />
                      </button>
                    </div>

                    {/* ADDRESS BODY */}
                    <div className="address-body">
                      <div className="address-body-icon">
                        <FaMapMarkerAlt size={12} />
                      </div>

                      <p>
                        {addressText ||
                          "No address details available"}
                      </p>
                    </div>

                    {/* FOOTER */}
                    <div className="address-card-footer">
                      <div className="address-delivery-note">
                        <span className="address-live-dot" />
                        Available for delivery
                      </div>

                      <div className="address-actions">
                        {/* EDIT */}
                        <button
                          type="button"
                          className="address-action edit"
                          onClick={() =>
                            navigate(
                              `/account/addresses/${id}/edit`
                            )
                          }
                        >
                          <FaEdit size={11} />
                          Edit
                        </button>

                        {/* DELETE */}
                        <button
                          type="button"
                          className="address-action delete"
                          onClick={() => remove(id)}
                        >
                          <FaTrash size={10} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* TIP */}
            <div className="address-tip mb-3">
              <div className="address-tip-icon">
                <FaCheckCircle size={13} />
              </div>

              <div className="address-tip-copy">
                <strong>Pro tip for faster checkout</strong>

                <p>
                  Keep your most-used delivery location marked as
                  default.
                </p>
              </div>

              <span
                className="address-tip-arrow"
                aria-hidden="true"
              >
                <FaChevronRight size={10} />
              </span>
            </div>
          </>
        )}
      </div>

      <style>{`
        .address-page {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          color: #17181d;
        }

        .address-header-add {
          text-decoration: none;
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .address-header-add:focus-visible,
        .address-hero-action:focus-visible,
        .address-primary-btn:focus-visible,
        .address-more:focus-visible,
        .address-action:focus-visible {
          outline: 3px solid rgba(99, 102, 241, .22);
          outline-offset: 3px;
        }

        .address-header-add:hover {
          transform: translateY(-1px);
        }

        /* HERO */

        .address-hero {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 14px;
          padding: 25px 26px;
          border: 1px solid #e9e8f3;
          border-radius: 22px;
          background:
            radial-gradient(
              circle at 88% 15%,
              rgba(99, 102, 241, .13),
              transparent 28%
            ),
            linear-gradient(
              135deg,
              #fafaff 0%,
              #fff 55%,
              #f8f8ff 100%
            );
          box-shadow: 0 12px 35px rgba(30, 27, 75, .055);
        }

        .address-hero::after {
          content: "";
          position: absolute;
          right: -75px;
          bottom: -100px;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: rgba(99, 102, 241, .045);
          pointer-events: none;
        }

        .address-hero-copy {
          position: relative;
          z-index: 1;
          min-width: 0;
        }

        .address-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 8px;
          color: #6366f1;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .address-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, .11);
        }

        .address-hero h1 {
          margin: 0 0 7px;
          color: #151621;
          font-size: clamp(22px, 3vw, 29px);
          line-height: 1.12;
          font-weight: 850;
          letter-spacing: -.7px;
        }

        .address-hero p {
          max-width: 570px;
          margin: 0;
          color: #737582;
          font-size: 12px;
          line-height: 1.6;
        }

        .address-hero-action,
        .address-primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 0;
          cursor: pointer;
          font: inherit;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          transition:
            transform .18s ease,
            box-shadow .18s ease,
            opacity .18s ease;
        }

        .address-hero-action {
          text-decoration: none;
          position: relative;
          z-index: 1;
          flex: none;
          min-height: 44px;
          padding: 0 15px 0 9px;
          border-radius: 13px;
          color: #fff;
          background: #4f46e5;
          box-shadow: 0 9px 22px rgba(79, 70, 229, .2);
        }

        .address-hero-action:hover,
        .address-primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 11px 25px rgba(79, 70, 229, .23);
        }

        .address-hero-action:active,
        .address-primary-btn:active {
          transform: translateY(0);
        }

        .address-hero-action-icon {
          display: grid;
          place-items: center;
          width: 27px;
          height: 27px;
          border-radius: 9px;
          background: rgba(255,255,255,.16);
        }

        /* SUMMARY */

        .address-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 15px;
          padding: 11px 13px;
          border: 1px solid #ececf2;
          border-radius: 15px;
          background: rgba(255,255,255,.82);
        }

        .address-summary-main {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .address-summary-icon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          flex: none;
          border-radius: 10px;
          color: #4f46e5;
          background: #f0efff;
        }

        .address-summary-main strong,
        .address-summary-main span {
          display: block;
        }

        .address-summary-main strong {
          margin-bottom: 2px;
          color: #30313a;
          font-size: 11px;
          font-weight: 850;
        }

        .address-summary-main span {
          color: #8a8b96;
          font-size: 10px;
        }

        .address-summary-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex: none;
          padding: 6px 9px;
          border: 1px solid #d9f5e8;
          border-radius: 999px;
          color: #087443;
          background: #f0fdf7;
          font-size: 9px;
          font-weight: 800;
        }

        /* CARDS */

        .address-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .address-card {
          position: relative;
          overflow: hidden;
          min-width: 0;
          padding: 17px;
          border: 1px solid #e9e9ef;
          border-radius: 19px;
          background: #fff;
          box-shadow: 0 5px 20px rgba(22, 24, 45, .045);
          transition:
            transform .2s ease,
            box-shadow .2s ease,
            border-color .2s ease;
        }

        .address-card:hover {
          transform: translateY(-2px);
          border-color: #dcdcf0;
          box-shadow: 0 14px 34px rgba(22, 24, 45, .09);
        }

        .address-card-accent {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(
            90deg,
            #4f46e5,
            #818cf8,
            transparent
          );
          opacity: .8;
        }

        .address-card-head {
          display: flex;
          align-items: flex-start;
          gap: 11px;
        }

        .address-type-icon {
          display: grid;
          place-items: center;
          width: 41px;
          height: 41px;
          flex: none;
          border: 1px solid #e5e4ff;
          border-radius: 13px;
          color: #4f46e5;
          background: linear-gradient(
            145deg,
            #f2f1ff,
            #eae9ff
          );
        }

        .address-main-info {
          min-width: 0;
          flex: 1;
          padding-top: 1px;
        }

        .address-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 4px;
        }

        .address-title-row h2 {
          min-width: 0;
          margin: 0;
          overflow: hidden;
          color: #1a1b23;
          font-size: 14px;
          line-height: 1.3;
          font-weight: 850;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .address-default {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex: none;
          padding: 4px 7px;
          border: 1px solid #d4f2e3;
          border-radius: 999px;
          color: #087443;
          background: #effcf6;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        .address-contact {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          color: #858691;
          font-size: 10px;
          line-height: 1.4;
        }

        .address-contact i {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #b6b7c0;
        }

        .address-more {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          flex: none;
          padding: 0;
          border: 1px solid #ededf2;
          border-radius: 10px;
          color: #777987;
          background: #fafafd;
          cursor: pointer;
          transition: all .16s ease;
        }

        .address-more:hover {
          border-color: #dcdafd;
          color: #4f46e5;
          background: #f4f3ff;
        }

        /* ADDRESS BODY */

        .address-body {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          min-height: 68px;
          margin: 15px 0 13px;
          padding: 12px;
          border: 1px solid #f0f0f4;
          border-radius: 13px;
          background: #fafafd;
        }

        .address-body-icon {
          display: grid;
          place-items: center;
          width: 25px;
          height: 25px;
          flex: none;
          margin-top: 1px;
          border-radius: 8px;
          color: #6366f1;
          background: #eeedff;
        }

        .address-body p {
          margin: 1px 0 0;
          color: #555763;
          font-size: 11px;
          line-height: 1.65;
        }

        /* FOOTER */

        .address-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 12px;
          border-top: 1px solid #f0f0f3;
        }

        .address-delivery-note {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          color: #858691;
          font-size: 9px;
          font-weight: 650;
        }

        .address-live-dot {
          width: 6px;
          height: 6px;
          flex: none;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,.1);
        }

        .address-actions {
          display: flex;
          gap: 6px;
          flex: none;
        }

        .address-action {
          text-decoration: none;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 10px;
          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          font: inherit;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
          transition: all .16s ease;
        }

        .address-action.edit {
          border-color: #e6e4ff;
          color: #4f46e5;
          background: #f6f5ff;
        }

        .address-action.edit:hover {
          border-color: #d7d4ff;
          background: #eeedff;
        }

        .address-action.delete {
          border-color: #f7dddd;
          color: #b42323;
          background: #fff8f8;
        }

        .address-action.delete:hover {
          border-color: #efcaca;
          background: #fff0f0;
        }

        /* EMPTY */

        .address-empty {
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 50px 25px 35px;
          border: 1px solid #e9e8f3;
          border-radius: 22px;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(99,102,241,.09),
              transparent 34%
            ),
            #fff;
          text-align: center;
        }

        .address-empty-visual {
          position: relative;
          display: grid;
          place-items: center;
          width: 102px;
          height: 102px;
          margin-bottom: 18px;
        }

        .address-empty-orbit {
          position: absolute;
          border: 1px solid #e5e4ff;
          border-radius: 50%;
        }

        .orbit-one {
          inset: 5px;
        }

        .orbit-two {
          inset: 18px;
          border-color: #efeffa;
        }

        .address-empty-pin {
          position: relative;
          z-index: 2;
          display: grid;
          place-items: center;
          width: 58px;
          height: 58px;
          border: 1px solid #dedcff;
          border-radius: 19px;
          color: #4f46e5;
          background: #f0efff;
          box-shadow: 0 10px 24px rgba(79,70,229,.12);
        }

        .address-empty-kicker {
          color: #6366f1;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .address-empty h2 {
          margin: 7px 0 7px;
          color: #181923;
          font-size: 20px;
          line-height: 1.25;
          font-weight: 850;
          letter-spacing: -.3px;
        }

        .address-empty p {
          max-width: 480px;
          margin: 0 auto 20px;
          color: #7b7c88;
          font-size: 11px;
          line-height: 1.7;
        }

        .address-primary-btn {
          min-height: 42px;
          padding: 0 16px;
          border-radius: 12px;
          color: #fff;
          background: #4f46e5;
          box-shadow: 0 8px 20px rgba(79,70,229,.18);
        }

        .address-empty-points {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 9px 18px;
          margin-top: 22px;
          padding-top: 17px;
          width: min(100%, 520px);
          border-top: 1px solid #f0f0f4;
        }

        .address-empty-points span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #858691;
          font-size: 9px;
          font-weight: 700;
        }

        .address-empty-points svg {
          color: #10b981;
        }

        /* TIP */

        .address-tip {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 15px;
          padding: 11px 13px;
          border: 1px solid #e7f0ed;
          border-radius: 14px;
          background: linear-gradient(90deg, #f8fcfa, #fff);
        }

        .address-tip-icon {
          display: grid;
          place-items: center;
          width: 31px;
          height: 31px;
          flex: none;
          border-radius: 10px;
          color: #059669;
          background: #ecfdf5;
        }

        .address-tip-copy {
          min-width: 0;
        }

        .address-tip-copy strong {
          display: block;
          margin-bottom: 2px;
          color: #34423c;
          font-size: 10px;
          font-weight: 850;
        }

        .address-tip-copy p {
          margin: 0;
          color: #7f8a85;
          font-size: 9px;
        }

        .address-tip-arrow {
          display: grid;
          place-items: center;
          width: 25px;
          height: 25px;
          margin-left: auto;
          flex: none;
          border-radius: 8px;
          color: #8ba098;
          background: #f1f7f4;
        }

        /* SKELETON */

        .address-skeleton-card {
          min-height: 190px;
        }

        .skeleton-circle,
        .skeleton-line,
        .skeleton-pill,
        .skeleton-button {
          background: linear-gradient(
            90deg,
            #f0f1f5 25%,
            #f8f8fa 50%,
            #f0f1f5 75%
          );
          background-size: 200% 100%;
          animation: addressShimmer 1.35s linear infinite;
        }

        .skeleton-circle {
          width: 41px;
          height: 41px;
          flex: none;
          border-radius: 13px;
        }

        .skeleton-copy {
          flex: 1;
        }

        .skeleton-line {
          height: 9px;
          margin-bottom: 7px;
          border-radius: 999px;
        }

        .skeleton-line.title {
          width: 35%;
          height: 11px;
        }

        .skeleton-line.meta {
          width: 48%;
        }

        .skeleton-line.wide {
          width: 92%;
        }

        .skeleton-line.medium {
          width: 76%;
        }

        .skeleton-line.small {
          width: 52%;
        }

        .skeleton-pill {
          width: 52px;
          height: 20px;
          border-radius: 999px;
        }

        .skeleton-address {
          margin: 19px 0 15px 52px;
        }

        .skeleton-actions {
          display: flex;
          gap: 7px;
          margin-left: 52px;
          padding-top: 12px;
          border-top: 1px solid #f0f0f3;
        }

        .skeleton-button {
          width: 58px;
          height: 30px;
          border-radius: 9px;
        }

        @keyframes addressShimmer {
          from {
            background-position: 200% 0;
          }

          to {
            background-position: -200% 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .address-card,
          .address-hero-action,
          .address-primary-btn,
          .address-more,
          .address-action,
          .skeleton-circle,
          .skeleton-line,
          .skeleton-pill,
          .skeleton-button {
            animation: none !important;
            transition: none !important;
          }
        }

        /* TABLET */

        @media (max-width: 820px) {
          .address-list {
            grid-template-columns: 1fr;
          }
        }

        /* MOBILE */

        @media (max-width: 600px) {
          .address-hero {
            align-items: flex-start;
            flex-direction: column;
            gap: 16px;
            padding: 20px;
            border-radius: 18px;
          }

          .address-hero h1 {
            font-size: 22px;
          }

          .address-hero p {
            font-size: 11px;
          }

          .address-hero-action {
            width: 100%;
          }

          .address-summary {
            align-items: flex-start;
            flex-direction: column;
            padding: 10px;
          }

          .address-summary-badge {
            width: 100%;
            justify-content: center;
          }

          .address-card {
            padding: 14px;
            border-radius: 17px;
          }

          .address-card-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .address-delivery-note {
            padding-left: 2px;
          }

          .address-actions {
            width: 100%;
          }

          .address-action {
            flex: 1;
            min-height: 37px;
          }

          .address-empty {
            padding: 38px 18px 27px;
            border-radius: 18px;
          }

          .address-empty h2 {
            font-size: 18px;
          }

          .address-empty p {
            font-size: 10.5px;
          }

          .address-primary-btn {
            width: 100%;
          }

          .address-tip {
            align-items: flex-start;
          }
        }

        @media (max-width: 390px) {
          .address-hero {
            padding: 17px;
          }

          .address-title-row h2 {
            max-width: 135px;
          }

          .address-contact {
            font-size: 9px;
          }

          .address-body p {
            font-size: 10px;
          }

          .address-empty-points {
            gap: 8px 12px;
          }

          .address-empty-points span {
            font-size: 8px;
          }
        }
      `}</style>
    </AccountShell>
  );
}

