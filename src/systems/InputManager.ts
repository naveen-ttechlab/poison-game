export class InputManager {
  keys = new Set<string>();
  mouseDX = 0;
  mouseDY = 0;
  pointerLocked = false;
  private canvas: HTMLElement | null = null;
  onInteract: (() => void) | null = null;
  onToggleFlashlight: (() => void) | null = null;

  attach(canvas: HTMLElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    canvas.addEventListener('click', this.requestLock);
  }

  detach() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    this.canvas?.removeEventListener('click', this.requestLock);
  }

  requestLock = () => {
    this.canvas?.requestPointerLock();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
    if (e.code === 'KeyE') this.onInteract?.();
    if (e.code === 'KeyF') this.onToggleFlashlight?.();
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.pointerLocked) return;
    this.mouseDX += e.movementX;
    this.mouseDY += e.movementY;
  };

  private handlePointerLockChange = () => {
    this.pointerLocked = document.pointerLockElement === this.canvas;
  };

  consumeMouseDelta(): [number, number] {
    const d: [number, number] = [this.mouseDX, this.mouseDY];
    this.mouseDX = 0;
    this.mouseDY = 0;
    return d;
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  get forward(): number {
    return (this.isDown('KeyW') || this.isDown('ArrowUp') ? 1 : 0) - (this.isDown('KeyS') || this.isDown('ArrowDown') ? 1 : 0);
  }

  get right(): number {
    return (this.isDown('KeyD') || this.isDown('ArrowRight') ? 1 : 0) - (this.isDown('KeyA') || this.isDown('ArrowLeft') ? 1 : 0);
  }

  get sprint(): boolean {
    return this.isDown('ShiftLeft') || this.isDown('ShiftRight');
  }
}

export const inputManager = new InputManager();
