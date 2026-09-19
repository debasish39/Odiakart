import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { AccountShell, api } from "./AccountShell";
import { AddressForm } from "./AddAddressPage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function EditAddressPage() {
  const id = window.location.pathname
    .split("/")
    .filter(Boolean)
    .slice(-2, -1)[0];

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");

  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);

  // ============================================================
  // LOAD ADDRESS
  // ============================================================

  const {
    data: addresses = [],
    isLoading: loading,
    error: addressError,
  } = useQuery({
    queryKey: ["addresses", token],
    queryFn: async () => {
      const d = await api("/api/addresses");
      return d.addresses || d.data || [];
    },
    enabled: !!token && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // ============================================================
  // FIND ADDRESS
  // ============================================================

  useEffect(() => {
    if (!id) {
      toast.error("Invalid address ID");
      return;
    }

    if (addressError) {
      console.error("Load address error:", addressError);

      toast.error(
        addressError.message || "Failed to load address"
      );

      return;
    }

    if (!addresses.length) {
      return;
    }

    const address = addresses.find(
      (item) =>
        String(item._id || item.id) === String(id)
    );

    if (!address) {
      toast.error("Address not found");
      setF(null);
      return;
    }

    // ==========================================================
    // NORMALIZE ADDRESS INTO THE FORM STRUCTURE
    // ==========================================================

    setF({
      label: address.label || "Home",

      fullName: address.fullName || "",
      phone: address.phone || "",
      alternatePhone: address.alternatePhone || "",

      // Detailed address fields
      houseNumber: address.houseNumber || "",
      buildingName: address.buildingName || "",
      floor: address.floor || "",
      street: address.street || "",

      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",

      area: address.area || "",
      village: address.village || "",
      postOffice: address.postOffice || "",
      block: address.block || "",

      city: address.city || "",
      district: address.district || "",
      state: address.state || "",

      postalCode: address.postalCode || "",
      country: address.country || "India",

      deliveryInstructions:
        address.deliveryInstructions || "",

      location: address.location || {
        latitude: null,
        longitude: null,
      },

      isDefault: Boolean(address.isDefault),
    });
  }, [id, addresses, addressError]);

  // ============================================================
  // UPDATE FORM FIELD
  // ============================================================

  const set = (key, value) => {
    setF((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // ============================================================
  // SAVE / UPDATE ADDRESS
  // ============================================================

  const save = async () => {
    if (!id) {
      toast.error("Invalid address ID");
      return;
    }

    if (!f) {
      toast.error("Address data is not available");
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      const payload = {
        label: String(
          f.label || "Home"
        ).trim(),

        fullName: String(
          f.fullName || ""
        ).trim(),

        phone: String(
          f.phone || ""
        ).trim(),

        alternatePhone: String(
          f.alternatePhone || ""
        ).trim(),

        // ======================================================
        // DETAILED ADDRESS
        // ======================================================

        houseNumber: String(
          f.houseNumber || ""
        ).trim(),

        buildingName: String(
          f.buildingName || ""
        ).trim(),

        floor: String(
          f.floor || ""
        ).trim(),

        street: String(
          f.street || ""
        ).trim(),

        addressLine1: String(
          f.addressLine1 || ""
        ).trim(),

        addressLine2: String(
          f.addressLine2 || ""
        ).trim(),

        landmark: String(
          f.landmark || ""
        ).trim(),

        area: String(
          f.area || ""
        ).trim(),

        village: String(
          f.village || ""
        ).trim(),

        postOffice: String(
          f.postOffice || ""
        ).trim(),

        block: String(
          f.block || ""
        ).trim(),

        city: String(
          f.city || ""
        ).trim(),

        district: String(
          f.district || ""
        ).trim(),

        state: String(
          f.state || ""
        ).trim(),

        postalCode: String(
          f.postalCode || ""
        ).trim(),

        country: String(
          f.country || "India"
        ).trim(),

        // ======================================================
        // DELIVERY
        // ======================================================

        deliveryInstructions: String(
          f.deliveryInstructions || ""
        ).trim(),

        // ======================================================
        // LOCATION
        // ======================================================

        location: f.location || {
          latitude: null,
          longitude: null,
        },

        isDefault: Boolean(
          f.isDefault
        ),
      };

      const d = await api(
        `/api/addresses/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      if (!d || d.success === false) {
        throw new Error(
          d?.message ||
            "Failed to update address"
        );
      }

      // ======================================================
      // REFRESH ADDRESS CACHE
      // ======================================================

      await queryClient.invalidateQueries({
        queryKey: ["addresses", token],
      });

      toast.success(
        d.message ||
          "Address updated successfully"
      );

      // ======================================================
      // RETURN TO CHECKOUT OR ADDRESSES
      // ======================================================

      let returnPath =
        "/account/addresses";

      try {
        const stored =
          sessionStorage.getItem(
            "odicart_checkout_return"
          );

        if (stored) {
          const returnData =
            JSON.parse(stored);

          if (
            returnData?.path ===
            "/cart"
          ) {
            returnPath = "/cart";

            sessionStorage.removeItem(
              "odicart_checkout_return"
            );
          }
        }
      } catch (error) {
        console.warn(
          "Unable to read checkout return path:",
          error
        );
      }

      navigate(returnPath);
    } catch (error) {
      console.error(
        "Update address error:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to update address"
      );

      setSaving(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <AccountShell title="Edit address">
        <div className="w-full px-1 pb-10">

          <div className="animate-pulse">

            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-200" />

              <div className="flex-1">
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="mt-2 h-6 w-44 rounded bg-slate-200" />
              </div>
            </div>

            <div className="space-y-6">

              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="border-b border-slate-100 pb-6"
                  >
                    <div className="mb-4 h-5 w-36 rounded bg-slate-200" />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="h-12 rounded-xl bg-slate-100" />
                      <div className="h-12 rounded-xl bg-slate-100" />
                    </div>
                  </div>
                )
              )}

            </div>

          </div>
        </div>
      </AccountShell>
    );
  }

  // ============================================================
  // ADDRESS NOT FOUND / ERROR
  // ============================================================

  if (!f) {
    return (
      <AccountShell title="Edit address">
        <div className="flex min-h-[420px] w-full items-center justify-center px-4">

          <div className="w-full max-w-md text-center">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <span className="text-xl">
                !
              </span>
            </div>

            <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
              {addressError
                ? "Unable to load address"
                : "Address not found"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {addressError
                ? addressError.message ||
                  "Please try again."
                : "This address may have been deleted or is no longer available."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/account/addresses"
                )
              }
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[.98]"
            >
              Back to addresses
            </button>

          </div>
        </div>
      </AccountShell>
    );
  }

  // ============================================================
  // EDIT ADDRESS FORM
  // ============================================================

  return (
    <AddressForm
      title="Edit address"
      f={f}
      set={set}
      save={save}
      saving={saving}
      submit="Save changes"
    />
  );
}