import React from "react";
import {
  FaFileContract,
  FaShieldAlt,
  FaUndo,
  FaTruck,
  FaBan,
  FaChevronRight,
} from "react-icons/fa";

import { AccountShell } from "./AccountShell";
import { useNavigate } from "react-router-dom";

export default function AccountLegalPage() {
  const navigate = useNavigate();

  const policies = [
    {
      title: "Terms & Conditions",
      description: "The rules and guidelines for using Odikart",
      icon: FaFileContract,
      path: "/legal/terms",
    },
    {
      title: "Privacy Policy",
      description: "How Odikart collects and handles your data",
      icon: FaShieldAlt,
      path: "/legal/privacy",
    },
    {
      title: "Refund Policy",
      description: "Returns, refunds and refund processing",
      icon: FaUndo,
      path: "/legal/refund",
    },
    {
      title: "Shipping Policy",
      description: "Delivery terms, timelines and tracking",
      icon: FaTruck,
      path: "/legal/shipping",
    },
    {
      title: "Cancellation Policy",
      description: "Order cancellation rules and conditions",
      icon: FaBan,
      path: "/legal/cancellation",
    },
  ];

  return (
    <AccountShell title="Terms & privacy">
      {/* =====================================================
          INTRO
      ===================================================== */}
      <section
        style={{
          marginTop: 30,
          marginBottom: 22,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            color: "#171717",
            letterSpacing: "-0.3px",
          }}
        >
          Legal & policies
        </h2>

        <p
          style={{
            margin: "7px 0 0",
            fontSize: 14,
            lineHeight: 1.6,
            color: "#737373",
            maxWidth: 650,
          }}
        >
          Review Odikart's policies to understand how orders, payments,
          shipping, returns, cancellations and your personal information
          are handled.
        </p>
      </section>

      {/* =====================================================
          POLICIES
      ===================================================== */}
      <section className="ok-section">
        <div className="ok-label mt-9">
          Policies
        </div>

        <div className="ok-card ok-list">
          {policies.map(
            ({ title, description, icon: Icon, path }) => (
              <button
                key={path}
                type="button"
                className="ok-list-item"
                onClick={() => navigate(path)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: 0,
                  cursor: "pointer",
                }}
              >
                {/* ICON */}
                <div className="ok-circle">
                  <Icon />
                </div>

                {/* CONTENT */}
                <div className="ok-grow">
                  <b
                    style={{
                      fontSize: 14,
                      display: "block",
                      color: "#171717",
                    }}
                  >
                    {title}
                  </b>

                  <div
                    className="ok-small"
                    style={{
                      marginTop: 3,
                      lineHeight: 1.45,
                    }}
                  >
                    {description}
                  </div>
                </div>

                {/* ARROW */}
                <FaChevronRight
                  size={12}
                  color="#999"
                  style={{
                    flexShrink: 0,
                  }}
                />
              </button>
            )
          )}
        </div>
      </section>

      {/* =====================================================
          YOUR PRIVACY MATTERS
      ===================================================== */}
      <section
        style={{
          marginTop: 28,
          marginBottom: 20,
        }}
      >
        <div
          className="ok-card"
          style={{
            padding: 20,
            borderRadius: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            {/* SHIELD */}
            <div
              style={{
                width: 46,
                height: 46,
                minWidth: 46,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#eef2ff",
                color: "#4f46e5",
              }}
            >
              <FaShieldAlt size={19} />
            </div>

            {/* TEXT */}
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#171717",
                }}
              >
                Your privacy matters
              </h3>

              <p
                style={{
                  margin: "7px 0 0",
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: "#737373",
                }}
              >
                Please review our policies to understand how Odikart
                handles orders, payments, returns, shipping, account
                information, and personal data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          POLICY UPDATES
      ===================================================== */}
      <section
        style={{
          marginBottom: 25,
        }}
      >
        <div
          className="ok-card"
          style={{
            padding: 18,
            borderRadius: 16,
            background: "#fafafa",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              lineHeight: 1.65,
              color: "#777",
            }}
          >
            Policies may be updated from time to time. Please check
            this section for the latest version of our policies and
            terms.
          </p>
        </div>
      </section>

      {/* =====================================================
          QUICK CONTACT
      ===================================================== */}
      <section
        style={{
          marginBottom: 30,
        }}
      >
        <div
          className="ok-card"
          style={{
            padding: 18,
            borderRadius: 16,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#222",
            }}
          >
            Have questions about our policies?
          </div>

          <div
            style={{
              marginTop: 5,
              fontSize: 12.5,
              color: "#777",
              lineHeight: 1.5,
            }}
          >
            Visit Help & Support or contact the Odikart support team
            for assistance.
          </div>

          <button
            type="button"
            onClick={() => navigate("/account/help")}
            style={{
              marginTop: 14,
              border: 0,
              borderRadius: 10,
              padding: "9px 16px",
              background: "blue",
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Help & Support
          </button>
        </div>
      </section>
    </AccountShell>
  );
}

