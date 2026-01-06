"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/Badge";
import { useAuth } from "@/lib/auth/context";
import { useSelectedSociety } from "@/lib/auth/useSelectedSociety";
import { useSelectedSocietyName } from "@/lib/auth/useSelectedSocietyName";
import { TrashIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface AMC {
  id: string;
  vendor_name: string;
  service_type: string;
  contract_start_date: string;
  contract_end_date: string;
  annual_cost: number;
  currency: string;
  contact_person: string;
  contact_phone: string;
  status: string;
  renewal_reminder_days: number;
  email?: string;
  notes?: string;
  assets?: AssetSummary[];
}

interface AssetSummary {
  id: string;
  name: string;
  asset_code?: string;
  location?: string;
}

interface Contact {
  name: string;
  phone: string;
  email: string;
}

interface FlashMessage {
  type: "success" | "error";
  message: string;
}

export default function AMCsPage() {
  const { user } = useAuth();
  const societyId = useSelectedSociety();
  const societyName = useSelectedSocietyName();
  const [amcs, setAmcs] = useState<AMC[]>([]);
  const [loading, setLoading] = useState(true);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([
    { name: "", phone: "", email: "" },
  ]);
  const [flashMessage, setFlashMessage] = useState<FlashMessage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [assetOptions, setAssetOptions] = useState<AssetSummary[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    vendor_name: "",
    service_type: "",
    contract_start_date: "",
    contract_end_date: "",
    annual_cost: "",
    currency: "INR",
    renewal_reminder_days: "30",
    notes: "",
  });

  useEffect(() => {
    fetchAMCs();
    fetchAssetsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.society_id]);

  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => setFlashMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [flashMessage]);

  const fetchAMCs = async () => {
    try {
      const societyParam = societyId ? `?society_id=${societyId}` : "";
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/amcs${societyParam}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      setAmcs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch AMCs:", error);
      setFlashMessage({
        type: "error",
        message: "Failed to load AMCs",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetsList = async () => {
    if (!user?.society_id) return;
    setAssetsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/assets?society_id=${user.society_id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAssetOptions(
          data.map((asset: any) => ({
            id: asset.id,
            name: asset.name,
            asset_code: asset.asset_code,
            location: asset.location,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load assets for AMC:", error);
      setFlashMessage({
        type: "error",
        message: "Failed to load assets for AMC",
      });
    } finally {
      setAssetsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vendor_name: "",
      service_type: "",
      contract_start_date: "",
      contract_end_date: "",
      annual_cost: "",
      currency: "INR",
      renewal_reminder_days: "30",
      notes: "",
    });
    setContacts([{ name: "", phone: "", email: "" }]);
    setEditingId(null);
    setSelectedAssets([]);
  };

  const startEdit = (amc: AMC) => {
    setFormData({
      vendor_name: amc.vendor_name,
      service_type: amc.service_type,
      contract_start_date: amc.contract_start_date,
      contract_end_date: amc.contract_end_date,
      annual_cost: amc.annual_cost?.toString() || "",
      currency: amc.currency || "INR",
      renewal_reminder_days: amc.renewal_reminder_days?.toString() || "30",
      notes: amc.notes || "",
    });
    setContacts([
      {
        name: amc.contact_person || "",
        phone: amc.contact_phone || "",
        email: amc.email || "",
      },
    ]);
    setEditingId(amc.id);
    setShowForm(true);
  };

  const handleDeleteAMC = async (amcId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/amcs?id=${amcId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setSelectedAssets((amc.assets || []).map((a) => a.id));

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete AMC");
      }

      setAmcs(amcs.filter((a) => a.id !== amcId));
      setDeleteConfirm(null);
      setFlashMessage({
        type: "success",
        message: "AMC deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting AMC:", error);
      setFlashMessage({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete AMC",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.society_id) {
      setFlashMessage({
        type: "error",
        message: "User society not found",
      });
      return;
    }

    if (selectedAssets.length === 0) {
      setFlashMessage({
        type: "error",
        message: "Select at least one asset for this AMC",
      });
      return;
    }

    const submitData = {
      ...formData,
      society_id: user.society_id,
      annual_cost: formData.annual_cost ? parseFloat(formData.annual_cost) : 0,
      renewal_reminder_days: parseInt(formData.renewal_reminder_days),
      contact_person: contacts[0]?.name || "",
      contact_phone: contacts[0]?.phone || "",
      email: contacts[0]?.email || "",
      asset_ids: selectedAssets,
    };

    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { ...submitData, id: editingId } : submitData;
      const token = localStorage.getItem("auth_token");

      const res = await fetch("/api/amcs", {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save AMC");
      }

      const savedAmc = await res.json();

      const linkedAssets = assetOptions.filter((a) =>
        selectedAssets.includes(a.id)
      );

      if (editingId) {
        setAmcs(
          amcs.map((a) =>
            a.id === editingId ? { ...savedAmc, assets: linkedAssets } : a
          )
        );
        setFlashMessage({
          type: "success",
          message: "AMC updated successfully",
        });
      } else {
        setAmcs([...amcs, { ...savedAmc, assets: linkedAssets }]);
        setFlashMessage({
          type: "success",
          message: "AMC added successfully",
        });
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Error saving AMC:", error);
      setFlashMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to save AMC",
      });
    }
  };

  const addContact = () => {
    setContacts([...contacts, { name: "", phone: "", email: "" }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const updateContact = (
    index: number,
    field: keyof Contact,
    value: string
  ) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
  };

  const getDaysToExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const days = Math.ceil(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Flash Messages */}
      {flashMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`rounded-lg shadow-lg px-6 py-4 text-white flex items-center gap-3 ${
              flashMessage.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            <div>{flashMessage.type === "success" ? "✓" : "✕"}</div>
            <p>{flashMessage.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[var(--foreground)]">
              AMC Management {societyName && `- ${societyName}`}
            </h1>
            <p className="mt-2 text-[var(--muted)]">
              Track and manage annual maintenance contracts
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Add AMC
          </button>
        </div>

        {showForm && (
          <div className="bg-[var(--card)] rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? "Edit AMC" : "Add New AMC"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vendor_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vendor_name: e.target.value,
                      })
                    }
                    required
                    placeholder="Enter vendor name"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Service Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.service_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_type: e.target.value,
                      })
                    }
                    required
                    placeholder="e.g., Plumbing, Electrical"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.contract_start_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contract_start_date: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.contract_end_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contract_end_date: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Annual Cost
                  </label>
                  <input
                    type="number"
                    value={formData.annual_cost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        annual_cost: e.target.value,
                      })
                    }
                    placeholder="0.00"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currency: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Renewal Reminder (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.renewal_reminder_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        renewal_reminder_days: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Additional notes"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="mb-6 p-4 bg-[var(--background)] rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-[var(--foreground)]">
                    Linked Assets <span className="text-red-500">*</span>
                  </h4>
                  <span className="text-xs text-gray-500">
                    Select assets that this AMC covers
                  </span>
                </div>
                {assetsLoading ? (
                  <div className="text-sm text-[var(--muted)]">Loading assets...</div>
                ) : assetOptions.length === 0 ? (
                  <div className="text-sm text-[var(--muted)]">
                    No assets available. Please add assets first.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                    {assetOptions.map((asset) => {
                      const checked = selectedAssets.includes(asset.id);
                      return (
                        <label
                          key={asset.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                            checked
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-[var(--border)]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssets([
                                  ...selectedAssets,
                                  asset.id,
                                ]);
                              } else {
                                setSelectedAssets(
                                  selectedAssets.filter((id) => id !== asset.id)
                                );
                              }
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                              {asset.name}
                            </p>
                            <p className="text-xs text-[var(--muted)] truncate">
                              {asset.asset_code || "No code"}
                              {asset.location ? ` • ${asset.location}` : ""}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mb-6 p-4 bg-[var(--background)] rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-[var(--foreground)]">
                    Contact Details <span className="text-red-500">*</span>
                  </h4>
                  <button
                    type="button"
                    onClick={addContact}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Add Contact
                  </button>
                </div>

                {contacts.map((contact, index) => (
                  <div key={index} className="mb-4 p-3 bg-[var(--card)] rounded border">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium text-[var(--foreground)]">
                        Contact {index + 1}
                        {index === 0 && <span className="text-red-500">*</span>}
                      </h4>
                      {contacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContact(index)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                          Name{" "}
                          {index === 0 && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) =>
                            updateContact(index, "name", e.target.value)
                          }
                          required={index === 0}
                          placeholder="Contact name"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                          Phone{" "}
                          {index === 0 && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) =>
                            updateContact(index, "phone", e.target.value)
                          }
                          required={index === 0}
                          placeholder="+91 1234567890"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                          Email{" "}
                          {index === 0 && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) =>
                            updateContact(index, "email", e.target.value)
                          }
                          required={index === 0}
                          placeholder="contact@example.com"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  {editingId ? "Update AMC" : "Add AMC"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="flex-1 bg-[var(--muted-bg)] text-[var(--foreground)] py-2 rounded-lg font-medium hover:bg-[var(--active-bg)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : amcs.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted)]">No AMCs found</div>
        ) : (
          <div className="grid gap-6">
            {amcs.map((amc) => {
              const daysLeft = getDaysToExpiry(amc.contract_end_date);
              return (
                <div
                  key={amc.id}
                  className="bg-[var(--card)] rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">
                        {amc.vendor_name}
                      </h3>
                      <p className="text-[var(--muted)] mt-1">{amc.service_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={amc.status} />
                      <button
                        onClick={() => startEdit(amc)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit AMC"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      {deleteConfirm === amc.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteAMC(amc.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                            title="Confirm delete"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-2 bg-gray-400 text-white rounded-lg hover:bg-[var(--background)]0 transition"
                            title="Cancel"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(amc.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete AMC"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Start Date</p>
                      <p className="font-medium">
                        {new Date(amc.contract_start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">End Date</p>
                      <p className="font-medium">
                        {new Date(amc.contract_end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Days Left</p>
                      <p
                        className={`font-medium ${
                          daysLeft < 30 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {daysLeft > 0 ? `${daysLeft} days` : "Expired"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Annual Cost</p>
                      <p className="font-medium">
                        {amc.currency}{" "}
                        {amc.annual_cost?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                  </div>

                  {amc.assets && amc.assets.length > 0 && (
                    <div className="mb-4 text-sm text-[var(--foreground)]">
                      <p className="font-semibold text-[var(--foreground)] mb-2">Assets</p>
                      <div className="flex flex-wrap gap-2">
                        {amc.assets.map((asset) => (
                          <span
                            key={asset.id}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                          >
                            {asset.name}
                            {asset.asset_code ? ` (${asset.asset_code})` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 text-sm text-[var(--muted)]">
                    <div>👤 {amc.contact_person}</div>
                    <div>📞 {amc.contact_phone}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
