import type { RollDirection, IInputState } from '../types';

export class InputManager implements IInputState {
  readonly keys: Record<string, boolean> = {};
  rollDirection: RollDirection | null = null;

  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onMouseDown: (e: MouseEvent) => void;
  private onContextMenu: (e: MouseEvent) => void;

  constructor() {
    this.onKeyDown = (e: KeyboardEvent) => {
      this.keys[e.code] = true;
    };
    this.onKeyUp = (e: KeyboardEvent) => {
      this.keys[e.code] = false;
    };
    this.onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        this.rollDirection = 'left';
      } else if (e.button === 2) {
        this.rollDirection = 'right';
      }
    };
    this.onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('contextmenu', this.onContextMenu);
  }

  consumeRollDirection(): RollDirection | null {
    const dir = this.rollDirection;
    this.rollDirection = null;
    return dir;
  }

  destroy(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('contextmenu', this.onContextMenu);
  }
}
