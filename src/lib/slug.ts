const SMALL_WORDS = new Set(["de", "da", "do", "das", "dos", "e", "em", "no", "na", "a", "o"]);

/** "01 - MOMENTOS ESPECIAIS" → "momentos-especiais" */
export function slugify(value: string): string {
  return stripOrderPrefix(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Remove o prefixo de ordenação: "01 - ", "02. ", "3 – ". */
export function stripOrderPrefix(value: string): string {
  return value.replace(/^\s*\d{1,3}\s*[-–—.)]\s*/, "").trim();
}

/** "01 - MOMENTOS ESPECIAIS" → "Momentos Especiais". Nome já capitalizado passa intacto. */
export function displayName(folderName: string): string {
  const clean = stripOrderPrefix(folderName);
  const isAllCaps = clean === clean.toUpperCase() && /[A-ZÀ-Ú]/.test(clean);
  if (!isAllCaps) return clean;

  return clean
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) =>
      index > 0 && SMALL_WORDS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}
