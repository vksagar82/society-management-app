"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/Badge";
import { useAuth } from "@/lib/auth/context";

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
}

interface Contact {
  name: string;
  phone: string;
  email: string;
}

export default function AMCsPage() {
  const { user } = useAuth();
  const [amcs, setAmcs] = useState<AMC[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([
    { name: "", phone: "", email: "" },
  ]);

  useEffect(() => {
    fetchAMCs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAMCs = async () => {
    try {
      const societyParam = user?.society_id
        ? `?society_id=${user.society_id}`
        : "";
      const res = await fetch(`/api/amcs${societyParam}`);
      const data = await res.json();
      setAmcs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch AMCs:", error);
      setAmcs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Validate at least one contact
    if (contacts.length === 0 || !contacts[0].name || !contacts[0].phone) {
      alert("At least one contact with name and phone is required");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        vendor_name: formData.get("vendor_name"),
        service_type: formData.get("service_type"),
        contract_start_date: formData.get("contract_start_date"),
        contract_end_date: formData.get("contract_end_date"),
        annual_cost: parseFloat(formData.get("annual_cost") as string),
        currency: formData.get("currency"),
        contact_person: contacts[0].name,
        contact_phone: contacts[0].phone,
        email: contacts[0].email,
        additional_contacts: contacts.length > 1 ? contacts.slice(1) : [],
      };

      if (user?.society_id) {
        payload.society_id = user.society_id;
      }

      const res = await fetch("/api/amcs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        setContacts([{ name: "", phone: "", email: "" }]);
        fetchAMCs();
      }
    } catch (error) {
      console.error("Failed to create AMC:", error);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">AMC Management</h1>
            <p className="mt-2 text-gray-600">
              Track and manage annual maintenance contracts
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Add AMC
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Add New AMC</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Name
                  </label>
                  <input
                    type="text"
                    name="vendor_name"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type
                  </label>
                  <input
                    type="text"
                    name="service_type"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="contract_start_date"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="contract_end_date"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Cost
                  </label>
                  <input
                    type="number"
                    name="annual_cost"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option>INR</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Contacts <span className="text-red-500">*</span>
                  </h3>
                  <button
                    type="button"
                    onClick={addContact}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                  >
                    <span className="text-xl">+</span> Add Contact
                  </button>
                </div>

                {contacts.map((contact, index) => (
                  <div
                    key={index}
                    className="mb-4 p-4 bg-gray-50 rounded-lg relative"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Contact {index + 1}{" "}
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
                        <label className="block text-xs font-medium text-gray-600 mb-1">
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
                        <label className="block text-xs font-medium text-gray-600 mb-1">
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
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) =>
                            updateContact(index, "email", e.target.value)
                          }
                          placeholder="email@example.com"
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
                  Add AMC
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400"
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
          <div className="text-center py-12 text-gray-600">No AMCs found</div>
        ) : (
          <div className="grid gap-6">
            {amcs.map((amc) => {
              const daysLeft = getDaysToExpiry(amc.contract_end_date);
              return (
                <div
                  key={amc.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {amc.vendor_name}
                      </h3>
                      <p className="text-gray-600 mt-1">{amc.service_type}</p>
                    </div>
                    <div className="ml-4">
                      <StatusBadge status={amc.status} />
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

                  <div className="flex gap-4 text-sm text-gray-600">
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
