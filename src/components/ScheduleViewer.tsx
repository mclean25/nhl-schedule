import { useEffect, useState, useMemo, memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTeamLogoPath } from "@/lib/teamLogos";
import type { WeekSchedule, Game } from "../types";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface TeamDayGames {
  [day: string]: Game[];
}

interface TeamTableData {
  team: string;
  gameCount: number;
  gamesByDay: TeamDayGames;
}

// Parse date string as local date (not UTC) to avoid timezone issues
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
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
function formatDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Find the week that contains tomorrow
function getDefaultWeek(weeks: WeekSchedule[]): string | null {
  if (weeks.length === 0) return null;

  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Reset time to midnight

  // Get the Monday of the week that contains tomorrow
  const weekStart = getWeekStart(tomorrow);
  const weekStartStr = formatDateString(weekStart);

  // Find the week in the data
  const foundWeek = weeks.find((w) => w.weekStart === weekStartStr);
  if (foundWeek) {
    return foundWeek.weekStart;
  }

  // If the week doesn't exist, find the closest future week
  const futureWeeks = weeks.filter((w) => w.weekStart >= weekStartStr);
  if (futureWeeks.length > 0) {
    return futureWeeks[0].weekStart;
  }

  // Fallback to the last week if no future weeks exist
  return weeks[weeks.length - 1].weekStart;
}

// Format date as "Jan 1"
function formatDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Format time as "7:00 PM"
function formatTime(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Get day of week from date string
function getDayOfWeek(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

// Handle image error by hiding it
function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = "none";
}

// Memoized team row component to prevent unnecessary re-renders
const TeamRow = memo(({ teamData }: { teamData: TeamTableData }) => {
  return (
    <TableRow>
      <TableCell className="font-medium sticky left-0 z-10 bg-background border-r min-w-[220px] w-[220px]">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={getTeamLogoPath(teamData.team)}
            alt={teamData.team}
            className="w-6 h-6 object-contain shrink-0"
            onError={handleImageError}
          />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="truncate">{teamData.team}</span>
            <span className="text-xs text-muted-foreground">
              {teamData.gameCount} {teamData.gameCount === 1 ? "game" : "games"}
            </span>
          </div>
        </div>
      </TableCell>
      {DAYS_OF_WEEK.map((day) => {
        const games = teamData.gamesByDay[day] || [];
        return (
          <TableCell key={day} className="align-top">
            {games.length > 0 ? (
              <div className="space-y-2">
                {games.map((game, idx) => {
                  const isHome = game.home_team === teamData.team;
                  const opponent = isHome ? game.away_team : game.home_team;
                  return (
                    <div
                      key={idx}
                      className="p-2 bg-muted rounded-md text-sm"
                    >
                      <div className="font-medium mb-1">
                        {isHome ? (
                          <span>
                            vs <strong>{opponent}</strong>
                          </span>
                        ) : (
                          <span>
                            @ <strong>{opponent}</strong>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(game.time_utc)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {game.arena}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );
});

TeamRow.displayName = "TeamRow";

export function ScheduleViewer() {
  const [weeks, setWeeks] = useState<WeekSchedule[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/schedule")
      .then((res) => res.json())
      .then((data: WeekSchedule[]) => {
        setWeeks(data);
        if (data.length > 0) {
          const defaultWeek = getDefaultWeek(data);
          setSelectedWeek(defaultWeek);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Transform week data into table format
  const tableData = useMemo(() => {
    const currentWeek = weeks.find((w) => w.weekStart === selectedWeek);
    if (!currentWeek) return [];

    // Organize games by team and day
    const teamDataMap = new Map<string, TeamTableData>();

    currentWeek.teams.forEach((teamSchedule) => {
      const gamesByDay: TeamDayGames = {};
      DAYS_OF_WEEK.forEach((day) => {
        gamesByDay[day] = [];
      });

      teamSchedule.games.forEach((game) => {
        const dayName = getDayOfWeek(game.date);
        if (gamesByDay[dayName]) {
          gamesByDay[dayName].push(game);
        }
      });

      teamDataMap.set(teamSchedule.team, {
        team: teamSchedule.team,
        gameCount: teamSchedule.gameCount,
        gamesByDay,
      });
    });

    // Convert to array and sort by game count (descending)
    return Array.from(teamDataMap.values()).sort(
      (a, b) => b.gameCount - a.gameCount
    );
  }, [weeks, selectedWeek]);

  // Calculate total games per day
  const gamesPerDay = useMemo(() => {
    const currentWeek = weeks.find((w) => w.weekStart === selectedWeek);
    if (!currentWeek) {
      const counts: Record<string, number> = {};
      DAYS_OF_WEEK.forEach((day) => {
        counts[day] = 0;
      });
      return counts;
    }

    const counts: Record<string, number> = {};
    DAYS_OF_WEEK.forEach((day) => {
      counts[day] = 0;
    });

    // Count unique games per day (each game appears twice - once for each team)
    const uniqueGamesByDay = new Map<string, Set<string>>();
    
    currentWeek.teams.forEach((teamSchedule) => {
      teamSchedule.games.forEach((game) => {
        const dayName = getDayOfWeek(game.date);
        if (!uniqueGamesByDay.has(dayName)) {
          uniqueGamesByDay.set(dayName, new Set());
        }
        // Use a unique identifier for each game (date + home + away)
        const gameId = `${game.date}-${game.home_team}-${game.away_team}`;
        uniqueGamesByDay.get(dayName)!.add(gameId);
      });
    });

    // Count unique games per day
    uniqueGamesByDay.forEach((gameSet, day) => {
      counts[day] = gameSet.size;
    });

    return counts;
  }, [weeks, selectedWeek]);

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p>Loading schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  const currentWeek = weeks.find((w) => w.weekStart === selectedWeek);
  const currentWeekIndex = weeks.findIndex((w) => w.weekStart === selectedWeek);
  const canGoPrev = currentWeekIndex > 0;
  const canGoNext = currentWeekIndex < weeks.length - 1;

  const handlePrevWeek = () => {
    if (canGoPrev && currentWeekIndex > 0) {
      setSelectedWeek(weeks[currentWeekIndex - 1].weekStart);
    }
  };

  const handleNextWeek = () => {
    if (canGoNext && currentWeekIndex < weeks.length - 1) {
      setSelectedWeek(weeks[currentWeekIndex + 1].weekStart);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-4">NHL Schedule Viewer</h1>
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            onClick={handlePrevWeek}
            disabled={!canGoPrev}
            variant="outline"
            size="icon"
            className="h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-lg font-semibold min-w-[200px] text-center">
            {currentWeek
              ? `${formatDate(currentWeek.weekStart)} - ${formatDate(currentWeek.weekEnd)}`
              : "No week selected"}
          </div>
          <Button
            onClick={handleNextWeek}
            disabled={!canGoNext}
            variant="outline"
            size="icon"
            className="h-10 w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {currentWeek && (
        <div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px] w-[220px] font-semibold sticky left-0 z-10 bg-background border-r">
                    Team
                  </TableHead>
                  {DAYS_OF_WEEK.map((day) => (
                    <TableHead key={day} className="font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <span>{day.slice(0, 3)}</span>
                        <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-normal text-muted-foreground">
                          {gamesPerDay[day]}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((teamData) => (
                  <TeamRow key={teamData.team} teamData={teamData} />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

