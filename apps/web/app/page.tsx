import PoppedCardShowcase from "./components/PoppedCardShowcase/PoppedCardShowcase";

export default function Home() {
  return (
    <main className="mx-auto max-w-300 px-6 pt-8 pb-20">
      <h1 className="mb-8 font-heading text-3xl font-bold text-paper">
        Gokaido
      </h1>
      <PoppedCardShowcase />
    </main>
  );
}
