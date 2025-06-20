import { load } from "cheerio";
import fs from "fs";
import path from "path";

type Eiga = {
  title: string;
  url: string;
};

const BASE_URL = "https://mydramalist.com";
const SEARCH_URL = "https://mydramalist.com/search";

const START_YEAR = 2004;
const END_YEAR = 2024;
const RESULTS_PER_YEAR = 10;

const eigasByYear: Record<string, Eiga[]> = {};

async function fetchTopjmovies(year: number): Promise<Eiga[]> {
  console.log(`Fetching top jmovies for year ${year}...`);

  // Build URL with filters: type=68 (drama), type=77 (jmovies), country=1 (Japan), sort=top, year filter
//   const url = `${SEARCH_URL}?adv=titles&ty=77&co=1&re=${year},${year}&so=top`;
  const url = `${SEARCH_URL}?adv=titles&ty=77&co=1&re=${year},${year}&so=popular`;
  
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Failed to fetch data for year ${year}: ${res.statusText}`);
    return [];
  }

  const html = await res.text();
  const $ = load(html);

//   fs.writeFileSync(`debug-${year}.html`, html);

  const jmovies: Eiga[] = [];

    $(".item a.block").each((_, el) => {
    if (jmovies.length >= RESULTS_PER_YEAR) return;

    const href = $(el).attr("href");
    const img = $(el).find("img");
    const title = img.attr("alt")?.trim();

    if (title && href && href.startsWith("/")) {
        jmovies.push({
        title,
        url: BASE_URL + href,
        });
    }
    });

  return jmovies;
}

async function main() {
  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const jmovies = await fetchTopjmovies(year);
    eigasByYear[year] = jmovies;
  }

  const outputPath = path.resolve("eigas-by-year-popular.ts");
  const outputContent =
    `export const eigasByYear = ${JSON.stringify(eigasByYear, null, 2)};\n`;

  fs.writeFileSync(outputPath, outputContent);
  console.log(`✅ Saved top jmovies by year to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
