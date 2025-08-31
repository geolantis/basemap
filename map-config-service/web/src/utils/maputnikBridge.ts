/**
 * Maputnik Bridge - Seamless integration with Maputnik editor
 * 
 * This creates a bi-directional communication channel with Maputnik
 * allowing for automatic save-back functionality without manual export/import
 */

export interface MaputnikConfig {
  styleUrl: string;
  styleName: string;
  saveEndpoint: string;
  apiKey: string;
}

export class MaputnikBridge {
  private config: MaputnikConfig;
  private iframe: HTMLIFrameElement | null = null;
  private saveCallback?: (style: any) => Promise<void>;
  
  constructor(config: MaputnikConfig) {
    this.config = config;
  }

  /**
   * Open Maputnik with custom parameters for save-back functionality
   */
  openMaputnik(options: {
    styleFile: string;
    onSave?: (style: any) => Promise<void>;
  }): string {
    const { styleFile, onSave } = options;
    
    // Store the save callback
    this.saveCallback = onSave;
    
    // Build the Maputnik URL with custom parameters
    const baseUrl = 'https://maputnik.github.io/editor/';
    const styleUrl = `${window.location.origin}/styles/${styleFile}`;
    
    // Create a custom Maputnik URL that includes our webhook
    const params = new URLSearchParams({
      // These parameters would work with a custom Maputnik build
      'webhook': `${window.location.origin}/api/maputnik-webhook`,
      'webhook-key': this.config.apiKey,
      'style-name': this.config.styleName
    });
    
    // For standard Maputnik, we use the hash parameter
    return `${baseUrl}#${encodeURIComponent(styleUrl)}`;
  }

  /**
   * Create a custom Maputnik instance with save integration
   * This would be used with a self-hosted Maputnik fork
   */
  createCustomMaputnik(container: HTMLElement, styleFile: string): void {
    // Create iframe with custom Maputnik
    const iframe = document.createElement('iframe');
    iframe.src = this.buildCustomMaputnikUrl(styleFile);
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    container.appendChild(iframe);
    this.iframe = iframe;
    
    // Set up message listener
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  /**
   * Build URL for custom Maputnik instance with webhook support
   */
  private buildCustomMaputnikUrl(styleFile: string): string {
    // If you host your own Maputnik fork with webhook support
    const customMaputnikUrl = process.env.VITE_CUSTOM_MAPUTNIK_URL || 'https://maputnik.github.io/editor/';
    
    const styleUrl = `${window.location.origin}/styles/${styleFile}`;
    const webhookUrl = `${window.location.origin}/api/styles/${styleFile}`;
    
    // Custom parameters for modified Maputnik
    const config = {
      style: styleUrl,
      webhook: {
        url: webhookUrl,
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      },
      autoSave: true,
      autoSaveInterval: 30000 // Auto-save every 30 seconds
    };
    
    // Encode configuration
    const encodedConfig = btoa(JSON.stringify(config));
    
    return `${customMaputnikUrl}#config=${encodedConfig}`;
  }

  /**
   * Handle messages from Maputnik iframe
   */
  private handleMessage(event: MessageEvent): void {
    // Verify origin
    if (!event.origin.includes('maputnik')) return;
    
    const { type, data } = event.data;
    
    switch (type) {
      case 'style-changed':
        this.onStyleChanged(data);
        break;
      case 'save-requested':
        this.saveStyle(data);
        break;
      case 'maputnik-ready':
        this.onMaputnikReady();
        break;
    }
  }

  /**
   * Handle style changes from Maputnik
   */
  private onStyleChanged(style: any): void {
    // Store the latest style locally
    sessionStorage.setItem('maputnik-current-style', JSON.stringify(style));
  }

  /**
   * Save style back to server
   */
  private async saveStyle(style: any): Promise<void> {
    if (this.saveCallback) {
      await this.saveCallback(style);
    } else {
      // Default save implementation
      const response = await fetch(this.config.saveEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(style)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save style');
      }
    }
    
    // Notify Maputnik of successful save
    this.sendToMaputnik('save-complete', { success: true });
  }

  /**
   * Called when Maputnik is ready
   */
  private onMaputnikReady(): void {
    // Send initial configuration
    this.sendToMaputnik('configure', {
      webhook: this.config.saveEndpoint,
      autoSave: true
    });
  }

  /**
   * Send message to Maputnik iframe
   */
  private sendToMaputnik(type: string, data: any): void {
    if (!this.iframe?.contentWindow) return;
    
    this.iframe.contentWindow.postMessage({
      type,
      data
    }, '*');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    window.removeEventListener('message', this.handleMessage.bind(this));
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
  }
}

/**
 * Create a bookmarklet for quick save from Maputnik
 * Users can add this to their bookmarks bar for one-click save
 */
export function createMaputnikBookmarklet(apiEndpoint: string, apiKey: string): string {
  const code = `
    javascript:(function(){
      const style = window.mapboxglMaputnik.store.getState().style.present;
      const filename = prompt('Save as filename:', 'style.json');
      if (!filename) return;
      
      fetch('${apiEndpoint}/styles/' + filename, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${apiKey}'
        },
        body: JSON.stringify(style)
      }).then(r => {
        if (r.ok) alert('Style saved successfully!');
        else alert('Failed to save style');
      }).catch(e => alert('Error: ' + e.message));
    })();
  `;
  
  return code.replace(/\s+/g, ' ').trim();
}

/**
 * Browser extension helper for Maputnik integration
 * This code would be part of a browser extension that injects save functionality
 */
export const browserExtensionScript = `
  // Inject save button into Maputnik
  function injectSaveButton() {
    const toolbar = document.querySelector('.maputnik-toolbar');
    if (!toolbar) {
      setTimeout(injectSaveButton, 1000);
      return;
    }
    
    const saveButton = document.createElement('button');
    saveButton.className = 'maputnik-button';
    saveButton.textContent = 'Save to Vercel';
    saveButton.onclick = async () => {
      const style = window.mapboxglMaputnik.store.getState().style.present;
      
      // Send to our API
      const response = await fetch(window.VERCEL_SAVE_ENDPOINT, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + window.VERCEL_API_KEY
        },
        body: JSON.stringify(style)
      });
      
      if (response.ok) {
        alert('Style saved to Vercel!');
      } else {
        alert('Failed to save style');
      }
    };
    
    toolbar.appendChild(saveButton);
  }
  
  // Start injection when Maputnik loads
  if (window.location.href.includes('maputnik.github.io')) {
    injectSaveButton();
  }
`;