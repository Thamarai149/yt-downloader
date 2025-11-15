/**
 * Backend Server Manager
 * Manages the Express backend server lifecycle
 */

const { spawn } = require('child_process');
const path = require('path');
const net = require('net');
const { app } = require('electron');
const logger = require('./logger');

class BackendServerManager {
  constructor() {
    this.serverProcess = null;
    this.serverPort = null;
    this.serverHost = 'localhost';
    this.startTime = null;
    this.healthCheckInterval = null;
    this.restartAttempts = 0;
    this.maxRestartAttempts = 3;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Start the backend server
   * @returns {Promise<Object>} Server configuration
   */
  async start() {
    try {
      logger.info('Starting backend server...');

      // Find available port
      this.serverPort = await this.findAvailablePort(4000);
      logger.info(`Using port: ${this.serverPort}`);

      // Get backend path
      const backendPath = this.getBackendPath();
      logger.info(`Backend path: ${backendPath}`);

      // Prepare environment variables
      const env = this.prepareEnvironment();

      // Start server process
      await this.startServerProcess(backendPath, env);

      // Wait for server to be ready
      await this.waitForServer();

      // Start health monitoring
      this.startHealthMonitoring();

      this.startTime = Date.now();
      this.restartAttempts = 0;

      logger.info(`Backend server started successfully at ${this.getUrl()}`);

      return {
        port: this.serverPort,
        host: this.serverHost,
        url: this.getUrl(),
      };
    } catch (error) {
      logger.error('Failed to start backend server:', error);
      throw error;
    }
  }

  /**
   * Stop the backend server
   * @returns {Promise<void>}
   */
  async stop() {
    try {
      logger.info('Stopping backend server...');

      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      // Kill server process
      if (this.serverProcess) {
        return new Promise((resolve) => {
          this.serverProcess.once('exit', () => {
            logger.info('Backend server stopped');
            this.serverProcess = null;
            this.serverPort = null;
            this.startTime = null;
            resolve();
          });

          // Try graceful shutdown first
          this.serverProcess.kill('SIGTERM');

          // Force kill after 5 seconds if still running
          setTimeout(() => {
            if (this.serverProcess) {
              logger.warn('Force killing backend server...');
              this.serverProcess.kill('SIGKILL');
            }
          }, 5000);
        });
      }

      logger.info('Backend server already stopped');
    } catch (error) {
      logger.error('Error stopping backend server:', error);
      throw error;
    }
  }

  /**
   * Restart the backend server
   * @returns {Promise<Object>}
   */
  async restart() {
    try {
      logger.info('Restarting backend server...');
      
      if (this.restartAttempts >= this.maxRestartAttempts) {
        throw new Error('Maximum restart attempts reached');
      }

      this.restartAttempts++;
      
      await this.stop();
      
      // Wait with exponential backoff
      const delay = Math.min(2000 * Math.pow(2, this.restartAttempts - 1), 10000);
      logger.info(`Waiting ${delay}ms before restart...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return await this.start();
    } catch (error) {
      logger.error('Failed to restart backend server:', error);
      throw error;
    }
  }

  /**
   * Get server status
   * @returns {Object} Server status
   */
  getStatus() {
    return {
      running: this.serverProcess !== null && !this.serverProcess.killed,
      port: this.serverPort,
      host: this.serverHost,
      url: this.getUrl(),
      pid: this.serverProcess ? this.serverProcess.pid : null,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      restartAttempts: this.restartAttempts,
    };
  }

  /**
   * Get server URL
   * @returns {string} Server URL
   */
  getUrl() {
    if (!this.serverPort) {
      return null;
    }
    return `http://${this.serverHost}:${this.serverPort}`;
  }

  /**
   * Find an available port
   * @param {number} startPort - Starting port to check
   * @returns {Promise<number>} Available port
   */
  async findAvailablePort(startPort) {
    return new Promise((resolve) => {
      const testServer = net.createServer();
      
      testServer.listen(startPort, () => {
        const port = testServer.address().port;
        testServer.close(() => resolve(port));
      });

      testServer.on('error', () => {
        // Port is in use, try next one
        resolve(this.findAvailablePort(startPort + 1));
      });
    });
  }

  /**
   * Get backend directory path
   * @returns {string} Backend path
   */
  getBackendPath() {
    if (this.isDevelopment) {
      // In development, use the backend folder in project root
      return path.join(process.cwd(), 'backend');
    } else {
      // In production, backend is bundled in resources
      return path.join(process.resourcesPath, 'backend');
    }
  }

  /**
   * Prepare environment variables for backend
   * @returns {Object} Environment variables
   */
  prepareEnvironment() {
    const userDataPath = app.getPath('userData');
    const downloadsPath = this.downloadPath || path.join(app.getPath('downloads'), 'YT-Downloads');
    
    // Get resources path for binaries
    const resourcesPath = this.isDevelopment 
      ? process.cwd() 
      : process.resourcesPath;

    return {
      ...process.env,
      PORT: this.serverPort.toString(),
      NODE_ENV: this.isDevelopment ? 'development' : 'production',
      USER_DATA_PATH: userDataPath,
      DOWNLOADS_PATH: downloadsPath,
      ELECTRON_MODE: 'true',
      IS_ELECTRON: 'true',
      ELECTRON_APP_PATH: app.getAppPath(),
      ELECTRON_USER_DATA: userDataPath,
      ELECTRON_DOWNLOADS_PATH: downloadsPath,
      // Pass resources path so backend can find binaries
      ELECTRON_RESOURCES_PATH: resourcesPath,
      // Disable auto-opening browser
      BROWSER: 'none',
    };
  }

  /**
   * Update download path
   * @param {string} newPath - New download path
   */
  updateDownloadPath(newPath) {
    this.downloadPath = newPath;
    logger.info(`Download path updated to: ${newPath}`);
    // Note: Backend will need to be restarted to pick up the new path
    // or we need to implement a way to update it dynamically via API
  }

  /**
   * Start the server process
   * @param {string} backendPath - Path to backend directory
   * @param {Object} env - Environment variables
   * @returns {Promise<void>}
   */
  async startServerProcess(backendPath, env) {
    return new Promise((resolve, reject) => {
      const serverScript = path.join(backendPath, 'server.js');
      
      // Check if server script exists
      const fs = require('fs');
      if (!fs.existsSync(serverScript)) {
        return reject(new Error(`Backend server script not found: ${serverScript}`));
      }

      logger.info(`Starting server process: node ${serverScript}`);

      // Spawn the server process
      this.serverProcess = spawn('node', [serverScript], {
        cwd: backendPath,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      // Handle stdout
      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        logger.info(`[Backend] ${output}`);
        
        // Check if server started successfully
        if (output.includes('listening on port') || output.includes('Server listening')) {
          resolve();
        }
      });

      // Handle stderr
      this.serverProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        logger.error(`[Backend Error] ${error}`);
      });

      // Handle process exit
      this.serverProcess.on('exit', (code, signal) => {
        logger.info(`Backend server exited with code ${code} and signal ${signal}`);
        
        if (code !== 0 && code !== null) {
          logger.error('Backend server crashed, attempting restart...');
          
          // Attempt automatic restart if not manually stopped
          if (this.restartAttempts < this.maxRestartAttempts) {
            setTimeout(() => {
              this.restart().catch(err => {
                logger.error('Failed to auto-restart backend:', err);
              });
            }, 3000);
          }
        }
      });

      // Handle process errors
      this.serverProcess.on('error', (error) => {
        logger.error('Backend server process error:', error);
        reject(error);
      });

      // Resolve after a timeout if we don't see the success message
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          logger.info('Server process started (timeout-based confirmation)');
          resolve();
        }
      }, 5000);
    });
  }

  /**
   * Wait for server to be ready
   * @returns {Promise<void>}
   */
  async waitForServer() {
    const maxAttempts = 30;
    const delayMs = 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const isHealthy = await this.healthCheck();
        if (isHealthy) {
          logger.info(`Server is ready after ${attempt} attempts`);
          return;
        }
      } catch (error) {
        // Server not ready yet
        logger.debug(`Health check attempt ${attempt} failed`);
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    throw new Error('Server failed to become ready within timeout period');
  }

  /**
   * Perform health check on server
   * @returns {Promise<boolean>} True if server is healthy
   */
  async healthCheck() {
    if (!this.serverPort) {
      return false;
    }

    return new Promise((resolve) => {
      const http = require('http');
      
      const options = {
        hostname: this.serverHost,
        port: this.serverPort,
        path: '/api/health',
        method: 'GET',
        timeout: 2000,
      };

      const req = http.request(options, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.healthCheck();
      
      if (!isHealthy) {
        logger.warn('Backend server health check failed');
        
        // Attempt restart if server is unhealthy
        if (this.restartAttempts < this.maxRestartAttempts) {
          logger.info('Attempting to restart unhealthy server...');
          this.restart().catch(err => {
            logger.error('Failed to restart unhealthy server:', err);
          });
        }
      }
    }, 30000);
  }

  /**
   * Check if server is running
   * @returns {boolean}
   */
  isRunning() {
    return this.serverProcess !== null && !this.serverProcess.killed;
  }

  /**
   * Check binary status from backend
   * @returns {Promise<Object|null>} Binary status or null
   */
  async checkBinaryStatus() {
    if (!this.serverPort) {
      return null;
    }

    return new Promise((resolve) => {
      const http = require('http');
      
      const options = {
        hostname: this.serverHost,
        port: this.serverPort,
        path: '/api/binaries/status',
        method: 'GET',
        timeout: 5000,
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const status = JSON.parse(data);
            resolve(status);
          } catch (error) {
            logger.error('Failed to parse binary status:', error);
            resolve(null);
          }
        });
      });

      req.on('error', (error) => {
        logger.error('Failed to check binary status:', error);
        resolve(null);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      req.end();
    });
  }
}

module.exports = BackendServerManager;
