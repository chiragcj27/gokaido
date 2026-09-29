import AwardsFloat from "./AwardsFloat";
import StatsTrail from "./StatsTrail";
import TeamPhoto from "./TeamPhoto";

const SEGMENTS = [
  {
    title: "Industrial / Office",
    body: "From large-scale operations to technical support, our industrial services are built to optimize performance and reduce downtime. With expertise and precision, we help industries operate stronger, safer, and more sustainably.",
  },
  {
    title: "Retail",
    body: "We provide tailored commercial solutions that keep businesses running smoothly—whether it’s facility maintenance, repairs, or specialized services. Our focus is on efficiency, reliability, and creating safe, productive spaces.",
  },
];

export default function AboutUsPage() {
  return (
    <>
    <main className="mx-auto flex max-w-360 flex-col gap-16 px-4 pt-20 pb-16 sm:px-15 lg:px-20">
      <div className="flex flex-col gap-2">
        <span className="font-heading text-[13px] font-bold tracking-[0.08em] text-red uppercase">OUR JOURNEY</span>
        <h1 className="m-0 font-heading text-2xl leading-tight font-extrabold uppercase sm:text-5xl">
          <span className="block text-paper">From Discipline</span>
          <span className="block text-red">To Your Hands</span>
        </h1>
        <p className="m-0 max-w-2xl font-sans text-sm text-paper/50">
          At Gokaido, every product goes through a journey of precision, people and purpose. From sourcing the finest materials to delivering at your doorstep, we ensure uncompromised quality at every step.
        </p>
      </div>
    </main>
    <TeamPhoto />
    <StatsTrail />
    <section className="mx-auto max-w-360 px-4 pb-16 sm:px-15 sm:pb-24 lg:px-20">
      <p className="m-0 max-w-6xl font-sans text-[clamp(1.125rem,2vw,1.875rem)] leading-snug text-paper/50 [&_em]:text-red [&_em]:not-italic">
        <em>GOKAIDO</em> is a brand dedicated to the world of martial arts, built on decades of experience, discipline,
        and a passion for the craft. Since <em>1975</em>, GOKAIDO has been creating and supplying quality martial arts
        equipment for practitioners, athletes, and training communities. Inspired by the spirit of discipline, precision,
        and perseverance, <em>GOKAIDO</em> brings together traditional martial arts values with reliable, purpose-built
        products. From uniforms and belts to protective <em>gear</em> and training <em>equipment</em>, every product is
        made to support the journey from practice to performance. Here, martial arts is more than a sport it is a way of
        life shaped by <em>discipline</em>, dedication, and the pursuit of mastery.
      </p>
    </section>
    <section className="mx-auto grid max-w-360 gap-10 px-4 pb-16 sm:grid-cols-2 sm:gap-16 sm:px-15 sm:pb-24 lg:px-20">
      {SEGMENTS.map((s, i) => (
        <article key={s.title} className="group flex flex-col items-center text-center">
          <span className="font-heading text-5xl font-light text-paper sm:text-6xl">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="relative isolate w-full px-6 pt-2 pb-12 sm:px-14">
            <div className="absolute inset-0 -z-10 bg-linear-to-b from-transparent via-red/35 to-red/85 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" />
            <h3 className="m-0 font-heading text-3xl font-light text-paper sm:text-4xl">{s.title}</h3>
            <p className="m-0 mt-8 text-left font-sans text-base leading-snug text-paper/70">{s.body}</p>
          </div>
        </article>
      ))}
    </section>
    <AwardsFloat />
    </>
  );
}