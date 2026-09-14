/**
 * Wafy Orbit Class Code to Human-Readable Academic Stage Mapping
 * 
 * Mapping:
 * 1  -> Thamheediyya-1
 * 2  -> Thamheediyya-2
 * 3  -> Aliya-1
 * 4  -> Aliya-2
 * 5  -> Aliya-3
 * 6  -> Aliya-4
 * 7  -> PG-1
 * 8  -> PG-2
 * F1 -> 10th Standard
 * F2 -> 9th Standard
 * F3 -> 8th Standard
 */

export const CLASS_STAGE_MAP: Record<string, string> = {
  "1": "Thamheediyya-1",
  "2": "Thamheediyya-2",
  "3": "Aliya-1",
  "4": "Aliya-2",
  "5": "Aliya-3",
  "6": "Aliya-4",
  "7": "PG-1",
  "8": "PG-2",
  "F1": "10th Standard",
  "F2": "9th Standard",
  "F3": "8th Standard",
};

export const CLASS_OPTIONS = [
  { code: "1", label: "Thamheediyya-1 (1)" },
  { code: "2", label: "Thamheediyya-2 (2)" },
  { code: "3", label: "Aliya-1 (3)" },
  { code: "4", label: "Aliya-2 (4)" },
  { code: "5", label: "Aliya-3 (5)" },
  { code: "6", label: "Aliya-4 (6)" },
  { code: "7", label: "PG-1 (7)" },
  { code: "8", label: "PG-2 (8)" },
  { code: "F1", label: "10th Standard (F1)" },
  { code: "F2", label: "9th Standard (F2)" },
  { code: "F3", label: "8th Standard (F3)" },
];

/**
 * Returns formatted human-readable class name from raw code or string
 */
export function formatStudentClass(rawCode: string | null | undefined): string {
  if (!rawCode) return "—";
  const trimmed = rawCode.trim();
  const upper = trimmed.toUpperCase();

  if (CLASS_STAGE_MAP[upper]) {
    return CLASS_STAGE_MAP[upper];
  }

  // Check if it was entered with prefix or lowercase
  for (const [key, val] of Object.entries(CLASS_STAGE_MAP)) {
    if (upper === key.toUpperCase() || upper === val.toUpperCase()) {
      return val;
    }
  }

  return trimmed;
}
