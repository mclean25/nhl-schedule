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

/**
 * Maps full team names to their official NHL abbreviations
 */
const TEAM_ABBREVIATIONS: Record<string, string> = {
  "Anaheim Ducks": "ANA",
  "Boston Bruins": "BOS",
  "Buffalo Sabres": "BUF",
  "Calgary Flames": "CGY",
  "Carolina Hurricanes": "CAR",
  "Chicago Blackhawks": "CHI",
  "Colorado Avalanche": "COL",
  "Columbus Blue Jackets": "CBJ",
  "Dallas Stars": "DAL",
  "Detroit Red Wings": "DET",
  "Edmonton Oilers": "EDM",
  "Florida Panthers": "FLA",
  "Los Angeles Kings": "LAK",
  "Minnesota Wild": "MIN",
  "Montréal Canadiens": "MTL",
  "Montreal Canadiens": "MTL",
  "Nashville Predators": "NSH",
  "New Jersey Devils": "NJD",
  "New York Islanders": "NYI",
  "New York Rangers": "NYR",
  "Ottawa Senators": "OTT",
  "Philadelphia Flyers": "PHI",
  "Pittsburgh Penguins": "PIT",
  "San Jose Sharks": "SJS",
  "Seattle Kraken": "SEA",
  "St. Louis Blues": "STL",
  "Tampa Bay Lightning": "TBL",
  "Toronto Maple Leafs": "TOR",
  "Utah Hockey Club": "UTA",
  "Vancouver Canucks": "VAN",
  "Vegas Golden Knights": "VGK",
  "Washington Capitals": "WSH",
  "Winnipeg Jets": "WPG",
};

/**
 * Get the official NHL abbreviation for a team
 */
export function getTeamAbbreviation(teamName: string): string {
  return TEAM_ABBREVIATIONS[teamName] || teamName.slice(0, 3).toUpperCase();
}

