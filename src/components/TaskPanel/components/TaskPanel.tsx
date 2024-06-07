import { useState } from "react";
import "react-contexify/dist/ReactContexify.css";
import styles from "../styles/TaskPanel.module.css";
import DeleteModal from "@components/DeleteModal";
import { Popup } from "@components/Popup";
import { Menu, Item, useContextMenu, Submenu } from "react-contexify";
import TaskButton from "@assets/taskIcon.svg?react";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverEvent,
  UniqueIdentifier,
  MouseSensor,
} from "@dnd-kit/core";
import { TaskPanelProps } from "../types/TaskTypes";
import TaskItem from "./TaskItem";
import TaskTitle from "./TaskTitle";
import { Task } from "@components/Sidebar";

const MENU_ID = "task-context-menu";

const TaskPanel = ({
  taskLists,
  isNewTaskOnTop,
  isMassDelete,
  handleDeleteAll,
  currentTask,
  setCurrentTask,
  onClick,
  setAskedForTask,
  tasks,
  setTasks,
  openTask,
  setOpenTask,
  currentSelectedTaskList,
  moveTaskToList,
}: TaskPanelProps) => {
  const { show } = useContextMenu({ id: MENU_ID });
  const [task, setTask] = useState<string>("");

  const handleDoubleClick = (event: React.MouseEvent, task: Task) => {
    event.preventDefault();
    setCurrentTask(task);
    show({
      id: MENU_ID,
      event: event as unknown as MouseEvent,
      props: {
        task,
      },
    });
  };

  const addTask = () => {
    if (task.trim() !== "") {
      const newTask = {
        id: Date.now(),
        text: task,
        completed: false,
        favorite: false,
        createdAt: new Date(),
      } as Task;
      setTasks(isNewTaskOnTop ? [newTask, ...tasks] : [...tasks, newTask]);
      setTask("");
    }
  };

  const saveEdit = (id: number, newText: string) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, text: newText } : t
    );
    setTasks(updatedTasks);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && task.trim() !== "") {
      addTask();
    }
  };

  const toggleTaskCompletion = (id: number) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleClickOnTask = (task: Task | null) => {
    onClick();
    setAskedForTask(task!.text);
  };

  const setAsFavorite = (id: number) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, favorite: !task.favorite } : task
    );
    setTasks(updatedTasks);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getCurrentTaskPosition = (id: UniqueIdentifier | undefined) =>
    tasks.findIndex((task) => task.id === id);

  const handleOnDragEnd = (event: DragOverEvent) => {
    const { active, over } = event;
    if (active.id === over?.id) return;

    setTasks((tasks) => {
      const firstPosition = getCurrentTaskPosition(active.id);
      const newPosition = getCurrentTaskPosition(over?.id);

      return arrayMove(tasks, firstPosition, newPosition);
    });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleOnDragEnd}
      collisionDetection={closestCorners}
    >
      <Popup onClose={() => setOpenTask(false)} isOpen={openTask}>
        <DeleteModal
          isMassDelete={isMassDelete}
          handleDelete={() => handleDeleteAll(true, isMassDelete)}
          handleCancel={() => setOpenTask(false)}
          item={currentTask?.text || "unknown"}
        />
      </Popup>
      <div className={styles.taskPanel}>
        <TaskTitle
          handleDeleteAll={handleDeleteAll}
          currentSelectedTaskList={currentSelectedTaskList}
          tasks={tasks}
        />
        <div className={styles.inputArea}>
          <input
            type="text"
            placeholder="What's your next task?"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.input}
          />
          <button
            onClick={addTask}
            className="controlButton"
            disabled={task.trim() === ""}
          >
            <TaskButton
              className={styles.svgStyle}
              style={{
                cursor: task.trim() === "" ? "not-allowed" : "inherit",
              }}
            />
          </button>
        </div>
        <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
          <ul className={styles.taskList}>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                toggleTaskCompletion={toggleTaskCompletion}
                handleDoubleClick={handleDoubleClick}
                saveEdit={saveEdit}
              />
            ))}
          </ul>
        </SortableContext>
        <Menu className={styles.contextMenuButton} id={MENU_ID}>
          <Item onClick={() => handleClickOnTask(currentTask)}>View</Item>
          <Submenu label="Move to">
            {taskLists.map((taskList) => (
              <Item
                key={taskList.id}
                onClick={() => moveTaskToList(currentTask!.id, taskList.id)}
              >
                {taskList.title}
              </Item>
            ))}
          </Submenu>
          <Item
            onClick={() => currentTask && toggleTaskCompletion(currentTask.id)}
          >
            Set as {currentTask?.completed ? "active" : "completed"}
          </Item>
          <Item onClick={() => currentTask && setAsFavorite(currentTask.id)}>
            Set as important
          </Item>
          <Item onClick={() => handleDeleteAll(false, false)}>Delete</Item>
        </Menu>
      </div>
    </DndContext>
  );
};

export default TaskPanel;
