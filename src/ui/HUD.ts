/**
 * HUD - Heads Up Display
 * Shows detection meter, stamina, timer, and game status
 */

export class HUD {
  private container: HTMLElement;
  
  // UI Elements
  private detectionContainer!: HTMLElement;
  private detectionBar!: HTMLElement;
  private detectionText!: HTMLElement;
  
  private staminaContainer!: HTMLElement;
  private staminaBar!: HTMLElement;
  
  private timerElement!: HTMLElement;
  private louisStateElement!: HTMLElement;
  
  // Interaction prompt
  private interactionPrompt!: HTMLElement;
  private interactionKey!: HTMLElement;
  private interactionText!: HTMLElement;
  
  // Hidden indicator
  private hiddenIndicator!: HTMLElement;
  private hidingWarning!: HTMLElement;
  private notificationContainer!: HTMLElement;
  
  private gameOverScreen: HTMLElement | null = null;
  private winScreen: HTMLElement | null = null;
  private escapeScreen: HTMLElement | null = null;

  constructor() {
    this.container = document.getElementById('ui-layer')!;
    this.createHUD();
  }
  
  private createHUD(): void {
    // Detection Meter (only visible when detected)
    this.detectionContainer = document.createElement('div');
    this.detectionContainer.className = 'detection-meter';
    this.detectionContainer.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 300px;
      text-align: center;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    
    this.detectionText = document.createElement('div');
    this.detectionText.textContent = 'DETECTED';
    this.detectionText.style.cssText = `
      color: #ff0000;
      font-weight: bold;
      font-size: 18px;
      text-shadow: 0 0 10px #ff0000;
      margin-bottom: 5px;
    `;
    
    const detectionBg = document.createElement('div');
    detectionBg.style.cssText = `
      width: 100%;
      height: 20px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid #333;
      border-radius: 10px;
      overflow: hidden;
    `;
    
    this.detectionBar = document.createElement('div');
    this.detectionBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #ffff00, #ff0000);
      transition: width 0.1s linear;
    `;
    
    detectionBg.appendChild(this.detectionBar);
    this.detectionContainer.appendChild(this.detectionText);
    this.detectionContainer.appendChild(detectionBg);
    this.container.appendChild(this.detectionContainer);
    
    // Stamina Bar (bottom left)
    this.staminaContainer = document.createElement('div');
    this.staminaContainer.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 30px;
      width: 200px;
    `;
    
    const staminaLabel = document.createElement('div');
    staminaLabel.textContent = 'STAMINA';
    staminaLabel.style.cssText = `
      color: #fff;
      font-size: 12px;
      margin-bottom: 5px;
      text-shadow: 0 0 5px #000;
    `;
    
    const staminaBg = document.createElement('div');
    staminaBg.style.cssText = `
      width: 100%;
      height: 15px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid #c9a227;
      border-radius: 7px;
      overflow: hidden;
    `;
    
    this.staminaBar = document.createElement('div');
    this.staminaBar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #c9a227, #ffd700);
      transition: width 0.1s linear;
    `;
    
    staminaBg.appendChild(this.staminaBar);
    this.staminaContainer.appendChild(staminaLabel);
    this.staminaContainer.appendChild(staminaBg);
    this.container.appendChild(this.staminaContainer);
    
    // Timer (top right)
    this.timerElement = document.createElement('div');
    this.timerElement.style.cssText = `
      position: absolute;
      top: 20px;
      right: 30px;
      color: #c9a227;
      font-size: 32px;
      font-weight: bold;
      font-family: 'Courier New', monospace;
      text-shadow: 0 0 10px #000;
    `;
    this.timerElement.textContent = '03:00';
    this.container.appendChild(this.timerElement);
    
    // Louis State indicator (bottom right, for debugging)
    this.louisStateElement = document.createElement('div');
    this.louisStateElement.style.cssText = `
      position: absolute;
      bottom: 30px;
      right: 30px;
      color: #fff;
      font-size: 14px;
      text-shadow: 0 0 5px #000;
      opacity: 0.7;
    `;
    this.louisStateElement.textContent = 'Louis: PATROL';
    this.container.appendChild(this.louisStateElement);
    
    // Interaction prompt (center bottom)
    this.interactionPrompt = document.createElement('div');
    this.interactionPrompt.style.cssText = `
      position: absolute;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 10px;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    `;
    
    this.interactionKey = document.createElement('span');
    this.interactionKey.style.cssText = `
      background: rgba(201, 162, 39, 0.9);
      color: #000;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 18px;
      font-family: monospace;
      box-shadow: 0 0 10px rgba(201, 162, 39, 0.5);
    `;
    this.interactionKey.textContent = 'E';
    
    this.interactionText = document.createElement('span');
    this.interactionText.style.cssText = `
      color: #fff;
      font-size: 18px;
      text-shadow: 0 0 5px #000;
      font-weight: 500;
    `;
    this.interactionText.textContent = 'Interact';
    
    this.interactionPrompt.appendChild(this.interactionKey);
    this.interactionPrompt.appendChild(this.interactionText);
    this.container.appendChild(this.interactionPrompt);
    
    // Hidden indicator (center)
    this.hiddenIndicator = document.createElement('div');
    this.hiddenIndicator.style.cssText = `
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #00ff00;
      font-size: 36px;
      font-weight: bold;
      text-shadow: 0 0 20px #00ff00;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    `;
    this.hiddenIndicator.innerHTML = `
      <span>👁️ HIDDEN</span>
      <span style="font-size: 16px; color: #aaa;">Louis cannot see you</span>
    `;
    this.container.appendChild(this.hiddenIndicator);
    
    // Hiding time warning (below hidden indicator)
    this.hidingWarning = document.createElement('div');
    this.hidingWarning.style.cssText = `
      position: absolute;
      top: 42%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #ff8800;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 0 0 10px #ff0000;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      text-align: center;
    `;
    this.container.appendChild(this.hidingWarning);
    
    // Notification container (top center, below detection)
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.style.cssText = `
      position: absolute;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      z-index: 100;
    `;
    this.container.appendChild(this.notificationContainer);
    
    // Create game over screens
    this.createGameOverScreens();
  }
  
  private createGameOverScreens(): void {
    // Game Over (Caught)
    this.gameOverScreen = document.createElement('div');
    this.gameOverScreen.className = 'game-over-screen';
    this.gameOverScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      pointer-events: auto;
    `;
    
    this.gameOverScreen.innerHTML = `
      <h1 style="color: #ff0000; font-size: 64px; margin-bottom: 20px; text-shadow: 0 0 20px #ff0000;">
        YOU GOT LITT UP!
      </h1>
      <p style="color: #fff; font-size: 24px; margin-bottom: 40px;">
        Louis caught you for a drug test.
      </p>
      <button id="restart-btn" style="
        padding: 20px 60px;
        font-size: 24px;
        background: #c9a227;
        color: #000;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
      ">TRY AGAIN</button>
    `;
    
    this.container.appendChild(this.gameOverScreen);
    
    // Win Screen (Timer)
    this.winScreen = document.createElement('div');
    this.winScreen.className = 'win-screen';
    this.winScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 50, 0, 0.9);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      pointer-events: auto;
    `;
    
    this.winScreen.innerHTML = `
      <h1 style="color: #00ff00; font-size: 64px; margin-bottom: 20px; text-shadow: 0 0 20px #00ff00;">
        TIME'S UP!
      </h1>
      <p style="color: #fff; font-size: 24px; margin-bottom: 40px;">
        Louis gave up! You survived the 3 minutes!
      </p>
      <button id="play-again-btn" style="
        padding: 20px 60px;
        font-size: 24px;
        background: #c9a227;
        color: #000;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
      ">PLAY AGAIN</button>
    `;
    
    this.container.appendChild(this.winScreen);
    
    // Escape Win Screen (Reached exit)
    this.escapeScreen = document.createElement('div');
    this.escapeScreen.className = 'escape-screen';
    this.escapeScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 100, 0, 0.95);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      pointer-events: auto;
    `;
    
    this.escapeScreen.innerHTML = `
      <h1 style="color: #00ff00; font-size: 72px; margin-bottom: 20px; text-shadow: 0 0 30px #00ff00;">
        ESCAPED!
      </h1>
      <p style="color: #c9a227; font-size: 28px; margin-bottom: 20px; font-style: italic;">
        "You just got Un-Litt!"
      </p>
      <p style="color: #fff; font-size: 24px; margin-bottom: 40px;">
        You reached the exit and escaped the drug test!
      </p>
      <button id="escape-again-btn" style="
        padding: 20px 60px;
        font-size: 24px;
        background: #c9a227;
        color: #000;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
      ">PLAY AGAIN</button>
    `;
    
    this.container.appendChild(this.escapeScreen);
    
    // Add event listeners
    const restartBtn = document.getElementById('restart-btn');
    restartBtn?.addEventListener('click', () => {
      window.location.reload();
    });
    
    const playAgainBtn = document.getElementById('play-again-btn');
    playAgainBtn?.addEventListener('click', () => {
      window.location.reload();
    });
    
    const escapeAgainBtn = document.getElementById('escape-again-btn');
    escapeAgainBtn?.addEventListener('click', () => {
      window.location.reload();
    });
  }
  
  // Interaction prompt methods
  showInteractionPrompt(text: string, key: string = 'E'): void {
    this.interactionText.textContent = text;
    this.interactionKey.textContent = key;
    this.interactionPrompt.style.opacity = '1';
  }
  
  hideInteractionPrompt(): void {
    this.interactionPrompt.style.opacity = '0';
  }
  
  showHiddenIndicator(show: boolean): void {
    this.hiddenIndicator.style.opacity = show ? '1' : '0';
    if (!show) {
      // Hide warning when no longer hidden
      this.hidingWarning.style.opacity = '0';
    }
  }
  
  /**
   * Show warning that hiding time is running out
   */
  showHidingWarning(secondsLeft: number): void {
    this.hidingWarning.textContent = `⚠️ GET OUT! ${secondsLeft.toFixed(1)}s left!`;
    this.hidingWarning.style.opacity = '1';
    
    // Pulse animation
    let pulseCount = 0;
    const pulse = setInterval(() => {
      pulseCount++;
      this.hidingWarning.style.transform = pulseCount % 2 === 0 
        ? 'translate(-50%, -50%) scale(1.1)' 
        : 'translate(-50%, -50%) scale(1)';
      
      if (pulseCount >= 6) {
        clearInterval(pulse);
        this.hidingWarning.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    }, 300);
  }
  
  /**
   * Show a notification message
   */
  showNotification(message: string, duration: number = 3000): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      color: #c9a227;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      border: 2px solid #c9a227;
      box-shadow: 0 0 20px rgba(201, 162, 39, 0.5);
      animation: slideDown 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add keyframes for animation
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    this.notificationContainer.appendChild(notification);
    
    // Remove after duration
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  }
  
  // Update methods
  setDetectionLevel(level: number): void {
    // Level is 0-1
    const percentage = Math.min(100, level * 100);
    this.detectionBar.style.width = `${percentage}%`;
    
    // Show/hide detection meter
    this.detectionContainer.style.opacity = level > 0 ? '1' : '0';
    
    // Change text based on level
    if (level < 0.3) {
      this.detectionText.textContent = 'SUSPICION';
      this.detectionText.style.color = '#ffff00';
      this.detectionBar.style.background = 'linear-gradient(90deg, #ffff00, #ffaa00)';
    } else if (level < 0.9) {
      this.detectionText.textContent = 'WARNING';
      this.detectionText.style.color = '#ff8800';
      this.detectionBar.style.background = 'linear-gradient(90deg, #ffaa00, #ff4400)';
    } else {
      this.detectionText.textContent = 'DETECTED!';
      this.detectionText.style.color = '#ff0000';
      this.detectionBar.style.background = 'linear-gradient(90deg, #ff4400, #ff0000)';
    }
  }
  
  setStamina(stamina: number): void {
    const percentage = Math.max(0, Math.min(100, stamina));
    this.staminaBar.style.width = `${percentage}%`;
    
    // Change color based on stamina
    if (percentage < 20) {
      this.staminaBar.style.background = '#ff0000';
    } else if (percentage < 50) {
      this.staminaBar.style.background = 'linear-gradient(90deg, #ff8800, #c9a227)';
    } else {
      this.staminaBar.style.background = 'linear-gradient(90deg, #c9a227, #ffd700)';
    }
  }
  
  setTimer(seconds: number): void {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    this.timerElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    // Warning color when time is low
    if (seconds < 30) {
      this.timerElement.style.color = '#ff0000';
    }
  }
  
  setLouisState(state: string): void {
    this.louisStateElement.textContent = `Louis: ${state}`;
    
    // Color code by state
    const colors: Record<string, string> = {
      'PATROL': '#00ff00',
      'SUSPICIOUS': '#ffff00',
      'CHASE': '#ff0000',
      'SEARCH': '#ff8800',
      'CAUGHT': '#ff0000'
    };
    this.louisStateElement.style.color = colors[state] || '#fff';
  }
  
  showGameOver(): void {
    if (this.gameOverScreen) {
      this.gameOverScreen.style.display = 'flex';
    }
  }
  
  showWin(): void {
    if (this.winScreen) {
      this.winScreen.style.display = 'flex';
    }
  }
  
  showEscapeWin(): void {
    if (this.escapeScreen) {
      this.escapeScreen.style.display = 'flex';
    }
  }
  
  hide(): void {
    this.detectionContainer.style.display = 'none';
    this.staminaContainer.style.display = 'none';
    this.timerElement.style.display = 'none';
    this.louisStateElement.style.display = 'none';
  }
}
