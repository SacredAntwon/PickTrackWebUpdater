// PickTrack Web Updater
// ESP32 firmware flashing tool for PickTrack devices

class PickTrackUpdater {
    constructor() {
        this.espStub = null;
        this.isConnected = false;
        this.currentStep = 0;
        this.totalSteps = 3;
        this.consoleCollapsed = true;
        
        // Firmware configuration
        this.firmwareConfig = {
            files: {
                bootloader: 'firmware/bootloader.bin',
                partitions: 'firmware/partitions.bin',
                firmware: 'firmware/firmware.bin'
            },
            offsets: {
                bootloader: 0x1000,
                partitions: 0x8000,
                firmware: 0x10000
            },
            expectedChip: 'ESP32',
            latestVersion: 'Device-v1.0.3 • App-v1.1.1'
        };

        // Mobile app download URL
        this.appDownloadUrl = 'https://expo.dev/accounts/sacredantwon/projects/picktrack/builds/9212a989-1c44-4fc1-8f8d-6985490aa921';
        
        this.initializeUI();
        this.setupEventListeners();
        this.checkBrowserSupport();
        this.loadChangelog();
        this.generateQRCode();
    }

    initializeUI() {
        // Get UI element references
        this.elements = {
            connectBtn: document.getElementById('connectBtn'),
            flashBtn: document.getElementById('flashBtn'),
            eraseBtn: document.getElementById('eraseBtn'),
            clearBtn: document.getElementById('clearBtn'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            deviceInfo: document.getElementById('deviceInfo'),
            macAddress: document.getElementById('macAddress'),
            latestVersion: document.getElementById('latestVersion'),
            progressCard: document.getElementById('progressCard'),
            progressFill: document.getElementById('progressFill'),
            progressPercent: document.getElementById('progressPercent'),
            progressStatus: document.getElementById('progressStatus'),
            console: document.getElementById('console'),
            notSupported: document.getElementById('notSupported'),
            consoleHeader: document.getElementById('consoleHeader'),
            consoleToggle: document.getElementById('consoleToggle'),
            consoleContent: document.getElementById('consoleContent'),
            changelogContent: document.getElementById('changelogContent'),
            qrCode: document.getElementById('qrCode'),
            qrUrl: document.getElementById('qrUrl')
        };

        // Set version display
        this.elements.latestVersion.textContent = this.firmwareConfig.latestVersion;
    }

    setupEventListeners() {
        this.elements.connectBtn.addEventListener('click', () => this.handleConnect());
        this.elements.flashBtn.addEventListener('click', () => this.handleFlash());
        this.elements.eraseBtn.addEventListener('click', () => this.handleErase());
        this.elements.clearBtn.addEventListener('click', () => this.clearConsole());
        this.elements.consoleHeader.addEventListener('click', () => this.toggleConsole());

        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            if (this.espStub) {
                this.espStub.disconnect();
            }
        });
    }

    checkBrowserSupport() {
        if ('serial' in navigator) {
            this.elements.notSupported.classList.add('hidden');
            this.log('PickTrack Web Updater loaded successfully', 'info');
        } else {
            this.elements.notSupported.classList.remove('hidden');
            this.log('Web Serial not supported in this browser', 'error');
        }
    }

    async loadChangelog() {
        try {
            const response = await fetch('changelog.txt');
            if (response.ok) {
                const changelogText = await response.text();
                this.elements.changelogContent.innerHTML = `<pre>${changelogText}</pre>`;
            } else {
                throw new Error(`Failed to load changelog: ${response.statusText}`);
            }
        } catch (error) {
            this.log(`Failed to load changelog: ${error.message}`, 'warning');
            this.elements.changelogContent.innerHTML = '<p>This will update your PickTrack device to the latest firmware version with bug fixes and new features.</p>';
        }
    }

    toggleConsole() {
        this.consoleCollapsed = !this.consoleCollapsed;
        
        if (this.consoleCollapsed) {
            this.elements.consoleContent.classList.add('hidden');
            this.elements.consoleToggle.textContent = '▼';
        } else {
            this.elements.consoleContent.classList.remove('hidden');
            this.elements.consoleToggle.textContent = '▲';
        }
    }

    async handleConnect() {
        if (this.isConnected) {
            await this.disconnect();
            return;
        }

        try {
            this.elements.connectBtn.disabled = true;
            this.elements.connectBtn.textContent = 'Connecting...';
            this.log('Attempting to connect to PickTrack device...', 'info');

            await this.connect();
        } catch (error) {
            this.log(`Connection failed: ${error.message}`, 'error');
            this.updateConnectionStatus(false);
        } finally {
            this.elements.connectBtn.disabled = false;
        }
    }

    async connect() {
        const esploaderMod = await window.esptoolPackage;
        
        const esploader = await esploaderMod.connect({
            log: (...args) => this.log(args.join(' ')),
            debug: (...args) => this.log(`[DEBUG] ${args.join(' ')}`, 'info'),
            error: (...args) => this.log(`[ERROR] ${args.join(' ')}`, 'error'),
        });

        try {
            await esploader.initialize();

            // Validate device compatibility
            if (!esploader.chipName.includes('ESP32')) {
                throw new Error(`Invalid device detected: ${esploader.chipName}. PickTrack requires ESP32.`);
            }

            this.log(`Connected to ${esploader.chipName}`, 'success');
            this.log(`MAC Address: ${this.formatMacAddress(esploader.macAddr())}`, 'info');

            this.espStub = await esploader.runStub();
            this.updateConnectionStatus(true, esploader.macAddr());

            this.espStub.addEventListener('disconnect', () => {
                this.updateConnectionStatus(false);
                this.log('Device disconnected', 'warning');
            });

        } catch (error) {
            await esploader.disconnect();
            throw error;
        }
    }

    async disconnect() {
        if (this.espStub) {
            try {
                await this.espStub.disconnect();
                await this.espStub.port.close();
            } catch (error) {
                this.log(`Disconnect error: ${error.message}`, 'warning');
            }
            this.espStub = null;
        }
        this.updateConnectionStatus(false);
        this.log('Disconnected from device', 'info');
    }

    updateConnectionStatus(connected, macAddr = null) {
        this.isConnected = connected;
        
        if (connected) {
            this.elements.statusDot.className = 'status-dot connected';
            this.elements.statusText.textContent = 'Connected';
            this.elements.connectBtn.textContent = 'Disconnect';
            this.elements.deviceInfo.classList.remove('hidden');
            this.elements.macAddress.textContent = macAddr ? this.formatMacAddress(macAddr) : '-';
            this.elements.flashBtn.disabled = false;
            this.elements.eraseBtn.disabled = false;
        } else {
            this.elements.statusDot.className = 'status-dot disconnected';
            this.elements.statusText.textContent = 'Disconnected';
            this.elements.connectBtn.textContent = 'Connect PickTrack Device';
            this.elements.deviceInfo.classList.add('hidden');
            this.elements.flashBtn.disabled = true;
            this.elements.eraseBtn.disabled = true;
        }
    }

    async handleFlash() {
        if (!this.isConnected) {
            this.log('No device connected', 'error');
            return;
        }

        const confirmed = confirm(
            'This will update your PickTrack device firmware. ' +
            'Do not disconnect the device during this process. Continue?'
        );

        if (!confirmed) return;

        try {
            this.elements.flashBtn.disabled = true;
            this.elements.eraseBtn.disabled = true;
            this.showProgress(true);
            
            await this.flashFirmware();
            
            this.log('Firmware update completed successfully!', 'success');
            this.log('Resetting device...', 'info');
            
            // Reset device to start new firmware
            await this.resetDevice();
            
            this.log('Device reset complete. New firmware is now running.', 'success');
            
        } catch (error) {
            this.log(`Flash failed: ${error.message}`, 'error');
        } finally {
            this.elements.flashBtn.disabled = false;
            this.elements.eraseBtn.disabled = false;
            this.showProgress(false);
        }
    }

    async flashFirmware() {
        const files = ['bootloader', 'partitions', 'firmware'];
        let totalSize = 0;
        let flashedSize = 0;

        // Calculate total firmware size
        this.log('Calculating firmware size...', 'info');
        for (const file of files) {
            const response = await fetch(this.firmwareConfig.files[file], { method: 'HEAD' });
            const size = parseInt(response.headers.get('content-length') || '0');
            totalSize += size;
        }

        this.log(`Total firmware size: ${(totalSize / 1024).toFixed(1)} KB`, 'info');

        // Flash each firmware component
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            const filePath = this.firmwareConfig.files[fileName];
            const offset = this.firmwareConfig.offsets[fileName];

            this.updateStepStatus(i + 1, '⏳');
            this.log(`Flashing ${fileName}...`, 'info');

            try {
                // Download firmware file
                const response = await fetch(filePath);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
                }
                
                const arrayBuffer = await response.arrayBuffer();
                
                // Flash to device
                await this.espStub.flashData(
                    arrayBuffer,
                    (bytesFlashed) => {
                        const currentFileProgress = flashedSize + bytesFlashed;
                        const percentage = Math.min((currentFileProgress / totalSize) * 100, 100);
                        this.updateProgress(percentage, `Flashing ${fileName}...`);
                    },
                    offset
                );

                flashedSize += arrayBuffer.byteLength;
                this.updateStepStatus(i + 1, '✅');
                this.log(`${fileName} flashed successfully`, 'success');

            } catch (error) {
                this.updateStepStatus(i + 1, '❌');
                throw new Error(`Failed to flash ${fileName}: ${error.message}`);
            }
        }

        this.updateProgress(100, 'Update complete!');
    }

    async resetDevice() {
        try {
            // Perform hardware reset to restart the device with new firmware
            await this.espStub.hardReset();
            this.log('Device reset successfully', 'success');
        } catch (error) {
            this.log(`Reset failed: ${error.message}`, 'warning');
            this.log('You may need to manually reset your device', 'info');
        }
    }

    async handleErase() {
        if (!this.isConnected) {
            this.log('No device connected', 'error');
            return;
        }

        const confirmed = confirm(
            'WARNING: This will completely erase your PickTrack device firmware. ' +
            'This action cannot be undone. Continue?'
        );

        if (!confirmed) return;

        try {
            this.elements.eraseBtn.disabled = true;
            this.elements.flashBtn.disabled = true;
            
            this.log('Erasing device flash memory...', 'warning');
            const startTime = Date.now();
            
            await this.espStub.eraseFlash();
            
            const duration = Date.now() - startTime;
            this.log(`Device erased successfully in ${duration}ms`, 'success');
            
        } catch (error) {
            this.log(`Erase failed: ${error.message}`, 'error');
        } finally {
            this.elements.eraseBtn.disabled = false;
            this.elements.flashBtn.disabled = false;
        }
    }

    showProgress(show) {
        if (show) {
            this.elements.progressCard.classList.remove('hidden');
            this.resetProgress();
        } else {
            setTimeout(() => {
                this.elements.progressCard.classList.add('hidden');
            }, 2000);
        }
    }

    resetProgress() {
        this.updateProgress(0, 'Preparing...');
        for (let i = 1; i <= 3; i++) {
            this.updateStepStatus(i, '⏳');
        }
    }

    updateProgress(percentage, status) {
        this.elements.progressFill.style.width = `${percentage}%`;
        this.elements.progressPercent.textContent = `${Math.round(percentage)}%`;
        this.elements.progressStatus.textContent = status;
    }

    updateStepStatus(step, status) {
        const statusElement = document.getElementById(`status${step}`);
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    formatMacAddress(macAddr) {
        return macAddr
            .map(byte => byte.toString(16).toUpperCase().padStart(2, '0'))
            .join(':');
    }

    log(message, type = 'log') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-message log-${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        this.elements.console.appendChild(logEntry);
        this.elements.console.scrollTop = this.elements.console.scrollHeight;

        // Limit console history to prevent memory issues
        const maxMessages = 100;
        while (this.elements.console.children.length > maxMessages) {
            this.elements.console.removeChild(this.elements.console.firstChild);
        }
    }

    clearConsole() {
        this.elements.console.innerHTML = '';
        this.log('Console cleared', 'info');
    }

    generateQRCode() {
        // Generate QR code using external API service
        const timestamp = Date.now();
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.appDownloadUrl)}&cache=${timestamp}`;
        
        this.elements.qrCode.src = qrApiUrl;
        this.elements.qrUrl.textContent = this.appDownloadUrl;
        
        this.log(`QR code generated for: ${this.appDownloadUrl}`, 'info');
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.picktrackUpdater = new PickTrackUpdater();
});