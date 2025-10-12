import React from "react";
import type { TeamWeekSchedule, GameInfo } from "../types";

interface WeekScheduleProps {
	teamSchedules: TeamWeekSchedule[];
	weekStart: Date;
	onPrevWeek: () => void;
	onNextWeek: () => void;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function WeekSchedule({
	teamSchedules,
	weekStart,
	onPrevWeek,
	onNextWeek,
}: WeekScheduleProps) {
	const formatDateRange = () => {
		const end = new Date(weekStart);
		end.setDate(weekStart.getDate() + 6);

		return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
	};

	const renderGameCell = (games: GameInfo[] | undefined) => {
		if (!games || games.length === 0) {
			return <td className="empty-cell"></td>;
		}

		return (
			<td className="game-cell">
				{games.map((game, idx) => (
					<div key={idx} className="game-info">
						<div className="opponent">
							{game.isHome ? "vs" : "@"} {game.opponent}
						</div>
						<div className="time">{game.time}</div>
					</div>
				))}
			</td>
		);
	};

	return (
		<div className="week-schedule">
			<div className="header">
				<button onClick={onPrevWeek} className="nav-button">
					← Prev Week
				</button>
				<h2>{formatDateRange()}</h2>
				<button onClick={onNextWeek} className="nav-button">
					Next Week →
				</button>
			</div>

			<div className="table-container">
				<table className="schedule-table">
					<thead>
						<tr>
							<th className="team-header">Team (Games)</th>
							{DAYS.map((day) => (
								<th key={day} className="day-header">
									{day}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{teamSchedules.map((schedule) => (
							<tr key={schedule.team}>
								<td className="team-name">
									{schedule.team} ({schedule.totalGames})
								</td>
								{DAYS.map((_, dayIndex) => (
									<React.Fragment key={dayIndex}>
										{renderGameCell(schedule.games.get(dayIndex))}
									</React.Fragment>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
