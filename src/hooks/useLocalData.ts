import { useState, useEffect } from 'react';
import type { Squad, TeamMember, Task, Sprint, SprintTask, TaskAssignment, ProductArea, AreaMetric } from '@/types';

interface LocalData {
  squads: Squad[];
  members: TeamMember[];
  tasks: Task[];
  sprints: Sprint[];
  sprintTasks: SprintTask[];
  taskAssignments: TaskAssignment[];
  productAreas: ProductArea[];
  areaMetrics: AreaMetric[];
}

const STORAGE_KEY = 'sprint-capacity-planner-data';

const getInitialData = (): LocalData => {
  // Initial Seed Data for Product Strategy
  const initialAreas: ProductArea[] = [
    { id: 1, name: 'Financial', icon: 'Wallet', health_score: 85, owner_id: null },
    { id: 2, name: 'Tasks', icon: 'CheckSquare', health_score: 45, owner_id: null },
    { id: 3, name: 'Pomodoro', icon: 'Timer', health_score: 92, owner_id: null },
    { id: 4, name: 'Habits', icon: 'Activity', health_score: 65, owner_id: null },
  ];

  // Generate some metrics for the last 30 days
  const initialMetrics: AreaMetric[] = [];
  const today = new Date();

  if (initialMetrics.length === 0) {
    initialAreas.forEach(area => {
      // Current state snapshot
      initialMetrics.push({
        id: Math.random(),
        area_id: area.id,
        metric_type: 'bug_count',
        value: area.id === 2 ? 12 : Math.floor(Math.random() * 5), // Tasks has bugs
        date: today.toISOString()
      });

      initialMetrics.push({
        id: Math.random(),
        area_id: area.id,
        metric_type: 'usage_rate',
        value: Math.floor(Math.random() * 40) + 40, // 40-80%
        date: today.toISOString()
      });
    });
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Ensure new fields exist for existing users
    return {
      ...parsed,
      productAreas: parsed.productAreas && parsed.productAreas.length > 0 ? parsed.productAreas : initialAreas,
      areaMetrics: parsed.areaMetrics && parsed.areaMetrics.length > 0 ? parsed.areaMetrics : initialMetrics,
    };
  }

  return {
    squads: [],
    members: [],
    tasks: [],
    sprints: [],
    sprintTasks: [],
    taskAssignments: [],
    productAreas: initialAreas,
    areaMetrics: initialMetrics,
  };
};

export const useLocalData = () => {
  const [data, setData] = useState<LocalData>(getInitialData);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addSquad = (squad: Omit<Squad, 'id' | 'created_at'>) => {
    const newSquad: Squad = {
      ...squad,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, squads: [...prev.squads, newSquad] }));
    return newSquad;
  };

  const addMember = (member: Omit<TeamMember, 'id' | 'created_at'>) => {
    const newMember: TeamMember = {
      ...member,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, members: [...prev.members, newMember] }));
    return newMember;
  };

  const addTask = (task: Omit<Task, 'id' | 'created_at'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now(),
      created_at: new Date().toISOString(),
      area_id: task.area_id || null // Ensure area_id is preserved
    };
    setData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    return newTask;
  };

  const addSprint = (sprint: Omit<Sprint, 'id' | 'created_at'>) => {
    const newSprint: Sprint = {
      ...sprint,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, sprints: [...prev.sprints, newSprint] }));
    return newSprint;
  };

  const updateSquad = (id: number, updates: Partial<Squad>) => {
    setData(prev => ({
      ...prev,
      squads: prev.squads.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  };

  const deleteSquad = (id: number) => {
    setData(prev => ({
      ...prev,
      squads: prev.squads.filter(s => s.id !== id),
      members: prev.members.filter(m => m.squad_id !== id),
    }));
  };

  const updateMember = (id: number, updates: Partial<TeamMember>) => {
    setData(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === id ? { ...m, ...updates } : m),
    }));
  };

  const deleteMember = (id: number) => {
    setData(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id),
      taskAssignments: prev.taskAssignments.filter(ta => ta.member_id !== id),
    }));
  };

  const updateTask = (id: number, updates: Partial<Task>) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  };

  const deleteTask = (id: number) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
      sprintTasks: prev.sprintTasks.filter(st => st.task_id !== id),
      taskAssignments: prev.taskAssignments.filter(ta => ta.task_id !== id),
    }));
  };

  const updateSprint = (id: number, updates: Partial<Sprint>) => {
    setData(prev => ({
      ...prev,
      sprints: prev.sprints.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  };

  const deleteSprint = (id: number) => {
    setData(prev => ({
      ...prev,
      sprints: prev.sprints.filter(s => s.id !== id),
      sprintTasks: prev.sprintTasks.filter(st => st.sprint_id !== id),
    }));
  };

  const addSprintTask = (sprintTask: Omit<SprintTask, 'id' | 'created_at'>) => {
    const newSprintTask: SprintTask = {
      ...sprintTask,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, sprintTasks: [...prev.sprintTasks, newSprintTask] }));
    return newSprintTask;
  };

  const removeSprintTask = (sprintId: number, taskId: number) => {
    setData(prev => ({
      ...prev,
      sprintTasks: prev.sprintTasks.filter(st => !(st.sprint_id === sprintId && st.task_id === taskId)),
    }));
  };

  return {
    data,
    addSquad,
    addMember,
    addTask,
    addSprint,
    updateSquad,
    deleteSquad,
    updateMember,
    deleteMember,
    updateTask,
    deleteTask,
    updateSprint,
    deleteSprint,
    addSprintTask,
    removeSprintTask,
  };
};
