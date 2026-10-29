"use client";

import Link from "next/link";
import {
  Heart,
  Shield,
  Users,
  Search,
  Star,
  ArrowRight,
  CheckCircle2,
  Crown,
  UserRound,
  Target,
  PartyPopper,
  Sparkles,
  ClipboardList,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ProfileCard from "@/components/ProfileCard";
import { listProfiles } from "@/lib/api";
import type { Profile } from "@/lib/types";

export default function Home() {
  const [featuredProfiles, setFeaturedProfiles] = useState<Profile[]>([]);
  const [activeHighlight, setActiveHighlight] = useState(0);

  const heroHighlights = [
    {
      label: "Verified member profiles",
      detail:
        "Every member profile is screened before publication so families connect with confidence.",
    },
    {
      label: "Private family-first experience",
      detail:
        "Control visibility and share details on your terms, with privacy built into each step.",
    },
    {
      label: "Active matchmaking community",
      detail:
        "A growing, serious community helps you discover meaningful matches faster.",
    },
  ];

  useEffect(() => {
    listProfiles({ page: 1, limit: 8 })
      .then((res) =>
        setFeaturedProfiles(
          res.data.filter((p) => p.isPublished !== false),
        ),
      )
      .catch(() => setFeaturedProfiles([]));
  }, []);

  return (
    <div className="space-y-10 md:space-y-14">
      {/* Hero Section */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[url('/images/hero-wedding-banner.jpg')] bg-cover bg-[center_-18px] md:bg-[center_-28px] opacity-100" />
        <div className="absolute inset-0 gradient-hero opacity-18" />
        <div className="absolute inset-0 bg-[#1e1528]/12" />
        <div className="section-shell relative py-10 md:py-14">
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl text-center"
            >
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
                <Star className="h-4 w-4 text-gold-light fill-gold-light" />
                Trusted by families across India
              </span>
              <h1 className="headline-serif mb-6 text-2xl font-semibold leading-tight md:text-4xl lg:text-5xl">
                A more personal
                <br />
                way to find your
                <br />
                <span className="text-gradient">perfect match</span>
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-[#f0e9ff] md:text-xl">
                Maher Marriage Bureau brings together trusted profiles,
                community values, and thoughtful matchmaking in one refined
                experience.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full gradient-primary px-8 py-4 text-lg font-semibold text-white transition-transform hover:-translate-y-0.5"
                >
                  Register Now
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/profiles"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  Browse Profiles
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-[#f6ecff]">
                {heroHighlights.map((item, index) => {
                  const isActive = activeHighlight === index;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setActiveHighlight(index)}
                      aria-pressed={isActive}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-left transition-all ${
                        isActive
                          ? "border-[#f5c777]/70 bg-white/22 text-white"
                          : "border-white/18 bg-white/8 hover:bg-white/16"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#f5c777]" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <motion.div
                key={activeHighlight}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="mx-auto mt-4 max-w-2xl rounded-2xl border border-white/20 bg-black/20 px-4 py-3 backdrop-blur-sm"
              >
                <p className="text-sm leading-6 text-[#f2e9ff] md:text-base">
                  {heroHighlights[activeHighlight]?.detail}
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-shell -mt-16 relative z-10">
        <div className="glass-panel rounded-3xl p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Trusted family-first platform",
              "Secure private interactions",
              "Thoughtful community matching",
              "Designed for meaningful connections",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-[#f2dfcf] bg-white/80 px-4 py-4 text-left shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1e5] text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold tracking-[0.02em] text-[#443b55] md:text-base">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hindi Taglines */}
      <section className="section-shell">
        <div className="gradient-hero relative overflow-hidden rounded-[2rem] px-6 py-14 text-center text-white md:px-12 md:py-20">
          <div className="ornament-grid absolute inset-0 opacity-[0.07]" />
          {/* Floating decorative hearts */}
          <span
            aria-hidden
            className="animate-float-soft pointer-events-none absolute left-[8%] top-10 text-[#f5c777]/50"
          >
            <Heart className="h-8 w-8 fill-current" />
          </span>
          <span
            aria-hidden
            className="animate-float-soft-alt pointer-events-none absolute right-[10%] bottom-12 text-[#f17b8f]/50"
          >
            <Heart className="h-6 w-6 fill-current" />
          </span>
          <span
            aria-hidden
            className="animate-twinkle-soft pointer-events-none absolute right-[18%] top-12 text-gold-light/70"
          >
            <Star className="h-5 w-5 fill-current" />
          </span>

          <div className="relative">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm"
            >
              <Heart className="h-4 w-4 fill-[#f5c777] text-[#f5c777]" />
              हमारा वादा
            </motion.span>

            <div className="mx-auto flex max-w-3xl flex-col items-center">
              {[
                "एक बेहतर कल के लिए बेहतर रिश्ते।",
                "हर किसी को मिले उसका मुकम्मल हमसफ़र।",
                "सही जीवनसाथी की खोज, अब एक भरोसेमंद कदम के साथ।",
              ].map((line, index) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, y: 22, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.18,
                    type: "spring",
                    stiffness: 90,
                  }}
                  className="group w-full"
                >
                  {index > 0 && (
                    <span className="mx-auto my-6 flex h-px w-20 bg-gradient-to-r from-transparent via-[#f5c777]/70 to-transparent" />
                  )}
                  <p className="headline-serif text-xl font-medium leading-relaxed text-[#f6ecff] transition-colors duration-300 group-hover:text-white md:text-2xl">
                    {line}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-10"
            >
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full gradient-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#d9485f]/30 transition-transform hover:-translate-y-0.5"
              >
                अपना जीवनसाथी खोजें
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-shell py-10 md:py-14">
        <div className="rounded-[2rem] border border-[#f0dfcf] bg-[#fffdfa] px-6 py-12 md:px-10">
          <div className="text-center mb-14">
            <h2 className="headline-serif text-3xl md:text-4xl font-semibold text-[#271f33] mb-4">
              Why Choose Maher Marriage Bureau?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-[#696174]">
              We make finding your soulmate simple, safe, and joyful.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "100% Verified Profiles",
                desc: "Every profile is manually verified for authenticity, giving you peace of mind.",
              },
              {
                icon: Search,
                title: "Smart Matchmaking",
                desc: "Our advanced algorithm suggests the most compatible matches based on your preferences.",
              },
              {
                icon: Users,
                title: "Privacy First",
                desc: "Your personal information is protected. Share details only when you're comfortable.",
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-[#f3e4d5] bg-white p-8 text-center shadow-sm transition-transform hover:-translate-y-1"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[#fff1e5]">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-[#2f273c]">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-[#6a6376]">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Profiles */}
      <section className="section-shell py-8 md:py-10">
        <div className="rounded-[2rem] border border-[#f0dfcf] bg-white px-6 py-10 md:px-10 md:py-12">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="headline-serif mb-2 text-3xl md:text-4xl font-semibold text-[#271f33]">
                Featured Profiles
              </h2>
              <p className="text-[#655e71]">
                Discover amazing people waiting to meet you.
              </p>
            </div>
            <Link
              href="/profiles"
              className="hidden md:flex items-center gap-2 text-primary font-semibold hover:text-primary-dark"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProfiles.map((profile, i) => (
              <ProfileCard key={profile.id} profile={profile} index={i} />
            ))}
          </div>
          <div className="text-center mt-10 md:hidden">
            <Link
              href="/profiles"
              className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-medium text-white"
            >
              View All Profiles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Membership Plans */}
      <section className="section-shell py-8 md:py-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#f0dfcf] bg-[#fffdfa] px-6 py-12 md:px-10 md:py-16">
          <div className="ornament-grid absolute inset-0 opacity-[0.04]" />
          <span
            aria-hidden
            className="animate-float-soft pointer-events-none absolute -right-6 top-10 text-[#f5c777]/35"
          >
            <Crown className="h-24 w-24" />
          </span>
          <span
            aria-hidden
            className="animate-twinkle-soft pointer-events-none absolute left-[6%] bottom-16 text-primary/20"
          >
            <Sparkles className="h-10 w-10" />
          </span>

          <div className="relative text-center mb-12">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f0dfcf] bg-white px-4 py-1.5 text-sm font-medium text-[#6a6376]">
              <Star className="h-4 w-4 fill-[#f5c777] text-[#f5c777]" />
              Membership Plans
            </span>
            <h2 className="headline-serif text-3xl md:text-4xl font-semibold text-[#271f33] mb-3">
              Choose the plan that fits your journey
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-[#696174]">
              Unlock better visibility and dedicated support with our curated
              membership tiers.
            </p>
          </div>

          <div className="relative mx-auto grid max-w-5xl gap-6 lg:grid-cols-2 lg:gap-8">
            {/* VIP */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="relative flex flex-col overflow-hidden rounded-[1.75rem] border border-[#e8c98a]/60 bg-gradient-to-br from-[#2a1f38] via-[#3a2a4d] to-[#4a3558] p-7 text-white shadow-xl shadow-[#2a1f38]/15 md:p-8"
            >
              <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#f5c777]/15 blur-2xl" />
              <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />

              <div className="relative mb-6 flex items-start justify-between gap-3">
                <div>
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#f5c777]/40 bg-[#f5c777]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#f5c777]">
                    <Crown className="h-3.5 w-3.5" />
                    Most Popular
                  </span>
                  <h3 className="headline-serif text-2xl font-semibold md:text-3xl">
                    VIP Membership
                  </h3>
                  <p className="mt-1 text-sm text-[#e8dff2]">
                    Priority care for serious matchmaking
                  </p>
                </div>
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f5c777]/20 text-[#f5c777]">
                  <Crown className="h-7 w-7" />
                </span>
              </div>

              <div className="relative mb-7 flex items-baseline gap-1">
                <span className="headline-serif text-4xl font-semibold text-[#f5c777] md:text-5xl">
                  ₹10,000
                </span>
                <span className="text-sm text-[#cbbfdc]">one-time</span>
              </div>

              <ul className="relative mb-8 flex flex-1 flex-col gap-3.5">
                {[
                  {
                    icon: Star,
                    text: "Priority profile listing",
                  },
                  {
                    icon: UserRound,
                    text: "Dedicated relationship manager",
                  },
                  {
                    icon: Target,
                    text: "Personalized match suggestions",
                  },
                  {
                    icon: PartyPopper,
                    text: "Access to premium events",
                  },
                ].map((benefit) => (
                  <li
                    key={benefit.text}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5c777]/20 text-[#f5c777]">
                      <benefit.icon className="h-4 w-4" />
                    </span>
                    <span className="pt-1 text-[0.95rem] leading-snug text-[#f4eef9]">
                      {benefit.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/contact"
                className="relative inline-flex items-center justify-center gap-2 rounded-full bg-[#f5c777] px-6 py-3.5 text-base font-semibold text-[#2a1f38] transition-transform hover:-translate-y-0.5"
              >
                Enquire for VIP
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="relative flex flex-col overflow-hidden rounded-[1.75rem] border border-[#f0dfcf] bg-white p-7 shadow-sm md:p-8"
            >
              <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-[#fff1e5] blur-2xl" />

              <div className="relative mb-6 flex items-start justify-between gap-3">
                <div>
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#f0dfcf] bg-[#fff8f0] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#8a8099]">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Great Value
                  </span>
                  <h3 className="headline-serif text-2xl font-semibold text-[#271f33] md:text-3xl">
                    Premium Membership
                  </h3>
                  <p className="mt-1 text-sm text-[#6a6376]">
                    Stand out with highlighted visibility
                  </p>
                </div>
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff1e5] text-primary">
                  <Sparkles className="h-7 w-7" />
                </span>
              </div>

              <div className="relative mb-7 flex items-baseline gap-1">
                <span className="headline-serif text-4xl font-semibold text-primary md:text-5xl">
                  ₹5,000
                </span>
                <span className="text-sm text-[#8a8099]">one-time</span>
              </div>

              <ul className="relative mb-8 flex flex-1 flex-col gap-3.5">
                {[
                  {
                    icon: Sparkles,
                    text: "Highlighted profile visibility",
                  },
                  {
                    icon: ClipboardList,
                    text: "Standard match suggestions",
                  },
                  {
                    icon: Globe,
                    text: "Access to online community features",
                  },
                ].map((benefit) => (
                  <li
                    key={benefit.text}
                    className="flex items-start gap-3 rounded-xl border border-[#f3e4d5] bg-[#fffaf5] px-3.5 py-3"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fff1e5] text-primary">
                      <benefit.icon className="h-4 w-4" />
                    </span>
                    <span className="pt-1 text-[0.95rem] leading-snug text-[#443b55]">
                      {benefit.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/contact"
                className="relative inline-flex items-center justify-center gap-2 rounded-full gradient-primary px-6 py-3.5 text-base font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Enquire for Premium
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-shell">
        <div className="gradient-primary overflow-hidden rounded-[2rem] px-6 py-14 text-center text-white md:px-10 md:py-16">
          <div className="absolute" />
          <Heart className="w-12 h-12 mx-auto mb-6 fill-white/30" />
          <h2 className="headline-serif mb-4 text-3xl md:text-4xl font-semibold">
            Your Life Partner is Waiting
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/85">
            Join thousands of happy couples who found their perfect match on
            Maher Marriage Bureau. Start your journey today.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-primary transition-colors hover:bg-[#fff2e7]"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
