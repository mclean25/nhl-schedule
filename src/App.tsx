import { useState, useEffect } from "react";
import type { Game } from "./types";
import { loadSchedule } from "./utils/csvParser";
import { getMonday, getWeekGames, buildTeamSchedules } from "./utils/weekUtils";
import { WeekSchedule } from "./components/WeekSchedule";
import "./App.css";

function App() {
	const [games, setGames] = useState<Game[]>([]);
	const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
		getMonday(new Date()),
	);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadSchedule().then((scheduleData) => {
			setGames(scheduleData);
			setLoading(false);
		});
	}, []);

	const handlePrevWeek = () => {
		const newWeekStart = new Date(currentWeekStart);
		newWeekStart.setDate(currentWeekStart.getDate() - 7);
		setCurrentWeekStart(newWeekStart);
	};

	const handleNextWeek = () => {
		const newWeekStart = new Date(currentWeekStart);
		newWeekStart.setDate(currentWeekStart.getDate() + 7);
		setCurrentWeekStart(newWeekStart);
	};

	if (loading) {
		return <div className="loading">Loading NHL Schedule...</div>;
	}

	const weekGames = getWeekGames(games, currentWeekStart);
	const teamSchedules = buildTeamSchedules(weekGames);

	return (
		<div className="app">
			<h1>NHL Schedule Viewer 2025-2026</h1>
			<WeekSchedule
				teamSchedules={teamSchedules}
				weekStart={currentWeekStart}
				onPrevWeek={handlePrevWeek}
				onNextWeek={handleNextWeek}
			/>
		</div>
	);
}

export default App;
