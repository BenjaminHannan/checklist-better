import { useMemo, useState } from "react";
import { X } from "lucide-react";

const TaskFocusModal = ({ isOpen, onClose, task, onUpdateTask }) => {
  const [draftTitle, setDraftTitle] = useState(task?.text ?? "");
  const [draftNotes, setDraftNotes] = useState(task?.notes ?? "");

  const isComplete = task?.completed;
  const isOverdue = useMemo(() => {
    if (!task?.date || task?.completed) return false;
    const todayKey = new Date().toISOString().slice(0, 10);
    return task.date < todayKey;
  }, [task]);

  const borderAccent = isComplete ? "border-l-emerald-500" : "border-l-rose-500";

  const handleClose = () => {
    if (task) {
      onUpdateTask({
        ...task,
        text: draftTitle.trim() || task.text,
        notes: draftNotes,
      });
    }
    onClose();
  };

  const handleToggleComplete = () => {
    if (!task) return;
    onUpdateTask({
      ...task,
      completed: !task.completed,
    });
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div
        className={`flex h-[80vh] w-[600px] max-w-[90vw] flex-col rounded-2xl border border-slate-800 border-l-4 bg-slate-900 shadow-2xl ${borderAccent}`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
          <input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            className="w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-slate-500"
            placeholder="Untitled task"
          />
          <button
            type="button"
            onClick={handleToggleComplete}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
              isComplete
                ? "bg-emerald-500/20 text-emerald-300"
                : isOverdue
                  ? "bg-rose-500/20 text-rose-300"
                  : "bg-slate-800 text-slate-200"
            }`}
          >
            {isComplete ? "Completed" : "Mark Complete"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 transition-colors hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col px-6 py-4">
          <textarea
            value={draftNotes}
            onChange={(event) => setDraftNotes(event.target.value)}
            placeholder="Add details, sub-tasks, or brain dump here..."
            className="h-full w-full flex-1 resize-none bg-transparent text-lg leading-relaxed text-slate-300 outline-none placeholder:text-slate-500"
            style={{ whiteSpace: "pre-wrap" }}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskFocusModal;
