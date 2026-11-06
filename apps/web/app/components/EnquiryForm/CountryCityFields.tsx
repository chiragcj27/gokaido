"use client";

import { useEffect, useState } from "react";
import SearchableSelect from "./SearchableSelect";
import COUNTRIES from "./countries.json";

const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);

/**
 * Linked Country → City dropdowns. Each country's cities are fetched only when
 * it's picked (India alone is thousands of names). The list only holds cities
 * and larger towns, so City also accepts typed text. That doubles as the
 * fallback if the list fails to load.
 */
export default function CountryCityFields({ fieldClassName }: { fieldClassName: string }) {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const countryCode = COUNTRIES.find((c) => c.name === country)?.code;

  useEffect(() => {
    setCities([]);
    if (!countryCode) return;

    const controller = new AbortController();
    setLoading(true);
    fetch(`/geo/cities/${countryCode}.json`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<string[]>) : []))
      .then(setCities)
      .catch(() => {
        // Aborted or offline: City stays usable as a plain text field.
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [countryCode]);

  function selectCountry(next: string) {
    setCountry(next);
    setCity("");
  }

  return (
    <>
      <SearchableSelect
        name="country"
        label="Country"
        options={COUNTRY_NAMES}
        value={country}
        onChange={selectCountry}
        placeholder="Country"
        autoComplete="country-name"
        className={fieldClassName}
      />
      <SearchableSelect
        name="city"
        label="City"
        options={cities}
        value={city}
        onChange={setCity}
        placeholder={!country ? "Select a country first" : loading ? "Loading cities…" : "City"}
        disabled={!country}
        allowCustom
        autoComplete="address-level2"
        className={fieldClassName}
      />
    </>
  );
}
