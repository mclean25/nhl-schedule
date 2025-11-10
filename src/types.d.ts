declare module "*.svg" {
  const content: string;
  export default content;
}

export interface Game {
  date: string;
  home_team: string;
  away_team: string;
  time_utc: string;
  arena: string;
}

export interface WeekSchedule {
  weekStart: string; // Monday date
  weekEnd: string; // Sunday date
  teams: TeamWeekSchedule[];
}

export interface TeamWeekSchedule {
  team: string;
  gameCount: number;
  games: Game[];
}
