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

    setF({
      label: address.label || "Home",
      fullName: address.fullName || "",
      phone: address.phone || "",
      alternatePhone: address.alternatePhone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",
      area: address.area || "",
      village: address.village || "",
      city: address.city || "",
      district: address.district || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "India",
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
        label: String(f.label || "Home").trim(),
        fullName: String(f.fullName || "").trim(),
        phone: String(f.phone || "").trim(),
        alternatePhone: String(
          f.alternatePhone || ""
        ).trim(),
        addressLine1: String(
          f.addressLine1 || ""
        ).trim(),
        addressLine2: String(
          f.addressLine2 || ""
        ).trim(),
        landmark: String(f.landmark || "").trim(),
        area: String(f.area || "").trim(),
        village: String(f.village || "").trim(),
        city: String(f.city || "").trim(),
        district: String(f.district || "").trim(),
        state: String(f.state || "").trim(),
        postalCode: String(
          f.postalCode || ""
        ).trim(),
        country: String(
          f.country || "India"
        ).trim(),
        location: f.location || {
          latitude: null,
          longitude: null,
        },
        isDefault: Boolean(f.isDefault),
      };

      const d = await api(`/api/addresses/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!d || d.success === false) {
        throw new Error(
          d?.message || "Failed to update address"
        );
      }

      // Refresh address cache
      await queryClient.invalidateQueries({
        queryKey: ["addresses", token],
      });

      toast.success(
        d.message || "Address updated successfully"
      );

      // ========================================================
      // RETURN TO CHECKOUT OR ADDRESSES
      // ========================================================

      let returnPath = "/account/addresses";

      try {
        const stored = sessionStorage.getItem(
          "odicart_checkout_return"
        );

        if (stored) {
          const returnData = JSON.parse(stored);

          if (returnData?.path === "/cart") {
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

      // React Router navigation
      navigate(returnPath);

    } catch (e) {
      console.error("Update address error:", e);

      toast.error(
        e.message || "Failed to update address"
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
        <div className="ok-card ok-empty">
          Loading address...
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
        <div className="ok-card ok-empty">
          <h3>
            {addressError
              ? "Unable to load address"
              : "Address not found"}
          </h3>

          <p className="ok-muted">
            {addressError
              ? addressError.message ||
                "Please try again."
              : "This address may have been deleted or is no longer available."}
          </p>

          <button
            className="ok-btn ok-primary"
            style={{ marginTop: 18 }}
            onClick={() =>
              navigate("/account/addresses")
            }
          >
            Back to addresses
          </button>
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

