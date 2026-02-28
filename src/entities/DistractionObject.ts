import * as THREE from 'three';
import { Game } from '../core/Game.js';
import { InteractiveObject } from './InteractiveObject.js';

export enum DistractionType {
  COFFEE_CUP = 'coffee_cup',
  BOOK = 'book',
  PHONE = 'phone',
  STAPLER = 'stapler',
  PAPERS = 'papers'
}

interface ThrowableState {
  isHeld: boolean;
  isThrown: boolean;
  velocity: THREE.Vector3;
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  throwTime: number;
  totalThrowTime: number;
}

/**
 * DistractionObject - Items that can be picked up and thrown to distract Louis
 */
export class DistractionObject extends InteractiveObject {
  private type: DistractionType;
  private state: ThrowableState;
  private noiseRadius: number = 10;
  private noiseDuration: number = 3;
  
  // Physics
  private arcHeight: number = 2;

  constructor(game: Game, position: THREE.Vector3, type: DistractionType) {
    const mesh = new THREE.Group();
    super(game, mesh);
    
    this.type = type;
    this.state = {
      isHeld: false,
      isThrown: false,
      velocity: new THREE.Vector3(),
      startPosition: new THREE.Vector3(),
      targetPosition: new THREE.Vector3(),
      throwTime: 0,
      totalThrowTime: 0
    };
    
    this.mesh.position.copy(position);
    this.createVisuals();
    this.updatePrompt();
  }

  private createVisuals(): void {
    switch (this.type) {
      case DistractionType.COFFEE_CUP:
        this.createCoffeeCup();
        break;
      case DistractionType.BOOK:
        this.createBook();
        break;
      case DistractionType.PHONE:
        this.createPhone();
        break;
      case DistractionType.STAPLER:
        this.createStapler();
        break;
      case DistractionType.PAPERS:
        this.createPapers();
        break;
    }
  }

  private createCoffeeCup(): void {
    const group = this.mesh as THREE.Group;
    
    // Cup
    const cupGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.15, 16);
    const cupMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.3
    });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.y = 0.075;
    cup.castShadow = true;
    group.add(cup);
    
    // Handle
    const handleGeo = new THREE.TorusGeometry(0.04, 0.01, 8, 16, Math.PI);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.08, 0.08, 0);
    handle.rotation.z = -Math.PI / 2;
    group.add(handle);
    
    // Coffee liquid
    const coffeeGeo = new THREE.CircleGeometry(0.07, 16);
    const coffeeMat = new THREE.MeshBasicMaterial({ color: 0x3d2314 });
    const coffee = new THREE.Mesh(coffeeGeo, coffeeMat);
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.14;
    group.add(coffee);
    
    this.noiseRadius = 8;
  }

  private createBook(): void {
    const group = this.mesh as THREE.Group;
    
    // Cover
    const coverMat = new THREE.MeshStandardMaterial({ 
      color: [0x8b0000, 0x006400, 0x00008b, 0x654321][Math.floor(Math.random() * 4)],
      roughness: 0.7
    });
    
    const bookGeo = new THREE.BoxGeometry(0.3, 0.05, 0.4);
    const book = new THREE.Mesh(bookGeo, coverMat);
    book.position.y = 0.025;
    book.castShadow = true;
    group.add(book);
    
    // Pages
    const pagesGeo = new THREE.BoxGeometry(0.28, 0.04, 0.38);
    const pagesMat = new THREE.MeshStandardMaterial({ color: 0xfff8dc });
    const pages = new THREE.Mesh(pagesGeo, pagesMat);
    pages.position.y = 0.025;
    group.add(pages);
    
    this.noiseRadius = 10;
    this.arcHeight = 1.5;
  }

  private createPhone(): void {
    const group = this.mesh as THREE.Group;
    
    // Body
    const bodyGeo = new THREE.BoxGeometry(0.08, 0.01, 0.15);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x111111,
      metalness: 0.8,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.005;
    body.castShadow = true;
    group.add(body);
    
    // Screen
    const screenGeo = new THREE.PlaneGeometry(0.07, 0.12);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.rotation.x = -Math.PI / 2;
    screen.position.y = 0.011;
    group.add(screen);
    
    this.noiseRadius = 12; // Phone rings louder!
  }

  private createStapler(): void {
    const group = this.mesh as THREE.Group;
    
    const staplerMat = new THREE.MeshStandardMaterial({ 
      color: 0xcc0000,
      metalness: 0.3,
      roughness: 0.4
    });
    
    const bodyGeo = new THREE.BoxGeometry(0.15, 0.06, 0.08);
    const body = new THREE.Mesh(bodyGeo, staplerMat);
    body.position.y = 0.03;
    body.castShadow = true;
    group.add(body);
    
    this.noiseRadius = 6;
    this.arcHeight = 1;
  }

  private createPapers(): void {
    const group = this.mesh as THREE.Group;
    
    // Multiple paper sheets
    const paperMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.9
    });
    
    for (let i = 0; i < 5; i++) {
      const paperGeo = new THREE.PlaneGeometry(0.3, 0.4);
      const paper = new THREE.Mesh(paperGeo, paperMat);
      paper.rotation.x = -Math.PI / 2;
      paper.rotation.z = Math.random() * 0.5;
      paper.position.set(
        (Math.random() - 0.5) * 0.1,
        0.005 + i * 0.002,
        (Math.random() - 0.5) * 0.1
      );
      paper.receiveShadow = true;
      group.add(paper);
    }
    
    this.noiseRadius = 5;
    this.arcHeight = 0.8;
  }

  interact(): void {
    if (this.state.isThrown) return;
    
    if (!this.state.isHeld) {
      this.pickUp();
    }
    // Note: Throwing is handled by mouse click, not E key
  }

  private pickUp(): void {
    this.state.isHeld = true;
    this.interactionRadius = 100; // Can throw from far
    this.updatePrompt();
    
    console.log(`📦 Picked up ${this.type}`);
    
    // Position in front of player (will be updated in update())
    this.mesh.scale.set(0.5, 0.5, 0.5); // Smaller when held
  }

  public throw(): void {
    if (!this.state.isHeld) return;
    
    this.state.isHeld = false;
    this.state.isThrown = true;
    this.state.startPosition.copy(this.mesh.position);
    this.state.throwTime = 0;
    this.state.totalThrowTime = 0.8; // seconds
    
    // Calculate throw target based on camera direction
    const camera = this.game.cameraController?.getCamera();
    if (camera) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      direction.y = 0;
      direction.normalize();
      
      // Target 5-8 meters in front
      const throwDistance = 5 + Math.random() * 3;
      this.state.targetPosition.copy(this.mesh.position)
        .add(direction.multiplyScalar(throwDistance));
    }
    
    this.interactionRadius = 2; // Reset
    this.updatePrompt();
    
    console.log(`💨 Threw ${this.type}!`);
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    
    if (this.state.isHeld) {
      this.updateHeldPosition();
    } else if (this.state.isThrown) {
      this.updateThrownPosition(deltaTime);
    }
  }

  private updateHeldPosition(): void {
    const player = this.game.player;
    if (!player) return;
    
    const playerPos = player.getPosition();
    const camera = this.game.cameraController?.getCamera();
    
    if (camera) {
      // Position in front of player, visible in view
      const offset = new THREE.Vector3(0.3, -0.2, -0.5);
      offset.applyQuaternion(camera.quaternion);
      
      this.mesh.position.copy(playerPos).add(offset);
      this.mesh.rotation.copy(camera.rotation);
    }
  }

  private updateThrownPosition(deltaTime: number): void {
    this.state.throwTime += deltaTime;
    const progress = this.state.throwTime / this.state.totalThrowTime;
    
    if (progress >= 1) {
      // Landed
      this.onLand();
      return;
    }
    
    // Parabolic arc
    const currentPos = new THREE.Vector3().lerpVectors(
      this.state.startPosition,
      this.state.targetPosition,
      progress
    );
    
    // Add arc height
    const arcOffset = Math.sin(progress * Math.PI) * this.arcHeight;
    currentPos.y = Math.max(0, currentPos.y + arcOffset);
    
    this.mesh.position.copy(currentPos);
    
    // Rotate while flying
    this.mesh.rotation.x += deltaTime * 5;
    this.mesh.rotation.z += deltaTime * 3;
  }

  private onLand(): void {
    this.state.isThrown = false;
    this.mesh.position.y = 0.05; // On ground
    this.mesh.rotation.set(0, Math.random() * Math.PI, 0);
    this.mesh.scale.set(1, 1, 1);
    
    // Make noise!
    this.makeNoise();
    
    // Reset prompt
    this.updatePrompt();
  }

  private makeNoise(): void {
    console.log(`💥 ${this.type} landed with a noise! Radius: ${this.noiseRadius}m`);
    
    // Visual effect - ring
    this.createNoiseRing();
    
    // Alert Louis
    this.game.alertLouis(this.mesh.position, this.noiseRadius, this.noiseDuration);
    
    // Show floating text
    this.showFloatingText('THUD!');
  }

  private createNoiseRing(): void {
    const ringGeo = new THREE.RingGeometry(0.1, 0.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(this.mesh.position);
    ring.position.y = 0.1;
    ring.rotation.x = -Math.PI / 2;
    this.game.getScene()?.add(ring);
    
    // Animate and remove
    const startTime = Date.now();
    const duration = 1000;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        this.game.getScene()?.remove(ring);
        return;
      }
      
      const scale = 1 + progress * 20;
      ring.scale.set(scale, scale, scale);
      ring.material.opacity = 0.5 * (1 - progress);
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  private showFloatingText(text: string): void {
    // Create temporary text element
    const div = document.createElement('div');
    div.textContent = text;
    div.style.cssText = `
      position: fixed;
      color: #ffff00;
      font-weight: bold;
      font-size: 20px;
      pointer-events: none;
      text-shadow: 0 0 5px #000;
      z-index: 1000;
    `;
    
    // Position above object
    const vector = this.mesh.position.clone();
    vector.y += 1;
    vector.project(this.game.cameraController!.getCamera());
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    
    document.body.appendChild(div);
    
    // Remove after animation
    setTimeout(() => {
      div.remove();
    }, 1000);
  }

  private updatePrompt(): void {
    if (this.state.isHeld) {
      // When held, show no prompt (throw is handled by mouse)
      this.prompt = { text: '', key: '' };
      this.isInteractable = false;
    } else if (this.state.isThrown) {
      this.prompt = { text: '', key: '' };
      this.isInteractable = false;
    } else {
      this.prompt = { text: `Pick up ${this.type.replace('_', ' ')}`, key: 'E' };
      this.isInteractable = true;
    }
  }

  /**
   * Check if object is currently held by player
   */
  isHeld(): boolean {
    return this.state.isHeld;
  }

  /**
   * Drop the item (called when hiding, etc.)
   */
  drop(): void {
    if (this.state.isHeld) {
      this.state.isHeld = false;
      this.mesh.scale.set(1, 1, 1);
      this.mesh.position.y = 0.05;
      this.updatePrompt();
    }
  }
}
