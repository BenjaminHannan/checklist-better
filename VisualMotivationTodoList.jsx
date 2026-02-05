import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Flame } from "lucide-react";

const todayKey = new Date().toISOString().slice(0, 10);

const initialTasks = [
  { id: 1, text: "Finish calculus worksheet", completed: false, date: todayKey },
  { id: 2, text: "Read 20 pages of history", completed: true, date: todayKey },
  { id: 3, text: "Draft English essay outline", completed: false, date: todayKey },
  { id: 4, text: "Review chemistry flashcards", completed: false, date: todayKey },
];

const buildHistory = () => {
  const history = [];
  for (let i = 29; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    history.push({
      date: date.toISOString().slice(0, 10),
      completedAll: Math.random() > 0.35,
    });
  }
  return history;
};

const CompletionRing = ({ percentage }) => {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const ringColor = percentage === 0 ? "text-rose-500" : percentage === 100 ? "text-emerald-400" : "text-emerald-300";

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          strokeWidth="10"
          className="text-slate-800"
          stroke="currentColor"
          fill="transparent"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          strokeWidth="10"
          strokeLinecap="round"
          className={ringColor}
          stroke="currentColor"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-semibold text-slate-100">{percentage}%</p>
        <p className="text-xs text-slate-400">Today</p>
      </div>
    </div>
  );
};

const VisualMotivationTodoList = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [history] = useState(buildHistory);
  const [hoverCompleteEnabled, setHoverCompleteEnabled] = useState(false);

  const todaysTasks = useMemo(
    () => tasks.filter((task) => task.date === todayKey),
    [tasks]
  );

  const completionRate = useMemo(() => {
    if (todaysTasks.length === 0) return 0;
    const completedCount = todaysTasks.filter((task) => task.completed).length;
    return Math.round((completedCount / todaysTasks.length) * 100);
  }, [todaysTasks]);

  const lastTwoWeeks = history.slice(-14);

  const toggleTask = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const markComplete = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId && !task.completed ? { ...task, completed: true } : task
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 font-sans text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/30">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Visual Motivation</p>
            <h1 className="text-2xl font-semibold tracking-tight">Completion Ring</h1>
            <p className="mt-1 text-sm text-slate-400">Finish today to close the loop.</p>
          </div>
          <CompletionRing percentage={completionRate} />
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-rose-500" />
              <h2 className="text-lg font-semibold tracking-tight">Today&apos;s Ghost List</h2>
            </div>
            <button
              type="button"
              onClick={() => setHoverCompleteEnabled((prev) => !prev)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-500 ${
                hoverCompleteEnabled
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-slate-700 bg-slate-900/60 text-slate-400"
              }`}
            >
              Hover to complete: {hoverCompleteEnabled ? "On" : "Off"}
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Completed tasks fade but stay to reinforce the completion bias.
          </p>

          <div className="mt-4 space-y-3">
            {todaysTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                onMouseEnter={() => {
                  if (hoverCompleteEnabled && !task.completed) markComplete(task.id);
                }}
                className={`group flex w-full items-center justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-slate-950/80 px-4 py-3 text-left shadow-lg shadow-black/20 transition-all duration-500 ${
                  task.completed ? "opacity-10" : "opacity-100 hover:border-slate-700/80 hover:shadow-emerald-500/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400 transition-all duration-500 group-hover:text-emerald-300" />
                  )}
                  <span className={`text-sm md:text-base ${task.completed ? "line-through" : ""}`}>
                    {task.text}
                  </span>
                </div>
                <span className={`text-xs ${task.completed ? "text-emerald-400" : "text-slate-500"}`}>
                  {task.completed ? "Done" : "Pending"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <footer className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Seinfeld Heatmap</h3>
              <p className="text-sm text-slate-400">Green streaks only. No gaps.</p>
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Last 14 days</span>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {lastTwoWeeks.map((day) => (
              <div
                key={day.date}
                className={`h-6 w-6 rounded-md transition-all duration-500 ${
                  day.completedAll ? "bg-emerald-400" : "bg-rose-500"
                }`}
                title={day.date}
              />
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default VisualMotivationTodoList;
