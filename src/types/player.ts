export type PlayerId = 'player' | 'ai';

export type ToolType = 'detector' | 'spoon' | 'skip' | 'antidote';

export interface ToolInstance {
  instanceId: string;
  type: ToolType;
}

export const MAX_INVENTORY = 4;

export interface Player {
  id: PlayerId;
  name: string;
  hp: number;
  inventory: ToolInstance[];
}

export type AiPersonality = 'cautious' | 'aggressive' | 'desperate';
