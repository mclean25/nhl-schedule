/**
 * Maps team names to their logo file paths
 * Team names from CSV are normalized to match the downloaded logo filenames
 */
export function getTeamLogoPath(teamName: string): string {
  // Normalize team name to match downloaded logo filenames
  // Replace spaces with underscores, remove accents, etc.
  // Note: Keep periods in abbreviations like "St." - don't replace them
  const normalized = teamName
    .replace(/\s+/g, "_")
    .replace(/é/g, "e")
    .replace(/'/g, "");
  // Don't replace periods - they're preserved in filenames like "St._Louis_Blues.svg"
  
  return `/team-icons/${normalized}.svg`;
}

