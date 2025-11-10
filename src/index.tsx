import { serve } from "bun";
import index from "./index.html";
import { readFileSync, existsSync } from "fs";
import { parse } from "csv-parse/sync";
import { join } from "path";
import type { Game, WeekSchedule, TeamWeekSchedule } from "./types";

// Read and parse CSV file
function loadSchedule(): Game[] {
  // Use import.meta.dir which is available in Bun, or fallback to process.cwd()
  const csvPath = import.meta.dir 
    ? `${import.meta.dir}/../nhl-schedule-2025-2026.csv`
    : `${process.cwd()}/nhl-schedule-2025-2026.csv`;
  const csvContent = readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });
  return records as Game[];
}

// Get Monday of the week for a given date
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Calculate days to subtract to get to Monday
  // Sunday (0) -> subtract 6 days, Monday (1) -> subtract 0, Tuesday (2) -> subtract 1, etc.
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Group games by week (Monday-Sunday)
function groupGamesByWeek(games: Game[]): WeekSchedule[] {
  const weekMap = new Map<string, Game[]>();

  games.forEach((game) => {
    const gameDate = new Date(game.date);
    const weekStart = getWeekStart(gameDate);
    const weekKey = formatDate(weekStart);

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(game);
  });

  const weekSchedules: WeekSchedule[] = [];

  weekMap.forEach((weekGames, weekStartStr) => {
    const weekStart = new Date(weekStartStr);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Group games by team
    const teamMap = new Map<string, Game[]>();

    weekGames.forEach((game) => {
      // Add game for home team
      if (!teamMap.has(game.home_team)) {
        teamMap.set(game.home_team, []);
      }
      teamMap.get(game.home_team)!.push(game);

      // Add game for away team
      if (!teamMap.has(game.away_team)) {
        teamMap.set(game.away_team, []);
      }
      teamMap.get(game.away_team)!.push(game);
    });

    // Convert to array and sort by game count (descending)
    const teams: TeamWeekSchedule[] = Array.from(teamMap.entries())
      .map(([team, games]) => ({
        team,
        gameCount: games.length,
        games,
      }))
      .sort((a, b) => b.gameCount - a.gameCount);

    weekSchedules.push({
      weekStart: weekStartStr,
      weekEnd: formatDate(weekEnd),
      teams,
    });
  });

  // Sort weeks by date
  weekSchedules.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  return weekSchedules;
}

const schedule = loadSchedule();

const server = serve({
  routes: {
    // Serve static files from public directory
    "/team-icons/*": async (req) => {
      const url = new URL(req.url);
      const filePath = url.pathname.replace("/team-icons/", "");
      const publicPath = join(process.cwd(), "public", "team-icons", filePath);
      
      if (existsSync(publicPath)) {
        const file = Bun.file(publicPath);
        return new Response(file, {
          headers: {
            "Content-Type": file.type || "image/svg+xml",
          },
        });
      }
      
      return new Response("Not found", { status: 404 });
    },

    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/schedule": {
      async GET(req) {
        const url = new URL(req.url);
        const weekParam = url.searchParams.get("week");

        if (weekParam) {
          // Return specific week
          const weekSchedules = groupGamesByWeek(schedule);
          const week = weekSchedules.find(
            (w) => w.weekStart === weekParam
          );
          if (week) {
            return Response.json(week);
          }
          return Response.json({ error: "Week not found" }, { status: 404 });
        }

        // Return all weeks
        const weekSchedules = groupGamesByWeek(schedule);
        return Response.json(weekSchedules);
      },
    },

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async (req) => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
