#!/usr/bin/env python3
import requests
import os
from pathlib import Path

# NHL team abbreviations mapping (full team name -> abbreviation)
TEAM_ABBREVIATIONS = {
    "Anaheim Ducks": "ANA",
    "Arizona Coyotes": "ARI",
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
    "Utah Mammoth": "UTA",  # Formerly Arizona Coyotes
    "Vancouver Canucks": "VAN",
    "Vegas Golden Knights": "VGK",
    "Washington Capitals": "WSH",
    "Winnipeg Jets": "WPG",
}

def get_team_abbreviation(team_name):
    """Get team abbreviation from full team name."""
    return TEAM_ABBREVIATIONS.get(team_name, team_name.split()[-1][:3].upper())

def download_logo(team_name, output_dir):
    """Download NHL team logo."""
    abbrev = get_team_abbreviation(team_name)
    
    # Try multiple logo URL formats
    logo_urls = [
        f"https://assets.nhle.com/logos/nhl/svg/{abbrev}_light.svg",
        f"https://assets.nhle.com/logos/nhl/svg/{abbrev}_dark.svg",
        f"https://assets.nhle.com/logos/nhl/svg/{abbrev}.svg",
    ]
    
    # Also try lowercase
    logo_urls.extend([
        f"https://assets.nhle.com/logos/nhl/svg/{abbrev.lower()}_light.svg",
        f"https://assets.nhle.com/logos/nhl/svg/{abbrev.lower()}_dark.svg",
        f"https://assets.nhle.com/logos/nhl/svg/{abbrev.lower()}.svg",
    ])
    
    # Create safe filename from team name
    safe_name = team_name.replace(" ", "_").replace("é", "e").replace("'", "")
    output_path = output_dir / f"{safe_name}.svg"
    
    for url in logo_urls:
        try:
            print(f"  Trying {url}...")
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                output_path.write_bytes(response.content)
                print(f"  ✓ Downloaded: {output_path.name}")
                return True
        except Exception as e:
            continue
    
    # If SVG doesn't work, try PNG
    png_urls = [
        f"https://assets.nhle.com/logos/nhl/{abbrev}.png",
        f"https://assets.nhle.com/logos/nhl/{abbrev.lower()}.png",
    ]
    
    output_path = output_dir / f"{safe_name}.png"
    for url in png_urls:
        try:
            print(f"  Trying {url}...")
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                output_path.write_bytes(response.content)
                print(f"  ✓ Downloaded: {output_path.name}")
                return True
        except Exception as e:
            continue
    
    print(f"  ✗ Failed to download logo for {team_name}")
    return False

def get_all_teams_from_csv(csv_file):
    """Extract all unique team names from the CSV file."""
    import csv
    
    teams = set()
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            teams.add(row['home_team'])
            teams.add(row['away_team'])
    
    return sorted(teams)

def download_all_logos():
    """Download logos for all NHL teams."""
    output_dir = Path("public/team-icons")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("Downloading NHL team logos...")
    print(f"Output directory: {output_dir.absolute()}\n")
    
    # Get teams from CSV
    csv_file = "nhl-schedule-2025-2026.csv"
    if os.path.exists(csv_file):
        teams = get_all_teams_from_csv(csv_file)
        print(f"Found {len(teams)} teams in CSV file\n")
    else:
        # Fallback to all known teams
        teams = list(TEAM_ABBREVIATIONS.keys())
        print(f"CSV not found, using {len(teams)} known teams\n")
    
    success_count = 0
    failed_teams = []
    
    for team in teams:
        print(f"Downloading logo for {team}...")
        if download_logo(team, output_dir):
            success_count += 1
        else:
            failed_teams.append(team)
        print()
    
    print(f"\n{'='*50}")
    print(f"Download complete!")
    print(f"Successfully downloaded: {success_count}/{len(teams)} logos")
    if failed_teams:
        print(f"\nFailed teams:")
        for team in failed_teams:
            print(f"  - {team}")
    print(f"\nLogos saved to: {output_dir.absolute()}")

if __name__ == "__main__":
    download_all_logos()

