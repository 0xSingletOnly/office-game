import * as THREE from 'three';
import { Game } from '../core/Game.js';
import { InteractiveObject } from './InteractiveObject.js';

export enum HidingSpotType {
  BATHROOM_STALL = 'bathroom_stall',
  CLOSET = 'closet',
  UNDER_DESK = 'under_desk',
  BOOKSHELF = 'bookshelf',
  LOCKER = 'locker'
}

/**
 * HidingSpot - Places where Mike can hide from Louis
 */
export class HidingSpot extends InteractiveObject {
  private type: HidingSpotType;
  private isOccupied: boolean = false;
  private occupant: 'player' | null = null;
  
  // Visual elements
  private doorMesh?: THREE.Mesh;
  
  // Hiding properties
  private readonly HIDE_TIME: number = 0.5; // Seconds to hide/unhide
  private readonly MAX_HIDE_TIME: number = 10; // Maximum time allowed in hiding spot
  private readonly WARNING_TIME: number = 3; // Show warning when this many seconds left
  private transitionTimer: number = 0;
  private isTransitioning: boolean = false;
  private hideTimer: number = 0; // Time spent hiding
  private isWarningShown: boolean = false;
  private hasBeenUsed: boolean = false; // Track if spot has been used

  constructor(game: Game, position: THREE.Vector3, type: HidingSpotType) {
    // Create base mesh
    const mesh = new THREE.Group();
    super(game, mesh);
    
    this.type = type;
    this.mesh.position.copy(position);
    
    // Create visual based on type
    this.createVisuals();
    
    // Set prompt
    this.updatePrompt();
  }

  private createVisuals(): void {
    const group = this.mesh as THREE.Group;
    
    switch (this.type) {
      case HidingSpotType.BATHROOM_STALL:
        this.createBathroomStall(group);
        break;
      case HidingSpotType.CLOSET:
        this.createCloset(group);
        break;
      case HidingSpotType.UNDER_DESK:
        this.createUnderDesk(group);
        break;
      case HidingSpotType.BOOKSHELF:
        this.createBookshelfGap(group);
        break;
      case HidingSpotType.LOCKER:
        this.createLocker(group);
        break;
    }
  }

  private createBathroomStall(group: THREE.Group): void {
    const wallMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xe0e0e0,
    });
    
    // Side walls
    const sideWallGeo = new THREE.BoxGeometry(0.1, 2.5, 1.5);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMaterial);
    leftWall.position.set(-0.5, 1.25, 0);
    leftWall.castShadow = true;
    group.add(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeo, wallMaterial);
    rightWall.position.set(0.5, 1.25, 0);
    rightWall.castShadow = true;
    group.add(rightWall);
    
    // Back wall
    const backWallGeo = new THREE.BoxGeometry(1.1, 2.5, 0.1);
    const backWall = new THREE.Mesh(backWallGeo, wallMaterial);
    backWall.position.set(0, 1.25, -0.7);
    backWall.castShadow = true;
    group.add(backWall);
    
    // Door (interactive)
    const doorGeo = new THREE.BoxGeometry(1.1, 2.5, 0.1);
    const doorMat = new THREE.MeshLambertMaterial({ 
      color: 0xcccccc,
    });
    this.doorMesh = new THREE.Mesh(doorGeo, doorMat);
    this.doorMesh.position.set(0, 1.25, 0.7);
    this.doorMesh.castShadow = true;
    group.add(this.doorMesh);
    
    // Door handle
    const handleGeo = new THREE.SphereGeometry(0.05);
    const handleMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.3, 1.2, 0.75);
    group.add(handle);
    
    this.interactionRadius = 1.5;
  }

  private createCloset(group: THREE.Group): void {
    const closetMat = new THREE.MeshLambertMaterial({ 
      color: 0x6b5038,
    });
    
    // Frame
    // Create as hollow - just sides
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 1.5), closetMat);
    left.position.set(-0.7, 1.5, 0);
    left.castShadow = true;
    group.add(left);
    
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 1.5), closetMat);
    right.position.set(0.7, 1.5, 0);
    right.castShadow = true;
    group.add(right);
    
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 0.1), closetMat);
    back.position.set(0, 1.5, -0.7);
    back.castShadow = true;
    group.add(back);
    
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.5), closetMat);
    top.position.set(0, 2.95, 0);
    top.castShadow = true;
    group.add(top);
    
    // Sliding doors
    const doorGeo = new THREE.BoxGeometry(0.7, 2.9, 0.05);
    const doorMat = new THREE.MeshLambertMaterial({ 
      color: 0x7a6048,
    });
    
    this.doorMesh = new THREE.Mesh(doorGeo, doorMat);
    this.doorMesh.position.set(0, 1.45, 0.7);
    this.doorMesh.castShadow = true;
    group.add(this.doorMesh);
    
    this.interactionRadius = 1.5;
  }

  private createUnderDesk(group: THREE.Group): void {
    // Just a visual indicator (the desk itself is already in the map)
    const mat = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3
    });
    const indicator = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.1, 0.6),
      mat
    );
    indicator.position.set(0, 0.05, 0);
    group.add(indicator);
    
    this.interactionRadius = 1.2;
  }

  private createBookshelfGap(group: THREE.Group): void {
    // Visual indicator between bookshelves
    const mat = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3
    });
    const indicator = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.5, 0.8),
      mat
    );
    indicator.position.set(0, 0.75, 0);
    group.add(indicator);
    
    this.interactionRadius = 1.5;
  }

  private createLocker(group: THREE.Group): void {
    const lockerMat = new THREE.MeshLambertMaterial({ 
      color: 0x888888,
    });
    
    // Locker body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 2, 0.8),
      lockerMat
    );
    body.position.set(0, 1, 0);
    body.castShadow = true;
    group.add(body);
    
    // Door
    this.doorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.9, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x999999 })
    );
    this.doorMesh.position.set(0, 1, 0.4);
    this.doorMesh.castShadow = true;
    group.add(this.doorMesh);
    
    // Vents
    for (let i = 0; i < 3; i++) {
      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.05, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x333333 })
      );
      vent.position.set(0, 1.5 - i * 0.15, 0.43);
      group.add(vent);
    }
    
    this.interactionRadius = 1.2;
  }

  interact(): void {
    if (this.isTransitioning) return;
    
    // Check if spot has already been used
    if (!this.isOccupied && this.hasBeenUsed) {
      console.log(`🚫 Cannot hide in ${this.type} - already used!`);
      this.game.showNotification('You cannot hide here again!');
      return;
    }
    
    if (!this.isOccupied) {
      this.hidePlayer();
    } else if (this.occupant === 'player') {
      this.unhidePlayer();
    }
  }

  private hidePlayer(): void {
    const player = this.game.player;
    if (!player) return;
    
    console.log(`🚪 Player is hiding in ${this.type}! (10 second limit)`);
    
    this.isOccupied = true;
    this.occupant = 'player';
    this.isTransitioning = true;
    this.hideTimer = 0; // Reset hide timer
    this.isWarningShown = false;
    
    // Hide player from AI detection
    
    // Move player inside
    const hidePosition = this.getHidePosition();
    player.setPosition(hidePosition.x, hidePosition.y, hidePosition.z);
    
    // Hide player mesh (make invisible)
    player.getMesh().visible = false;
    
    // Close door animation
    this.animateDoor(true);
    
    // Update prompt
    this.updatePrompt();
    
    // Start transition timer
    this.transitionTimer = 0;
    
    // Show "HIDDEN" UI
    this.game.setHiddenState(true);
    
    // Mark as used
    this.hasBeenUsed = true;
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, this.HIDE_TIME * 1000);
  }

  private unhidePlayer(): void {
    console.log(`🚪 Player exited hiding spot! (was hidden for ${this.hideTimer.toFixed(1)}s)`);
    
    this.isOccupied = false;
    this.occupant = null;
    this.isTransitioning = true;
    this.hideTimer = 0; // Reset timer
    this.isWarningShown = false;
    
    // Show player mesh
    if (this.game.player) {
      this.game.player.getMesh().visible = true;
    }
    
    // Open door animation
    this.animateDoor(false);
    
    // Move player to exit position
    const exitPosition = this.getExitPosition();
    this.game.player?.setPosition(exitPosition.x, exitPosition.y, exitPosition.z);
    
    // Update prompt
    this.updatePrompt();
    
    // Hide "HIDDEN" UI
    this.game.setHiddenState(false);
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, this.HIDE_TIME * 1000);
  }

  private animateDoor(close: boolean): void {
    if (!this.doorMesh) return;
    
    // Simple animation - could be tweened
    const targetRotation = close ? 0 : Math.PI / 2;
    this.doorMesh.rotation.y = targetRotation;
  }

  private getHidePosition(): THREE.Vector3 {
    // Position inside the hiding spot
    return new THREE.Vector3(
      this.mesh.position.x,
      this.type === HidingSpotType.UNDER_DESK ? 0.5 : 1,
      this.mesh.position.z
    );
  }

  private getExitPosition(): THREE.Vector3 {
    // Position just outside the hiding spot
    const offset = new THREE.Vector3(0, 0, 1.5);
    return this.mesh.position.clone().add(offset);
  }



  /**
   * Check if player is currently hidden in this spot
   */
  isPlayerHidden(): boolean {
    return this.isOccupied && this.occupant === 'player';
  }

  /**
   * Get the type of hiding spot
   */
  getType(): HidingSpotType {
    return this.type;
  }
  
  /**
   * Check if this hiding spot has been used before
   */
  isUsed(): boolean {
    return this.hasBeenUsed;
  }
  
  /**
   * Reset the used state (for game restart)
   */
  resetUsedState(): void {
    this.hasBeenUsed = false;
  }
  
  /**
   * Update the interaction prompt based on state
   */
  private updatePrompt(): void {
    if (this.isOccupied && this.occupant === 'player') {
      this.prompt = { text: 'Exit', key: 'E' };
    } else if (this.hasBeenUsed) {
      this.prompt = { text: 'Used', key: 'X' };
    } else {
      this.prompt = { text: 'Hide', key: 'E' };
    }
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Update transition
    if (this.isTransitioning) {
      this.transitionTimer += deltaTime;
    }
    
    // Update hide timer if player is hidden
    if (this.isOccupied && this.occupant === 'player') {
      this.hideTimer += deltaTime;
      
      // Show warning when time is running low
      const timeRemaining = this.MAX_HIDE_TIME - this.hideTimer;
      if (timeRemaining <= this.WARNING_TIME && timeRemaining > 0 && !this.isWarningShown) {
        this.showTimeWarning(timeRemaining);
        this.isWarningShown = true;
      }
      
      // Force exit when time is up
      if (this.hideTimer >= this.MAX_HIDE_TIME) {
        console.log('⏰ Hide time expired! Forcing exit...');
        this.forceExit();
      }
    }
  }
  
  /**
   * Show warning that hide time is running out
   */
  private showTimeWarning(secondsLeft: number): void {
    console.log(`⚠️ Hiding time running out! ${secondsLeft.toFixed(1)}s remaining!`);
    this.game.showHidingWarning(secondsLeft);
  }
  
  /**
   * Force player to exit hiding spot (time limit reached)
   */
  private forceExit(): void {
    this.unhidePlayer();
    this.game.showNotification('You were forced out! Hide time expired.');
  }
}
