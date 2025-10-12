#!/usr/bin/env python3
import requests
import csv
from datetime import datetime
import time

def download_schedule():
    output_file = "nhl-schedule-2025-2026.csv"
    start_date = "2025-10-07"
    end_date = "2026-04-16"
    
    print(f"Downloading NHL 2025-2026 season schedule...")
    print(f"Season: {start_date} to {end_date}")
    
    # Prepare CSV
    games = []
    current_date = start_date
    
    while current_date and current_date <= end_date:
        print(f"Fetching schedule for week starting {current_date}...")
        
        response = requests.get(f"https://api-web.nhle.com/v1/schedule/{current_date}")
        data = response.json()
        
        # Extract games from gameWeek
        if 'gameWeek' in data:
            for day in data['gameWeek']:
                for game in day.get('games', []):
                    # Extract game details
                    game_date = day['date']
                    home_team = f"{game['homeTeam']['placeName']['default']} {game['homeTeam']['commonName']['default']}"
                    away_team = f"{game['awayTeam']['placeName']['default']} {game['awayTeam']['commonName']['default']}"
                    game_time_utc = game['startTimeUTC']
                    arena = game['venue']['default']
                    
                    games.append({
                        'date': game_date,
                        'home_team': home_team,
                        'away_team': away_team,
                        'time_utc': game_time_utc,
                        'arena': arena
                    })
        
        # Get next date
        next_date = data.get('nextStartDate')
        if not next_date or next_date > end_date:
            break
        
        current_date = next_date
        time.sleep(0.5)  # Be respectful to the API
    
    # Write to CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['date', 'home_team', 'away_team', 'time_utc', 'arena']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        writer.writerows(games)
    
    print(f"\nDownload complete! {len(games)} games saved to {output_file}")

if __name__ == "__main__":
    download_schedule()
