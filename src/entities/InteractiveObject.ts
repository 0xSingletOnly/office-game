import * as THREE from 'three';
import { Game } from '../core/Game.js';

export interface InteractionPrompt {
  text: string;
  key: string;
}

export abstract class InteractiveObject {
  protected game: Game;
  protected mesh: THREE.Object3D;
  protected interactionRadius: number = 2;
  protected prompt: InteractionPrompt = { text: 'Interact', key: 'E' };
  protected isInteractable: boolean = true;

  constructor(game: Game, mesh: THREE.Object3D) {
    this.game = game;
    this.mesh = mesh;
    
    // Add to scene
    game.getScene()?.add(this.mesh);
  }

  /**
   * Check if player is close enough to interact
   */
  canInteract(playerPosition: THREE.Vector3): boolean {
    if (!this.isInteractable) return false;
    
    const distance = this.mesh.position.distanceTo(playerPosition);
    return distance <= this.interactionRadius;
  }

  /**
   * Perform the interaction
   */
  abstract interact(): void;

  /**
   * Get interaction prompt to display to player
   */
  getPrompt(): InteractionPrompt {
    return this.prompt;
  }

  /**
   * Update object state (called each frame)
   */
  update(_deltaTime: number): void {
    // Override in subclasses
  }

  /**
   * Get the 3D mesh
   */
  getMesh(): THREE.Object3D {
    return this.mesh;
  }

  /**
   * Get position
   */
  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  /**
   * Clean up when removing object
   */
  dispose(): void {
    this.game.getScene()?.remove(this.mesh);
  }
}
