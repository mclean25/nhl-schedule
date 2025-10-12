export interface Game {
	date: string;
	homeTeam: string;
	awayTeam: string;
	timeUtc: string;
	arena: string;
}

export interface TeamWeekSchedule {
	team: string;
	games: Map<number, GameInfo[]>; // day of week (0=Mon, 6=Sun) -> games
	totalGames: number;
}

export interface GameInfo {
	opponent: string;
	isHome: boolean;
	time: string;
}
