/**
 * Generic State Machine for AI behavior
 * Can be used for Louis AI and potentially other entities
 */

export interface State<T> {
  name: string;
  enter?(entity: T): void;
  execute(entity: T, deltaTime: number): void;
  exit?(entity: T): void;
}

export class StateMachine<T> {
  private entity: T;
  private states: Map<string, State<T>> = new Map();
  private currentState: State<T> | null = null;
  private previousState: State<T> | null = null;
  private globalState: State<T> | null = null;

  constructor(entity: T) {
    this.entity = entity;
  }

  addState(state: State<T>): void {
    this.states.set(state.name, state);
  }

  setCurrentState(stateName: string): void {
    const newState = this.states.get(stateName);
    if (!newState) {
      console.warn(`State ${stateName} not found!`);
      return;
    }

    // Exit current state
    if (this.currentState) {
      this.currentState.exit?.(this.entity);
    }

    // Store previous state
    this.previousState = this.currentState;

    // Enter new state
    this.currentState = newState;
    this.currentState.enter?.(this.entity);

    console.log(`🤖 State changed: ${this.previousState?.name || 'None'} → ${stateName}`);
  }

  setGlobalState(stateName: string): void {
    const state = this.states.get(stateName);
    if (state) {
      this.globalState = state;
    }
  }

  update(deltaTime: number): void {
    // Execute global state first
    if (this.globalState) {
      this.globalState.execute(this.entity, deltaTime);
    }

    // Execute current state
    if (this.currentState) {
      this.currentState.execute(this.entity, deltaTime);
    }
  }

  getCurrentState(): State<T> | null {
    return this.currentState;
  }

  getCurrentStateName(): string | null {
    return this.currentState?.name || null;
  }

  getPreviousState(): State<T> | null {
    return this.previousState;
  }

  revertToPreviousState(): void {
    if (this.previousState) {
      this.setCurrentState(this.previousState.name);
    }
  }

  isInState(stateName: string): boolean {
    return this.currentState?.name === stateName;
  }
}
