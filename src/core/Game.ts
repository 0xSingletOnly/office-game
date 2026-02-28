import * as THREE from 'three';
import { InputManager } from './InputManager.js';
import { CameraController } from './CameraController.js';
import { Player } from '../entities/Player.js';
import { OfficeMap } from '../entities/OfficeMap.js';
import { LouisAI } from '../entities/LouisAI.js';
import { HUD } from '../ui/HUD.js';
import { InteractiveObject } from '../entities/InteractiveObject.js';
import { ExitZone } from '../entities/ExitZone.js';

export class Game {
  private container: HTMLElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  
  // Game systems
  public inputManager: InputManager | null = null;
  public cameraController: CameraController | null = null;
  
  // Game entities
  public player: Player | null = null;
  public officeMap: OfficeMap | null = null;
  public louis: LouisAI | null = null;
  public exitZone: ExitZone | null = null;
  
  // UI
  public hud: HUD | null = null;
  
  // Game state
  private gameTime: number = 180; // 3 minutes in seconds
  private isGameOver: boolean = false;
  private isRunning: boolean = false;
  
  // Interactive objects
  private interactiveObjects: InteractiveObject[] = [];
  private currentInteractable: InteractiveObject | null = null;
  private animationFrameId: number = 0;
  
  // UI elements
  private pointerLockUI: HTMLElement | null = null;
  private startBtn: HTMLElement | null = null;

  init(): void {
    // Get container
    this.container = document.getElementById('game-container');
    if (!this.container) {
      console.error('Game container not found!');
      return;
    }
    
    // Get UI elements
    this.pointerLockUI = document.getElementById('pointer-lock-ui');
    this.startBtn = document.getElementById('start-btn');
    
    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
    
    // Initialize game systems
    this.inputManager = new InputManager();
    this.cameraController = new CameraController();
    
    // Initialize UI
    this.hud = new HUD();
    
    // Initialize entities
    this.officeMap = new OfficeMap(this.scene, this);
    this.player = new Player(this);
    this.louis = new LouisAI(this);
    
    // Setup camera to follow player
    if (this.cameraController && this.player) {
      this.cameraController.setTarget(this.player.getMesh());
    }
    
    // Build the office environment with interactive objects
    this.officeMap.build();
    
    // Setup interactive objects
    this.setupInteractiveObjects();
    
    // Create exit zone
    this.exitZone = new ExitZone(this, new THREE.Vector3(0, 0, 18));
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    console.log('🎮 Game initialized! Click "Start" to begin.');
  }
  
  private setupEventListeners(): void {
    if (!this.startBtn) return;
    
    this.startBtn.addEventListener('click', () => {
      this.start();
    });
    
    // Also handle pointer lock change
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.renderer?.domElement) {
        this.pointerLockUI?.classList.add('hidden');
        this.isRunning = true;
      } else {
        this.pointerLockUI?.classList.remove('hidden');
        this.isRunning = false;
      }
    });
    
    // Click on canvas to resume
    this.renderer?.domElement.addEventListener('click', () => {
      if (!this.isRunning && this.pointerLockUI?.classList.contains('hidden')) {
        this.requestPointerLock();
      }
    });
  }
  
  start(): void {
    this.requestPointerLock();
    this.isRunning = true;
    this.gameLoop();
    console.log('🚀 Game started! Good luck, Mike!');
  }
  
  private requestPointerLock(): void {
    this.renderer?.domElement.requestPointerLock();
  }
  
  private gameLoop(): void {
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    
    if (!this.isRunning) return;
    
    const deltaTime = this.clock.getDelta();
    
    // Update all systems
    this.update(deltaTime);
    
    // Render
    this.render();
  }
  
  private update(deltaTime: number): void {
    if (this.isGameOver) return;
    
    // Update game timer
    this.gameTime -= deltaTime;
    if (this.gameTime <= 0) {
      this.onWin();
      return;
    }
    
    // Update input
    this.inputManager?.update();
    
    // Update player
    this.player?.update(deltaTime);
    
    // Update Louis AI
    this.louis?.update(deltaTime);
    
    // Update interactive objects
    this.interactiveObjects.forEach(obj => obj.update(deltaTime));
    
    // Update exit zone
    this.exitZone?.update(deltaTime);
    
    // Handle interactions
    this.handleInteractions();
    
    // Update camera
    this.cameraController?.update(deltaTime);
    
    // Update HUD
    this.updateHUD();
  }
  
  private setupInteractiveObjects(): void {
    // Get interactive objects from OfficeMap
    this.interactiveObjects = this.officeMap?.getInteractiveObjects() || [];
    console.log(`🎮 Created ${this.interactiveObjects.length} interactive objects`);
  }
  
  private handleInteractions(): void {
    if (!this.player) return;
    
    const playerPos = this.player.getPosition();
    let nearestObject: InteractiveObject | null = null;
    let nearestDist = Infinity;
    
    // Find nearest interactable object
    for (const obj of this.interactiveObjects) {
      if (obj.canInteract(playerPos)) {
        const dist = obj.getPosition().distanceTo(playerPos);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestObject = obj;
        }
      }
    }
    
    // Update current interactable and UI
    if (nearestObject !== this.currentInteractable) {
      this.currentInteractable = nearestObject;
      
      if (nearestObject) {
        const prompt = nearestObject.getPrompt();
        this.hud?.showInteractionPrompt(prompt.text, prompt.key);
      } else {
        this.hud?.hideInteractionPrompt();
      }
    }
    
    // Handle E key press for interaction
    if (this.inputManager?.isInteracting() && nearestObject) {
      nearestObject.interact();
    }
    
    // Handle mouse click for throwing
    if (this.inputManager?.isAttacking()) {
      this.handleThrow();
    }
  }
  
  private handleThrow(): void {
    // Find held distraction object
    for (const obj of this.interactiveObjects) {
      // Check if it's a DistractionObject and is held
      const distractionObj = obj as { isHeld?: () => boolean; throw?: () => void };
      if (distractionObj.isHeld && distractionObj.throw && distractionObj.isHeld()) {
        distractionObj.throw();
        break;
      }
    }
  }
  
  /**
   * Show/hide hidden indicator in HUD
   */
  setHiddenState(hidden: boolean): void {
    this.hud?.showHiddenIndicator(hidden);
  }
  
  /**
   * Alert Louis to investigate a noise/distraction
   */
  public alertLouis(position: THREE.Vector3, _radius: number, _duration: number): void {
    console.log(`🔔 Alerting Louis to noise at (${position.x.toFixed(1)}, ${position.z.toFixed(1)})`);
    
    // If Louis is not chasing, make him investigate
    const louisState = this.louis?.getState();
    if (louisState && !['CHASE', 'CAUGHT'].includes(louisState)) {
      // Set Louis's investigation target
      this.louis?.investigateNoise(position);
    }
  }
  
  private updateHUD(): void {
    if (!this.hud) return;
    
    // Update timer
    this.hud.setTimer(this.gameTime);
    
    // Update stamina
    if (this.player) {
      this.hud.setStamina(this.player.getStamina());
    }
    
    // Update Louis state
    if (this.louis) {
      this.hud.setLouisState(this.louis.getState() || 'UNKNOWN');
    }
  }
  
  public updateDetection(level: number): void {
    this.hud?.setDetectionLevel(level);
  }
  
  public onPlayerCaught(): void {
    this.isGameOver = true;
    this.hud?.showGameOver();
    this.stop();
  }
  
  private onWin(): void {
    this.isGameOver = true;
    this.hud?.showWin();
    this.stop();
  }
  
  /**
   * Called when player reaches the exit
   */
  onPlayerEscape(): void {
    this.isGameOver = true;
    this.hud?.showEscapeWin();
    this.stop();
  }
  
  private render(): void {
    if (!this.renderer || !this.scene || !this.cameraController) return;
    
    this.renderer.render(this.scene, this.cameraController.getCamera());
  }
  
  private onWindowResize(): void {
    if (!this.renderer || !this.cameraController) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.renderer.setSize(width, height);
    this.cameraController.onWindowResize(width, height);
  }
  
  public getScene(): THREE.Scene | null {
    return this.scene;
  }
  
  public stop(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    document.exitPointerLock();
  }
  
  public dispose(): void {
    this.stop();
    this.renderer?.dispose();
    this.inputManager?.dispose();
    
    // Clean up interactive objects
    this.interactiveObjects.forEach(obj => obj.dispose());
    this.interactiveObjects = [];
    
    // Clean up exit zone
    this.exitZone?.dispose();
  }
}
