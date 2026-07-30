"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Loader2 } from "lucide-react";
import {
  fieldInput,
  fieldLabel,
  primaryButton,
  secondaryButton,
} from "./ui/styles";
import { useSettings } from "./SettingsProvider";
import { currencyAffix, formatReviewDate } from "@/lib/object-format";

interface ObjectFormProps {
  initialData?: { name: string; price: number; reviewDays: number };
  /**
   * Clock captured by the parent when it opened the form. Passed in rather than
   * read here so rendering stays pure; without it the date preview is skipped.
   */
  baseDate?: Date | null;
  onSubmit: (data: {
    name: string;
    price: number;
    reviewDays: number;
  }) => Promise<void>;
  onCancel: () => void;
  onSuccess: () => void;
}

const DAY_PRESETS = [
  { days: 7, label: "1 week" },
  { days: 30, label: "1 month" },
  { days: 90, label: "3 months" },
];

export default function ObjectForm({
  initialData,
  baseDate,
  onSubmit,
  onCancel,
  onSuccess,
}: ObjectFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [price, setPrice] = useState(
    initialData ? (initialData.price / 100).toString() : "",
  );
  // Held as a string so clearing the field does not produce NaN.
  const [reviewDays, setReviewDays] = useState(
    (initialData?.reviewDays ?? 30).toString(),
  );
  const [loading, setLoading] = useState(false);

  const settings = useSettings();
  const affix = currencyAffix(settings);

  const parsedDays = parseInt(reviewDays, 10);
  const parsedPrice = parseFloat(price);

  // Only previewed when creating: on edit the server recomputes `reviewAt` from
  // the original `createdAt`, so a "from now" date here would be a lie.
  const reviewDate =
    !initialData && baseDate && Number.isFinite(parsedDays) && parsedDays > 0
      ? new Date(baseDate.getTime() + parsedDays * 24 * 60 * 60 * 1000)
      : null;

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.error("Enter a price greater than zero.");
      return;
    }

    if (!Number.isFinite(parsedDays) || parsedDays < 1) {
      toast.error("The waiting period must be at least one day.");
      return;
    }

    const priceInCents = Math.round(parsedPrice * 100);

    try {
      setLoading(true);
      await onSubmit({
        name: name.trim(),
        price: priceInCents,
        reviewDays: parsedDays,
      });
      toast.success(
        initialData
          ? "Object edited successfully!"
          : "Object saved successfully!",
      );
      onSuccess();
    } catch {
      toast.error("There was an error saving the object, try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-5">
      <div className="space-y-1.5">
        <label htmlFor="object-name" className={fieldLabel}>
          What is it?
        </label>
        <input
          id="object-name"
          type="text"
          required
          autoComplete="off"
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          className={fieldInput}
          placeholder="Nintendo Switch"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="object-price" className={fieldLabel}>
          Price
        </label>
        {/* The symbol and the side it goes on both come from the locale: it-IT
            puts the euro after the amount, en-US puts the dollar before it. */}
        <div className="relative">
          <span
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[15px] text-muted ${
              affix.position === "prefix" ? "left-3.5" : "right-3.5"
            }`}
          >
            {affix.symbol}
          </span>
          <input
            id="object-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(ev) => setPrice(ev.target.value)}
            className={`${fieldInput} font-medium tabular-nums ${
              affix.position === "prefix" ? "pl-10" : "pr-12"
            }`}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <label htmlFor="object-days" className={fieldLabel}>
          Wait for
        </label>

        <div className="grid grid-cols-3 gap-2">
          {DAY_PRESETS.map((preset) => {
            const active = parsedDays === preset.days;
            return (
              <button
                key={preset.days}
                type="button"
                onClick={() => setReviewDays(preset.days.toString())}
                aria-pressed={active}
                className={`h-10 cursor-pointer rounded-xl border text-[13px] font-semibold transition-[background-color,border-color,color] duration-200 ${
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line bg-surface-muted text-muted hover:border-line-strong hover:text-foreground"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <input
            id="object-days"
            type="number"
            inputMode="numeric"
            min="1"
            required
            value={reviewDays}
            onChange={(ev) => setReviewDays(ev.target.value)}
            className={`${fieldInput} pr-14 tabular-nums`}
            placeholder="30"
          />
          <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[13px] text-muted">
            days
          </span>
        </div>

        {reviewDate && (
          <p className="flex items-center gap-1.5 text-[13px] text-muted">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            You decide on{" "}
            <span className="font-medium text-foreground">
              {formatReviewDate(reviewDate, settings.locale)}
            </span>
          </p>
        )}

        {initialData && (
          <p className="flex items-center gap-1.5 text-[13px] text-muted">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            Counted from the day the object was added.
          </p>
        )}
      </div>

      <div className="flex gap-2.5 border-t border-line pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className={secondaryButton}
        >
          Cancel
        </button>
        <button type="submit" disabled={loading} className={primaryButton}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Saving" : initialData ? "Apply" : "Add object"}
        </button>
      </div>
    </form>
  );
}
