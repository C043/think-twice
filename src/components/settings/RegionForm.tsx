"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppSettings, CURRENCY_OPTIONS, LOCALE_OPTIONS } from "@/lib/settings";
import { formatPrice, formatReviewDate } from "@/lib/object-format";
import { fieldInput, fieldLabel, primaryButton } from "../ui/styles";

/** Fixed instant for the preview, so the sample never shifts while you choose. */
const SAMPLE_DATE = "2026-08-29T10:00:00Z";
const SAMPLE_CENTS = 34900;

export default function RegionForm({ initial }: { initial: AppSettings }) {
  const router = useRouter();
  const [locale, setLocale] = useState(initial.locale);
  const [currency, setCurrency] = useState(initial.currency);
  const [saving, setSaving] = useState(false);

  const dirty = locale !== initial.locale || currency !== initial.currency;

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);

    try {
      const resp = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, currency }),
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || "Failed to save settings");
      }

      toast.success("Settings saved!");
      // The layout reads the row on the server, so the whole tree has to be
      // re-rendered for the new format to reach the list.
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save the settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="settings-locale" className={fieldLabel}>
          Language and date format
        </label>
        <select
          id="settings-locale"
          value={locale}
          onChange={(ev) => setLocale(ev.target.value)}
          className={`${fieldInput} cursor-pointer`}
        >
          {LOCALE_OPTIONS.every((option) => option.value !== locale) && (
            <option value={locale}>{locale}</option>
          )}
          {LOCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="settings-currency" className={fieldLabel}>
          Currency
        </label>
        <select
          id="settings-currency"
          value={currency}
          onChange={(ev) => setCurrency(ev.target.value)}
          className={`${fieldInput} cursor-pointer`}
        >
          {CURRENCY_OPTIONS.every((option) => option.value !== currency) && (
            <option value={currency}>{currency}</option>
          )}
          {CURRENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value} — {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-line bg-surface-muted px-3.5 py-3">
        <p className={fieldLabel}>Preview</p>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <span className="font-semibold tabular-nums text-foreground">
            {formatPrice(SAMPLE_CENTS, { locale, currency })}
          </span>
          <span className="text-[13px] text-muted tabular-nums">
            {formatReviewDate(SAMPLE_DATE, locale)}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || !dirty}
        className={`${primaryButton} w-full`}
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? "Saving" : dirty ? "Save changes" : "Saved"}
      </button>
    </form>
  );
}
