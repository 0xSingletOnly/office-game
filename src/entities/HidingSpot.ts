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
  private transitionTimer: number = 0;
  private isTransitioning: boolean = false;

  constructor(game: Game, position: THREE.Vector3, type: HidingSpotType) {
    // Create base mesh
    const mesh = new THREE.Group();
    super(game, mesh);
    
    this.type = type;
    this.mesh.position.copy(position);
    
    // Create visual based on type
    this.createVisuals();
    
    // Set prompt
    this.prompt = {
      text: this.isOccupied ? 'Exit' : 'Hide',
      key: 'E'
    };
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
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      roughness: 0.8 
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
    const doorMat = new THREE.MeshStandardMaterial({ 
      color: 0xaaaaaa,
      roughness: 0.6 
    });
    this.doorMesh = new THREE.Mesh(doorGeo, doorMat);
    this.doorMesh.position.set(0, 1.25, 0.7);
    this.doorMesh.castShadow = true;
    group.add(this.doorMesh);
    
    // Door handle
    const handleGeo = new THREE.SphereGeometry(0.05);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.3, 1.2, 0.75);
    group.add(handle);
    
    this.interactionRadius = 1.5;
  }

  private createCloset(group: THREE.Group): void {
    const closetMat = new THREE.MeshStandardMaterial({ 
      color: 0x4a3728,
      roughness: 0.9 
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
    const doorMat = new THREE.MeshStandardMaterial({ 
      color: 0x5a4738,
      roughness: 0.8 
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
    const lockerMat = new THREE.MeshStandardMaterial({ 
      color: 0x666666,
      metalness: 0.7,
      roughness: 0.3 
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
      new THREE.MeshStandardMaterial({ color: 0x777777 })
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
    
    if (!this.isOccupied) {
      this.hidePlayer();
    } else if (this.occupant === 'player') {
      this.unhidePlayer();
    }
  }

  private hidePlayer(): void {
    const player = this.game.player;
    if (!player) return;
    
    console.log(`🚪 Player is hiding in ${this.type}!`);
    
    this.isOccupied = true;
    this.occupant = 'player';
    this.isTransitioning = true;
    
    // Hide player from AI detection
    
    // Move player inside
    const hidePosition = this.getHidePosition();
    player.setPosition(hidePosition.x, hidePosition.y, hidePosition.z);
    
    // Hide player mesh (make invisible)
    player.getMesh().visible = false;
    
    // Close door animation
    this.animateDoor(true);
    
    // Update prompt
    this.prompt.text = 'Exit';
    
    // Start transition timer
    this.transitionTimer = 0;
    
    // Show "HIDDEN" UI
    this.showHiddenUI(true);
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, this.HIDE_TIME * 1000);
  }

  private unhidePlayer(): void {
    console.log(`🚪 Player exited hiding spot!`);
    
    this.isOccupied = false;
    this.occupant = null;
    this.isTransitioning = true;
    
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
    this.prompt.text = 'Hide';
    
    // Hide "HIDDEN" UI
    this.showHiddenUI(false);
    
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

  private showHiddenUI(show: boolean): void {
    // This will be handled by the HUD
    // For now, log to console
    if (show) {
      console.log('👁️ HIDDEN - Louis cannot see you!');
    }
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

  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Update transition
    if (this.isTransitioning) {
      this.transitionTimer += deltaTime;
    }
  }
}
