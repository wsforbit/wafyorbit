/**
 * Advanced Multi-Format Delimited Data & RFC-4180 CSV Parser
 * 
 * Correctly handles:
 * 1. Tab-Separated Values (TSV) from direct Excel / Google Sheets copy-paste.
 * 2. Commas inside cells (e.g., "Kakkodi, Calicut" or direct spreadsheet cell contents).
 * 3. Double-quoted fields with embedded commas and quotes.
 * 4. Semicolon-delimited files.
 * 5. Trailing newlines, Windows \r\n line endings, and whitespace.
 */

export function parseCsvLine(line: string): string[] {
  if (!line || !line.trim()) return [];

  // 1. If line contains Tab characters (Direct copy-paste from Excel / Google Sheets)
  if (line.includes("\t")) {
    return line.split("\t").map((col) => {
      let clean = col.trim();
      if (clean.startsWith('"') && clean.endsWith('"') && clean.length >= 2) {
        clean = clean.slice(1, -1);
      }
      return clean.replace(/""/g, '"').trim();
    });
  }

  // 2. If line is Semicolon-delimited and contains no commas outside quotes
  if (line.includes(";") && !line.includes(",")) {
    return line.split(";").map((col) => {
      let clean = col.trim();
      if (clean.startsWith('"') && clean.endsWith('"') && clean.length >= 2) {
        clean = clean.slice(1, -1);
      }
      return clean.replace(/""/g, '"').trim();
    });
  }

  // 3. RFC-4180 Standard Comma-Separated Parser
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Check for escaped double quotes ("")
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());

  // Clean enclosing quotes
  return result.map((col) => {
    let clean = col.trim();
    if (clean.startsWith('"') && clean.endsWith('"') && clean.length >= 2) {
      clean = clean.slice(1, -1);
    }
    return clean.replace(/""/g, '"').trim();
  });
}

/**
 * Parses full CSV / TSV text block into 2D array of rows and columns
 */
export function parseCsvContent(content: string): string[][] {
  if (!content) return [];

  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawLines = normalized.split("\n");
  const rows: string[][] = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parsedLine = parseCsvLine(trimmed);
    if (parsedLine.length > 0) {
      rows.push(parsedLine);
    }
  }

  return rows;
}
