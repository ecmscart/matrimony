"use client";

import { Mail, Phone, Clock, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { submitContact, ApiRequestError } from "@/lib/api";
import { config } from "@/lib/config";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setFormError(null);
    try {
      await submitContact(data);
      setSubmitted(true);
      reset();
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError ? err.message : "Failed to send message",
      );
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="section-shell pt-8 md:pt-10">
        <div className="rounded-[2rem] border border-[#f0dfcf] bg-white/90 px-6 py-12 text-center md:px-8">
          <h1 className="headline-serif mb-3 text-3xl font-semibold text-[#251e31] md:text-4xl">
            Get in Touch
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[#655e71]">
            Have questions or need help? We&apos;re here to assist you on your
            journey to finding your perfect life partner.
          </p>
        </div>
      </div>

      <div className="section-shell py-10 md:py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Contact Info Cards */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#f0dfcf] bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff1e5]">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold text-[#312a40]">Email Us</h3>
              <p className="text-[#675f73]">{config.contact.supportEmail}</p>
              <p className="text-[#675f73]">{config.contact.infoEmail}</p>
            </div>

            <div className="rounded-2xl border border-[#f0dfcf] bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff1e5]">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold text-[#312a40]">Call Us</h3>
              <p className="text-[#675f73]">{config.contact.phone}</p>
            </div>

            <div className="rounded-2xl border border-[#f0dfcf] bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff1e5]">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold text-[#312a40]">
                Working Hours
              </h3>
              <p className="text-[#675f73]">{config.contact.hoursWeekday}</p>
              <p className="text-[#675f73]">{config.contact.hoursSunday}</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="glass-panel rounded-3xl p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for reaching out. We&apos;ll get back to you
                    within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="rounded-full gradient-primary px-6 py-3 font-medium text-white"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="mb-6 text-xl font-semibold text-[#2e263b]">
                    Send us a Message
                  </h2>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {formError && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                        {formError}
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Your Name
                        </label>
                        <input
                          {...register("name")}
                          type="text"
                          id="contact-name"
                          placeholder="John Doe"
                          className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3"
                        />
                        {errors.name && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Email Address
                        </label>
                        <input
                          {...register("email")}
                          type="email"
                          id="contact-email"
                          placeholder="you@example.com"
                          className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Subject
                      </label>
                      <input
                        {...register("subject")}
                        type="text"
                        id="subject"
                        placeholder="How can we help?"
                        className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3"
                      />
                      {errors.subject && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.subject.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Message
                      </label>
                      <textarea
                        {...register("message")}
                        id="message"
                        rows={6}
                        placeholder="Tell us more about your query..."
                        className="soft-ring w-full resize-none rounded-xl border border-[#efdfce] bg-white px-4 py-3"
                      />
                      {errors.message && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 rounded-full gradient-primary px-8 py-3 font-semibold text-white disabled:opacity-60"
                    >
                      <Send className="w-5 h-5" />
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
