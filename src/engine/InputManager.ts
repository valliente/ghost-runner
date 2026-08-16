export interface HotkeyActions {
  onTogglePause?: () => void;
  onToggleMute?: () => void;
  onReset?: () => void;
  onLapSplit?: () => void;
  onNitroBoost?: () => void;
}

export class InputManager {
  private actions: HotkeyActions;
  private isListening: boolean = false;
  private keyListener: (e: KeyboardEvent) => void;

  constructor(actions: HotkeyActions = {}) {
    this.actions = actions;
    this.keyListener = this.handleKeyDown.bind(this);
  }

  public startListening(): void {
    if (this.isListening || typeof window === 'undefined') return;
    window.addEventListener('keydown', this.keyListener);
    this.isListening = true;
  }

  public stopListening(): void {
    if (!this.isListening || typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.keyListener);
    this.isListening = false;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Ignore input if focused in text or file input
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (this.actions.onTogglePause) this.actions.onTogglePause();
        break;
      case 'KeyM':
        if (this.actions.onToggleMute) this.actions.onToggleMute();
        break;
      case 'KeyR':
        if (this.actions.onReset) this.actions.onReset();
        break;
      case 'KeyS':
        if (this.actions.onLapSplit) this.actions.onLapSplit();
        break;
      case 'KeyN':
      case 'ShiftLeft':
        if (this.actions.onNitroBoost) this.actions.onNitroBoost();
        break;
    }
  }

  public setActions(actions: Partial<HotkeyActions>): void {
    this.actions = { ...this.actions, ...actions };
  }
}
