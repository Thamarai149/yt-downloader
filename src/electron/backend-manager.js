/**
 * Backend Server Manager
 * Manages the Express backend server lifecycle
 */

const { spawn } = require('child_process');
const path = require('path');
const net = require('net');
const { app } = require('electron');
const logger = require('./logger');
const fs = require('fs');

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

      // Prepare environment
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
   * Stop backend server
   */
  async stop() {
    try {
      logger.info('Stopping backend server...');

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      if (this.serverProcess) {
        return new Promise((resolve) => {
          this.serverProcess.once('exit', () => {
            logger.info('Backend server stopped');
            this.serverProcess = null;
            this.serverPort = null;
            this.startTime = null;
            resolve();
          });

          this.serverProcess.kill('SIGTERM');

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
   * Restart backend server
   */
  async restart() {
    try {
      logger.info('Restarting backend server...');

      if (this.restartAttempts >= this.maxRestartAttempts) {
        throw new Error('Maximum restart attempts reached');
      }

      this.restartAttempts++;

      await this.stop();

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
   * Server status
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

  getUrl() {
    if (!this.serverPort) return null;
    return `http://${this.serverHost}:${this.serverPort}`;
  }

  /**
   * Find free port
   */
  async findAvailablePort(startPort) {
    return new Promise((resolve) => {
      const testServer = net.createServer();

      testServer.listen(startPort, () => {
        const port = testServer.address().port;
        testServer.close(() => resolve(port));
      });

      testServer.on('error', () => {
        resolve(this.findAvailablePort(startPort + 1));
      });
    });
  }

  /**
   * Get backend path for both development and production
   */
  getBackendPath() {
    if (this.isDevelopment) {
      return path.join(process.cwd(), 'backend');
    }

    // Production mode: Check multiple possible locations
    const appPath = app.getAppPath();
    const possiblePaths = [];

    // 1. Inside app.asar.unpacked (preferred for electron-builder)
    if (appPath.includes('app.asar')) {
      possiblePaths.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'backend'));
    }

    // 2. Directly in resources
    possiblePaths.push(path.join(process.resourcesPath, 'backend'));

    // 3. Relative to app path
    possiblePaths.push(path.join(appPath, 'backend'));

    // 4. In app directory (for portable builds)
    possiblePaths.push(path.join(path.dirname(app.getPath('exe')), 'resources', 'backend'));

    // Find the first path that exists
    for (const backendPath of possiblePaths) {
      const serverScript = path.join(backendPath, 'server.js');
      if (fs.existsSync(serverScript)) {
        logger.info(`Found backend at: ${backendPath}`);
        return backendPath;
      }
    }

    // Log all attempted paths for debugging
    logger.error('Backend not found in any of these locations:');
    possiblePaths.forEach(p => logger.error(`  - ${p}`));

    // Return first path as fallback (will fail with clear error)
    return possiblePaths[0];
  }

  /**
   * Environment variables
   */
  prepareEnvironment() {
    const userDataPath = app.getPath('userData');
    const downloadsPath = this.downloadPath || path.join(app.getPath('downloads'), 'YT-Downloads');

    const resourcesPath = this.isDevelopment ? process.cwd() : process.resourcesPath;

    return {
      ...process.env,
      PORT: this.serverPort.toString(),
      NODE_ENV: this.isDevelopment ? 'development' : 'production',
      USER_DATA_PATH: userDataPath,
      DOWNLOADS_PATH: downloadsPath,
      ELECTRON_MODE: 'true',
      ELECTRON_APP_PATH: app.getAppPath(),
      ELECTRON_RESOURCES_PATH: resourcesPath,
      BROWSER: 'none',
    };
  }

  updateDownloadPath(newPath) {
    this.downloadPath = newPath;
    logger.info(`Download path updated to: ${newPath}`);
  }

  /**
   * Start backend server process
   */
  async startServerProcess(backendPath, env) {
    return new Promise((resolve, reject) => {
      const serverScript = path.join(backendPath, 'server.js');

      // Verify backend files exist
      if (!fs.existsSync(serverScript)) {
        const error = new Error(`Backend server script not found: ${serverScript}`);
        logger.error(error.message);
        
        // List what's actually in the backend directory
        const parentDir = path.dirname(serverScript);
        if (fs.existsSync(parentDir)) {
          logger.info(`Contents of ${parentDir}:`);
          try {
            const files = fs.readdirSync(parentDir);
            files.forEach(file => logger.info(`  - ${file}`));
          } catch (e) {
            logger.error(`Failed to list directory: ${e.message}`);
          }
        } else {
          logger.error(`Backend directory does not exist: ${parentDir}`);
        }
        
        return reject(error);
      }

      // Check if package.json exists
      const packageJson = path.join(backendPath, 'package.json');
      if (!fs.existsSync(packageJson)) {
        logger.warn(`Backend package.json not found at: ${packageJson}`);
      }

      logger.info(`Starting server process: node ${serverScript}`);
      logger.info(`Working directory: ${backendPath}`);

      this.serverProcess = spawn('node', [serverScript], {
        cwd: backendPath,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      let resolved = false;

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        logger.info(`[Backend] ${output}`);

        if (!resolved && (output.includes('listening on port') || output.includes('Server listening') || output.includes('Server ready'))) {
          resolved = true;
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        logger.error(`[Backend Error] ${error}`);
        
        // If we get a critical error before resolving, reject
        if (!resolved && (error.includes('Cannot find module') || error.includes('SyntaxError') || error.includes('Error:'))) {
          resolved = true;
          reject(new Error(`Backend startup error: ${error}`));
        }
      });

      this.serverProcess.on('exit', (code, signal) => {
        logger.info(`Backend server exited with code ${code}, signal ${signal}`);
        
        if (!resolved && code !== 0) {
          resolved = true;
          reject(new Error(`Backend process exited with code ${code}`));
        }
      });

      this.serverProcess.on('error', (error) => {
        logger.error('Backend server process error:', error);
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      });

      // Resolve anyway after timeout (backend might be running but not logging)
      setTimeout(() => {
        if (!resolved && this.serverProcess && !this.serverProcess.killed) {
          logger.warn('Backend started but no confirmation message received');
          resolved = true;
          resolve();
        }
      }, 8000);
    });
  }

  /**
   * Wait for server to become ready
   */
  async waitForServer() {
    const maxAttempts = 30;
    const delayMs = 1000;

    for (let i = 1; i <= maxAttempts; i++) {
      try {
        if (await this.healthCheck()) return;
      } catch {}

      await new Promise(r => setTimeout(r, delayMs));
    }

    throw new Error('Server failed to become ready within timeout');
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.serverPort) return false;

    return new Promise((resolve) => {
      const http = require('http');

      const req = http.request(
        {
          hostname: this.serverHost,
          port: this.serverPort,
          path: '/api/health',
          method: 'GET',
          timeout: 2000,
        },
        (res) => resolve(res.statusCode === 200)
      );

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  /**
   * Periodic health monitoring
   */
  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      const healthy = await this.healthCheck();

      if (!healthy) {
        logger.warn('Backend health check failed — restarting...');
        this.restart().catch(err => logger.error('Restart failed:', err));
      }
    }, 30000);
  }

  isRunning() {
    return this.serverProcess !== null && !this.serverProcess.killed;
  }

  /**
   * Check binary status from backend
   */
  async checkBinaryStatus() {
    if (!this.isRunning()) {
      return { ready: false, error: 'Backend server not running' };
    }

    try {
      const http = require('http');
      const url = `${this.getUrl()}/api/binaries/status`;

      return new Promise((resolve) => {
        const req = http.request(url, { method: 'GET', timeout: 5000 }, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const status = JSON.parse(data);
              resolve(status);
            } catch (error) {
              resolve({ ready: false, error: 'Failed to parse binary status' });
            }
          });
        });

        req.on('error', (error) => {
          logger.error('Failed to check binary status:', error);
          resolve({ ready: false, error: error.message });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ ready: false, error: 'Request timeout' });
        });

        req.end();
      });
    } catch (error) {
      logger.error('Error checking binary status:', error);
      return { ready: false, error: error.message };
    }
  }
}

module.exports = BackendServerManager;
