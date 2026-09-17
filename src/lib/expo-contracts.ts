// Expo 2027 contract award ledger — typed accessor over data/expo-contracts.json
// (the data master; bump `updated` on every edit — it drives the page's
// dateModified + sitemap lastmod).
//
// Deliberately NO total. Summing these rows would invent a number: the ledger
// is incomplete by design, one row is a framework ceiling rather than spending,
// and a sum would read as "the cost of Expo 2027", which it is not. See the
// `_readme` in the master for the editing rules this file assumes.

import data from "../data/expo-contracts.json";

export type ContractKind = "award" | "framework";

export type Contract = {
  id: string;
  package: string;
  awardedTo: string[];
  subcontractors: string[];
  value: number;
  currency: string;
  vat: "excl" | "incl";
  kind: ContractKind;
  awarded: string;
  scope: string;
  verified: string;
  sources: string[];
  eurApprox?: number;
  bidders?: number;
  lots?: string;
  term?: string;
  note?: string;
  frameworkNote?: string;
  consortiumNote?: string;
};

export type Watched = { package: string; reported: string; why: string };

export const LEDGER = data;
export const updated: string = data.updated;
export const scopeNote: string = data.scopeNote;

// Largest first — the ledger's job is to show the shape of the spend.
export const contracts: Contract[] = (data.contracts as Contract[])
  .slice()
  .sort((a, b) => b.value - a.value);

export const watching: Watched[] = data.watching as Watched[];

export const contractCount = contracts.length;

// Distinct companies named as a winner or a named subcontractor.
export const companyCount = new Set(
  contracts.flatMap((c) => [...c.awardedTo, ...c.subcontractors]),
).size;

// How many rows are firm awards rather than framework ceilings — printed on the
// page so the distinction is visible rather than buried in a footnote.
export const awardCount = contracts.filter((c) => c.kind === "award").length;

export const earliest = contracts
  .map((c) => c.awarded)
  .sort()[0];

// RSD with thin spaces, e.g. "5,280,000,000 RSD". Values are stored as plain
// numbers so the JSON endpoint stays machine-readable.
export function money(c: Pick<Contract, "value" | "currency">): string {
  return `${c.value.toLocaleString("en-GB")} ${c.currency}`;
}

// A short, honest label for the figure's status.
export function kindLabel(c: Pick<Contract, "kind">): string {
  return c.kind === "framework" ? "Framework ceiling" : "Awarded";
}

export function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
