import type { ToolType } from './player';

export interface ToolDefinition {
  type: ToolType;
  name: string;
  icon: string;
  description: string;
  targetsRequired: 0 | 1 | 2;
}

export const TOOL_DEFINITIONS: Record<ToolType, ToolDefinition> = {
  detector: {
    type: 'detector',
    name: 'Poison Detector',
    icon: '🔍',
    description: 'Reveal whether one cup is SAFE or POISON.',
    targetsRequired: 1,
  },
  spoon: {
    type: 'spoon',
    name: 'Spoon',
    icon: '🥄',
    description: 'Compare two cups: SAME LIQUID or DIFFERENT LIQUID.',
    targetsRequired: 2,
  },
  skip: {
    type: 'skip',
    name: 'Skip Turn',
    icon: '⏭️',
    description: 'End your turn immediately, without drinking.',
    targetsRequired: 0,
  },
  antidote: {
    type: 'antidote',
    name: 'Antidote',
    icon: '🧪',
    description: 'Use right before drinking to survive if that cup is poison.',
    targetsRequired: 0,
  },
};
