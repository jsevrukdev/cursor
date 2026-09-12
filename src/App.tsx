import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import './App.css'

function App() {
  const tasks = useQuery(api.tasks.list)
  const createTask = useMutation(api.tasks.create)
  const toggleTask = useMutation(api.tasks.toggle)
  const removeTask = useMutation(api.tasks.remove)

  const [title, setTitle] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (trimmed.length === 0) return
    setTitle('')
    await createTask({ title: trimmed })
  }

  const remaining = tasks?.filter((task) => !task.completed).length ?? 0

  return (
    <main className="app">
      <header className="app__header">
        <h1>Convex Tasks</h1>
        <p className="app__subtitle">
          A real-time demo running on a local Convex backend + Vite/React.
        </p>
      </header>

      <form className="task-form" onSubmit={handleSubmit}>
        <input
          className="task-form__input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a new task..."
          aria-label="New task title"
        />
        <button className="task-form__button" type="submit">
          Add
        </button>
      </form>

      {tasks === undefined ? (
        <p className="app__status">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="app__status">No tasks yet. Add your first one above.</p>
      ) : (
        <>
          <ul className="task-list">
            {tasks.map((task) => (
              <li
                key={task._id}
                className={`task${task.completed ? ' task--done' : ''}`}
              >
                <label className="task__label">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(event) =>
                      void toggleTask({
                        taskId: task._id as Id<'tasks'>,
                        completed: event.target.checked,
                      })
                    }
                  />
                  <span className="task__title">{task.title}</span>
                </label>
                <button
                  className="task__delete"
                  onClick={() =>
                    void removeTask({ taskId: task._id as Id<'tasks'> })
                  }
                  aria-label={`Delete ${task.title}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <footer className="app__footer">
            {remaining} of {tasks.length} remaining
          </footer>
        </>
      )}
    </main>
  )
}

export default App
