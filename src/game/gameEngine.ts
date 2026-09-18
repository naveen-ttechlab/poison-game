import type { GameState, GameAction } from '../types/game';
import { STARTING_HP } from '../types/game';
import type { PlayerId } from '../types/player';
import { createEmptyKnowledge } from '../types/clue';
import { TOOL_DEFINITIONS } from '../types/item';
import { SeededRandom, deriveRng, nextId, randomSeed } from '../utils/random';
import { assertValidCups } from '../utils/validation';
import { getCupById, revealCup, unrevealedCups } from './cupManager';
import { generateClue } from './clueEngine';
import { resolveDetector, resolveSpoon, removeTool, findToolInstance } from './itemEngine';
import { decideAiAction, generateAiDialogue } from './aiEngine';
import { startRound, isRoundOver, isMatchOver, matchWinner } from './roundManager';

function otherPlayer(id: PlayerId): PlayerId {
  return id === 'player' ? 'ai' : 'player';
}

function pushEvent(
  state: GameState,
  actor: PlayerId,
  type: GameState['history'][number]['type'],
  text: string,
  silent = false,
): GameState {
  return { ...state, history: [...state.history, { id: nextId('evt'), round: state.round, type, actor, text, silent }] };
}

function withNextRng(state: GameState): [SeededRandom, GameState] {
  const rng = deriveRng(state.seed, state.rngCursor);
  return [rng, { ...state, rngCursor: state.rngCursor + 1 }];
}

export function createNewMatch(seed: string = randomSeed()): GameState {
  const base: GameState = {
    seed,
    rngCursor: 0,
    round: 0,
    turnCount: 0,
    cups: [],
    players: {
      player: { id: 'player', name: 'You', hp: STARTING_HP, inventory: [] },
      ai: { id: 'ai', name: 'The Opponent', hp: STARTING_HP, inventory: [] },
    },
    currentPlayer: 'player',
    phase: 'awaiting_action',
    pendingToolType: null,
    pendingTargets: [],
    pendingDrinkCupId: null,
    pendingUseAntidote: false,
    playerKnowledge: { player: createEmptyKnowledge(), ai: createEmptyKnowledge() },
    clues: [],
    history: [],
    winner: null,
    aiDialogue: null,
    lastDrinkResult: null,
  };
  const [rng, withCursor] = withNextRng(base);
  return startRound(withCursor, rng);
}

/** Ends the current player's turn, hands control to the other player, occasionally
 * trickles a fresh clue to whoever is up next, and lets the AI say something when
 * it's about to become the human's turn. Does NOT check round/match end — callers
 * that can trigger those (drinking) check first and skip this instead. */
function endTurn(state: GameState): GameState {
  const [rng, withCursor] = withNextRng(state);
  const nextPlayer = otherPlayer(withCursor.currentPlayer);
  let next: GameState = {
    ...withCursor,
    currentPlayer: nextPlayer,
    phase: 'awaiting_action',
    pendingToolType: null,
    pendingTargets: [],
    pendingDrinkCupId: null,
    pendingUseAntidote: false,
    turnCount: withCursor.turnCount + 1,
    aiDialogue: null,
    // Clear the last drink result once its turn is truly over — otherwise the
    // camera rig keeps reading a stale drinkingCupId and stays zoomed in on the
    // cup forever instead of returning to the default view.
    lastDrinkResult: null,
  };

  if (next.turnCount % 3 === 0) {
    const clue = generateClue(next.cups, next.round, rng, [nextPlayer]);
    if (clue) {
      next = {
        ...next,
        clues: [...next.clues, clue],
        playerKnowledge: {
          ...next.playerKnowledge,
          [nextPlayer]: { facts: [...next.playerKnowledge[nextPlayer].facts, clue] },
        },
      };
    }
  }

  if (nextPlayer === 'player') {
    const line = generateAiDialogue(next, rng);
    next = { ...next, aiDialogue: line };
  }

  return next;
}

function handleSelectTool(state: GameState, player: PlayerId, toolInstanceId: string): GameState {
  if (state.phase !== 'awaiting_action' || state.currentPlayer !== player) return state;
  const tool = findToolInstance(state.players[player].inventory, toolInstanceId);
  if (!tool || tool.type === 'antidote') return state; // antidote is only used at drink time, not a standalone action
  const required = TOOL_DEFINITIONS[tool.type].targetsRequired;
  if (required === 0) return resolveTool(state, player, tool.type, []); // e.g. Skip — nothing to target, resolves immediately
  if (unrevealedCups(state.cups).length < required) return state; // not enough cups left to target
  return {
    ...state,
    phase: 'awaiting_targets',
    pendingToolType: tool.type,
    pendingTargets: [],
  };
}

function handleTargetCup(state: GameState, player: PlayerId, cupId: string): GameState {
  if (state.phase !== 'awaiting_targets' || state.currentPlayer !== player || !state.pendingToolType) return state;
  const cup = getCupById(state.cups, cupId);
  if (cup.isRevealed || state.pendingTargets.includes(cupId)) return state;

  const targets = [...state.pendingTargets, cupId];
  const required = TOOL_DEFINITIONS[state.pendingToolType].targetsRequired;
  if (targets.length < required) {
    return { ...state, pendingTargets: targets };
  }

  return resolveTool(state, player, state.pendingToolType, targets);
}

function resolveTool(state: GameState, player: PlayerId, toolType: NonNullable<GameState['pendingToolType']>, targets: string[]): GameState {
  const toolInstance = state.players[player].inventory.find((t) => t.type === toolType);
  if (!toolInstance) return state; // defensive — should be unreachable
  const inventoryAfter = removeTool(state.players[player].inventory, toolInstance.instanceId);
  let next: GameState = {
    ...state,
    players: { ...state.players, [player]: { ...state.players[player], inventory: inventoryAfter } },
  };

  if (toolType === 'detector') {
    const fact = { ...resolveDetector(next.cups, targets[0], next.round), revealedTo: [player] as PlayerId[] };
    next = {
      ...next,
      clues: [...next.clues, fact],
      playerKnowledge: { ...next.playerKnowledge, [player]: { facts: [...next.playerKnowledge[player].facts, fact] } },
    };
    next = pushEvent(next, player, 'tool_use', `${player === 'player' ? 'You' : 'The opponent'} used the Poison Detector.`, true);
  } else if (toolType === 'spoon') {
    const fact = { ...resolveSpoon(next.cups, targets[0], targets[1], next.round), revealedTo: [player] as PlayerId[] };
    next = {
      ...next,
      clues: [...next.clues, fact],
      playerKnowledge: { ...next.playerKnowledge, [player]: { facts: [...next.playerKnowledge[player].facts, fact] } },
    };
    next = pushEvent(next, player, 'tool_use', `${player === 'player' ? 'You' : 'The opponent'} used the Spoon.`, true);
  } else if (toolType === 'skip') {
    next = pushEvent(next, player, 'tool_use', `${player === 'player' ? 'You' : 'The opponent'} skipped the turn.`);
    // Unlike Detector/Spoon, Skip ends the turn outright instead of returning
    // control to the same player — it's the escape valve from the "must drink"
    // rule, not a free investigative sub-action.
    const ended = endTurn(next);
    return isRoundOver(ended) ? { ...ended, phase: 'round_end' } : ended;
  }

  // Using an investigative tool (Detector/Spoon) is a free sub-action, not a full
  // turn — the same player keeps acting (use more tools, or drink) until they
  // actually drink or skip.
  return { ...next, phase: 'awaiting_action', pendingToolType: null, pendingTargets: [] };
}

function handleSelectDrinkCup(state: GameState, player: PlayerId, cupId: string): GameState {
  if (state.phase !== 'awaiting_action' || state.currentPlayer !== player) return state;
  const cup = getCupById(state.cups, cupId);
  if (cup.isRevealed) return state;
  // pendingUseAntidote is intentionally NOT reset here — it's armed from the tools
  // panel before a cup is even picked, and should carry through into the dialog.
  return { ...state, phase: 'confirm_drink', pendingDrinkCupId: cupId };
}

function handleToggleAntidote(state: GameState, player: PlayerId): GameState {
  if (state.currentPlayer !== player) return state;
  // Arming/disarming the antidote happens from the Your Tools panel, which is only
  // interactive during awaiting_action — but also allow it while the drink dialog
  // is open in case a cup was already picked before the player decided.
  if (state.phase !== 'awaiting_action' && state.phase !== 'confirm_drink') return state;
  const hasAntidote = state.players[player].inventory.some((t) => t.type === 'antidote');
  if (!hasAntidote) return state;
  return { ...state, pendingUseAntidote: !state.pendingUseAntidote };
}

function handleConfirmDrink(state: GameState, player: PlayerId): GameState {
  if (state.phase !== 'confirm_drink' || state.currentPlayer !== player || !state.pendingDrinkCupId) return state;
  const cup = getCupById(state.cups, state.pendingDrinkCupId);
  const antidoteInstance = state.pendingUseAntidote
    ? state.players[player].inventory.find((t) => t.type === 'antidote')
    : undefined;
  const antidoteUsed = Boolean(antidoteInstance);
  const survivedByAntidote = cup.isPoison && antidoteUsed;

  let next = state;
  if (antidoteInstance) {
    const inventoryAfter = removeTool(next.players[player].inventory, antidoteInstance.instanceId);
    next = { ...next, players: { ...next.players, [player]: { ...next.players[player], inventory: inventoryAfter } } };
  }

  return {
    ...next,
    phase: 'drinking',
    lastDrinkResult: { cupId: cup.id, wasPoison: cup.isPoison, survivedByAntidote, drinker: player },
  };
}

function handleCancel(state: GameState, player: PlayerId): GameState {
  if (state.currentPlayer !== player) return state;
  if (state.phase !== 'awaiting_targets' && state.phase !== 'confirm_drink') return state;
  // pendingUseAntidote is deliberately left alone — it's armed independently from
  // the tools panel, so backing out of a tool selection or a drink decision
  // shouldn't disarm it.
  return {
    ...state,
    phase: 'awaiting_action',
    pendingToolType: null,
    pendingTargets: [],
    pendingDrinkCupId: null,
  };
}

function handleDrinkAnimationDone(state: GameState): GameState {
  if (state.phase !== 'drinking' || !state.lastDrinkResult) return state;
  const { cupId, wasPoison, survivedByAntidote, drinker } = state.lastDrinkResult;
  const cups = revealCup(state.cups, cupId);
  assertValidCups(cups);
  const cup = getCupById(cups, cupId);

  let players = state.players;
  if (wasPoison && !survivedByAntidote) {
    players = { ...players, [drinker]: { ...players[drinker], hp: players[drinker].hp - 1 } };
  }

  const who = drinker === 'player' ? 'You' : 'The opponent';
  const resultText = wasPoison
    ? survivedByAntidote
      ? `${who} drank Cup ${cup.displayNumber} — POISON, but the antidote saved ${drinker === 'player' ? 'you' : 'them'}.`
      : `${who} drank Cup ${cup.displayNumber} — POISON.`
    : `${who} drank Cup ${cup.displayNumber} — safe.`;

  let next: GameState = { ...state, cups, players };
  next = pushEvent(next, drinker, 'reveal', resultText);

  if (isMatchOver(next)) {
    next = pushEvent(next, drinker, 'match_end', 'The match is over.');
    return { ...next, phase: 'match_end', winner: matchWinner(next) };
  }
  if (isRoundOver(next)) {
    next = pushEvent(next, drinker, 'round_end', `Round ${next.round} is over.`);
    return { ...next, phase: 'round_end' };
  }

  return endTurn(next);
}

const AI_MAX_SUB_ACTIONS = 8; // safety cap — bounded anyway by inventory size (max 4 tools)

/** Resolves the AI's entire turn in one go: it may use several tools in sequence
 * (each is a free sub-action now, same as for the human player), then must drink to
 * end its turn. Done as a loop within a single dispatch rather than relying on a
 * React effect to re-trigger — currentPlayer/phase can return to the exact same
 * values between sub-actions, which wouldn't reliably re-fire an effect. */
function handleAiTurn(state: GameState): GameState {
  if (state.currentPlayer !== 'ai' || state.phase !== 'awaiting_action') return state;

  let current = state;
  for (let i = 0; i < AI_MAX_SUB_ACTIONS; i++) {
    const [rng, withCursor] = withNextRng(current);
    current = withCursor;
    const decision = decideAiAction(current, rng);

    if (decision.action === 'use_tool') {
      const result = handleSelectTool(current, 'ai', decision.toolInstanceId);
      if (result.phase === 'awaiting_targets') {
        let targeted = result;
        for (const cupId of decision.targets) {
          targeted = handleTargetCup(targeted, 'ai', cupId);
        }
        current = targeted;
        continue;
      }
      if (result.currentPlayer !== 'ai') return result; // zero-target tool (Skip) resolved and ended the turn
      if (result === current) break; // selecting the tool failed — fall through to forced drink
      current = result;
      continue;
    }

    const afterSelect = handleSelectDrinkCup(current, 'ai', decision.cupId);
    const afterAntidote = decision.useAntidote ? handleToggleAntidote(afterSelect, 'ai') : afterSelect;
    return handleConfirmDrink(afterAntidote, 'ai');
  }

  // Exhausted the safety cap without drinking (shouldn't happen) — force a drink so
  // the match can never stall on the AI's turn.
  const unrevealed = unrevealedCups(current.cups);
  if (unrevealed.length === 0) return current;
  const fallbackCup = unrevealed[0];
  return handleConfirmDrink(handleSelectDrinkCup(current, 'ai', fallbackCup.id), 'ai');
}

function handleAdvanceRound(state: GameState): GameState {
  if (state.phase !== 'round_end') return state;
  const [rng, withCursor] = withNextRng(state);
  return startRound(withCursor, rng);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.kind) {
    case 'new_match':
      return createNewMatch(action.seed);
    case 'select_tool':
      return handleSelectTool(state, action.player, action.toolInstanceId);
    case 'target_cup':
      return handleTargetCup(state, action.player, action.cupId);
    case 'select_drink_cup':
      return handleSelectDrinkCup(state, action.player, action.cupId);
    case 'toggle_antidote':
      return handleToggleAntidote(state, action.player);
    case 'confirm_drink':
      return handleConfirmDrink(state, action.player);
    case 'cancel':
      return handleCancel(state, action.player);
    case 'drink_animation_done':
      return handleDrinkAnimationDone(state);
    case 'ai_turn':
      return handleAiTurn(state);
    case 'advance_round':
      return handleAdvanceRound(state);
    default:
      return state;
  }
}

export function unrevealedCupIds(state: GameState): string[] {
  return unrevealedCups(state.cups).map((c) => c.id);
}
