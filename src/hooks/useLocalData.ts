import { useState, useEffect } from 'react';
import type { Squad, TeamMember, Task, Sprint, SprintTask, TaskAssignment } from '@/types';

interface LocalData {
  squads: Squad[];
  members: TeamMember[];
  tasks: Task[];
  sprints: Sprint[];
  sprintTasks: SprintTask[];
  taskAssignments: TaskAssignment[];
}

const STORAGE_KEY = 'sprint-capacity-planner-data';

const getInitialData = (): LocalData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    squads: [],
    members: [],
    tasks: [],
    sprints: [],
    sprintTasks: [],
    taskAssignments: [],
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
  };
};
