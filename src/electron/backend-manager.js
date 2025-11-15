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
   * FIXED VERSION — Correct backend path for production
   */
  getBackendPath() {
    if (this.isDevelopment) {
      return path.join(process.cwd(), 'backend');
    }

    const appPath = app.getAppPath();

    // Production mode: backend unpacked inside resources/app.asar.unpacked/
    if (appPath.includes('app.asar')) {
      return path.join(process.resourcesPath, 'app.asar.unpacked', 'backend');
    }

    // Fallback
    return path.join(process.resourcesPath, 'backend');
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

      if (!fs.existsSync(serverScript)) {
        return reject(new Error(`Backend server script not found: ${serverScript}`));
      }

      logger.info(`Starting server process: node ${serverScript}`);

      this.serverProcess = spawn('node', [serverScript], {
        cwd: backendPath,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        logger.info(`[Backend] ${output}`);

        if (output.includes('listening on port') || output.includes('Server listening')) {
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        logger.error(`[Backend Error] ${data.toString().trim()}`);
      });

      this.serverProcess.on('exit', (code, signal) => {
        logger.info(`Backend server exited with code ${code}, signal ${signal}`);
      });

      this.serverProcess.on('error', (error) => {
        logger.error('Backend server process error:', error);
        reject(error);
      });

      // Resolve anyway after timeout
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          resolve();
        }
      }, 5000);
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
}

module.exports = BackendServerManager;
