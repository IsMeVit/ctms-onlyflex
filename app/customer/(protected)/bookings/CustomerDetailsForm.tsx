"use client";
import { User, Mail, Phone } from 'lucide-react';
import BaseCheckBox from "@/components/utils/BaseCheckBox";
import { useForm } from "react-hook-form";

interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sendConfirmationSms: boolean;
  sendConfirmationEmail: boolean;
  subscribeToPromotionalOffers: boolean;
}

interface CustomerDetailsFormProps {
  details: CustomerDetails;
  onChange: (details: CustomerDetails) => void;
}

export function CustomerDetailsForm({ details, onChange }: CustomerDetailsFormProps) {
  const {
    register,
    formState: { errors },
    trigger,
  } = useForm<CustomerDetails>({
    defaultValues: details,
    mode: "onBlur",
  });

  const handleChange = (field: keyof CustomerDetails, value: string | boolean) => {
    onChange({ ...details, [field]: value });
    trigger(field as any);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium mb-2">First Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="John"
              {...register("firstName", { required: "First name is required" })}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className={`w-full pl-10 pr-4 py-3 bg-zinc-950 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.firstName ? "border-red-500" : "border-zinc-800"
              }`}
            />
          </div>
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Last Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Doe"
              {...register("lastName", { required: "Last name is required" })}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className={`w-full pl-10 pr-4 py-3 bg-zinc-950 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.lastName ? "border-red-500" : "border-zinc-800"
              }`}
            />
          </div>
          {errors.lastName && (
            <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2">Email Address *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="email"
              placeholder="john.doe@email.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
              onChange={(e) => handleChange("email", e.target.value)}
              className={`w-full pl-10 pr-4 py-3 bg-zinc-950 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.email ? "border-red-500" : "border-zinc-800"
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-2">Phone Number *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="tel"
              placeholder="+1 (555) 123-4567"
              {...register("phone", {
                required: "Phone number is required",
                minLength: {
                  value: 6,
                  message: "Enter a valid phone number",
                },
              })}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={`w-full pl-10 pr-4 py-3 bg-zinc-950 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.phone ? "border-red-500" : "border-zinc-800"
              }`}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <h3 className="font-medium mb-3">Preferences</h3>
        <div className="space-y-3">
          <BaseCheckBox
            label="Send booking confirmation via SMS"
            checked={details.sendConfirmationSms}
            onChange={(e) => handleChange("sendConfirmationSms", e.target.checked)}
          />
          <BaseCheckBox
            label="Send booking confirmation via Email"
            checked={details.sendConfirmationEmail}
            onChange={(e) => handleChange("sendConfirmationEmail", e.target.checked)}
          />
          <BaseCheckBox
            label="Subscribe to promotional offers"
            checked={details.subscribeToPromotionalOffers}
            onChange={(e) => handleChange("subscribeToPromotionalOffers", e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
}