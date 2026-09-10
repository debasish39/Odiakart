import React, { useMemo, useState } from "react";
import {
  FaQuestionCircle,
  FaBox,
  FaCreditCard,
  FaUndo,
  FaMapMarkerAlt,
  FaChevronRight,
  FaSearch,
  FaHeadset,
  FaArrowRight,
  FaChevronDown,
  FaTruck,
  FaClock,
  FaTimesCircle,
  FaCheckCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { AccountShell } from "./AccountShell";

/* =========================================================
   HELP TOPICS
========================================================= */

const topics = [
  {
    id: "order",
    title: "Where is my order?",
    description: "Track your order and check delivery status",
    icon: FaBox,
    articleTitle: "Track your order",
    articleDescription:
      "Find your order status, delivery progress and tracking information.",
    faqs: [
      {
        question: "How can I track my order?",
        answer:
          "Open your Orders page and select the order you want to track. You can view the latest order status, shipment information and delivery progress there.",
      },
      {
        question: "What does Out for Delivery mean?",
        answer:
          "Out for Delivery means your package has reached the final delivery stage and is with the delivery partner for delivery.",
      },
      {
        question: "Why is my order delayed?",
        answer:
          "Delivery can sometimes take longer because of courier delays, weather, address issues or operational problems. Check the latest tracking information for updates.",
      },
      {
        question: "What should I do if my order is not delivered?",
        answer:
          "First check the tracking status. If the expected delivery date has passed, contact support and provide your order number so the team can investigate.",
      },
    ],
  },

  {
    id: "payment",
    title: "Payment issue",
    description: "Get help with payments and transactions",
    icon: FaCreditCard,
    articleTitle: "Payment help",
    articleDescription:
      "Learn what to do when a payment fails, remains pending or needs verification.",
    faqs: [
      {
        question: "Why did my payment fail?",
        answer:
          "A payment may fail because of insufficient balance, bank restrictions, incorrect payment details, network problems or temporary payment gateway issues.",
      },
      {
        question: "My payment was deducted but the order was not created.",
        answer:
          "Do not make another payment immediately. Check your Orders page first. If the order is missing, contact support with your payment reference and transaction details.",
      },
      {
        question: "What does payment pending mean?",
        answer:
          "Payment pending means the payment provider has not yet confirmed the final transaction status. Please wait for the transaction to be completed before retrying.",
      },
      {
        question: "Can I change my payment method?",
        answer:
          "The available payment methods depend on your checkout options. If an order has already been placed, payment-method changes may not be available.",
      },
    ],
  },

  {
    id: "return",
    title: "Return or refund",
    description: "Learn about returns, refunds and cancellations",
    icon: FaUndo,
    articleTitle: "Returns & refunds",
    articleDescription:
      "Understand the return process, cancellation options and refund status.",
    faqs: [
      {
        question: "How can I return an order?",
        answer:
          "Open your Orders page, select the eligible order and use the available return option. Follow the instructions shown for that order.",
      },
      {
        question: "When will I receive my refund?",
        answer:
          "Refund timing depends on the payment method and the processing status of the return. Check your order or payment status for the latest information.",
      },
      {
        question: "Can I cancel my order?",
        answer:
          "Cancellation depends on the current order status. Orders that have already entered shipping or delivery may no longer be cancellable.",
      },
      {
        question: "What if I received a damaged product?",
        answer:
          "Contact support as soon as possible and provide your order details and relevant product information. Photos may also be requested during the support process.",
      },
    ],
  },

  {
    id: "address",
    title: "Delivery address",
    description: "Manage or update your delivery address",
    icon: FaMapMarkerAlt,
    articleTitle: "Delivery address help",
    articleDescription:
      "Get help with saved addresses, incorrect addresses and delivery locations.",
    faqs: [
      {
        question: "How can I add a new address?",
        answer:
          "Open your Addresses section and choose the option to add a new address. Enter the required contact and delivery information and save it.",
      },
      {
        question: "Can I change the address after ordering?",
        answer:
          "Address changes depend on the current order status. Once an order has been shipped, changing the delivery address may not be possible.",
      },
      {
        question: "Why is my PIN code not being accepted?",
        answer:
          "Make sure you have entered a valid six-digit Indian PIN code. The address lookup may also depend on the availability of postal data.",
      },
      {
        question: "What happens if the delivery address is incorrect?",
        answer:
          "Contact support as soon as possible. If the order has not yet shipped, the address may be easier to correct.",
      },
    ],
  },
];

/* =========================================================
   ADDITIONAL QUICK HELP
========================================================= */

const quickHelp = [
  {
    id: "delivery",
    title: "Delivery information",
    description: "Understand delivery times and shipment updates.",
    icon: FaTruck,
  },
  {
    id: "pending",
    title: "Order still processing",
    description: "Understand why your order has not shipped yet.",
    icon: FaClock,
  },
  {
    id: "cancelled",
    title: "Cancelled order",
    description: "Learn what happens after an order is cancelled.",
    icon: FaTimesCircle,
  },
  {
    id: "completed",
    title: "Order completed",
    description: "Learn what happens after successful delivery.",
    icon: FaCheckCircle,
  },
];

/* =========================================================
   FAQ ITEM
========================================================= */

function FAQItem({ question, answer, open, onClick }) {
  return (
    <div className={`help-faq ${open ? "open" : ""}`}>
      <button
        type="button"
        className="help-faq-question"
        onClick={onClick}
        aria-expanded={open}
      >
        <span>{question}</span>

        <span className="help-faq-arrow">
          <FaChevronDown />
        </span>
      </button>

      {open && (
        <div className="help-faq-answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function HelpSupportPage() {
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredTopics = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return topics;
    }

    return topics.filter((topic) => {
      const topicText = [
        topic.title,
        topic.description,
        topic.articleTitle,
        topic.articleDescription,
        ...topic.faqs.map(
          (faq) => `${faq.question} ${faq.answer}`
        ),
      ]
        .join(" ")
        .toLowerCase();

      return topicText.includes(value);
    });
  }, [search]);

  /* =======================================================
     OPEN TOPIC
  ======================================================= */

  const openTopic = (topic) => {
    setSelectedTopic(topic);
    setOpenFaq(null);

    window.setTimeout(() => {
      document
        .getElementById("help-article")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  /* =======================================================
     CONTACT SUPPORT
  ======================================================= */

  const handleContact = () => {
    /*
      Connect your support/ticket API here.

      Example:
      navigate("/account/support/new-ticket");
    */

    toast.info("Connect your support/ticket API here");
  };

  /* =======================================================
     CLEAR SEARCH
  ======================================================= */

  const clearSearch = () => {
    setSearch("");
  };

  return (
    <AccountShell title="Help & support">
      <div className="help-page">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="help-hero mt-15">
          <div className="help-hero-content">
            <div className="help-hero-icon">
              <FaHeadset />
            </div>

            <div className="help-hero-copy">
              <span className="help-eyebrow">
                SUPPORT CENTER
              </span>

              <h1>How can we help?</h1>

              <p>
                Find answers to common questions or get in touch
                with our support team.
              </p>
            </div>
          </div>

          {/* SEARCH */}

          <div className="help-search">
            <FaSearch />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search help topics..."
              aria-label="Search help topics"
            />

            {search && (
              <button
                type="button"
                className="help-search-clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </section>

        {/* =================================================
            SEARCH RESULT INFO
        ================================================= */}

        {search && (
          <div className="help-search-result">
            <span>
              Search results for{" "}
              <strong>"{search}"</strong>
            </span>

            <span>
              {filteredTopics.length}{" "}
              {filteredTopics.length === 1
                ? "topic"
                : "topics"}{" "}
              found
            </span>
          </div>
        )}

        {/* =================================================
            POPULAR TOPICS
        ================================================= */}

        <section className="help-section ">
          <div className="help-section-header">
            <div>
              <span className="help-section-label">
                {search ? "RESULTS" : "POPULAR"}
              </span>

              <h2>
                {search
                  ? "Help topics"
                  : "What do you need help with?"}
              </h2>
            </div>

            {!search && (
              <span className="help-topic-count">
                {topics.length} topics
              </span>
            )}
          </div>

          {filteredTopics.length > 0 ? (
            <div className="help-topics">
              {filteredTopics.map((topic) => {
                const Icon = topic.icon;

                return (
                  <button
                    type="button"
                    className="help-topic"
                    key={topic.id}
                    onClick={() => openTopic(topic)}
                  >
                    <div className="help-topic-icon">
                      <Icon />
                    </div>

                    <div className="help-topic-content">
                      <strong>{topic.title}</strong>

                      <span>
                        {topic.description}
                      </span>
                    </div>

                    <div className="help-topic-arrow">
                      <FaChevronRight />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="help-empty">
              <div className="help-empty-icon">
                <FaSearch />
              </div>

              <strong>No help topics found</strong>

              <span>
                Try searching with another keyword.
              </span>

              <button
                type="button"
                onClick={clearSearch}
              >
                Clear search
              </button>
            </div>
          )}
        </section>

        {/* =================================================
            ARTICLE / FAQ
        ================================================= */}

        {selectedTopic && (
          <section
            className="help-article-section"
            id="help-article"
          >
            <div className="help-article-header">
              <div className="help-article-heading">
                <div className="help-article-icon">
                  <selectedTopic.icon />
                </div>

                <div>
                  <span className="help-section-label">
                    HELP ARTICLE
                  </span>

                  <h2>{selectedTopic.articleTitle}</h2>

                  <p>
                    {selectedTopic.articleDescription}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="help-close-article"
                onClick={() => {
                  setSelectedTopic(null);
                  setOpenFaq(null);
                }}
                aria-label="Close help article"
              >
                ×
              </button>
            </div>

            <div className="help-faq-list">
              {selectedTopic.faqs.map((faq, index) => {
                const faqId =
                  `${selectedTopic.id}-${index}`;

                return (
                  <FAQItem
                    key={faqId}
                    question={faq.question}
                    answer={faq.answer}
                    open={openFaq === faqId}
                    onClick={() =>
                      setOpenFaq(
                        openFaq === faqId
                          ? null
                          : faqId
                      )
                    }
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* =================================================
            QUICK HELP
        ================================================= */}

        {!search && !selectedTopic && (
          <section className="help-section">
            <div className="help-section-header">
              <div>
                <span className="help-section-label">
                  QUICK HELP
                </span>

                <h2>Common questions</h2>
              </div>
            </div>

            <div className="help-quick-grid">
              {quickHelp.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    type="button"
                    className="help-quick-card"
                    key={item.id}
                    onClick={() =>
                      toast.info(
                        `${item.title} help article coming soon`
                      )
                    }
                  >
                    <div className="help-quick-icon">
                      <Icon />
                    </div>

                    <div>
                      <strong>{item.title}</strong>

                      <span>
                        {item.description}
                      </span>
                    </div>

                    <FaChevronRight className="help-quick-arrow" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* =================================================
            CONTACT SUPPORT
        ================================================= */}

        <section className="help-contact">
          <div className="help-contact-icon">
            <FaQuestionCircle />
          </div>

          <div className="help-contact-content">
            <span className="help-contact-label">
              NEED MORE HELP?
            </span>

            <h2>We're here to help.</h2>

            <p>
              Can't find what you're looking for? Contact
              Odikart support and we'll help you resolve the
              issue.
            </p>
          </div>

          <button
            type="button"
            className="help-contact-btn"
            onClick={handleContact}
          >
            Contact support
            <FaArrowRight />
          </button>
        </section>

        {/* =================================================
            CSS
        ================================================= */}

        <style>{`
          /* =================================================
             ROOT
          ================================================= */

          .help-page {
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 18px 24px 70px;
            box-sizing: border-box;
            color: #17172f;
            overflow-x: hidden;
          }

          .help-page *,
          .help-page *::before,
          .help-page *::after {
            box-sizing: border-box;
          }

          /* =================================================
             HERO
          ================================================= */

          .help-hero {
            position: relative;
            overflow: hidden;
            width: 100%;
            padding: 28px;
            border: 1px solid rgba(79, 70, 229, 0.13);
            border-radius: 24px;
            background:
              radial-gradient(
                circle at 90% 0%,
                rgba(124, 58, 237, 0.18),
                transparent 30%
              ),
              radial-gradient(
                circle at 0% 100%,
                rgba(99, 102, 241, 0.1),
                transparent 35%
              ),
              linear-gradient(
                135deg,
                #ffffff 0%,
                #f8f7ff 52%,
                #f1efff 100%
              );
            box-shadow:
              0 12px 35px rgba(44, 38, 110, 0.07);
          }

          .help-hero::before {
            content: "";
            position: absolute;
            width: 220px;
            height: 220px;
            right: -100px;
            top: -110px;
            border-radius: 50%;
            background: rgba(124, 58, 237, 0.08);
            filter: blur(25px);
            pointer-events: none;
          }

          .help-hero::after {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            border-radius: inherit;
            border: 1px solid rgba(99, 102, 241, 0.08);
          }

          .help-hero-content {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .help-hero-icon {
            width: 58px;
            height: 58px;
            flex: 0 0 58px;
            display: grid;
            place-items: center;
            border-radius: 18px;
            color: #fff;
            background:
              linear-gradient(
                145deg,
                #4f46e5,
                #7c3aed
              );
            font-size: 22px;
            box-shadow:
              0 10px 24px rgba(79, 70, 229, 0.25);
          }

          .help-eyebrow {
            display: block;
            margin-bottom: 4px;
            color: #6366f1;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1.4px;
          }

          .help-hero h1 {
            margin: 0;
            color: #17172f;
            font-size: clamp(22px, 3vw, 28px);
            line-height: 1.2;
            font-weight: 850;
            letter-spacing: -0.5px;
          }

          .help-hero p {
            max-width: 700px;
            margin: 6px 0 0;
            color: #74748c;
            font-size: 13px;
            line-height: 1.55;
          }

          /* =================================================
             SEARCH
          ================================================= */

          .help-search {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 11px;
            width: 100%;
            height: 52px;
            margin-top: 22px;
            padding: 0 15px;
            border: 1px solid #e4e1f5;
            border-radius: 15px;
            background: rgba(255, 255, 255, 0.96);
            box-shadow:
              0 8px 22px rgba(44, 38, 110, 0.06);
            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .help-search:focus-within {
            border-color: rgba(99, 102, 241, 0.55);
            box-shadow:
              0 0 0 4px rgba(99, 102, 241, 0.09),
              0 10px 26px rgba(44, 38, 110, 0.07);
          }

          .help-search > svg {
            flex: 0 0 auto;
            color: #818cf8;
            font-size: 15px;
          }

          .help-search input {
            width: 100%;
            height: 100%;
            min-width: 0;
            padding: 0;
            border: 0;
            outline: 0;
            background: transparent;
            color: #17172f;
            font-family: inherit;
            font-size: 13px;
          }

          .help-search input::placeholder {
            color: #a3a3b7;
          }

          .help-search-clear {
            width: 25px;
            height: 25px;
            flex: 0 0 25px;
            display: grid;
            place-items: center;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: #f1f0f8;
            color: #77778e;
            font-size: 17px;
            line-height: 1;
            cursor: pointer;
            transition:
              background 0.2s ease,
              color 0.2s ease;
          }

          .help-search-clear:hover {
            background: #e9e7f5;
            color: #4f46e5;
          }

          /* =================================================
             SEARCH RESULTS
          ================================================= */

          .help-search-result {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            width: 100%;
            margin-top: 13px;
            padding: 0 2px;
            color: #85859a;
            font-size: 11px;
          }

          .help-search-result strong {
            color: #4f46e5;
            font-weight: 800;
          }

          /* =================================================
             SECTION
          ================================================= */

          .help-section {
            width: 100%;
            margin-top: 30px;
          }

          .help-section-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 13px;
          }

          .help-section-label {
            display: block;
            margin-bottom: 3px;
            color: #6366f1;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1.2px;
          }

          .help-section-header h2 {
            margin: 0;
            color: #20203a;
            font-size: 18px;
            font-weight: 850;
            letter-spacing: -0.2px;
          }

          .help-topic-count {
            padding: 5px 9px;
            border-radius: 999px;
            background: #eef2ff;
            color: #4f46e5;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
          }

          /* =================================================
             TOPICS
          ================================================= */

          .help-topics {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 12px;
            width: 100%;
          }

          .help-topic {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
            min-height: 78px;
            gap: 13px;
            padding: 13px;
            border: 1px solid #ebe9f5;
            border-radius: 17px;
            background: #fff;
            color: inherit;
            text-align: left;
            cursor: pointer;
            transition:
              transform 0.2s ease,
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .help-topic:hover {
            transform: translateY(-2px);
            border-color: rgba(99, 102, 241, 0.28);
            box-shadow:
              0 12px 28px rgba(55, 48, 163, 0.09);
          }

          .help-topic:active {
            transform: scale(0.99);
          }

          .help-topic:focus-visible {
            outline: 3px solid rgba(99, 102, 241, 0.18);
            outline-offset: 2px;
          }

          .help-topic-icon {
            width: 43px;
            height: 43px;
            flex: 0 0 43px;
            display: grid;
            place-items: center;
            border-radius: 13px;
            color: #4f46e5;
            background:
              linear-gradient(
                145deg,
                #eef2ff,
                #f5f3ff
              );
            font-size: 16px;
          }

          .help-topic-content {
            flex: 1;
            min-width: 0;
          }

          .help-topic-content strong {
            display: block;
            color: #24243c;
            font-size: 13px;
            font-weight: 800;
          }

          .help-topic-content span {
            display: block;
            margin-top: 4px;
            overflow: hidden;
            color: #85859a;
            font-size: 11px;
            line-height: 1.4;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .help-topic-arrow {
            width: 28px;
            height: 28px;
            flex: 0 0 28px;
            display: grid;
            place-items: center;
            border-radius: 9px;
            background: #f6f5ff;
            color: #7c73d9;
            font-size: 10px;
            transition:
              transform 0.2s ease,
              background 0.2s ease;
          }

          .help-topic:hover .help-topic-arrow {
            transform: translateX(2px);
            background: #eef2ff;
          }

          /* =================================================
             EMPTY
          ================================================= */

          .help-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 190px;
            padding: 25px;
            border: 1px dashed #dcd9ed;
            border-radius: 17px;
            background: #fafaff;
            text-align: center;
          }

          .help-empty-icon {
            width: 46px;
            height: 46px;
            display: grid;
            place-items: center;
            margin-bottom: 11px;
            border-radius: 14px;
            background: #eef2ff;
            color: #818cf8;
            font-size: 18px;
          }

          .help-empty strong {
            color: #292943;
            font-size: 14px;
          }

          .help-empty span {
            margin-top: 4px;
            color: #85859a;
            font-size: 12px;
          }

          .help-empty button {
            margin-top: 13px;
            padding: 8px 13px;
            border: 0;
            border-radius: 8px;
            background: #eef2ff;
            color: #4f46e5;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
          }

          /* =================================================
             ARTICLE
          ================================================= */

          .help-article-section {
            width: 100%;
            margin-top: 30px;
            padding: 20px;
            border: 1px solid rgba(99, 102, 241, 0.13);
            border-radius: 20px;
            background:
              linear-gradient(
                135deg,
                #ffffff,
                #faf9ff
              );
            box-shadow:
              0 10px 30px rgba(44, 38, 110, 0.06);
            scroll-margin-top: 20px;
          }

          .help-article-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 15px;
            padding-bottom: 17px;
            border-bottom: 1px solid #eceaf6;
          }

          .help-article-heading {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .help-article-icon {
            width: 44px;
            height: 44px;
            flex: 0 0 44px;
            display: grid;
            place-items: center;
            border-radius: 13px;
            color: #fff;
            background:
              linear-gradient(
                145deg,
                #4f46e5,
                #7c3aed
              );
            box-shadow:
              0 8px 18px rgba(79, 70, 229, 0.2);
          }

          .help-article-heading h2 {
            margin: 0;
            color: #20203a;
            font-size: 18px;
            font-weight: 850;
          }

          .help-article-heading p {
            margin: 3px 0 0;
            color: #85859a;
            font-size: 12px;
            line-height: 1.5;
          }

          .help-close-article {
            width: 30px;
            height: 30px;
            flex: 0 0 30px;
            display: grid;
            place-items: center;
            padding: 0;
            border: 0;
            border-radius: 9px;
            background: #f2f1f8;
            color: #77778d;
            font-size: 20px;
            line-height: 1;
            cursor: pointer;
            transition:
              background 0.2s ease,
              color 0.2s ease;
          }

          .help-close-article:hover {
            background: #e9e7f4;
            color: #4f46e5;
          }

          /* =================================================
             FAQ
          ================================================= */

          .help-faq-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 15px;
          }

          .help-faq {
            overflow: hidden;
            border: 1px solid #ebe9f5;
            border-radius: 13px;
            background: #fff;
            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .help-faq.open {
            border-color: rgba(99, 102, 241, 0.25);
            box-shadow:
              0 7px 18px rgba(55, 48, 163, 0.05);
          }

          .help-faq-question {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            width: 100%;
            padding: 14px;
            border: 0;
            background: transparent;
            color: #292943;
            text-align: left;
            font: inherit;
            font-size: 13px;
            font-weight: 750;
            cursor: pointer;
          }

          .help-faq-question:hover {
            color: #4f46e5;
          }

          .help-faq-arrow {
            width: 27px;
            height: 27px;
            flex: 0 0 27px;
            display: grid;
            place-items: center;
            border-radius: 8px;
            background: #f5f4fc;
            color: #77778e;
            font-size: 10px;
            transition:
              transform 0.2s ease,
              background 0.2s ease;
          }

          .help-faq.open .help-faq-arrow {
            transform: rotate(180deg);
            background: #eef2ff;
            color: #4f46e5;
          }

          .help-faq-answer {
            padding: 0 14px 15px;
          }

          .help-faq-answer p {
            margin: 0;
            padding-top: 12px;
            border-top: 1px solid #f0eff7;
            color: #74748c;
            font-size: 12px;
            line-height: 1.65;
          }

          /* =================================================
             QUICK HELP
          ================================================= */

          .help-quick-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 10px;
          }

          .help-quick-card {
            position: relative;
            display: flex;
            align-items: flex-start;
            gap: 10px;
            min-width: 0;
            padding: 14px;
            border: 1px solid #ebe9f5;
            border-radius: 15px;
            background: #fff;
            color: inherit;
            text-align: left;
            cursor: pointer;
            transition:
              transform 0.2s ease,
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .help-quick-card:hover {
            transform: translateY(-2px);
            border-color: rgba(99, 102, 241, 0.25);
            box-shadow:
              0 10px 24px rgba(55, 48, 163, 0.07);
          }

          .help-quick-icon {
            width: 35px;
            height: 35px;
            flex: 0 0 35px;
            display: grid;
            place-items: center;
            border-radius: 10px;
            background: #f0efff;
            color: #6366f1;
            font-size: 13px;
          }

          .help-quick-card > div:nth-child(2) {
            min-width: 0;
            flex: 1;
          }

          .help-quick-card strong {
            display: block;
            color: #292943;
            font-size: 12px;
            font-weight: 800;
          }

          .help-quick-card span {
            display: block;
            margin-top: 3px;
            color: #89899d;
            font-size: 10px;
            line-height: 1.45;
          }

          .help-quick-arrow {
            flex: 0 0 auto;
            margin-top: 4px;
            color: #aaa8bb;
            font-size: 9px;
          }

          /* =================================================
             CONTACT SUPPORT
          ================================================= */

          .help-contact {
            display: flex;
            align-items: center;
            gap: 16px;
            width: 100%;
            margin-top: 30px;
            padding: 22px;
            border: 1px solid rgba(99, 102, 241, 0.14);
            border-radius: 20px;
            background:
              radial-gradient(
                circle at 100% 0,
                rgba(124, 58, 237, 0.13),
                transparent 32%
              ),
              linear-gradient(
                135deg,
                #f8f7ff,
                #ffffff
              );
          }

          .help-contact-icon {
            width: 50px;
            height: 50px;
            flex: 0 0 50px;
            display: grid;
            place-items: center;
            border-radius: 15px;
            color: #fff;
            background:
              linear-gradient(
                145deg,
                #4f46e5,
                #7c3aed
              );
            font-size: 20px;
            box-shadow:
              0 8px 20px rgba(79, 70, 229, 0.22);
          }

          .help-contact-content {
            flex: 1;
            min-width: 0;
          }

          .help-contact-label {
            display: block;
            color: #6366f1;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 1.2px;
          }

          .help-contact h2 {
            margin: 3px 0 0;
            color: #20203a;
            font-size: 17px;
            font-weight: 850;
          }

          .help-contact p {
            max-width: 700px;
            margin: 4px 0 0;
            color: #77778e;
            font-size: 12px;
            line-height: 1.5;
          }

          .help-contact-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 42px;
            padding: 0 16px;
            flex: 0 0 auto;
            border: 0;
            border-radius: 11px;
            color: #fff;
            background:
              linear-gradient(
                135deg,
                #4f46e5,
                #7c3aed
              );
            box-shadow:
              0 8px 18px rgba(79, 70, 229, 0.22);
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition:
              transform 0.2s ease,
              box-shadow 0.2s ease;
          }

          .help-contact-btn:hover {
            transform: translateY(-1px);
            box-shadow:
              0 11px 24px rgba(79, 70, 229, 0.28);
          }

          .help-contact-btn:active {
            transform: scale(0.98);
          }

          .help-contact-btn:focus-visible,
          .help-topic:focus-visible,
          .help-quick-card:focus-visible,
          .help-faq-question:focus-visible,
          .help-close-article:focus-visible {
            outline: 3px solid rgba(99, 102, 241, 0.2);
            outline-offset: 3px;
          }

          /* =================================================
             TABLET
          ================================================= */

          @media (max-width: 1000px) {
            .help-quick-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 850px) {
            .help-page {
              padding-left: 16px;
              padding-right: 16px;
            }

            .help-topics {
              grid-template-columns: 1fr;
            }

            .help-contact {
              align-items: flex-start;
            }

            .help-contact-btn {
              align-self: center;
            }
          }

          /* =================================================
             MOBILE
          ================================================= */

          @media (max-width: 600px) {
            .help-page {
              width: 100%;
              padding: 6px 0 88px;
              overflow-x: hidden;
            }

            .help-hero {
              padding: 20px 14px;
              border-left: 0;
              border-right: 0;
              border-radius: 0;
              box-shadow: none;
            }

            .help-hero-content {
              gap: 11px;
            }

            .help-hero-icon {
              width: 46px;
              height: 46px;
              flex-basis: 46px;
              border-radius: 13px;
              font-size: 18px;
            }

            .help-eyebrow {
              font-size: 9px;
              letter-spacing: 1.1px;
            }

            .help-hero h1 {
              font-size: 21px;
            }

            .help-hero p {
              font-size: 11px;
            }

            .help-search {
              height: 47px;
              margin-top: 16px;
              border-radius: 12px;
            }

            .help-search input {
              font-size: 12px;
            }

            .help-search-result {
              padding: 0 10px;
              font-size: 10px;
            }

            .help-section {
              padding: 0 10px;
              margin-top: 24px;
            }

            .help-section-header {
              align-items: center;
            }

            .help-section-header h2 {
              font-size: 16px;
            }

            .help-section-label {
              font-size: 9px;
            }

            .help-topic-count {
              font-size: 9px;
            }

            .help-topics {
              grid-template-columns: 1fr;
              gap: 9px;
            }

            .help-topic {
              min-height: 68px;
              padding: 10px;
              border-radius: 14px;
            }

            .help-topic-icon {
              width: 38px;
              height: 38px;
              flex-basis: 38px;
              border-radius: 11px;
              font-size: 14px;
            }

            .help-topic-content strong {
              font-size: 12px;
            }

            .help-topic-content span {
              font-size: 10px;
            }

            .help-topic-arrow {
              width: 26px;
              height: 26px;
              flex-basis: 26px;
            }

            .help-article-section {
              margin-top: 24px;
              padding: 15px 10px;
              border-left: 0;
              border-right: 0;
              border-radius: 0;
              box-shadow: none;
              scroll-margin-top: 10px;
            }

            .help-article-heading {
              align-items: flex-start;
              gap: 10px;
            }

            .help-article-icon {
              width: 39px;
              height: 39px;
              flex-basis: 39px;
              border-radius: 11px;
              font-size: 14px;
            }

            .help-article-heading h2 {
              font-size: 15px;
            }

            .help-article-heading p {
              font-size: 10px;
            }

            .help-close-article {
              width: 28px;
              height: 28px;
              flex-basis: 28px;
            }

            .help-faq-question {
              padding: 12px;
              font-size: 11px;
            }

            .help-faq-answer {
              padding: 0 12px 13px;
            }

            .help-faq-answer p {
              font-size: 11px;
              line-height: 1.6;
            }

            .help-quick-grid {
              grid-template-columns: 1fr;
              gap: 8px;
            }

            .help-quick-card {
              padding: 11px;
              border-radius: 13px;
            }

            .help-contact {
              flex-direction: column;
              align-items: stretch;
              margin-top: 24px;
              padding: 18px 14px;
              border-left: 0;
              border-right: 0;
              border-radius: 0;
            }

            .help-contact-icon {
              width: 44px;
              height: 44px;
              flex-basis: 44px;
              border-radius: 12px;
              font-size: 17px;
            }

            .help-contact h2 {
              font-size: 16px;
            }

            .help-contact p {
              font-size: 11px;
            }

            .help-contact-btn {
              width: 100%;
              min-height: 43px;
              margin-top: 4px;
            }
          }

          /* =================================================
             REDUCED MOTION
          ================================================= */

          @media (prefers-reduced-motion: reduce) {
            .help-page *,
            .help-page *::before,
            .help-page *::after {
              scroll-behavior: auto !important;
              transition: none !important;
              animation: none !important;
            }
          }
        `}</style>
      </div>
    </AccountShell>
  );
}