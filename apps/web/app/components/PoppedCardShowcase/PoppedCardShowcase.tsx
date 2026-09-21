"use client";

import PoppedCard from "../PoppedCard/PoppedCard";

const DUMMY_IMAGE = "/card/card-sample.png";

const subcategories = [
  {
    key: "karate",
    eyebrow: "Martial Arts",
    title: "Karate Gloves",
    description:
      "Engineered for precision, protection and performance. Trusted by athletes at every level.",
  },
  {
    key: "boxing",
    eyebrow: "Combat Sports",
    title: "Boxing Gloves",
    description:
      "Built for power and control in every round, from first sparring session to fight night.",
  },
];

const products = [
  {
    key: "gi-red",
    title: "Karate Headgear",
    subtitle: "Lorem ipsum",
    price: "₹2,499.00",
    originalPrice: "₹0.00",
    colors: [
      { name: "Red", hex: "#e2342a" },
      { name: "White", hex: "#f5f5f5" },
      { name: "Blue", hex: "#1a3f8f" },
    ],
  },
  {
    key: "gloves-pro",
    title: "Pro Boxing Gloves",
    subtitle: "Lorem ipsum",
    price: "₹2,299.00",
    originalPrice: "₹2,799.00",
    colors: [
      { name: "Red", hex: "#e2342a" },
      { name: "White", hex: "#f5f5f5" },
      { name: "Blue", hex: "#1a3f8f" },
    ],
  },
  {
    key: "belt-black",
    title: "Black Belt - Cotton",
    subtitle: "Lorem ipsum",
    price: "₹499.00",
    originalPrice: "₹649.00",
    colors: [
      { name: "Black", hex: "#151515" },
      { name: "White", hex: "#f5f5f5" },
    ],
  },
];

export default function PoppedCardShowcase() {
  return (
    <>
      <section className="mb-14">
        <h2 className="mb-8 font-heading text-xl font-bold text-paper">
          Shop by Category
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {subcategories.map((item) => (
            <PoppedCard
              key={item.key}
              variant="subcategory"
              imageSrc={DUMMY_IMAGE}
              imageAlt={item.title}
              eyebrow={item.eyebrow}
              title={item.title}
              description={item.description}
              href={`/categories/${item.key}`}
            />
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="mb-8 font-heading text-xl font-bold text-paper">
          Best Sellers
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
          {products.map((item) => (
            <PoppedCard
              key={item.key}
              variant="product"
              imageSrc={DUMMY_IMAGE}
              imageAlt={item.title}
              title={item.title}
              subtitle={item.subtitle}
              price={item.price}
              originalPrice={item.originalPrice}
              colors={item.colors}
              href={`/products/${item.key}`}
              onAddToCart={() => console.log(`Added ${item.title} to cart`)}
              onColorSelect={(color) =>
                console.log(`${item.title}: selected ${color.name}`)
              }
            />
          ))}
        </div>
      </section>
    </>
  );
}
