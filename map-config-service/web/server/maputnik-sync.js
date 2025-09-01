#!/usr/bin/env node

/**
 * Maputnik Style Sync Server
 * 
 * This server provides automatic synchronization between Maputnik editor
 * and your database using the Maputnik CLI watch mode.
 * 
 * Features:
 * - Runs Maputnik CLI in watch mode for each style
 * - Monitors file changes and auto-saves to database
 * - Provides WebSocket updates to frontend
 * - No manual save/upload required!
 */

import { spawn } from 'child_process';
import { watch } from 'chokidar';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  MAPUTNIK_PORT_START: 8000,
  API_PORT: 3002,
  STYLES_DIR: path.join(__dirname, '../public/styles'),
  TEMP_DIR: path.join(__dirname, '../temp/styles'),
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_KEY: process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
};

// Initialize Supabase client
const supabase = CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY
  ? createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY)
  : null;

// Track active Maputnik instances
const maputnikInstances = new Map();

class MaputnikManager {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  setupRoutes() {
    // Start editing a style with Maputnik CLI
    this.app.post('/api/maputnik/start', async (req, res) => {
      const { styleId, styleName } = req.body;
      
      try {
        const port = await this.startMaputnikInstance(styleId, styleName);
        res.json({ 
          success: true, 
          port,
          url: `http://localhost:${port}`
        });
      } catch (error) {
        console.error('Failed to start Maputnik:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Stop editing a style
    this.app.post('/api/maputnik/stop', async (req, res) => {
      const { styleId } = req.body;
      
      try {
        await this.stopMaputnikInstance(styleId);
        res.json({ success: true });
      } catch (error) {
        console.error('Failed to stop Maputnik:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get status of active instances
    this.app.get('/api/maputnik/status', (req, res) => {
      const instances = Array.from(maputnikInstances.entries()).map(([id, instance]) => ({
        styleId: id,
        port: instance.port,
        styleName: instance.styleName,
        url: `http://localhost:${instance.port}`
      }));
      
      res.json({ instances });
    });
  }

  setupWebSocket() {
    const server = this.app.listen(CONFIG.API_PORT, () => {
      console.log(`🚀 Maputnik Sync Server running on port ${CONFIG.API_PORT}`);
    });

    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
    });
  }

  async startMaputnikInstance(styleId, styleName) {
    // Check if already running
    if (maputnikInstances.has(styleId)) {
      const instance = maputnikInstances.get(styleId);
      return instance.port;
    }

    // Find available port
    const port = CONFIG.MAPUTNIK_PORT_START + maputnikInstances.size;
    
    // Create temp directory if not exists
    await fs.mkdir(CONFIG.TEMP_DIR, { recursive: true });
    
    // Copy style file to temp location for editing
    const sourceFile = path.join(CONFIG.STYLES_DIR, `${styleName}.json`);
    const tempFile = path.join(CONFIG.TEMP_DIR, `${styleName}-${styleId}.json`);
    
    try {
      await fs.copyFile(sourceFile, tempFile);
    } catch (error) {
      console.error(`Failed to copy style file: ${error.message}`);
      throw new Error(`Style file not found: ${styleName}.json`);
    }

    // Start Maputnik CLI in watch mode
    console.log(`Starting Maputnik for ${styleName} on port ${port}...`);
    const maputnikProcess = spawn('npx', [
      'maputnik',
      '--watch',
      '--file', tempFile,
      '--port', port.toString()
    ], {
      stdio: 'pipe'
    });

    maputnikProcess.stdout.on('data', (data) => {
      console.log(`[Maputnik ${port}]: ${data}`);
    });

    maputnikProcess.stderr.on('data', (data) => {
      console.error(`[Maputnik ${port} Error]: ${data}`);
    });

    maputnikProcess.on('close', (code) => {
      console.log(`Maputnik on port ${port} exited with code ${code}`);
      maputnikInstances.delete(styleId);
    });

    // Watch the temp file for changes
    const watcher = watch(tempFile, {
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async () => {
      console.log(`Style ${styleName} changed, saving to database...`);
      await this.saveStyleToDatabase(styleId, styleName, tempFile);
    });

    // Store instance info
    maputnikInstances.set(styleId, {
      port,
      styleName,
      process: maputnikProcess,
      watcher,
      tempFile
    });

    // Wait a bit for Maputnik to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    return port;
  }

  async stopMaputnikInstance(styleId) {
    const instance = maputnikInstances.get(styleId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    // Stop file watcher
    if (instance.watcher) {
      await instance.watcher.close();
    }

    // Kill Maputnik process
    if (instance.process) {
      instance.process.kill();
    }

    // Save final state to database
    await this.saveStyleToDatabase(styleId, instance.styleName, instance.tempFile);

    // Copy final version back to public styles
    const publicFile = path.join(CONFIG.STYLES_DIR, `${instance.styleName}.json`);
    await fs.copyFile(instance.tempFile, publicFile);

    // Clean up temp file
    try {
      await fs.unlink(instance.tempFile);
    } catch (error) {
      console.error('Failed to delete temp file:', error);
    }

    maputnikInstances.delete(styleId);
  }

  async saveStyleToDatabase(styleId, styleName, filePath) {
    try {
      // Read the updated style
      const styleContent = await fs.readFile(filePath, 'utf-8');
      const styleJson = JSON.parse(styleContent);

      // Save to Supabase if configured
      if (supabase) {
        const { error } = await supabase
          .from('map_configs')
          .update({
            style: `https://mapconfig.geolantis.com/styles/${styleName}.json`,
            metadata: {
              ...styleJson.metadata,
              lastModified: new Date().toISOString(),
              styleJson: styleJson
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', styleId);

        if (error) {
          console.error('Failed to save to database:', error);
        } else {
          console.log(`✅ Style ${styleName} saved to database`);
          
          // Notify connected clients
          this.broadcast({
            type: 'style-saved',
            styleId,
            styleName,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Also save to public directory for immediate access
      const publicFile = path.join(CONFIG.STYLES_DIR, `${styleName}.json`);
      await fs.copyFile(filePath, publicFile);
      
    } catch (error) {
      console.error('Error saving style:', error);
    }
  }

  broadcast(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });
  }

  // Cleanup on exit
  async cleanup() {
    console.log('Cleaning up Maputnik instances...');
    
    for (const [styleId, instance] of maputnikInstances.entries()) {
      try {
        await this.stopMaputnikInstance(styleId);
      } catch (error) {
        console.error(`Failed to stop instance ${styleId}:`, error);
      }
    }
  }
}

// Start the server
const manager = new MaputnikManager();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await manager.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down...');
  await manager.cleanup();
  process.exit(0);
});