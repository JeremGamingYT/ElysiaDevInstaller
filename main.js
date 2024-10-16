const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs-extra')
const { exec } = require('child_process')
const axios = require('axios')
const progress = require('progress-stream')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
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
  const forgeUrl = 'https://raw.githubusercontent.com/JeremGamingYT/ElysiaDevInstaller/main/Installer/forge/forge-installer.jar'
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
    // Exécution de l'installateur Forge
    exec(`java -jar "${installerPath}"`, { maxBuffer: 1024 * 500 }, (error) => {
      if (error) {
        console.error(`Erreur lors de l'installation de Forge: ${error.message}`)
        event.sender.send('install-forge-reply', { success: false })
      } else {
        event.sender.send('install-forge-reply', { success: true })
      }
    })    
  } catch (error) {
    console.error(`Erreur lors du téléchargement de Forge: ${error.message}`)
    event.sender.send('install-forge-reply', { success: false })
  }
})

ipcMain.handle('install-mods', async (event) => {
  const mods = [
    { name: 'AmbientSounds_FORGE_v6.1.1_mc1.20.1.jar', url: 'https://raw.githubusercontent.com/JeremGamingYT/ElysiaDevInstaller/main/Installer/mods/AmbientSounds_FORGE_v6.1.1_mc1.20.1.jar' },
    { name: 'Animation_Overhaul-forge-1.20.x-1.3.1.jar', url: 'https://raw.githubusercontent.com/JeremGamingYT/ElysiaDevInstaller/main/Installer/mods/Animation_Overhaul-forge-1.20.x-1.3.1.jar' },
    { name: 'BetterAnimationsCollection-v8.0.0-1.20.1-Forge.jar', url: 'https://raw.githubusercontent.com/JeremGamingYT/ElysiaDevInstaller/main/Installer/mods/BetterAnimationsCollection-v8.0.0-1.20.1-Forge.jar' },
    { name: 'BetterThirdPerson-Forge-1.20-1.9.0.jar', url: 'https://raw.githubusercontent.com/JeremGamingYT/ElysiaDevInstaller/main/Installer/mods/BetterThirdPerson-Forge-1.20-1.9.0.jar' },
    { name: 'BiomesOPlenty-forge-1.20.1-19.0.0.91.jar', url: 'https://raw.githubusercontent.com/JeremGamingYT/ElysiaDevInstaller/main/Installer/mods/BiomesOPlenty-forge-1.20.1-19.0.0.91.jar' },
    { name: 'BuildPasteMod-1.20.1v1.11.jar', url: 'https://raw.githubusercontent.com/JeremGamingYT/ElysiaDevInstaller/main/Installer/mods/BuildPasteMod-1.20.1v1.11.jar' },
    { name: 'ChatNotify-Forge-1.20.1-1.3.0.jar', url: 'https://raw.githubusercontent.com/JeremGamingYT/ElysiaDevInstaller/main/Installer/mods/ChatNotify-Forge-1.20.1-1.3.0.jar' },
    { name: 'Chipped-forge-1.20.1-3.0.6.jar', url: 'https://raw.githubusercontent.com/JeremGamingYT/ElysiaDevInstaller/main/Installer/mods/Chipped-forge-1.20.1-3.0.6.jar' },
    { name: 'Clumps-forge-1.20.1-12.0.0.4.jar', url: 'https://raw.githubusercontent.com/JeremGamingYT/ElysiaDevInstaller/main/Installer/mods/Clumps-forge-1.20.1-12.0.0.4.jar' }
    // Ajoutez les autres mods de la même manière
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
    console.error(`Erreur lors de l'installation des mods: ${error.message}`)
    event.sender.send('install-mods-reply', { success: false })
  }
})