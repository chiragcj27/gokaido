import Image from "next/image";
import EnquiryForm from "../components/EnquiryForm/EnquiryForm";

/**
 * "Sign up today" — franchise enquiry form over the gear banner.
 */
export default function FranchiseSignup() {
  return (
    <section id="franchise-signup" aria-labelledby="franchise-signup-title" className="relative bg-black pb-24">
      <div className="relative aspect-1580/715 w-full overflow-hidden">
        {/* Full-colour banner; only its top and bottom edges are masked so it melts into the page — the top fade is long and eased so there is no visible line against the black above. */}
        <Image
          src="/franchise/image 261.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover mask-[linear-gradient(to_bottom,transparent,rgb(0_0_0/0.15)_12%,rgb(0_0_0/0.6)_26%,black_42%,black_72%,transparent)]"
        />

        <h2 id="franchise-signup-title" className="absolute inset-x-0 top-[-11%] m-0">
          <span className="sr-only">Sign up today</span>
          {/* Arched title: text laid along a shallow upward curve. */}
          <svg aria-hidden viewBox="0 0 1000 260" className="mx-auto block w-[88%]">
            <path id="franchise-signup-arc" d="M 0 250 Q 500 100 1000 250" fill="none" />
            <text
              className="fill-paper font-heading uppercase"
              fontSize="118"
              fontWeight={600}
              letterSpacing="-4"
            >
              <textPath href="#franchise-signup-arc" startOffset="50%" textAnchor="middle">
                Sign up today
              </textPath>
            </text>
          </svg>
        </h2>
      </div>

      <div className="relative z-10 mx-4 -mt-[18%] sm:mx-auto sm:-mt-[16%] sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-paper/30 bg-panel/95 p-4 backdrop-blur-sm sm:p-5">
          {/* Placeholder copy (tracked in DUMMY_DATA.md). */}
          <EnquiryForm
            intro="Fill out the form below and we’ll get you started on bringing Gokaido to your city."
            thanks="We’ve got your details. Our franchise team will be in touch soon."
          />
        </div>
      </div>
    </section>
  );
}
