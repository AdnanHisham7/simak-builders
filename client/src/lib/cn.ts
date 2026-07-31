type ClassValue = string | number | boolean | null | undefined | ClassValue[];

function flatten(input: ClassValue, out: string[]): void {
  if (!input) return;
  if (Array.isArray(input)) {
    input.forEach((item) => flatten(item, out));
    return;
  }
  if (typeof input === "string" || typeof input === "number") {
    out.push(String(input));
  }
}

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  flatten(inputs, out);
  return out.join(" ").trim().replace(/\s+/g, " ");
}
