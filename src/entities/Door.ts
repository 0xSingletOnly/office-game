import * as THREE from 'three';
import { Game } from '../core/Game.js';
import { InteractiveObject } from './InteractiveObject.js';

export enum DoorType {
  STANDARD = 'standard',
  GLASS = 'glass',
  SLIDING = 'sliding',
  DOUBLE = 'double'
}

/**
 * Door - Interactive doors that can be opened/closed
 */
export class Door extends InteractiveObject {
  private type: DoorType;
  private isOpen: boolean = false;
  private isLocked: boolean = false;
  private doorMesh: THREE.Group;
  
  // Animation
  private isAnimating: boolean = false;
  private animationProgress: number = 0;
  private readonly ANIMATION_DURATION = 0.5;
  
  // Door properties
  private width: number;
  private height: number;
  private openAngle: number = Math.PI / 2;

  constructor(
    game: Game, 
    position: THREE.Vector3, 
    rotation: number = 0,
    type: DoorType = DoorType.STANDARD,
    width: number = 1.2,
    height: number = 2.5
  ) {
    const mesh = new THREE.Group();
    super(game, mesh);
    
    this.type = type;
    this.width = width;
    this.height = height;
    this.doorMesh = new THREE.Group();
    
    this.mesh.position.copy(position);
    this.mesh.rotation.y = rotation;
    
    this.createVisuals();
    this.updatePrompt();
  }

  private createVisuals(): void {
    const group = this.mesh as THREE.Group;
    
    // Door frame
    const frameMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4a4a4a,
      roughness: 0.7 
    });
    
    // Frame sides
    const frameThickness = 0.1;
    const frameDepth = 0.15;
    
    // Left frame
    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, this.height, frameDepth),
      frameMaterial
    );
    leftFrame.position.set(-this.width/2 - frameThickness/2, this.height/2, 0);
    leftFrame.castShadow = true;
    group.add(leftFrame);
    
    // Right frame
    const rightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, this.height, frameDepth),
      frameMaterial
    );
    rightFrame.position.set(this.width/2 + frameThickness/2, this.height/2, 0);
    rightFrame.castShadow = true;
    group.add(rightFrame);
    
    // Top frame
    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(this.width + frameThickness * 2, frameThickness, frameDepth),
      frameMaterial
    );
    topFrame.position.set(0, this.height + frameThickness/2, 0);
    topFrame.castShadow = true;
    group.add(topFrame);
    
    // Create door based on type
    switch (this.type) {
      case DoorType.STANDARD:
        this.createStandardDoor();
        break;
      case DoorType.GLASS:
        this.createGlassDoor();
        break;
      case DoorType.SLIDING:
        this.createSlidingDoor();
        break;
      case DoorType.DOUBLE:
        this.createDoubleDoor();
        break;
    }
    
    // Position door mesh at hinge
    this.doorMesh.position.set(-this.width/2, 0, 0);
    group.add(this.doorMesh);
  }

  private createStandardDoor(): void {
    const doorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,  // Wood color
      roughness: 0.6 
    });
    
    // Main door panel
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(this.width, this.height, 0.08),
      doorMaterial
    );
    panel.position.set(this.width/2, this.height/2, 0);
    panel.castShadow = true;
    this.doorMesh.add(panel);
    
    // Door handle
    const handleMat = new THREE.MeshStandardMaterial({ 
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.2 
    });
    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.05),
      handleMat
    );
    handle.position.set(this.width - 0.15, this.height/2, 0.08);
    this.doorMesh.add(handle);
    
    // Decorative panels (6 rectangles)
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x6b350b });
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const decorPanel = new THREE.Mesh(
          new THREE.BoxGeometry(this.width * 0.35, this.height * 0.22, 0.02),
          panelMat
        );
        decorPanel.position.set(
          this.width * 0.25 + col * this.width * 0.45,
          this.height * 0.2 + row * this.height * 0.28,
          0.05
        );
        this.doorMesh.add(decorPanel);
      }
    }
  }

  private createGlassDoor(): void {
    // Frame
    const frameMat = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      metalness: 0.5,
      roughness: 0.5 
    });
    
    // Top and bottom frames
    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(this.width, 0.1, 0.06),
      frameMat
    );
    topFrame.position.set(this.width/2, this.height - 0.05, 0);
    this.doorMesh.add(topFrame);
    
    const bottomFrame = new THREE.Mesh(
      new THREE.BoxGeometry(this.width, 0.1, 0.06),
      frameMat
    );
    bottomFrame.position.set(this.width/2, 0.05, 0);
    this.doorMesh.add(bottomFrame);
    
    // Side frames
    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, this.height - 0.2, 0.06),
      frameMat
    );
    leftFrame.position.set(0.025, this.height/2, 0);
    this.doorMesh.add(leftFrame);
    
    const rightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, this.height - 0.2, 0.06),
      frameMat
    );
    rightFrame.position.set(this.width - 0.025, this.height/2, 0);
    this.doorMesh.add(rightFrame);
    
    // Glass
    const glassMat = new THREE.MeshPhysicalMaterial({ 
      color: 0x88ccff,
      metalness: 0,
      roughness: 0,
      transmission: 0.9,
      transparent: true,
      opacity: 0.3
    });
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(this.width - 0.1, this.height - 0.2, 0.02),
      glassMat
    );
    glass.position.set(this.width/2, this.height/2, 0);
    this.doorMesh.add(glass);
    
    // Handle
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.3, 0.04),
      frameMat
    );
    handle.position.set(this.width - 0.1, this.height/2, 0.05);
    this.doorMesh.add(handle);
  }

  private createSlidingDoor(): void {
    // Similar to standard but slides instead of rotates
    const doorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x666666,
      metalness: 0.6,
      roughness: 0.4 
    });
    
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(this.width, this.height, 0.06),
      doorMaterial
    );
    panel.position.set(this.width/2, this.height/2, 0);
    panel.castShadow = true;
    this.doorMesh.add(panel);
    
    // Track
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const topTrack = new THREE.Mesh(
      new THREE.BoxGeometry(this.width * 2, 0.1, 0.1),
      trackMat
    );
    topTrack.position.set(this.width/2, this.height + 0.05, 0);
    this.mesh.add(topTrack);
  }

  private createDoubleDoor(): void {
    // Create two standard doors that open from center
    // For simplicity, treat as one wide door for now
    this.createStandardDoor();
  }

  interact(): void {
    if (this.isAnimating || this.isLocked) return;
    
    this.isOpen = !this.isOpen;
    this.isAnimating = true;
    this.animationProgress = 0;
    
    console.log(`🚪 Door ${this.isOpen ? 'opened' : 'closed'}`);
    
    this.updatePrompt();
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Animate door
    if (this.isAnimating) {
      this.animationProgress += deltaTime / this.ANIMATION_DURATION;
      
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.isAnimating = false;
      }
      
      // Apply animation
      if (this.type === DoorType.SLIDING) {
        // Slide door
        const targetX = this.isOpen ? -this.width/2 : 0;
        const startX = this.isOpen ? 0 : -this.width/2;
        const currentX = startX + (targetX - startX) * this.easeOutCubic(this.animationProgress);
        this.doorMesh.position.x = currentX;
      } else {
        // Rotate door
        const targetAngle = this.isOpen ? this.openAngle : 0;
        const startAngle = this.isOpen ? 0 : this.openAngle;
        const currentAngle = startAngle + (targetAngle - startAngle) * this.easeOutCubic(this.animationProgress);
        this.doorMesh.rotation.y = currentAngle;
      }
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private updatePrompt(): void {
    if (this.isLocked) {
      this.prompt = { text: 'Locked', key: '🔒' };
    } else {
      this.prompt = { 
        text: this.isOpen ? 'Close' : 'Open', 
        key: 'E' 
      };
    }
  }

  /**
   * Lock/unlock the door
   */
  setLocked(locked: boolean): void {
    this.isLocked = locked;
    this.updatePrompt();
  }

  /**
   * Check if door is locked
   */
  getLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Check if door is open
   */
  getIsOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Force set door state (for game events)
   */
  forceSetOpen(open: boolean): void {
    if (this.isLocked && open) return;
    
    this.isOpen = open;
    this.isAnimating = true;
    this.animationProgress = 0;
    this.updatePrompt();
  }
}
