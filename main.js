const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs-extra')
const { exec } = require('child_process')
const axios = require('axios')
const progress = require('progress-stream')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    resizable: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  mainWindow.setMenu(null)
  mainWindow.loadFile('index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('install-forge', async (event) => {
  const forgeUrl = 'https://github.com/VotreUtilisateur/VotreDepot/raw/main/installer/forge/forge-installer.jar'
  const installerPath = path.join(app.getPath('temp'), 'forge-installer.jar')
  try {
    const response = await axios.get(forgeUrl, { responseType: 'stream' })
    const totalLength = response.headers['content-length']
    const writer = fs.createWriteStream(installerPath)
    const progStream = progress({
      length: totalLength,
      time: 100
    })
    progStream.on('progress', (progressData) => {
      event.sender.send('forge-download-progress', progressData.percentage)
    })
    response.data.pipe(progStream).pipe(writer)
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
    exec(`"${installerPath}"`, (error) => {
      if (error) event.sender.send('install-forge-reply', { success: false })
      else event.sender.send('install-forge-reply', { success: true })
    })
  } catch {
    event.sender.send('install-forge-reply', { success: false })
  }
})

ipcMain.handle('install-mods', async (event) => {
  const mods = [
    { name: 'mod1.jar', url: 'https://github.com/VotreUtilisateur/VotreDepot/raw/main/installer/mods/mod1.jar' },
    { name: 'mod2.jar', url: 'https://github.com/VotreUtilisateur/VotreDepot/raw/main/installer/mods/mod2.jar' }
  ]
  const modsDestPath = path.join(app.getPath('appData'), '.minecraft', 'mods')

  try {
    const desktopPath = app.getPath('desktop')
    const backupModsPath = path.join(desktopPath, 'mods_backup_' + Date.now())

    // Vérifier si le dossier mods existe déjà
    if (await fs.pathExists(modsDestPath)) {
      // Déplacer le dossier mods existant vers le bureau
      await fs.move(modsDestPath, backupModsPath)
    }

    await fs.ensureDir(modsDestPath)

    for (const mod of mods) {
      const modPath = path.join(modsDestPath, mod.name)
      const response = await axios.get(mod.url, { responseType: 'stream' })
      const totalLength = response.headers['content-length']
      const writer = fs.createWriteStream(modPath)
      const progStream = progress({
        length: totalLength,
        time: 100
      })
      progStream.on('progress', (progressData) => {
        event.sender.send('mods-download-progress', { name: mod.name, percentage: progressData.percentage })
      })
      response.data.pipe(progStream).pipe(writer)
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })
    }
    event.sender.send('install-mods-reply', { success: true })
  } catch (error) {
    event.sender.send('install-mods-reply', { success: false })
  }
})