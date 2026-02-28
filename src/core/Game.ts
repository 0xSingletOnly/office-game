import * as THREE from 'three';
import { InputManager } from './InputManager.js';
import { CameraController } from './CameraController.js';
import { Player } from '../entities/Player.js';
import { OfficeMap } from '../entities/OfficeMap.js';

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
  
  // Game state
  private isRunning: boolean = false;
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
    
    // Initialize entities
    this.officeMap = new OfficeMap(this.scene);
    this.player = new Player(this);
    
    // Setup camera to follow player
    if (this.cameraController && this.player) {
      this.cameraController.setTarget(this.player.getMesh());
    }
    
    // Build the office environment
    this.officeMap.build();
    
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
    // Update input
    this.inputManager?.update();
    
    // Update player
    this.player?.update(deltaTime);
    
    // Update camera
    this.cameraController?.update(deltaTime);
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
  }
}
