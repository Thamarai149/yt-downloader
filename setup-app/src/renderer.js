// Global variables
let currentSettings = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await checkServerStatus();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Backend status updates
    window.electronAPI.onBackendStatus((data) => {
        updateServerStatus(data.running, data.error);
    });

    // Installation progress updates
    window.electronAPI.onInstallProgress((data) => {
        appendToInstallOutput(data);
    });
}

// Tab management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Settings management
async function loadSettings() {
    try {
        currentSettings = await window.electronAPI.getSettings();
        
        document.getElementById('backendPath').value = currentSettings.backendPath || '';
        document.getElementById('serverPort').value = currentSettings.serverPort || 3000;
        document.getElementById('telegramToken').value = currentSettings.telegramToken || '';
        document.getElementById('downloadPath').value = currentSettings.downloadPath || '';
        document.getElementById('autoStart').checked = currentSettings.autoStart || false;
        
        // Update server URLs
        updateServerUrls(currentSettings.serverPort || 3000);
    } catch (error) {
        console.error('Failed to load settings:', error);
        showNotification('Failed to load settings', 'error');
    }
}

async function saveSettings() {
    try {
        const settings = {
            backendPath: document.getElementById('backendPath').value,
            serverPort: parseInt(document.getElementById('serverPort').value),
            telegramToken: document.getElementById('telegramToken').value,
            downloadPath: document.getElementById('downloadPath').value,
            autoStart: document.getElementById('autoStart').checked
        };
        
        await window.electronAPI.saveSettings(settings);
        currentSettings = settings;
        updateServerUrls(settings.serverPort);
        showNotification('Settings saved successfully!', 'success');
    } catch (error) {
        console.error('Failed to save settings:', error);
        showNotification('Failed to save settings', 'error');
    }
}

async function selectBackendPath() {
    try {
        const path = await window.electronAPI.selectFolder();
        if (path) {
            document.getElementById('backendPath').value = path;
        }
    } catch (error) {
        console.error('Failed to select backend path:', error);
        showNotification('Failed to select folder', 'error');
    }
}

async function selectDownloadPath() {
    try {
        const path = await window.electronAPI.selectFolder();
        if (path) {
            document.getElementById('downloadPath').value = path;
        }
    } catch (error) {
        console.error('Failed to select download path:', error);
        showNotification('Failed to select folder', 'error');
    }
}

// Server management
async function startServer() {
    try {
        const result = await window.electronAPI.startBackend();
        if (result.success) {
            showNotification('Server starting...', 'info');
            updateServerStatus(true);
        } else {
            showNotification(`Failed to start server: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Failed to start server:', error);
        showNotification('Failed to start server', 'error');
    }
}

async function stopServer() {
    try {
        const result = await window.electronAPI.stopBackend();
        if (result.success) {
            showNotification('Server stopped', 'info');
            updateServerStatus(false);
        } else {
            showNotification(`Failed to stop server: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Failed to stop server:', error);
        showNotification('Failed to stop server', 'error');
    }
}

async function checkServerStatus() {
    try {
        const status = await window.electronAPI.getBackendStatus();
        updateServerStatus(status.running);
    } catch (error) {
        console.error('Failed to check server status:', error);
    }
}

function updateServerStatus(running, error = null) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (running) {
        statusDot.className = 'status-dot running';
        statusText.textContent = 'Server Running';
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        statusDot.className = 'status-dot stopped';
        statusText.textContent = error ? `Server Error: ${error}` : 'Server Stopped';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

function updateServerUrls(port) {
    document.getElementById('webUrl').textContent = `http://localhost:${port}`;
    document.getElementById('apiUrl').textContent = `http://localhost:${port}/api`;
}

// Installation management
async function installDependencies() {
    try {
        const installOutput = document.getElementById('installOutput');
        installOutput.textContent = 'Starting installation...\n';
        
        const result = await window.electronAPI.installDependencies();
        
        if (result.success) {
            appendToInstallOutput('\n✅ Installation completed successfully!\n');
            showNotification('Dependencies installed successfully!', 'success');
        } else {
            appendToInstallOutput(`\n❌ Installation failed with exit code: ${result.exitCode}\n`);
            showNotification('Installation failed', 'error');
        }
    } catch (error) {
        console.error('Failed to install dependencies:', error);
        showNotification('Failed to install dependencies', 'error');
    }
}

function appendToInstallOutput(text) {
    const installOutput = document.getElementById('installOutput');
    installOutput.textContent += text;
    installOutput.scrollTop = installOutput.scrollHeight;
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        zIndex: '1000',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease'
    });
    
    // Set background color based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8',
        warning: '#ffc107'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    window.electronAPI.removeAllListeners('backend-status');
    window.electronAPI.removeAllListeners('install-progress');
});