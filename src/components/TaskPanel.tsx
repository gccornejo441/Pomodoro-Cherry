import React, { useState, useEffect } from 'react';
import styles from './TaskPanel.module.css';
import { Menu, Item, useContextMenu, RightSlot } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import { ReactComponent as TaskButton } from './assets/taskButton.svg';
import { ReactComponent as SaveButton } from './assets/saveButton.svg';
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates  } from '@dnd-kit/sortable';
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, closestCorners, DragOverEvent, UniqueIdentifier } from '@dnd-kit/core';
import TaskItem from './TaskItem';

const svgStyle = {
    width: '20px',
    height: '20px',
    fill: 'currentColor'
};

const MENU_ID = 'task-context-menu';

export interface Task {
    id: number;
    text: string;
    completed: boolean;
    favorite: boolean;
}

interface TaskPanelProps {
    setAskedForTask: React.Dispatch<React.SetStateAction<string>>;
    onClick: () => void;
}

const TaskPanel = ({ onClick, setAskedForTask }: TaskPanelProps) => {
    const { show } = useContextMenu({ id: MENU_ID });
    const [task, setTask] = useState<string>('');
    const [tasks, setTasks] = useState<Task[]>(() => {
        const savedTasks = localStorage.getItem('tasks');
        return savedTasks ? JSON.parse(savedTasks) : [];
    });
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [editId, setEditId] = useState<number | null>(null);
    const [editText, setEditText] = useState('');

    const handleDoubleClick = (event: React.MouseEvent, task: Task) => {
        event.preventDefault();
        setCurrentTask(task);
        show({
            id: MENU_ID,
            event: event as unknown as MouseEvent,
            props: {
                task
            }
        });
    };

    useEffect(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }, [tasks]);

    const addTask = () => {
        if (task.trim() !== '') {
            setTasks([...tasks, { id: Date.now(), text: task, completed: false, favorite: false }]);
            setTask('');
        }
    };

    const deleteTask = (id: number) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const startEdit = (task: Task | null) => {
        setEditId(task!.id);
        setEditText(task!.text);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditText(e.target.value);
    };

    const saveEdit = (id: number) => {
        const updatedTasks = tasks.map(t => t.id === id ? { ...t, text: editText } : t);
        setTasks(updatedTasks);
        setEditId(null);
        setEditText('');
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && (editId ? editText.trim() !== '' : task.trim() !== '')) {
            editId ? saveEdit(editId) : addTask();
        }
    };

    const toggleTaskCompletion = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const handleClickOnTask = (task: Task | null) => {
        onClick();
        setAskedForTask(task!.text);
    }

    const setAsFavorite = (id: number) => {
        const updatedTasks = tasks.map(task =>
            task.id === id ? { ...task, favorite: !task.favorite } : task
        );
        setTasks(updatedTasks);
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100,
                distance: 5,
            },               
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const getCurrentTaskPosition = (id: UniqueIdentifier | undefined) => tasks.findIndex((task) => task.id === id);

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
        <DndContext onDragEnd={handleOnDragEnd} sensors={sensors} collisionDetection={closestCorners}>
            <div className={styles.taskPanel}>
                <div className={styles.inputArea}>
                    <input
                        type="text"
                        placeholder={editId ? "Edit task" : "Add a task"}
                        value={editId ? editText : task}
                        onChange={editId ? handleEditChange : (e) => setTask(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className={styles.input}
                    />
                    <button
                        onClick={editId ? () => saveEdit(editId) : addTask}
                        className={editId ? styles.button : styles.button}
                        disabled={editId ? editText.trim() === '' : task.trim() === ''}>
                        {editId ? <SaveButton style={svgStyle} /> : <TaskButton style={svgStyle} />}
                    </button>
                </div>
                <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                    <ul className={styles.taskList}>
                        {tasks.map(task => (
                            <TaskItem key={task.id} task={task} toggleTaskCompletion={toggleTaskCompletion} handleDoubleClick={handleDoubleClick} />
                        ))}
                    </ul>
                </SortableContext>
                <Menu id={MENU_ID}>
                    <Item className={styles.contextMenuButton}
                        onClick={() => handleClickOnTask(currentTask)}>View</Item>
                    <Item
                        className={styles.contextMenuButton}
                        onClick={() => startEdit(currentTask)}>Edit</Item>
                    <Item className={styles.contextMenuButton}
                        onClick={() => currentTask && toggleTaskCompletion(currentTask.id)}>Set as {currentTask?.completed ? 'active' : 'completed'}</Item>
                    <Item className={styles.contextMenuButton} onClick={() => currentTask && setAsFavorite(currentTask.id)}>Set as important<RightSlot>⭐</RightSlot></Item>
                    <Item
                        className={styles.contextMenuButton}
                        onClick={() => currentTask && deleteTask(currentTask.id)}>Delete<RightSlot>CTRL + D</RightSlot></Item>
                </Menu>
            </div>
        </DndContext>
    );
}

export default TaskPanel;
