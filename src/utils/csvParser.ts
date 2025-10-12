import { Game } from "../types";

export async function loadSchedule(): Promise<Game[]> {
	const response = await fetch("/nhl-schedule-2025-2026.csv");
	const csvText = await response.text();

	const lines = csvText.split("\n");
	const games: Game[] = [];

	// Skip header
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const parts = parseCSVLine(line);
		if (parts.length >= 5) {
			games.push({
				date: parts[0],
				homeTeam: parts[1],
				awayTeam: parts[2],
				timeUtc: parts[3],
				arena: parts[4],
			});
		}
	}

	return games;
}

function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === "," && !inQuotes) {
			result.push(current);
			current = "";
		} else {
			current += char;
		}
	}

	result.push(current);
	return result;
}
