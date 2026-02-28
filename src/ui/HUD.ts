/**
 * HUD - Heads Up Display (PS1 Retro Style)
 * Shows detection meter, stamina, timer, and game status
 * Styled to look like a PlayStation 1 game interface
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
  private muteIndicator!: HTMLElement;
  
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
    // Detection Meter (only visible when detected) - PS1 style blocky meter
    this.detectionContainer = document.createElement('div');
    this.detectionContainer.className = 'detection-meter';
    this.detectionContainer.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 280px;
      text-align: center;
      opacity: 0;
      transition: opacity 0.15s;
      font-family: 'VT323', monospace;
    `;
    
    this.detectionText = document.createElement('div');
    this.detectionText.textContent = 'DETECTED';
    this.detectionText.style.cssText = `
      color: #ff0000;
      font-weight: bold;
      font-size: 28px;
      text-shadow: 2px 2px 0 #000;
      margin-bottom: 4px;
      font-family: 'Press Start 2P', cursive;
      font-size: 14px;
      letter-spacing: 2px;
    `;
    
    const detectionBg = document.createElement('div');
    detectionBg.style.cssText = `
      width: 100%;
      height: 20px;
      background: #1a1a1a;
      border: 3px solid #444;
      overflow: hidden;
      image-rendering: pixelated;
    `;
    
    this.detectionBar = document.createElement('div');
    this.detectionBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(180deg, #ff4444 0%, #ff0000 50%, #aa0000 100%);
      transition: width 0.1s linear;
      image-rendering: pixelated;
    `;
    
    detectionBg.appendChild(this.detectionBar);
    this.detectionContainer.appendChild(this.detectionText);
    this.detectionContainer.appendChild(detectionBg);
    this.container.appendChild(this.detectionContainer);
    
    // Stamina Bar (bottom left) - PS1 style segmented bar
    this.staminaContainer = document.createElement('div');
    this.staminaContainer.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 30px;
      width: 180px;
      font-family: 'VT323', monospace;
    `;
    
    const staminaLabel = document.createElement('div');
    staminaLabel.textContent = 'STAMINA';
    staminaLabel.style.cssText = `
      color: #ffff00;
      font-size: 18px;
      margin-bottom: 4px;
      text-shadow: 1px 1px 0 #000;
      font-family: 'Press Start 2P', cursive;
      font-size: 10px;
      letter-spacing: 1px;
    `;
    
    const staminaBg = document.createElement('div');
    staminaBg.style.cssText = `
      width: 100%;
      height: 16px;
      background: #1a1a1a;
      border: 3px solid #666;
      overflow: hidden;
      image-rendering: pixelated;
    `;
    
    this.staminaBar = document.createElement('div');
    this.staminaBar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, #ffff00 0%, #c9a227 50%, #886600 100%);
      transition: width 0.1s linear;
      image-rendering: pixelated;
    `;
    
    staminaBg.appendChild(this.staminaBar);
    this.staminaContainer.appendChild(staminaLabel);
    this.staminaContainer.appendChild(staminaBg);
    this.container.appendChild(this.staminaContainer);
    
    // Timer (top right) - PS1 style digital clock
    this.timerElement = document.createElement('div');
    this.timerElement.style.cssText = `
      position: absolute;
      top: 20px;
      right: 30px;
      color: #00ff00;
      font-size: 36px;
      font-weight: bold;
      font-family: 'Press Start 2P', cursive;
      font-size: 20px;
      text-shadow: 2px 2px 0 #000;
      letter-spacing: 2px;
    `;
    this.timerElement.textContent = '03:00';
    this.container.appendChild(this.timerElement);
    
    // Mute indicator (top right, below timer)
    this.muteIndicator = document.createElement('div');
    this.muteIndicator.style.cssText = `
      position: absolute;
      top: 50px;
      right: 30px;
      color: #888;
      font-size: 12px;
      font-family: 'Press Start 2P', cursive;
      text-shadow: 1px 1px 0 #000;
      opacity: 0;
      transition: opacity 0.2s;
    `;
    this.muteIndicator.textContent = '🔇 MUTED';
    this.container.appendChild(this.muteIndicator);
    
    // Louis State indicator (bottom right) - PS1 style status
    this.louisStateElement = document.createElement('div');
    this.louisStateElement.style.cssText = `
      position: absolute;
      bottom: 30px;
      right: 30px;
      color: #fff;
      font-size: 16px;
      text-shadow: 1px 1px 0 #000;
      font-family: 'VT323', monospace;
      opacity: 0.9;
    `;
    this.louisStateElement.textContent = 'Louis: PATROL';
    this.container.appendChild(this.louisStateElement);
    
    // Interaction prompt (center bottom) - PS1 style button prompt
    this.interactionPrompt = document.createElement('div');
    this.interactionPrompt.style.cssText = `
      position: absolute;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 12px;
      opacity: 0;
      transition: opacity 0.15s;
      pointer-events: none;
    `;
    
    this.interactionKey = document.createElement('span');
    this.interactionKey.style.cssText = `
      background: #ffff00;
      color: #000;
      padding: 6px 12px;
      font-weight: bold;
      font-size: 16px;
      font-family: 'Press Start 2P', cursive;
      font-size: 10px;
      border: 3px solid #fff;
      box-shadow: 3px 3px 0 #000;
      image-rendering: pixelated;
    `;
    this.interactionKey.textContent = 'E';
    
    this.interactionText = document.createElement('span');
    this.interactionText.style.cssText = `
      color: #fff;
      font-size: 20px;
      text-shadow: 2px 2px 0 #000;
      font-family: 'VT323', monospace;
    `;
    this.interactionText.textContent = 'Interact';
    
    this.interactionPrompt.appendChild(this.interactionKey);
    this.interactionPrompt.appendChild(this.interactionText);
    this.container.appendChild(this.interactionPrompt);
    
    // Hidden indicator (center) - PS1 style status text
    this.hiddenIndicator = document.createElement('div');
    this.hiddenIndicator.style.cssText = `
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #00ff00;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 0 #000;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      font-family: 'Press Start 2P', cursive;
      font-size: 12px;
      letter-spacing: 2px;
    `;
    this.hiddenIndicator.innerHTML = `
      <span>◆ HIDDEN ◆</span>
      <span style="font-size: 10px; color: #88ff88; font-family: 'VT323', monospace; font-size: 16px;">Louis cannot see you</span>
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
      font-size: 18px;
      font-weight: bold;
      text-shadow: 2px 2px 0 #000;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
      text-align: center;
      font-family: 'Press Start 2P', cursive;
      font-size: 10px;
      letter-spacing: 1px;
    `;
    this.container.appendChild(this.hidingWarning);
    
    // Notification container (top center, below detection)
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.style.cssText = `
      position: absolute;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
      z-index: 100;
    `;
    this.container.appendChild(this.notificationContainer);
    
    // Create game over screens
    this.createGameOverScreens();
  }
  
  private createGameOverScreens(): void {
    // Game Over (Caught) - PS1 style game over screen
    this.gameOverScreen = document.createElement('div');
    this.gameOverScreen.className = 'game-over-screen';
    this.gameOverScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      pointer-events: auto;
      font-family: 'VT323', monospace;
    `;
    
    this.gameOverScreen.innerHTML = `
      <h1 style="color: #ff0000; font-size: 32px; margin-bottom: 30px; text-shadow: 3px 3px 0 #000; font-family: 'Press Start 2P', cursive; line-height: 1.5; text-align: center;">
        YOU GOT<br>LITT UP!
      </h1>
      <p style="color: #ff8888; font-size: 20px; margin-bottom: 40px; text-shadow: 1px 1px 0 #000;">
        Louis caught you for a drug test.
      </p>
      <button id="restart-btn" style="
        padding: 15px 40px;
        font-size: 14px;
        font-family: 'Press Start 2P', cursive;
        background: #aa0000;
        color: #fff;
        border: 4px solid #ff0000;
        cursor: pointer;
        box-shadow: 0 4px 0 #000;
      ">TRY AGAIN</button>
    `;
    
    this.container.appendChild(this.gameOverScreen);
    
    // Win Screen (Timer) - PS1 style victory screen
    this.winScreen = document.createElement('div');
    this.winScreen.className = 'win-screen';
    this.winScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 50, 0, 0.95);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      pointer-events: auto;
      font-family: 'VT323', monospace;
    `;
    
    this.winScreen.innerHTML = `
      <h1 style="color: #00ff00; font-size: 32px; margin-bottom: 30px; text-shadow: 3px 3px 0 #000; font-family: 'Press Start 2P', cursive;">
        TIME'S UP!
      </h1>
      <p style="color: #88ff88; font-size: 20px; margin-bottom: 40px; text-shadow: 1px 1px 0 #000;">
        Louis gave up! You survived!
      </p>
      <button id="play-again-btn" style="
        padding: 15px 40px;
        font-size: 14px;
        font-family: 'Press Start 2P', cursive;
        background: #00aa00;
        color: #000;
        border: 4px solid #00ff00;
        cursor: pointer;
        box-shadow: 0 4px 0 #000;
      ">PLAY AGAIN</button>
    `;
    
    this.container.appendChild(this.winScreen);
    
    // Escape Win Screen (Reached exit) - PS1 style victory
    this.escapeScreen = document.createElement('div');
    this.escapeScreen.className = 'escape-screen';
    this.escapeScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 80, 0, 0.95);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      pointer-events: auto;
      font-family: 'VT323', monospace;
    `;
    
    this.escapeScreen.innerHTML = `
      <h1 style="color: #00ff00; font-size: 32px; margin-bottom: 30px; text-shadow: 3px 3px 0 #000; font-family: 'Press Start 2P', cursive;">
        ESCAPED!
      </h1>
      <p style="color: #c9a227; font-size: 18px; margin-bottom: 20px; font-style: italic; text-shadow: 1px 1px 0 #000;">
        "You just got Un-Litt!"
      </p>
      <p style="color: #fff; font-size: 18px; margin-bottom: 40px; text-shadow: 1px 1px 0 #000;">
        You reached the exit and escaped the drug test!
      </p>
      <button id="escape-again-btn" style="
        padding: 15px 40px;
        font-size: 14px;
        font-family: 'Press Start 2P', cursive;
        background: #00aa00;
        color: #000;
        border: 4px solid #00ff00;
        cursor: pointer;
        box-shadow: 0 4px 0 #000;
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
    this.hidingWarning.textContent = `GET OUT! ${secondsLeft.toFixed(0)}s`;
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
      background: #1a1a1a;
      color: #ffff00;
      padding: 10px 20px;
      font-size: 16px;
      font-family: 'VT323', monospace;
      border: 3px solid #ffff00;
      box-shadow: 3px 3px 0 #000;
      animation: slideDown 0.2s ease-out;
      text-align: center;
      text-shadow: 1px 1px 0 #000;
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
      notification.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => {
        notification.remove();
      }, 200);
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
      this.detectionBar.style.background = 'linear-gradient(180deg, #ffff00 0%, #c9a227 50%, #886600 100%)';
    } else if (level < 0.9) {
      this.detectionText.textContent = 'WARNING';
      this.detectionText.style.color = '#ff8800';
      this.detectionBar.style.background = 'linear-gradient(180deg, #ffaa00 0%, #ff8800 50%, #aa4400 100%)';
    } else {
      this.detectionText.textContent = 'DETECTED!';
      this.detectionText.style.color = '#ff0000';
      this.detectionBar.style.background = 'linear-gradient(180deg, #ff4444 0%, #ff0000 50%, #aa0000 100%)';
    }
  }
  
  setStamina(stamina: number): void {
    const percentage = Math.max(0, Math.min(100, stamina));
    this.staminaBar.style.width = `${percentage}%`;
    
    // Change color based on stamina
    if (percentage < 20) {
      this.staminaBar.style.background = 'linear-gradient(180deg, #ff4444 0%, #ff0000 50%, #aa0000 100%)';
    } else if (percentage < 50) {
      this.staminaBar.style.background = 'linear-gradient(180deg, #ffaa00 0%, #ff8800 50%, #aa4400 100%)';
    } else {
      this.staminaBar.style.background = 'linear-gradient(180deg, #ffff00 0%, #c9a227 50%, #886600 100%)';
    }
  }
  
  setTimer(seconds: number): void {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    this.timerElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    // Warning color when time is low
    if (seconds < 30) {
      this.timerElement.style.color = '#ff0000';
      this.timerElement.style.animation = 'blink 0.5s step-end infinite';
    } else {
      this.timerElement.style.color = '#00ff00';
      this.timerElement.style.animation = 'none';
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
  
  setMuteIndicator(isMuted: boolean): void {
    this.muteIndicator.style.opacity = isMuted ? '1' : '0';
  }
  
  hide(): void {
    this.detectionContainer.style.display = 'none';
    this.staminaContainer.style.display = 'none';
    this.timerElement.style.display = 'none';
    this.louisStateElement.style.display = 'none';
  }
}
