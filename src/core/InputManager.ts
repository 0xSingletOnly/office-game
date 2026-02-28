export class InputManager {
  // Movement keys
  private keys: Map<string, boolean> = new Map();
  
  // Mouse
  private mouseDelta: { x: number; y: number } = { x: 0, y: 0 };
  private mouseSensitivity: number = 0.002;
  
  // Action states
  private justPressed: Set<string> = new Set();
  private previousKeys: Map<string, boolean> = new Map();
  
  // Mouse buttons
  private mouseButtons: Map<number, boolean> = new Map();
  private justClicked: Set<number> = new Set();
  private previousMouseButtons: Map<number, boolean> = new Map();
  
  constructor() {
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    // Mouse movement (for pointer lock)
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    
    // Mouse buttons
    window.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
  }
  
  private onMouseDown(event: MouseEvent): void {
    this.mouseButtons.set(event.button, true);
  }
  
  private onMouseUp(event: MouseEvent): void {
    this.mouseButtons.set(event.button, false);
  }
  
  private onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.keys.set(key, true);
    
    // Prevent default for game keys to avoid page scrolling
    if (['w', 'a', 's', 'd', 'e', 'shift', ' ', 'm'].includes(key)) {
      event.preventDefault();
    }
  }
  
  private onKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.keys.set(key, false);
  }
  
  private onMouseMove(event: MouseEvent): void {
    // Only process mouse movement when pointer is locked
    if (document.pointerLockElement) {
      this.mouseDelta.x += event.movementX * this.mouseSensitivity;
      this.mouseDelta.y += event.movementY * this.mouseSensitivity;
    }
  }
  
  /**
   * Called once per frame to update action states
   */
  update(): void {
    // Track just pressed keys
    this.justPressed.clear();
    
    for (const [key, isPressed] of this.keys) {
      const wasPressed = this.previousKeys.get(key) || false;
      if (isPressed && !wasPressed) {
        this.justPressed.add(key);
      }
      this.previousKeys.set(key, isPressed);
    }
    
    // Track just clicked mouse buttons
    this.justClicked.clear();
    
    for (const [button, isPressed] of this.mouseButtons) {
      const wasPressed = this.previousMouseButtons.get(button) || false;
      if (isPressed && !wasPressed) {
        this.justClicked.add(button);
      }
      this.previousMouseButtons.set(button, isPressed);
    }
  }
  
  // Movement input
  isMovingForward(): boolean {
    return this.keys.get('w') || false;
  }
  
  isMovingBackward(): boolean {
    return this.keys.get('s') || false;
  }
  
  isMovingLeft(): boolean {
    return this.keys.get('a') || false;
  }
  
  isMovingRight(): boolean {
    return this.keys.get('d') || false;
  }
  
  isSprinting(): boolean {
    return this.keys.get('shift') || false;
  }
  
  isCrouching(): boolean {
    return this.keys.get('c') || false;
  }
  
  // Actions
  isInteracting(): boolean {
    return this.justPressed.has('e');
  }
  
  isAttacking(): boolean {
    return this.justClicked.has(0); // Left mouse button
  }
  
  // Mouse input
  getMouseDelta(): { x: number; y: number } {
    return { ...this.mouseDelta };
  }
  
  resetMouseDelta(): void {
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
  }
  
  // General key check
  isKeyPressed(key: string): boolean {
    return this.keys.get(key.toLowerCase()) || false;
  }
  
  isKeyJustPressed(key: string): boolean {
    return this.justPressed.has(key.toLowerCase());
  }
  
  // Get movement vector (normalized)
  getMovementVector(): { x: number; z: number } {
    let x = 0;
    let z = 0;
    
    if (this.isMovingForward()) z -= 1;
    if (this.isMovingBackward()) z += 1;
    if (this.isMovingLeft()) x -= 1;
    if (this.isMovingRight()) x += 1;
    
    // Normalize diagonal movement
    if (x !== 0 && z !== 0) {
      const length = Math.sqrt(x * x + z * z);
      x /= length;
      z /= length;
    }
    
    return { x, z };
  }
  
  dispose(): void {
    // Cleanup if needed
  }
}
