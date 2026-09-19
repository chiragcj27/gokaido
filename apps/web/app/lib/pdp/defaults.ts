import type { Faq, SizeGuide } from "./types";

// The storefront's site-wide fallback — used whenever a product's
// subcategory hasn't configured its own size guide in the admin panel yet
// (a Subcategory document with no `sizeGuide` set). Deliberately generic
// (no chest-specific column framing) and missing the largest size, so it's
// visibly distinct from a subcategory's own configured chart above.
export const DEFAULT_SIZE_GUIDE: SizeGuide = {
  title: "Size Guide",
  description: "General sizing for this category — check the product description for fit notes.",
  measurementImageSrc: "/mini-mannequin-image.png",
  measurementGuide: [
    {
      letter: "A",
      title: "Chest / Bust",
      description: "Measure around the fullest part of your chest, keeping the tape level and snug.",
    },
    {
      letter: "B",
      title: "Length",
      description: "Measure from the top of the shoulder to the hem.",
    },
  ],
  sizeChart: [
    { size: "XS", chestMinCm: 72, chestMaxCm: 78, lengthCm: 58 },
    { size: "S", chestMinCm: 78, chestMaxCm: 84, lengthCm: 60 },
    { size: "M", chestMinCm: 84, chestMaxCm: 90, lengthCm: 62 },
    { size: "L", chestMinCm: 90, chestMaxCm: 96, lengthCm: 64 },
    { size: "XL", chestMinCm: 96, chestMaxCm: 102, lengthCm: 66 },
  ],
  footerNote: "Sizes are approximate and may vary slightly by product. For any assistance, feel free to contact our support team.",
};

// No FAQ model exists in the backend yet, so every product page shows the same store-wide answers.
export const DEFAULT_FAQS: Faq[] = [
  {
    question: "What size should I order?",
    answer: "Check the size guide on this page — if you're between sizes, we recommend choosing the larger one.",
  },
  {
    question: "What's the delivery time?",
    answer: "Orders typically dispatch within 2 business days and arrive within 3-7 days depending on location.",
  },
  {
    question: "Can I return if the size doesn't fit?",
    answer: "Yes, unused items in original packaging can be returned within 7 days of delivery.",
  },
];
