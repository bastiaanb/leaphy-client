const { app } = require('electron');
const path = require("path");
const nativeImage = require('electron').nativeImage;

const squirrel = require('./electron/squirrel.js');
if (squirrel.handleEvent(app, path)) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}

const { BrowserWindow } = require('electron');
const url = require("url");

let mainWindow;

app.on('ready', createWindow)
app.on('window-all-closed', function () { if (process.platform !== 'darwin') app.quit() })
app.on('activate', function () { if (mainWindow === null) createWindow() })
app.setAppLogsPath();

const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const os = require("os");
const util = require('util');
const asyncExecFile = util.promisify(require('child_process').execFile);

const Executable = require('./electron/executable.js');
const executable = new Executable(asyncExecFile);

const ArduinoCli = require('./electron/arduinoCli.js');
const arduinoCli = new ArduinoCli(executable, os, path, app);

const PrerequisiteManager = require('./electron/prerequisiteManager');
const prerequisiteManager = new PrerequisiteManager(arduinoCli, executable, os, app, path);
ipcMain.on('verify-installation', prerequisiteManager.verifyInstallation);
ipcMain.on('install-usb-driver', prerequisiteManager.installUsbDriver);

const Compiler = require('./electron/compiler.js');
const compiler = new Compiler(app, arduinoCli, path, fs);
ipcMain.on('compile', compiler.compile);

const DeviceManager = require('./electron/deviceManager.js');
const deviceManager = new DeviceManager(arduinoCli);
ipcMain.on('update-device', deviceManager.updateDevice);
ipcMain.on('get-serial-devices', deviceManager.getDevices);

const WorkspaceManager = require('./electron/workspaceManager');
const workspaceManager = new WorkspaceManager(fs, dialog);
ipcMain.on('save-workspace', workspaceManager.save);
ipcMain.on('save-workspace-as', workspaceManager.saveAs);
ipcMain.on('restore-workspace', workspaceManager.restore);

const WebBrowserLauncher = require('./electron/webBrowserLauncher');
const webBrowserLauncher = new WebBrowserLauncher(os);
ipcMain.on('open-browser-page', webBrowserLauncher.openWebPage);

const firstRun = require('electron-first-run');
const FirstRunDetector = require('./electron/firstRunDetector');
const firstRunDetector = new FirstRunDetector(firstRun);
ipcMain.on('detect-first-run', firstRunDetector.detectFirstRun);

function loadUrl(mainWindow) {
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "dist", "index.html"),
            protocol: "file:",
            slashes: true,
        })
    );
}

function createWindow() {
    var image = nativeImage.createFromPath(__dirname + '/easybloqs-app-icon.png');
    image.setTemplateImage(true);

    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        icon: image
    })

    mainWindow.maximize();
    mainWindow.setMenu(null);
    mainWindow.setMenuBarVisibility(false);

    loadUrl(mainWindow);

    // Open the DevTools.
    //mainWindow.webContents.openDevTools()

    mainWindow.on('closed', function () {
        mainWindow = null
    })

    mainWindow.webContents.on('did-fail-load', function () {
        loadUrl(mainWindow);
    })
}