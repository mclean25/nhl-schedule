import { Game, TeamWeekSchedule, GameInfo } from "../types";

export function getMonday(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day; // Adjust when day is Sunday
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

export function getSunday(monday: Date): Date {
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	sunday.setHours(23, 59, 59, 999);
	return sunday;
}

export function getWeekGames(games: Game[], weekStart: Date): Game[] {
	const weekEnd = getSunday(weekStart);

	return games.filter((game) => {
		const gameDate = new Date(game.timeUtc);
		return gameDate >= weekStart && gameDate <= weekEnd;
	});
}

export function buildTeamSchedules(weekGames: Game[]): TeamWeekSchedule[] {
	const teamMap = new Map<string, Map<number, GameInfo[]>>();

	weekGames.forEach((game) => {
		const gameDate = new Date(game.timeUtc);
		const dayOfWeek = (gameDate.getDay() + 6) % 7; // Convert to Mon=0, Sun=6

		// Format time
		const time = formatTime(game.timeUtc);

		// Add for home team
		if (!teamMap.has(game.homeTeam)) {
			teamMap.set(game.homeTeam, new Map());
		}
		const homeSchedule = teamMap.get(game.homeTeam)!;
		if (!homeSchedule.has(dayOfWeek)) {
			homeSchedule.set(dayOfWeek, []);
		}
		homeSchedule.get(dayOfWeek)!.push({
			opponent: game.awayTeam,
			isHome: true,
			time,
		});

		// Add for away team
		if (!teamMap.has(game.awayTeam)) {
			teamMap.set(game.awayTeam, new Map());
		}
		const awaySchedule = teamMap.get(game.awayTeam)!;
		if (!awaySchedule.has(dayOfWeek)) {
			awaySchedule.set(dayOfWeek, []);
		}
		awaySchedule.get(dayOfWeek)!.push({
			opponent: game.homeTeam,
			isHome: false,
			time,
		});
	});

	// Convert to array and calculate totals
	const teamSchedules: TeamWeekSchedule[] = [];
	teamMap.forEach((games, team) => {
		let totalGames = 0;
		games.forEach((dayGames) => {
			totalGames += dayGames.length;
		});

		teamSchedules.push({
			team,
			games,
			totalGames,
		});
	});

	// Sort by total games descending
	teamSchedules.sort((a, b) => b.totalGames - a.totalGames);

	return teamSchedules;
}

function formatTime(utcTime: string): string {
	const date = new Date(utcTime);
	return date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}
