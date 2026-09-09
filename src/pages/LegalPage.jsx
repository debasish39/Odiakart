import React, { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ChevronRight,
  FileText,
  LockKeyhole,
  RefreshCcw,
  Truck,
  ShieldCheck,
  Mail,
  Clock3,
  Ban,
} from "lucide-react";

/* =========================================================
   ODikart LEGAL CONTENT

   Supported routes:

   /legal/terms
   /legal/privacy
   /legal/refund
   /legal/shipping
   /legal/cancellation
========================================================= */

const legalContent = {
  /* =========================================================
     TERMS & CONDITIONS
  ========================================================= */

  terms: {
    title: "Terms & Conditions",
    shortTitle: "Terms",
    desc: "Understand the rules and guidelines that apply when using Odikart.",
    icon: FileText,
    accent: "indigo",

    sections: [
      {
        title: "Acceptance of Terms",
        content:
          "By accessing, browsing, registering with, or purchasing through Odikart, you agree to comply with these Terms & Conditions and the policies referenced within them. If you do not agree with these terms, please do not use the platform.",
      },

      {
        title: "Account & Registration",
        content:
          "Certain features may require you to create an account. You are responsible for providing accurate and current information, keeping your account information updated, protecting your authentication credentials, and notifying Odikart if you believe your account has been accessed without authorization. Odikart may use mobile-number or OTP verification.",
      },

      {
        title: "Use of Platform",
        content:
          "You agree to use Odikart only for lawful purposes. You must not use the platform for fraud, unauthorized access, malicious activity, interference with platform security, harmful uploads, unauthorized scraping, fake accounts, fake orders, or abuse of promotional programs.",
      },

      {
        title: "Products & Listings",
        content:
          "Odikart may display products, descriptions, photographs, specifications, availability, seller information, and other product information. We make reasonable efforts to keep listings accurate. However, colors may appear differently depending on your device, specifications may change, availability may change, and occasional listing errors may occur.",
      },

      {
        title: "Pricing & Taxes",
        content:
          "Prices are displayed in Indian Rupees (INR), unless otherwise specified. Prices, applicable taxes, shipping charges, discounts, and other charges may change. If an obvious pricing or listing error occurs, Odikart may correct the error and, where appropriate, cancel the affected order.",
      },

      {
        title: "Orders",
        content:
          "Placing an order constitutes a request to purchase the selected products. Orders may be cancelled or rejected because of product unavailability, incorrect information, suspected fraud, payment problems, incorrect delivery information, logistics limitations, or violation of these Terms.",
      },

      {
        title: "Payments",
        content:
          "Odikart may support Cash on Delivery, online payments, and other payment methods made available during checkout. Online payments may be processed through third-party payment providers. You agree to provide valid payment information where required.",
      },

      {
        title: "Shipping & Delivery",
        content:
          "Orders are processed according to product availability, seller or warehouse processing, delivery location, logistics capacity, and other fulfillment conditions. Estimated delivery dates are provided for guidance and may change because of courier delays, weather, holidays, incorrect addresses, customer unavailability, or other circumstances outside reasonable control.",
      },

      {
        title: "Returns & Exchanges",
        content:
          "Eligible products may be returned or exchanged according to Odikart's applicable return conditions. Eligibility may depend on product category, product condition, return timing, packaging, accessories, tags, and the reason for return. Some products may have special or no-return conditions.",
      },

      {
        title: "Refunds",
        content:
          "Approved refunds are handled according to Odikart's Refund Policy. The amount and timing may depend on the amount actually paid, approved return quantity, discounts, coupon conditions, payment method, and applicable processing requirements.",
      },

      {
        title: "Coupons & Offers",
        content:
          "Coupons and promotional offers may have expiry dates, minimum order requirements, product restrictions, usage limits, or customer-specific conditions. Coupons cannot be exchanged for cash unless expressly stated. Odikart may modify, restrict, or withdraw promotional benefits where permitted.",
      },

      {
        title: "Referral Program",
        content:
          "Referral benefits are subject to the applicable referral-program conditions. A reward may require a referred customer to register using a valid referral code, complete required verification, place a qualifying order, satisfy applicable minimum-order requirements, receive the order successfully, and complete the applicable return or cancellation period. Odikart may withhold or reverse rewards for fraud, abuse, self-referral, duplicate accounts, suspicious activity, or other violations.",
      },

      {
        title: "User Responsibilities",
        content:
          "You agree to provide truthful information and use Odikart responsibly. You are responsible for your account activity, checkout information, delivery address, appropriate use of coupons and referral programs, and following applicable return procedures.",
      },

      {
        title: "Intellectual Property",
        content:
          "Odikart and its licensors may own or have rights to platform content including logos, brand elements, website design, graphics, text, software, images, and other original content. Protected content may not be reproduced, modified, distributed, or commercially exploited without appropriate authorization.",
      },

      {
        title: "Limitation of Liability",
        content:
          "To the extent permitted by applicable law, Odikart will not be responsible for indirect, incidental, or consequential losses arising from circumstances outside our reasonable control. Nothing in these Terms is intended to exclude or restrict rights or remedies that cannot legally be excluded or restricted.",
      },

      {
        title: "Fraud & Abuse",
        content:
          "Odikart may investigate suspicious activity involving fake accounts, fake orders, payment abuse, coupon abuse, referral manipulation, false return claims, repeated fraudulent transactions, or unauthorized system access. Where appropriate, Odikart may cancel transactions, restrict accounts, withhold promotional benefits, or take other lawful action.",
      },

      {
        title: "Account Suspension",
        content:
          "Odikart may suspend or restrict an account when there is reasonable evidence of fraud, abuse, security violations, repeated policy violations, unauthorized activity, or misuse of promotional programs. Users may contact support regarding account restrictions where appropriate.",
      },

      {
        title: "Changes to Terms",
        content:
          "Odikart may update these Terms & Conditions from time to time. Changes become effective when published on the platform unless another effective date is specified. Continued use after an update indicates acceptance of the updated terms, subject to applicable law.",
      },

      {
        title: "Contact",
        content:
          "For questions regarding these Terms & Conditions, please contact support@eshop.debasish.xyz.",
      },
    ],
  },

  /* =========================================================
     PRIVACY POLICY
  ========================================================= */

  privacy: {
    title: "Privacy Policy",
    shortTitle: "Privacy",
    desc: "Learn what information Odikart may collect, why it is used, and how it is protected.",
    icon: LockKeyhole,
    accent: "violet",

    sections: [
      {
        title: "Information We Collect",
        content:
          "Depending on how you use Odikart, we may process your name, mobile number, email address, account information, delivery and billing address, order information, product and transaction information, customer-support communications, referral information, coupon usage, device information, IP address, and platform usage information.",
      },

      {
        title: "Phone & OTP",
        content:
          "Odikart may use mobile-number-based authentication and OTP verification to create or access your account, verify identity, protect accounts, send authentication-related communications, and help prevent unauthorized access and abuse. OTP codes should never be shared with another person.",
      },

      {
        title: "Account Information",
        content:
          "When you create or maintain an Odikart account, we may process information associated with the account, including your name, email address, mobile number, profile information, and authentication-related information.",
      },

      {
        title: "Address Information",
        content:
          "When you place an order, we may process delivery information such as recipient name, mobile number, house or building information, street or locality, city, state, postal code, and delivery instructions. This information is used to fulfill and deliver orders.",
      },

      {
        title: "Order & Payment Information",
        content:
          "We may process information relating to products ordered, order amounts, order status, delivery information, returns, refunds, payment method, payment transaction identifiers, coupon usage, and referral-related transactions. Payments may be processed by third-party payment service providers.",
      },

      {
        title: "Device Information",
        content:
          "When you access Odikart, certain technical information may be processed, such as browser type, device type, operating system, IP address, application information, approximate technical location information, and usage or diagnostic information.",
      },

      {
        title: "Cookies",
        content:
          "Odikart may use cookies, local storage, and similar technologies to maintain sessions, remember preferences, support authentication, improve functionality, understand platform usage, and improve security. Browser settings may allow you to control certain technologies, although disabling them may affect functionality.",
      },

      {
        title: "How We Use Data",
        content:
          "Information may be used to create and manage accounts, authenticate users, process orders, deliver products, process payments and refunds, provide support, manage returns, provide tracking, apply coupons, operate referral programs, prevent fraud and abuse, improve the platform, communicate important service information, maintain security, and comply with legal obligations.",
      },

      {
        title: "Data Sharing",
        content:
          "Relevant information may be shared with service providers where necessary to operate Odikart, including payment processors, courier and logistics providers, technology and cloud providers, communication providers, customer-support providers, and security or fraud-prevention services.",
      },

      {
        title: "Security",
        content:
          "Odikart uses reasonable technical and organizational measures intended to protect information from unauthorized access, misuse, alteration, or disclosure. However, no internet-based system can be guaranteed to be completely secure.",
      },

      {
        title: "Data Retention",
        content:
          "Information may be retained for as long as reasonably necessary to provide services, maintain transaction records, resolve disputes, prevent fraud, meet legal, accounting, tax, or regulatory requirements, and enforce applicable agreements. When no longer required, information may be deleted, anonymized, or securely disposed of subject to applicable requirements.",
      },

      {
        title: "User Rights",
        content:
          "Depending on applicable law, you may have rights relating to your personal information, including rights to request access, correction, deletion where legally applicable, withdrawal of certain permissions or consent, and raising privacy-related concerns. Requests may be subject to verification and legal requirements.",
      },

      {
        title: "Children's Privacy",
        content:
          "Odikart is intended for users who are legally capable of entering into applicable transactions. We do not knowingly seek to collect personal information from children in violation of applicable law. Contact us if you believe a child has provided personal information improperly.",
      },

      {
        title: "Contact",
        content:
          "For privacy-related questions or requests, please contact support@eshop.debasish.xyz.",
      },
    ],
  },

  /* =========================================================
     REFUND POLICY
  ========================================================= */

  refund: {
    title: "Refund Policy",
    shortTitle: "Refunds",
    desc: "Understand cancellation, return inspection, approval, and refund processing.",
    icon: RefreshCcw,
    accent: "emerald",

    sections: [
      {
        title: "Refund Eligibility",
        content:
          "A refund may be available when an eligible product is damaged during delivery, incorrectly delivered, missing required components, defective where applicable, or otherwise eligible under the applicable return conditions. Products generally need to be returned in the required condition with applicable packaging, accessories, tags, manuals, and included items.",
      },

      {
        title: "Cancellation",
        content:
          "Customers may request cancellation before an order reaches a stage where cancellation is no longer possible. Availability depends on order status, payment status, shipping or fulfillment progress, logistics processing, and product type.",
      },

      {
        title: "Return Inspection",
        content:
          "Returned products may be inspected before a refund is approved. Inspection may consider product condition, signs of use, physical damage, missing accessories, packaging, authenticity where relevant, and whether the returned item matches the ordered item.",
      },

      {
        title: "Approved Refund",
        content:
          "Once a return has been received and approved, Odikart may initiate the applicable refund. The amount may depend on the amount actually paid, approved return quantity, applicable discounts, coupon conditions, shipping charges where applicable, and other lawful deductions.",
      },

      {
        title: "Payment Method",
        content:
          "Where possible, refunds for online payments may be processed through the applicable payment method or payment service provider. Actual credit timing depends on the payment provider and financial institution.",
      },

      {
        title: "COD Refunds",
        content:
          "For Cash on Delivery orders, Odikart may require appropriate information to process an eligible refund. Refunds may be processed through a supported electronic payment method or another method made available by Odikart. Customers should provide accurate refund information.",
      },

      {
        title: "Online Payment Refunds",
        content:
          "For prepaid orders, approved refunds may be initiated through the applicable payment gateway or payment service. The time required for the amount to appear in the customer's account may vary.",
      },

      {
        title: "Non-refundable Items",
        content:
          "Certain products may be non-refundable or may have special return conditions. These may include products specifically marked as non-returnable, personalized or customized products, products that cannot reasonably be returned due to their nature, or products that do not satisfy applicable return conditions.",
      },

      {
        title: "Refund Timeline",
        content:
          "Refund timing depends on the transaction and processing stage. Return processing begins after the returned product is received, inspection may be required before approval, and once approved the refund is initiated through the applicable payment process. Banks and payment providers may require additional processing time.",
      },

      {
        title: "Failed or Delayed Refunds",
        content:
          "If an approved refund has not been received after the applicable processing period, contact support with your order number, registered mobile number or email, refund details, and relevant payment information so the transaction can be investigated.",
      },

      {
        title: "Fraudulent Refund or Return Claims",
        content:
          "Odikart may investigate suspicious return or refund activity, including repeated false claims, product substitution, intentional damage, fraudulent documentation, or other abuse. Appropriate action may include return or refund rejection, account restrictions, cancellation of promotional benefits, or other lawful action.",
      },

      {
        title: "Contact",
        content:
          "For refund-related questions, please contact support@eshop.debasish.xyz and include your order number whenever contacting support about a specific refund.",
      },
    ],
  },

  /* =========================================================
     SHIPPING POLICY
  ========================================================= */

  shipping: {
    title: "Shipping Policy",
    shortTitle: "Shipping",
    desc: "Learn how Odikart orders are processed, shipped, tracked, and delivered.",
    icon: Truck,
    accent: "blue",

    sections: [
      {
        title: "Processing Time",
        content:
          "After an order is successfully placed, it may go through stages such as Order Confirmed, Processing, Packed, Shipped, In Transit, Out for Delivery, and Delivered. Processing time depends on product availability, seller processing, warehouse operations, and fulfillment conditions.",
      },

      {
        title: "Delivery Timeline",
        content:
          "Estimated delivery timelines may be displayed during shopping or checkout. Delivery time depends on delivery location, product availability, seller or warehouse processing, courier capacity, transportation conditions, and local delivery conditions. Estimated dates are not always guaranteed.",
      },

      {
        title: "Shipping Charges",
        content:
          "Shipping charges may vary based on delivery location, product size and weight, order value, seller or fulfillment method, promotional offers, and logistics charges. Applicable charges will be displayed during checkout where possible.",
      },

      {
        title: "Tracking",
        content:
          "Once an order has been shipped, tracking information may become available. Customers can use available tracking information to view shipment progress. Tracking may be provided by Odikart and/or the applicable logistics partner.",
      },

      {
        title: "Delivery Attempts",
        content:
          "Courier partners may make delivery attempts according to their operational procedures. Customers should ensure that someone is available where required, the registered mobile number is reachable, the delivery address is accurate, and delivery instructions are clear. Repeated unsuccessful attempts may result in the shipment being returned to the sender.",
      },

      {
        title: "Address Changes",
        content:
          "Customers should verify their delivery address before completing an order. Once an order enters processing or shipping, changing the address may not always be possible. Contact Odikart support as soon as possible if an address change is needed.",
      },

      {
        title: "Delays",
        content:
          "Delivery may be delayed because of severe weather, natural disasters, transportation disruptions, public holidays, high logistics volume, courier operational issues, incorrect or incomplete address information, customer unavailability, regulatory or security restrictions, or other circumstances beyond reasonable control.",
      },

      {
        title: "Damaged Packages",
        content:
          "Customers should inspect packages when reasonably possible. If a package appears seriously damaged, document the condition with photographs or videos where possible and contact Odikart support promptly. Applicable return and refund procedures will apply.",
      },

      {
        title: "Incorrect or Missing Items",
        content:
          "If you receive a wrong product, missing product, missing component, or a product substantially different from what was ordered, contact Odikart support as soon as possible with order details and supporting information.",
      },

      {
        title: "Delivery Tracking & Courier Partners",
        content:
          "Odikart may use third-party logistics and courier providers to fulfill orders. Tracking availability and delivery procedures may vary depending on the logistics provider and destination.",
      },

      {
        title: "Undeliverable Orders",
        content:
          "An order may become undeliverable because of an incorrect or incomplete address, customer unavailability, repeated failed delivery attempts, refusal to accept the package, or service restrictions. Where an order is returned to the sender, refund or re-shipment will be handled according to the applicable order, payment, return, and refund conditions.",
      },

      {
        title: "Contact",
        content:
          "For shipping and delivery support, please contact support@eshop.debasish.xyz and provide your order number when contacting us about an existing shipment.",
      },
    ],
  },

  /* =========================================================
     CANCELLATION POLICY
  ========================================================= */

  cancellation: {
    title: "Cancellation Policy",
    shortTitle: "Cancellation",
    desc: "Understand when and how Odikart orders can be cancelled.",
    icon: Ban,
    accent: "rose",

    sections: [
      {
        title: "Order Cancellation",
        content:
          "Customers may request cancellation of an order before it reaches a stage where cancellation is no longer possible. Cancellation availability depends on the current order status, payment status, fulfillment progress, shipping status, and product type.",
      },

      {
        title: "Cancellation Before Shipment",
        content:
          "If a cancellation request is received before the order is shipped, Odikart may cancel the order and process the applicable refund according to the payment method and Refund Policy.",
      },

      {
        title: "Cancellation After Shipment",
        content:
          "Once an order has been shipped or handed over to a delivery partner, direct cancellation may no longer be possible. In such cases, the customer may need to follow the applicable return process after delivery.",
      },

      {
        title: "Refund After Cancellation",
        content:
          "For eligible prepaid orders, the applicable refund may be processed through the original payment method or the payment service provider used for the transaction. The actual processing time may depend on the payment provider and financial institution.",
      },

      {
        title: "Cash on Delivery Orders",
        content:
          "For Cash on Delivery orders, no payment refund is required when an order is cancelled before delivery and no payment has been collected. If payment has already been collected, the applicable refund process will apply.",
      },

      {
        title: "Cancellation by Odikart",
        content:
          "Odikart may cancel an order in circumstances such as product unavailability, pricing or listing errors, payment issues, suspected fraud, incorrect delivery information, logistics limitations, or other operational reasons.",
      },

      {
        title: "Coupon and Promotional Orders",
        content:
          "If an order containing a coupon or promotional benefit is cancelled, the coupon or promotional benefit may not be restored automatically. Any restoration will depend on the applicable coupon terms and conditions.",
      },

      {
        title: "Referral Orders",
        content:
          "Orders associated with referral benefits may be subject to additional eligibility conditions. Cancellation, return, refund, or fraudulent activity may affect the eligibility of referral rewards.",
      },

      {
        title: "Contact",
        content:
          "If you need help cancelling an order, please contact Odikart Support with your order number and registered mobile number or email address.",
      },
    ],
  },
};

/* =========================================================
   ACCENT CONFIG
========================================================= */

const accentClasses = {
  indigo: {
    icon: "bg-indigo-600 text-white shadow-indigo-500/25",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
    heading: "text-indigo-700",
    line: "bg-indigo-600",
    active:
      "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20",
  },

  violet: {
    icon: "bg-violet-600 text-white shadow-violet-500/25",
    badge: "bg-violet-50 text-violet-700 border-violet-100",
    heading: "text-violet-700",
    line: "bg-violet-600",
    active:
      "bg-violet-600 text-white shadow-lg shadow-violet-500/20",
  },

  emerald: {
    icon: "bg-emerald-600 text-white shadow-emerald-500/25",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    heading: "text-emerald-700",
    line: "bg-emerald-600",
    active:
      "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
  },

  blue: {
    icon: "bg-blue-600 text-white shadow-blue-500/25",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    heading: "text-blue-700",
    line: "bg-blue-600",
    active:
      "bg-blue-600 text-white shadow-lg shadow-blue-500/20",
  },

  rose: {
    icon: "bg-rose-600 text-white shadow-rose-500/25",
    badge: "bg-rose-50 text-rose-700 border-rose-100",
    heading: "text-rose-700",
    line: "bg-rose-600",
    active:
      "bg-rose-600 text-white shadow-lg shadow-rose-500/20",
  },
};

/* =========================================================
   LEGAL PAGE
========================================================= */

const LegalPage = () => {
  const { type } = useParams();

  const page = legalContent[type];

  /* -------------------------------------------------------
     Section IDs
  ------------------------------------------------------- */

  const sectionIds = useMemo(() => {
    if (!page) return [];

    return page.sections.map((section, index) => ({
      title: section.title,
      id: `legal-section-${index + 1}`,
    }));
  }, [page]);

  /* -------------------------------------------------------
     Scroll to top when page changes
  ------------------------------------------------------- */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [type]);

  /* =======================================================
     PAGE NOT FOUND
  ======================================================= */

  if (!page) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-20">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <FileText size={30} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Page not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            The legal page you requested does not exist.
          </p>

          <Link
            to="/"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <ArrowLeft size={16} />
            Back to Odikart
          </Link>
        </div>
      </main>
    );
  }

  const Icon = page.icon;

  const accent =
    accentClasses[page.accent] || accentClasses.indigo;

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-800 ">

      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-200/25 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-200/25 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="relative border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-8 lg:px-10 lg:pb-14 lg:pt-10">

          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-md"
          >
            <ArrowLeft size={16} />
            Back to Odikart
          </Link>

          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">

            <div>
              <div
                className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${accent.badge}`}
              >
                <Icon size={14} />
                Odikart Legal Center
              </div>

              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {page.title}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                {page.desc}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">

                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                  <Clock3 size={14} />
                  Last updated: September 9, 2026
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                  <ShieldCheck size={14} />
                  Please read carefully
                </span>

              </div>
            </div>

            <div
              className={`hidden h-24 w-24 items-center justify-center rounded-3xl shadow-2xl sm:flex ${accent.icon}`}
            >
              <Icon
                size={42}
                strokeWidth={1.7}
              />
            </div>

          </div>
        </div>
      </section>

      {/* ===================================================
          LEGAL PAGE NAVIGATION
      =================================================== */}

      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 sm:px-8 lg:px-10">

          {Object.entries(legalContent).map(
            ([key, item]) => {
              const ItemIcon = item.icon;
              const active = key === type;

              return (
                <Link
                  key={key}
                  to={`/legal/${key}`}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-300 ${
                    active
                      ? accent.active
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <ItemIcon size={15} />
                  {item.shortTitle}
                </Link>
              );
            }
          )}

        </div>
      </div>

      {/* ===================================================
          DOCUMENT CONTENT
      =================================================== */}

      <section className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">

        <div className="grid gap-8 lg:grid-cols-[270px_minmax(0,1fr)]">

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-xl">

              <div className="mb-3 px-3 py-2">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  On this page
                </p>
              </div>

              <nav className="space-y-1">

                {sectionIds.map(
                  ({ title, id }, index) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-500 transition duration-300 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-400 transition group-hover:bg-slate-200 group-hover:text-slate-700">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="line-clamp-2">
                        {title}
                      </span>
                    </a>
                  )
                )}

              </nav>
            </div>
          </aside>

          {/* =================================================
              DOCUMENT
          ================================================= */}

          <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.07)]">

            {/* Document header */}

            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-9">

              <div className="flex items-center gap-3">

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent.icon}`}
                >
                  <Icon size={19} />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {page.title}
                  </p>

                  <p className="text-xs text-slate-500">
                    {page.sections.length} sections
                  </p>
                </div>

              </div>

            </div>

            {/* Sections */}

            <div className="px-6 py-7 sm:px-9 sm:py-10 lg:px-12">

              {page.sections.map(
                (section, index) => {

                  const sectionId =
                    `legal-section-${index + 1}`;

                  return (
                    <section
                      id={sectionId}
                      key={`${section.title}-${index}`}
                      className="scroll-mt-28 border-b border-slate-100 py-7 first:pt-0 last:border-b-0 last:pb-0"
                    >

                      <div className="flex gap-4">

                        {/* Number */}

                        <div className="hidden shrink-0 pt-0.5 sm:block">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black ${accent.badge}`}
                          >
                            {index + 1}
                          </span>
                        </div>

                        {/* Content */}

                        <div className="min-w-0 flex-1">

                          <h2
                            className={`text-xl font-extrabold tracking-tight ${accent.heading}`}
                          >
                            {section.title}
                          </h2>

                          <div
                            className={`mt-3 h-1 w-10 rounded-full ${accent.line}`}
                          />

                          {/* Supports string OR array */}

                          {Array.isArray(section.content) ? (
                            <div className="mt-4 space-y-3">
                              {section.content.map(
                                (paragraph, paragraphIndex) => (
                                  <p
                                    key={paragraphIndex}
                                    className="text-sm leading-7 text-slate-600 sm:text-[15px]"
                                  >
                                    {paragraph}
                                  </p>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-[15px]">
                              {section.content}
                            </p>
                          )}

                        </div>

                      </div>

                    </section>
                  );
                }
              )}

            </div>
          </article>

        </div>
      </section>

      {/* ===================================================
          SUPPORT CTA
      =================================================== */}

      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 lg:px-10">

        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-9 text-white shadow-2xl sm:px-9 lg:px-12">

          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                <Mail size={14} />
                Need help?
              </div>

              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Questions about this policy?
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Our support team can help with your account, orders,
                returns, refunds, shipping, and other questions.
              </p>

            </div>

            <a
              href="mailto:support@eshop.debasish.xyz"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Contact Support
              <ChevronRight size={16} />
            </a>

          </div>
        </div>
      </section>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="border-t border-slate-200 bg-white px-5 py-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Odikart. All rights reserved.
      </footer>

    </main>
  );
};

export default LegalPage;

