/**
 * The list, drawn before its rows exist.
 *
 * Geometry is copied from ObjectListClient rather than approximated — the same
 * paddings, the same fixed row heights, the same 2.5 gap. A placeholder that is
 * a few pixels off its real counterpart pushes the whole page when the data
 * lands, which is worse than showing nothing at all.
 *
 * Widths differ per row so the block reads as a list of objects and not as a
 * table waiting to be filled.
 */

const ROWS = [
  { name: "w-32", meta: "w-24" },
  { name: "w-44", meta: "w-28" },
  { name: "w-28", meta: "w-20" },
];

export default function ObjectListSkeleton() {
  return (
    // aria-hidden with a live status alongside: a screen reader gains nothing
    // from three rows of empty boxes, but it does need to be told to wait.
    <div>
      <p className="sr-only" role="status">
        Loading your objects…
      </p>

      <div aria-hidden className="mb-3 flex items-center justify-between gap-3 px-1">
        <span className="skeleton h-4 w-44 rounded" />
        <span className="skeleton h-5 w-16 shrink-0 rounded-full" />
      </div>

      <ul aria-hidden className="flex w-full flex-col gap-2.5">
        {ROWS.map((row, index) => (
          <li
            key={index}
            style={{ animationDelay: `${index * 40}ms` }}
            className="animate-row-in overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
          >
            <div className="px-4 py-3.5">
              {/* h-6 stands in for the 24px line box of the name and price. */}
              <div className="flex h-6 items-center justify-between gap-3">
                <span className={`skeleton h-4 rounded ${row.name}`} />
                <span className="skeleton h-4 w-16 shrink-0 rounded" />
              </div>

              <div className="mt-1.5 flex h-5 items-center justify-between gap-3">
                <span className={`skeleton h-3 rounded ${row.meta}`} />
                <span className="skeleton h-3 w-14 shrink-0 rounded" />
              </div>

              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-line">
                <span className="skeleton block h-full w-1/3 rounded-full" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
