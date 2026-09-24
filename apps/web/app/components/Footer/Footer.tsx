import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";
import TaglineReveal from "./TaglineReveal";

const aboutUsLinks = [
  { label: "Our Legacy", href: "/our-legacy" },
  { label: "FAQs", href: "/faqs" },
  { label: "Blogs", href: "/blogs" },
  { label: "Customer Support", href: "/support" },
  { label: "Become a distributor", href: "/become-a-distributor" },
  { label: "Export", href: "/export" },
];

const availableInCountries = ["India", "Dubai", "Sri Lanka", "Mauritius"];

const socialLinks = [
  { label: "Facebook", href: "https://facebook.com", icon: "/footer/social-facebook.svg" },
  { label: "Instagram", href: "https://instagram.com", icon: "/footer/social-instagram.svg" },
  { label: "YouTube", href: "https://youtube.com", icon: "/footer/social-youtube.svg" },
  { label: "Twitter", href: "https://twitter.com", icon: "/footer/social-twitter.svg" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "/footer/social-linkedin.svg" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.bgPhoto}>
        <Image
          src="/footer/bg-mats.jpg"
          alt=""
          fill
          sizes="100vw"
          quality={70}
        />
      </div>
      <div className={styles.tint} />
      <div className={styles.fadeTop} />
      <div className={styles.fadeBottom} />

      <div className={styles.content}>
        <div className={styles.hero}>
          <Image
            src="/footer/logo.png"
            alt="Gokaido"
            width={1788}
            height={395}
            className={styles.logo}
            priority
          />
          <TaglineReveal />
        </div>

        <div className={styles.columns}>
          <div className={styles.column} data-name="About Us">
            <h3 className={styles.heading}>About Us</h3>
            <ul className={styles.list}>
              {aboutUsLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.column} data-name="Available In">
            <h3 className={styles.heading}>Available In</h3>
            <ul className={styles.list}>
              {availableInCountries.map((country) => (
                <li key={country}>
                  <span>{country}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.contactColumn} data-name="Contact">
            <h3 className={styles.heading}>Contact</h3>

            <div className={styles.contactBody}>
              <div className={styles.contactMain}>
                <address className={styles.address}>
                  <div className={styles.addressName}>Mumbai (Head Office)</div>
                  <div className={styles.addressLines}>
                    136-B, Deccean Chembers Bldg,
                    <br />
                    J.S.S. Road, Near Majestic Shopping Centre,
                    <br />
                    Mumbai - 400 004
                    <br />
                    India
                  </div>
                </address>

                <div className={styles.social}>
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className={styles.socialLink}
                    >
                      <img src={social.icon} alt="" width={11} height={11} />
                    </a>
                  ))}
                </div>

                <div className={styles.appBadgesBlock}>
                  <h4 className={styles.appBadgesHeading}>Download the app</h4>
                  <div className={styles.appBadges}>
                    <a href="#" aria-label="Get it on Google Play">
                      <img src="/footer/app-badge-google-play.png" alt="Get it on Google Play" />
                    </a>
                    <a href="#" aria-label="Download on the App Store">
                      <img src="/footer/app-badge-app-store.png" alt="Download on the App Store" />
                    </a>
                  </div>
                </div>
              </div>

              <div className={styles.contactAside} data-name="Contact Details">
                <div className={styles.contactDetails}>
                  <strong>Email</strong> -{" "}
                  <a href="mailto:gikaido@gmail.com">gikaido@gmail.com</a> /{" "}
                  <a href="mailto:gokaidoorders@gmail.com">gokaidoorders@gmail.com</a>
                </div>
                <div className={styles.contactDetails}>
                  <strong>Mobile No.:</strong>{" "}
                  <a href="tel:+912223859074">+91-22-23859074</a>
                  <br />
                  <a href="tel:+919820585200">+91-9820585200</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p className={styles.copyright}>© {year} Gokaido. All rights reserved.</p>
        <nav className={styles.legalLinks} aria-label="Legal">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-of-service">Terms of Service</Link>
          <button type="button">Cookie Settings</button>
        </nav>
      </div>
    </footer>
  );
}
