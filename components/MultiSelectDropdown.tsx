"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import type { FieldOption } from "@/lib/constants/profile-options";

interface MultiSelectDropdownProps {
  options: FieldOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
}

/**
 * Accessible multi-select with search, checkbox-style toggling, selected chips
 * and optional free-text ("Add ...") entries. Selected values not present in
 * `options` still render (their raw value is shown as the label).
 */
export function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  allowCustom = true,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const labelFor = (val: string) =>
    options.find((opt) => opt.value === val)?.label ?? val;

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const searchTrim = search.trim();
  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTrim.toLowerCase()),
  );

  const canAddCustom =
    allowCustom &&
    searchTrim.length > 0 &&
    !options.some((opt) => opt.label.toLowerCase() === searchTrim.toLowerCase()) &&
    !value.some((v) => v.toLowerCase() === searchTrim.toLowerCase());

  const addCustom = () => {
    if (!canAddCustom) return;
    onChange([...value, searchTrim]);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="soft-ring flex w-full items-center justify-between gap-2 rounded-xl border border-[#efdfce] bg-white px-4 py-3 text-left"
      >
        <span className={value.length ? "text-[#2e263b]" : "text-gray-400"}>
          {value.length ? `${value.length} selected` : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-[#fff1e5] px-2.5 py-1 text-xs font-medium text-[#b7354a]"
            >
              {labelFor(v)}
              <button
                type="button"
                onClick={() => toggle(v)}
                aria-label={`Remove ${labelFor(v)}`}
                className="text-[#b7354a]/70 hover:text-[#b7354a]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-[#efdfce] bg-white p-2 shadow-lg">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Search or add..."
            className="soft-ring mb-2 w-full rounded-lg border border-[#efdfce] bg-white px-3 py-2 text-sm"
          />
          <div className="max-h-52 overflow-auto">
            {filtered.map((opt) => {
              const selected = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fff8f0]"
                >
                  <span>{opt.label}</span>
                  {selected && <Check className="h-4 w-4 text-[#d9485f]" />}
                </button>
              );
            })}
            {canAddCustom && (
              <button
                type="button"
                onClick={addCustom}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#d9485f] hover:bg-[#fff8f0]"
              >
                Add &ldquo;{searchTrim}&rdquo;
              </button>
            )}
            {filtered.length === 0 && !canAddCustom && (
              <p className="px-3 py-2 text-sm text-gray-400">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
