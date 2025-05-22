# PickTrack Web Updater

A modern web-based firmware flashing tool for PickTrack devices, built with Web Serial API for seamless browser-based updates.

![PickTrack Web Updater](assets/logo.png)

## 🚀 Features

- **Browser-Based Flashing**: No software installation required - runs directly in your web browser
- **Automatic Device Detection**: Validates device compatibility and displays device information
- **Real-Time Progress**: Live progress tracking with detailed step-by-step updates
- **Automatic Reset**: Device automatically restarts after firmware update
- **Mobile App Integration**: Built-in QR code for easy mobile app download
- **Console Logging**: Detailed logging with expandable console for debugging

## 🔧 Requirements

### Browser Compatibility

- **Chrome** 89+ (recommended)
- **Edge** 89+
- **Opera** 75+
- Other Chromium-based browsers with Web Serial API support

### Device Compatibility

- PickTrack devices only

### Network Requirements

- HTTPS connection (required for Web Serial API)
- Internet access for external dependencies

## 🎯 Usage

### Flashing Firmware

1. **Open the web updater** in a supported browser
2. **Connect your PickTrack device** via USB
3. **Click "Connect PickTrack Device"** and select your device from the browser prompt
4. **Verify device info** - MAC address will be displayed when connected
5. **Click "Update Firmware"** to begin the flashing process
6. **Wait for completion** - do not disconnect during the process
7. **Device will automatically reset** and run the new firmware

## ⚙️ Device Management

- **View Device Info**: MAC address and connection status
- **Erase Device**: Complete flash memory wipe (use with caution)
- **Console Monitoring**: Real-time logging with toggle visibility
- **Mobile App Access**: Scan QR code to download companion app

## 🐛 Troubleshooting

### Connection Issues

- **"Browser Not Supported"**: Use Chrome, Edge, or another Chromium-based browser
- **Device not detected**: Ensure USB cable supports data transfer (not just charging)
- **Permission denied**: Grant browser permission to access serial ports
- **Connection fails**: Try different USB port or cable

### Flashing Problems

- **Flash fails**: Ensure device remains connected throughout the process
- **Still failing**: Unplug the device, refresh the page and plug it back in

---

**PickTrack Web Updater** • By Sacred Labs • Only use with official PickTrack devices.
