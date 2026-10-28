import type { OrderItem } from "../lib/types";

const MAX_SHOWN = 3;

// Overlapping product photos for an order row — the exact colour bought
// (`variantImage` is snapshotted at order time).
export default function ItemThumbs({ items }: { items: OrderItem[] }) {
  const extra = items.length - MAX_SHOWN;
  return (
    <div className="thumb-stack">
      {items.slice(0, MAX_SHOWN).map((item, i) =>
        item.variantImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            className="thumb"
            src={item.variantImage}
            alt={`${item.productName} (${item.variantColor} / ${item.variantSize})`}
            title={`${item.productName} · ${item.variantColor} / ${item.variantSize} × ${item.quantity}`}
            loading="lazy"
          />
        ) : (
          <span key={i} className="thumb thumb-empty" title={item.productName} />
        )
      )}
      {extra > 0 && <span className="thumb thumb-more">+{extra}</span>}
    </div>
  );
}
