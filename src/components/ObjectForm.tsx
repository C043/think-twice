import { useState } from "react";
import { toast } from "sonner";

interface ObjectFormProps {
  initialData?: { name: string; price: number; reviewDays: number };
  onSubmit: (data: {
    name: string;
    price: number;
    reviewDays: number;
  }) => Promise<void>;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ObjectForm({
  initialData,
  onSubmit,
  onCancel,
  onSuccess,
}: ObjectFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [price, setPrice] = useState(
    initialData ? (initialData.price / 100).toString() : "",
  );
  const [reviewDays, setReviewDays] = useState(initialData?.reviewDays || 30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoading(false);
    setError(false);

    const priceInCents = Math.round(parseFloat(price) * 100);

    try {
      setLoading(true);
      await onSubmit({ name, price: priceInCents, reviewDays });
      toast.success(
        initialData
          ? "Object edited successfully!"
          : "Object saved successfully!",
      );
      onSuccess();
    } catch (err) {
      setError(true);
      toast.error("There was an error saving the object, try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col h-full justify-between gap-4 p-4"
    >
      <div className="space-y-4">
        <h2 className="text-xl font-bold dark:text-white text-black">
          {initialData ? "Edit Object" : "Add new Object"}
        </h2>

        <div>
          <label className="block text-sm font-medium mb-1 text-black dark:text-slate-300">
            Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            className="w-full p-2 border rounded-lg bg-transparent text-black dark:text-white"
            placeholder="Es. Nintendo Switch"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-black dark:text-slate-300">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-2 border rounded-lg bg-transparent text-black dark:text-white"
            placeholder="1.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-black dark:text-slate-300">
            Days to wait
          </label>
          <input
            type="number"
            required
            value={reviewDays}
            onChange={(e) => setReviewDays(parseInt(e.target.value))}
            className="w-full p-2 border rounded-lg bg-transparent text-black dark:text-white"
            placeholder="30"
          />
        </div>
        <div className="flex gap-2 pt-4 border-t dark:border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 p-2 border rounded-lg text-sm font-medium text-black dark:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 p-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Saving..." : initialData ? "Apply" : "Add"}
          </button>
        </div>
      </div>
    </form>
  );
}
