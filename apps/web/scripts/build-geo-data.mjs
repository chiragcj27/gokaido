#!/usr/bin/env node
// Regenerates the country/city lists behind the enquiry form's dropdowns from
// GeoNames (CC BY 4.0 — https://www.geonames.org). Only needed to refresh the
// data; the output is committed.
//
//   curl -O https://download.geonames.org/export/dump/countryInfo.txt
//   curl -O https://download.geonames.org/export/dump/cities15000.zip && unzip cities15000.zip
//   node apps/web/scripts/build-geo-data.mjs <directory holding those two files>
//
// Output:
//   app/components/EnquiryForm/countries.json — bundled, India first
//   public/geo/cities/{ISO2}.json             — fetched when a country is picked
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error("Usage: build-geo-data.mjs <directory with countryInfo.txt and cities15000.txt>");
  process.exit(1);
}

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const citiesDir = join(webRoot, "public/geo/cities");

const rows = (file) =>
  readFileSync(join(sourceDir, file), "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("\t"));

// City districts plus historical, abandoned and destroyed places: none are a
// city someone would give as their location.
const EXCLUDED_FEATURE_CODES = new Set(["PPLX", "PPLH", "PPLQ", "PPLW"]);

const citiesByCountry = new Map();
for (const row of rows("cities15000.txt")) {
  // Columns: 2 = ASCII name, 7 = feature code, 8 = country code. ASCII because
  // the plain name carries diacritics people don't type ("Thāne").
  const [name, featureCode, code] = [row[2], row[7], row[8]];
  if (!name || EXCLUDED_FEATURE_CODES.has(featureCode)) continue;
  if (!citiesByCountry.has(code)) citiesByCountry.set(code, new Set());
  citiesByCountry.get(code).add(name);
}

const byName = (a, b) => a.localeCompare(b, "en");

// Countries with no cities in the data are dropped (uninhabited territories and
// GeoNames' retired codes such as AN and CS).
const countries = rows("countryInfo.txt")
  .map((row) => ({ code: row[0], name: row[4] }))
  .filter(({ code }) => citiesByCountry.has(code))
  .sort((a, b) => (a.code === "IN" ? -1 : b.code === "IN" ? 1 : byName(a.name, b.name)));

rmSync(citiesDir, { recursive: true, force: true });
mkdirSync(citiesDir, { recursive: true });
for (const { code } of countries) {
  writeFileSync(join(citiesDir, `${code}.json`), JSON.stringify([...citiesByCountry.get(code)].sort(byName)));
}
writeFileSync(join(webRoot, "app/components/EnquiryForm/countries.json"), `${JSON.stringify(countries, null, 2)}\n`);

console.log(`${countries.length} countries, ${[...citiesByCountry.values()].reduce((n, s) => n + s.size, 0)} cities`);
