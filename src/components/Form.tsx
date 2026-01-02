"use client";

import React from "react";
import { useForm } from "react-hook-form";

interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "date" | "number" | "textarea" | "select";
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

interface GenericFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  submitButtonText?: string;
  isLoading?: boolean;
}

export const GenericForm: React.FC<GenericFormProps> = ({
  fields,
  onSubmit,
  submitButtonText = "Submit",
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {fields.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={field.name}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>

          {field.type === "textarea" ? (
            <textarea
              id={field.name}
              {...register(field.name, { required: field.required })}
              placeholder={field.placeholder}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          ) : field.type === "select" ? (
            <select
              id={field.name}
              {...register(field.name, { required: field.required })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={field.name}
              type={field.type}
              {...register(field.name, { required: field.required })}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          )}

          {errors[field.name] && (
            <p className="mt-1 text-sm text-red-600">
              {field.label} is required
            </p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {isLoading ? "Loading..." : submitButtonText}
      </button>
    </form>
  );
};
