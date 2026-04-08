import { Task } from '../types';

export const calculateICE = (impact: number | null, confidence: number | null, ease: number | null): number => {
  return (impact || 0) * (confidence || 0) * (ease || 0);
};

export const calculateRICE = (reach: number | null, impact: number | null, confidence: number | null, effort: number | null): number => {
  if (!effort || effort === 0) return 0;
  return ((reach || 0) * (impact || 0) * (confidence || 0)) / effort;
};

export const calculateBRICE = (bv: number | null, reach: number | null, impact: number | null, confidence: number | null, effort: number | null): number => {
  if (!effort || effort === 0) return 0;
  return ((bv || 0) * (reach || 0) * (impact || 0) * (confidence || 0)) / effort;
};

export const getTaskScore = (task: Task, model?: 'ICE' | 'RICE' | 'BRICE'): number => {
  const activeModel = model || task.prioritization_model;

  switch (activeModel) {
    case 'ICE':
      return calculateICE(task.ice_impact || 0, task.ice_confidence || 0, task.ice_ease || 0);
    case 'RICE':
      return calculateRICE(task.rice_reach || 0, task.rice_impact || 0, task.rice_confidence || 0, task.rice_effort || 0);
    case 'BRICE':
      return calculateBRICE(
        task.brice_business_value || 0,
        task.brice_reach || 0,
        task.brice_impact || 0,
        task.brice_confidence || 0,
        task.brice_effort || 0
      );
    default:
      return 0;
  }
};
