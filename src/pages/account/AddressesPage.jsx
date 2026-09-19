import React, { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");

  const {
    data: items = [],
    isLoading: loading,
    error: addressesError,
  } = useQuery({
    queryKey: ["addresses", token],
    queryFn: async () => {
      const d = await api("/api/addresses");
      return d.addresses || d.data || d || [];
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const remove = async (id) => {
    if (!confirm("Delete this address?")) return;

    try {
      await api(`/api/addresses/${id}`, {
        method: "DELETE",
      });

      toast.success("Address deleted");

      // Refresh the cached address list instead of doing a manual
      // fetch + local state update cycle.
      await queryClient.invalidateQueries({
        queryKey: ["addresses", token],
      });
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
          onClick={() => navigate("/account/addresses/add")}
          aria-label="Add a new address"
          title="Add address"
          className="group flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
        >
          <FaPlus
            size={13}
            className="transition-transform duration-200 group-hover:rotate-90"
          />
        </button>
      }
    >
      <div className="w-full pb-8">
        {/* HERO */}
        <section className="group relative w-full overflow-hidden rounded-[22px] border border-indigo-100 bg-white shadow-[0_12px_38px_rgba(30,27,75,0.06)] sm:rounded-[25px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(99,102,241,0.13),transparent_29%),radial-gradient(circle_at_10%_120%,rgba(59,130,246,0.07),transparent_34%)]" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-indigo-100/50 blur-3xl transition-transform duration-700 group-hover:scale-110" />

          <div className="relative flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-7">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-600 sm:text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.10)]" />
                Delivery locations
              </div>

              <h1 className="text-[24px] font-extrabold tracking-[-0.04em] text-slate-900 sm:text-[29px]">
                Where should we deliver?
              </h1>

              <p className="mt-2 max-w-xl text-[12px] leading-5 text-slate-500 sm:text-[13px] sm:leading-6">
                Save your favourite delivery locations for a faster, smoother
                checkout experience.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/account/addresses/add")}
              className="group/add relative flex h-11 w-full shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-4 text-[12px] font-extrabold text-white shadow-[0_8px_20px_rgba(79,70,229,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-[0_11px_25px_rgba(79,70,229,0.25)] active:scale-[0.98] sm:w-auto"
            >
              <span className="pointer-events-none absolute inset-y-0 -left-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700 group-hover/add:left-[120%]" />
              <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                <FaPlus size={11} />
              </span>
              <span className="relative z-10">Add new address</span>
            </button>
          </div>
        </section>

        {/* SUMMARY */}
        <section className="mt-3.5 flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_5px_20px_rgba(15,23,42,0.035)] sm:flex-row sm:items-center sm:justify-between sm:p-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <FaMapMarkerAlt size={14} />
            </div>

            <div className="min-w-0">
              <strong className="block text-[13px] font-extrabold text-slate-800 sm:text-[14px]">
                {items.length === 0
                  ? "No saved addresses"
                  : `${items.length} saved ${
                      items.length === 1 ? "address" : "addresses"
                    }`}
              </strong>

              <span className="mt-0.5 block text-[10.5px] leading-4 text-slate-500 sm:text-[11px]">
                {items.length === 0
                  ? "Add one to make checkout quicker."
                  : "Choose your preferred location at checkout."}
              </span>
            </div>
          </div>

          {items.length > 0 && (
            <div className="inline-flex min-h-7 w-full items-center justify-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 text-[10px] font-extrabold text-emerald-700 sm:w-auto">
              <FaCheckCircle size={10} />
              Ready for checkout
            </div>
          )}
        </section>

        {/* LOADING */}
        {loading ? (
          <div
            className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2"
            aria-label="Loading addresses"
          >
            {[1, 2, 3, 4].map((item) => (
              <AddressSkeleton key={item} />
            ))}
          </div>
        ) : addressesError ? (
          /* ERROR */
          <section className="relative mt-3.5 overflow-hidden rounded-[22px] border border-red-100 bg-white px-5 py-10 text-center shadow-[0_7px_25px_rgba(15,23,42,0.04)] sm:px-8 sm:py-14">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.07),transparent_34%)]" />

            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] bg-red-50 text-red-500 ring-1 ring-red-100">
              <FaMapMarkerAlt size={25} />
            </div>

            <span className="relative mt-5 inline-block text-[10px] font-extrabold uppercase tracking-[0.13em] text-red-500">
              Couldn't load addresses
            </span>

            <h2 className="relative mt-2 text-[19px] font-extrabold tracking-[-0.025em] text-slate-900 sm:text-[21px]">
              We couldn't get your saved addresses
            </h2>

            <p className="relative mx-auto mt-2 max-w-md text-[12px] leading-5 text-slate-500 sm:text-[13px]">
              Please try again. Your saved addresses have not been changed.
            </p>

            <button
              type="button"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["addresses", token],
                })
              }
              className="group relative mt-5 inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-5 text-[12px] font-extrabold text-white shadow-[0_8px_20px_rgba(79,70,229,0.18)] transition-all hover:-translate-y-0.5 hover:bg-indigo-700 active:scale-[0.98]"
            >
              <span className="pointer-events-none absolute inset-y-0 -left-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700 group-hover:left-[120%]" />
              <span className="relative z-10">Try again</span>
            </button>
          </section>
        ) : items.length === 0 ? (
          /* EMPTY */
          <section className="relative mt-3.5 overflow-hidden rounded-[22px] border border-slate-200 bg-white px-5 py-10 text-center shadow-[0_7px_25px_rgba(15,23,42,0.04)] sm:px-8 sm:py-14">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08),transparent_35%)]" />

            <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-1 rounded-full border border-indigo-100" />
              <div className="absolute inset-4 rounded-full border border-indigo-50" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-[18px] border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-[0_10px_25px_rgba(79,70,229,0.12)]">
                <FaMapMarkerAlt size={23} />
              </div>
            </div>

            <span className="relative mt-4 inline-block text-[10px] font-extrabold uppercase tracking-[0.13em] text-indigo-600">
              Nothing saved yet
            </span>

            <h2 className="relative mt-2 text-[20px] font-extrabold tracking-[-0.03em] text-slate-900 sm:text-[22px]">
              Your delivery addresses live here
            </h2>

            <p className="relative mx-auto mt-2 max-w-lg text-[12px] leading-5 text-slate-500 sm:text-[13px] sm:leading-6">
              Add your home, work, or any other location. We'll keep it ready
              whenever you need to place an order.
            </p>

            <button
              type="button"
              onClick={() => navigate("/account/addresses/add")}
              className="group relative mt-5 inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-5 text-[12px] font-extrabold text-white shadow-[0_8px_20px_rgba(79,70,229,0.18)] transition-all hover:-translate-y-0.5 hover:bg-indigo-700 active:scale-[0.98] sm:w-auto"
            >
              <span className="pointer-events-none absolute inset-y-0 -left-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700 group-hover:left-[120%]" />
              <FaPlus className="relative z-10" size={11} />
              <span className="relative z-10">Add your first address</span>
            </button>

            <div className="relative mx-auto mt-6 flex w-full max-w-xl flex-wrap justify-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4">
              {["Faster checkout", "Easy editing", "Securely saved"].map(
                (point) => (
                  <span
                    key={point}
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500"
                  >
                    <FaCheckCircle size={10} className="text-emerald-500" />
                    {point}
                  </span>
                ),
              )}
            </div>
          </section>
        ) : (
          <>
            {/* ADDRESS LIST */}
            <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
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
                  <article
                    className="group relative min-w-0 overflow-hidden rounded-[19px] border border-slate-200 bg-white p-4 shadow-[0_5px_20px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-[0_15px_35px_rgba(15,23,42,0.08)] sm:p-[17px]"
                    key={id}
                  >
                    <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-600 via-indigo-400 to-transparent opacity-80" />

                    {/* HEADER */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600">
                        <FaHome size={14} />
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h2 className="max-w-[70%] truncate text-[14px] font-extrabold text-slate-900">
                            {label}
                          </h2>

                          {a.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.04em] text-emerald-700">
                              <FaCheckCircle size={8} />
                              Default
                            </span>
                          )}
                        </div>

                        {(contactName || a.phone) && (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            {contactName && <span>{contactName}</span>}
                            {contactName && a.phone && (
                              <span className="h-1 w-1 rounded-full bg-slate-300" />
                            )}
                            {a.phone && <span>{a.phone}</span>}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/account/addresses/${id}/edit`)
                        }
                        aria-label={`Edit ${label}`}
                        title="Edit address"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95"
                      >
                        <FaEdit size={11} />
                      </button>
                    </div>

                    {/* BODY */}
                    <div className="mt-4 flex min-h-[70px] items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                        <FaMapMarkerAlt size={11} />
                      </div>

                      <p className="min-w-0 text-[12.5px] leading-5 text-slate-600 sm:text-[13px]">
                        {addressText || "No address details available"}
                      </p>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.10)]" />
                        Available for delivery
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/account/addresses/${id}/edit`)
                          }
                          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 text-[10.5px] font-extrabold text-indigo-600 transition-all hover:bg-indigo-100 active:scale-[0.98] sm:flex-none"
                        >
                          <FaEdit size={10} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => remove(id)}
                          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 text-[10.5px] font-extrabold text-red-600 transition-all hover:bg-red-100 active:scale-[0.98] sm:flex-none"
                        >
                          <FaTrash size={9} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* TIP */}
            <div className="mt-3.5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-white p-3.5 sm:items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <FaCheckCircle size={12} />
              </div>

              <div className="min-w-0">
                <strong className="block text-[11.5px] font-extrabold text-emerald-950">
                  Pro tip for faster checkout
                </strong>
                <p className="mt-0.5 text-[10.5px] leading-4 text-emerald-900/60">
                  Keep your most-used delivery location marked as default.
                </p>
              </div>

              <FaChevronRight
                size={10}
                className="ml-auto mt-1 shrink-0 text-emerald-400 sm:mt-0"
              />
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </AccountShell>
  );
}

function AddressSkeleton() {
  return (
    <div className="relative min-h-[205px] overflow-hidden rounded-[19px] border border-slate-200 bg-white p-4 shadow-[0_5px_20px_rgba(15,23,42,0.035)] sm:p-[17px]">
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent [animation:addressSkeletonShine_1.5s_infinite]" />

      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />

        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-24 rounded-full bg-slate-200" />
          <div className="h-2.5 w-32 rounded-full bg-slate-100" />
        </div>

        <div className="h-8 w-8 rounded-lg bg-slate-100" />
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex gap-2.5">
          <div className="h-6 w-6 shrink-0 rounded-lg bg-slate-200" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-2.5 w-[92%] rounded-full bg-slate-200" />
            <div className="h-2.5 w-[76%] rounded-full bg-slate-100" />
            <div className="h-2.5 w-[54%] rounded-full bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="h-2.5 w-28 rounded-full bg-slate-100" />
        <div className="flex gap-1.5">
          <div className="h-8 w-14 rounded-lg bg-slate-100" />
          <div className="h-8 w-16 rounded-lg bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
