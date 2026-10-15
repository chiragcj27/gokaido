import CartPageClient from "./CartPageClient";
import { getBestsellers } from "../lib/catalog";

export default async function CartPage() {
  // "You May Also Like": admin-flagged bestsellers (placeholders until some exist). A few extra are
  // fetched so there's still a full row after dropping the ones already in the bag.
  const { products } = await getBestsellers(12);
  return <CartPageClient recommended={products} />;
}
