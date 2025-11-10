import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
          setSelectedWeek(data[0].weekStart);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string): string => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDayOfWeek = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

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

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-4">NHL Schedule Viewer</h1>
        <div className="flex gap-2 flex-wrap mb-6">
          {weeks.map((week) => (
            <Button
              key={week.weekStart}
              onClick={() => setSelectedWeek(week.weekStart)}
              variant={selectedWeek === week.weekStart ? "default" : "outline"}
            >
              {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
            </Button>
          ))}
        </div>
      </div>

      {currentWeek && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Week of {formatDate(currentWeek.weekStart)} - {formatDate(currentWeek.weekEnd)}
          </h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] font-semibold">Team</TableHead>
                  {DAYS_OF_WEEK.map((day) => (
                    <TableHead key={day} className="font-semibold">
                      {day.slice(0, 3)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((teamData) => (
                  <TableRow key={teamData.team}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{teamData.team}</span>
                        <span className="text-xs text-muted-foreground">
                          {teamData.gameCount} {teamData.gameCount === 1 ? "game" : "games"}
                        </span>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

