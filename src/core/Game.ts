import * as THREE from 'three';
import { InputManager } from './InputManager.js';
import { CameraController } from './CameraController.js';
import { CollisionSystem } from './CollisionSystem.js';
import { Player } from '../entities/Player.js';
import { OfficeMap } from '../entities/OfficeMap.js';
import { LouisAI } from '../entities/LouisAI.js';
import { HUD } from '../ui/HUD.js';
import { InteractiveObject } from '../entities/InteractiveObject.js';
import { ExitZone } from '../entities/ExitZone.js';
import { PS1Renderer } from './PS1Renderer.js';
import { AudioManager } from '../audio/AudioManager.js';

export class Game {
  private container: HTMLElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private ps1Renderer: PS1Renderer | null = null;
  private scene: THREE.Scene | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  
  // Game systems
  public inputManager: InputManager | null = null;
  public cameraController: CameraController | null = null;
  public collisionSystem: CollisionSystem | null = null;
  
  // Game entities
  public player: Player | null = null;
  public officeMap: OfficeMap | null = null;
  public louis: LouisAI | null = null;
  public exitZone: ExitZone | null = null;
  
  // UI
  public hud: HUD | null = null;
  
  // Audio
  public audioManager: AudioManager = new AudioManager();
  
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
    
    // Initialize renderer with PS1 settings (no antialias for retro feel)
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Force pixel ratio to 1 for consistent pixelation
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    // Use basic shadow map for sharper, more retro shadows
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    // Initialize PS1 post-processing renderer
    // pixelScale: 1.5 = subtle pixelation (retro feel without nausea)
    // colorDepth: 48 = more color gradations for smoother look
    // vertexSnap: 2 = minimal vertex snapping
    this.ps1Renderer = new PS1Renderer(this.renderer, 1.5, 48, true, 2);
    
    // Initialize scene with PS1-style colors - bright for visibility
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a2a4a);
    // Light fog for atmosphere without darkness
    this.scene.fog = new THREE.Fog(0x2a2a4a, 20, 60);
    
    // Initialize game systems
    this.inputManager = new InputManager();
    this.cameraController = new CameraController();
    this.collisionSystem = new CollisionSystem();
    
    // Initialize UI
    this.hud = new HUD();
    
    // Initialize office map with collision system
    this.officeMap = new OfficeMap(this.scene, this, this.collisionSystem);
    this.officeMap.build();
    
    // Initialize entities (after map is built so collision system is populated)
    this.player = new Player(this);
    this.player.setCollisionSystem(this.collisionSystem);
    this.louis = new LouisAI(this);
    
    // Setup camera to follow player
    if (this.cameraController && this.player) {
      this.cameraController.setTarget(this.player.getMesh());
    }
    
    // Setup interactive objects
    this.setupInteractiveObjects();
    
    // Create exit zone
    this.exitZone = new ExitZone(this, new THREE.Vector3(0, 0, 18));
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Initialize audio (preload the soundtrack)
    this.initAudio();
    
    console.log('🎮 Game initialized! Click "Start" to begin.');
  }
  
  private async initAudio(): Promise<void> {
    await this.audioManager.init();
    await this.audioManager.loadBGM('/audio/Greenback_Boogie_-_Theme_from_the_TV_Suits_(mp3.pm).mp3');
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
  
  async start(): Promise<void> {
    this.requestPointerLock();
    this.isRunning = true;
    
    // Start playing the soundtrack
    this.audioManager.resume();
    this.audioManager.playBGM(true);
    
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
    
    // Handle audio mute toggle
    this.handleAudioControls();
    
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
  
  private handleAudioControls(): void {
    // M key to toggle mute
    if (this.inputManager?.isKeyJustPressed('m')) {
      const isMuted = this.audioManager.toggleMute();
      this.hud?.showNotification(isMuted ? '🔇 Music Muted' : '🔊 Music Unmuted');
      this.hud?.setMuteIndicator(isMuted);
    }
  }
  
  /**
   * Show/hide hidden indicator in HUD
   */
  setHiddenState(hidden: boolean): void {
    this.hud?.showHiddenIndicator(hidden);
  }
  
  /**
   * Show warning that hiding time is running out
   */
  showHidingWarning(secondsLeft: number): void {
    this.hud?.showHidingWarning(secondsLeft);
  }
  
  /**
   * Show a notification message
   */
  showNotification(message: string): void {
    this.hud?.showNotification(message);
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
    
    // Use PS1 renderer for retro effect
    if (this.ps1Renderer) {
      this.ps1Renderer.render(this.scene, this.cameraController.getCamera());
    } else {
      this.renderer.render(this.scene, this.cameraController.getCamera());
    }
  }
  
  private onWindowResize(): void {
    if (!this.renderer || !this.cameraController) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.renderer.setSize(width, height);
    this.ps1Renderer?.onWindowResize(width, height);
    this.cameraController.onWindowResize(width, height);
  }
  
  public getScene(): THREE.Scene | null {
    return this.scene;
  }
  
  public stop(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    document.exitPointerLock();
    this.audioManager.stopBGM();
  }
  
  public dispose(): void {
    this.stop();
    this.ps1Renderer?.dispose();
    this.renderer?.dispose();
    this.inputManager?.dispose();
    
    // Clean up interactive objects
    this.interactiveObjects.forEach(obj => obj.dispose());
    this.interactiveObjects = [];
    
    // Clean up exit zone
    this.exitZone?.dispose();
  }
}
