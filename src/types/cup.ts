/**
 * A cup is a physical object with a persistent identity (`id`). Poison is bound to
 * that identity forever within a round — `positionIndex` is only where it currently
 * sits on the table and changes on swap, never `isPoison`.
 */
export interface Cup {
  id: string;
  /** Stable 1-6 label shown to players and used in clue text — fixed for the whole
   * round, unlike positionIndex, so a clue about "Cup 3" stays about the same
   * physical cup even after it's been swapped to a different table slot. */
  displayNumber: number;
  positionIndex: number; // 0-5, current table slot
  isPoison: boolean;
  isRevealed: boolean;
}
