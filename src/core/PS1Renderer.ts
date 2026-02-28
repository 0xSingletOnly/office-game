import * as THREE from 'three';

/**
 * PS1Renderer - Post-processing effects to simulate PS1 graphics style
 * Features:
 * - Low resolution rendering with nearest neighbor upscaling
 * - Vertex snapping (simulating PS1 vertex precision)
 * - Color quantization (limited color depth)
 * - Dithering
 */

// Vertex shader for the post-processing quad
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader with PS1 effects (subtle version)
const fragmentShader = `
  uniform sampler2D tDiffuse;
  uniform vec2 resolution;
  uniform float pixelScale;
  uniform float colorDepth;
  uniform bool enableDithering;
  uniform float vertexSnap;
  
  varying vec2 vUv;
  
  // Bayer dither matrix (4x4)
  const float ditherMatrix[16] = float[](
    0.0, 8.0, 2.0, 10.0,
    12.0, 4.0, 14.0, 6.0,
    3.0, 11.0, 1.0, 9.0,
    15.0, 7.0, 13.0, 5.0
  );
  
  void main() {
    vec2 uv = vUv;
    
    // Vertex snap effect - very subtle by default
    if (vertexSnap > 0.0) {
      vec2 snap = vec2(vertexSnap) / resolution;
      uv = floor(uv / snap) * snap;
    }
    
    // Sample the texture
    vec4 color = texture2D(tDiffuse, uv);
    
    // Color quantization - blend between original and quantized for smoother look
    vec3 quantized = floor(color.rgb * colorDepth + 0.5) / colorDepth;
    vec3 finalColor = mix(color.rgb, quantized, 0.6); // Blend 60% quantized, 40% original
    
    // Apply subtle dithering only if enabled
    if (enableDithering) {
      vec2 pixelCoord = gl_FragCoord.xy;
      int index = int(mod(pixelCoord.x, 4.0)) + int(mod(pixelCoord.y, 4.0)) * 4;
      float threshold = ditherMatrix[index] / 16.0 - 0.5;
      
      // Very subtle dither (reduced from 0.5 to 0.25)
      finalColor += threshold * (1.0 / colorDepth) * 0.25;
      
      // Clamp to valid range
      finalColor = clamp(finalColor, 0.0, 1.0);
    }
    
    gl_FragColor = vec4(finalColor, color.a);
  }
`;

export class PS1Renderer {
  private renderer: THREE.WebGLRenderer;
  private renderTarget: THREE.WebGLRenderTarget;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private quad: THREE.Mesh;
  
  // PS1 settings
  private pixelScale: number;
  
  constructor(
    renderer: THREE.WebGLRenderer,
    pixelScale: number = 4, // Lower = more pixelated (e.g., 4 means render at 1/4 resolution)
    colorDepth: number = 32, // Number of color levels per channel
    enableDithering: boolean = true,
    vertexSnap: number = 16 // Vertex snap precision (higher = more snappy)
  ) {
    this.renderer = renderer;
    this.pixelScale = pixelScale;
    
    // Create low-resolution render target with nearest neighbor filtering
    const width = Math.max(1, Math.floor(window.innerWidth / pixelScale));
    const height = Math.max(1, Math.floor(window.innerHeight / pixelScale));
    
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false
    });
    
    // Create post-processing scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.renderTarget.texture },
        resolution: { value: new THREE.Vector2(width, height) },
        pixelScale: { value: pixelScale },
        colorDepth: { value: colorDepth },
        enableDithering: { value: enableDithering },
        vertexSnap: { value: vertexSnap }
      },
      vertexShader,
      fragmentShader
    });
    
    // Create full-screen quad
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.quad);
  }
  
  /**
   * Render the scene with PS1 effects
   * @param scene - The main 3D scene
   * @param camera - The camera to render with
   */
  render(scene: THREE.Scene, camera: THREE.Camera): void {
    // Render to low-res target
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(scene, camera);
    
    // Render the quad to screen with PS1 effects
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Handle window resize
   */
  onWindowResize(width: number, height: number): void {
    const targetWidth = Math.max(1, Math.floor(width / this.pixelScale));
    const targetHeight = Math.max(1, Math.floor(height / this.pixelScale));
    
    this.renderTarget.setSize(targetWidth, targetHeight);
    this.material.uniforms.resolution.value.set(targetWidth, targetHeight);
  }
  
  /**
   * Update PS1 effect parameters
   */
  setPixelScale(scale: number): void {
    this.pixelScale = scale;
    this.material.uniforms.pixelScale.value = scale;
    this.onWindowResize(window.innerWidth, window.innerHeight);
  }
  
  setColorDepth(depth: number): void {
    this.material.uniforms.colorDepth.value = depth;
  }
  
  setDithering(enabled: boolean): void {
    this.material.uniforms.enableDithering.value = enabled;
  }
  
  setVertexSnap(precision: number): void {
    this.material.uniforms.vertexSnap.value = precision;
  }
  
  /**
   * Get the low-resolution render target (for debugging)
   */
  getRenderTarget(): THREE.WebGLRenderTarget {
    return this.renderTarget;
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    this.renderTarget.dispose();
    this.material.dispose();
    (this.quad.geometry as THREE.BufferGeometry).dispose();
  }
}

/**
 * Helper function to modify materials for PS1-style flat shading
 */
export function createPS1Material(
  color: number,
  _roughness: number = 0.8,
  _metalness: number = 0.0
): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    color: color,
  });
}

/**
 * Helper to apply vertex snapping to a mesh's geometry
 * This simulates the PS1's lack of sub-pixel precision
 */
export function applyVertexSnap(geometry: THREE.BufferGeometry, snapSize: number = 0.01): void {
  const positionAttribute = geometry.attributes.position;
  const positions = positionAttribute.array as Float32Array;
  
  for (let i = 0; i < positions.length; i++) {
    positions[i] = Math.round(positions[i] / snapSize) * snapSize;
  }
  
  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals();
}
