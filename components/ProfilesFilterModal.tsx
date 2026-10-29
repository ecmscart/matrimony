"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import type { FieldOption } from "@/lib/constants/profile-options";
import {
  CASTE_OPTIONS,
  COMPLEXION_OPTIONS,
  FAMILY_TYPE_OPTIONS,
  HEIGHT_OPTIONS,
  INCOME_OPTIONS,
  INDIA_STATE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  MOTHER_TONGUE_OPTIONS,
  RELIGION_OPTIONS,
} from "@/lib/constants/profile-options";

export type ProfileFilterValues = {
  gender: string;
  ageRange: string;
  religion: string;
  caste: string;
  city: string;
  state: string;
  maritalStatus: string;
  motherTongue: string;
  height: string;
  familyType: string;
  income: string;
  complexion: string;
  hasChildren: string;
};

export const DEFAULT_PROFILE_FILTERS: ProfileFilterValues = {
  gender: "any",
  ageRange: "any",
  religion: "any",
  caste: "any",
  city: "any",
  state: "any",
  maritalStatus: "any",
  motherTongue: "any",
  height: "any",
  familyType: "any",
  income: "any",
  complexion: "any",
  hasChildren: "any",
};

const AGE_OPTIONS: FieldOption[] = [
  { value: "18-25", label: "18 – 25" },
  { value: "26-30", label: "26 – 30" },
  { value: "31-35", label: "31 – 35" },
  { value: "36-40", label: "36 – 40" },
  { value: "41-50", label: "41 – 50" },
];

const GENDER_OPTIONS: FieldOption[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const HAS_CHILDREN_OPTIONS: FieldOption[] = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];

const selectClassName =
  "soft-ring w-full rounded-xl border border-[#ecdac8] bg-white px-3.5 py-2.5 text-sm text-[#2f2938] outline-none transition focus:border-[#e2b896]";

interface ProfilesFilterModalProps {
  open: boolean;
  values: ProfileFilterValues;
  cityOptions: string[];
  onClose: () => void;
  onApply: (values: ProfileFilterValues) => void;
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FieldOption[];
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[#5d556a]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClassName}
      >
        <option value="any">Any</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function countActiveFilters(values: ProfileFilterValues): number {
  return (Object.keys(DEFAULT_PROFILE_FILTERS) as (keyof ProfileFilterValues)[])
    .filter((key) => values[key] !== DEFAULT_PROFILE_FILTERS[key]).length;
}

export default function ProfilesFilterModal({
  open,
  values,
  cityOptions,
  onClose,
  onApply,
}: ProfilesFilterModalProps) {
  const titleId = useId();
  const [draft, setDraft] = useState(values);

  useEffect(() => {
    if (open) setDraft(values);
  }, [open, values]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  function setField<K extends keyof ProfileFilterValues>(
    key: K,
    value: ProfileFilterValues[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  const cityFieldOptions: FieldOption[] = cityOptions.map((c) => ({
    value: c,
    label: c,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Close filters"
        className="absolute inset-0 bg-[#1c1524]/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.75rem] border border-[#f0dfcf] bg-[#fffaf4] shadow-2xl sm:rounded-[1.75rem]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#f0dfcf] px-5 py-4 sm:px-6">
          <div>
            <h2
              id={titleId}
              className="headline-serif text-2xl font-semibold text-[#251e31]"
            >
              Filters
            </h2>
            <p className="mt-0.5 text-sm text-[#655e71]">
              Refine matches. Every field includes Any.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#6d6578] transition hover:bg-[#fff0e4] hover:text-[#251e31]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FilterSelect
              id="filter-gender"
              label="Gender"
              value={draft.gender}
              onChange={(v) => setField("gender", v)}
              options={GENDER_OPTIONS}
            />
            <FilterSelect
              id="filter-age"
              label="Age range"
              value={draft.ageRange}
              onChange={(v) => setField("ageRange", v)}
              options={AGE_OPTIONS}
            />
            <FilterSelect
              id="filter-religion"
              label="Religion"
              value={draft.religion}
              onChange={(v) => setField("religion", v)}
              options={RELIGION_OPTIONS}
            />
            <FilterSelect
              id="filter-caste"
              label="Caste"
              value={draft.caste}
              onChange={(v) => setField("caste", v)}
              options={CASTE_OPTIONS}
            />
            <FilterSelect
              id="filter-city"
              label="City"
              value={draft.city}
              onChange={(v) => setField("city", v)}
              options={cityFieldOptions}
            />
            <FilterSelect
              id="filter-state"
              label="State"
              value={draft.state}
              onChange={(v) => setField("state", v)}
              options={INDIA_STATE_OPTIONS}
            />
            <FilterSelect
              id="filter-marital"
              label="Marital status"
              value={draft.maritalStatus}
              onChange={(v) => setField("maritalStatus", v)}
              options={MARITAL_STATUS_OPTIONS}
            />
            <FilterSelect
              id="filter-tongue"
              label="Mother tongue"
              value={draft.motherTongue}
              onChange={(v) => setField("motherTongue", v)}
              options={MOTHER_TONGUE_OPTIONS}
            />
            <FilterSelect
              id="filter-height"
              label="Height"
              value={draft.height}
              onChange={(v) => setField("height", v)}
              options={HEIGHT_OPTIONS}
            />
            <FilterSelect
              id="filter-family"
              label="Family type"
              value={draft.familyType}
              onChange={(v) => setField("familyType", v)}
              options={FAMILY_TYPE_OPTIONS}
            />
            <FilterSelect
              id="filter-income"
              label="Income"
              value={draft.income}
              onChange={(v) => setField("income", v)}
              options={INCOME_OPTIONS}
            />
            <FilterSelect
              id="filter-complexion"
              label="Complexion"
              value={draft.complexion}
              onChange={(v) => setField("complexion", v)}
              options={COMPLEXION_OPTIONS}
            />
            <FilterSelect
              id="filter-children"
              label="Has children"
              value={draft.hasChildren}
              onChange={(v) => setField("hasChildren", v)}
              options={HAS_CHILDREN_OPTIONS}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#f0dfcf] bg-[#fff7ef] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={() => setDraft({ ...DEFAULT_PROFILE_FILTERS })}
            className="rounded-full px-4 py-2.5 text-sm font-medium text-[#6d6578] transition hover:bg-white hover:text-[#251e31]"
          >
            Clear all
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#efdfce] bg-white px-5 py-2.5 text-sm font-medium text-[#4e445f] transition hover:bg-[#fff2e6] sm:flex-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onApply(draft)}
              className="flex-1 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] sm:flex-none"
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
