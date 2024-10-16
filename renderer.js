const { ipcRenderer } = require('electron')

const installForgeBtn = document.getElementById('installForge')
const installModsBtn = document.getElementById('installMods')
const forgeProgress = document.getElementById('forgeProgress')
const modsProgress = document.getElementById('modsProgress')
const statusMessage = document.getElementById('statusMessage')
const modNameDisplay = document.getElementById('modName')
const modProgressBar = document.getElementById('modProgressBar')

installForgeBtn.addEventListener('click', () => {
  forgeProgress.classList.remove('hidden')
  installForgeBtn.disabled = true
  statusMessage.textContent = 'Téléchargement et installation de Forge en cours...'
  ipcRenderer.invoke('install-forge')
})

ipcRenderer.on('forge-download-progress', (event, percentage) => {
  const progressBar = forgeProgress.querySelector('div')
  progressBar.style.width = `${percentage}%`
})

ipcRenderer.on('install-forge-reply', (event, arg) => {
  forgeProgress.classList.add('hidden')
  installForgeBtn.disabled = false
  if (arg.success) {
    statusMessage.textContent = 'Forge a été installé avec succès.'
  } else {
    statusMessage.textContent = 'Une erreur est survenue lors de l\'installation de Forge.'
  }
})

installModsBtn.addEventListener('click', async () => {
  const hasExistingMods = await ipcRenderer.invoke('check-existing-mods')
  if (hasExistingMods) {
    const proceed = confirm('Attention ! Des mods ont été détectés dans votre dossier, ils seront sauvegardés sur votre bureau et remplacés. Voulez-vous continuer ?')
    if (!proceed) {
      return
    }
  }

  modsProgress.classList.remove('hidden')
  installModsBtn.disabled = true
  statusMessage.textContent = 'Téléchargement et installation des mods en cours...'
  modNameDisplay.textContent = ''
  modProgressBar.style.width = '0%'
  ipcRenderer.invoke('install-mods')
})

ipcRenderer.on('mod-start', (event, modName) => {
  console.log(`Début de l'installation du mod : ${modName}`)
  modNameDisplay.textContent = `Installation de ${modName}...`
  modProgressBar.style.width = '0%'
})

ipcRenderer.on('mods-download-progress', (event, data) => {
  modProgressBar.style.width = `${data.percentage}%`
})

ipcRenderer.on('install-mods-reply', (event, arg) => {
  modsProgress.classList.add('hidden')
  installModsBtn.disabled = false
  modNameDisplay.textContent = ''
  if (arg.success) {
    statusMessage.textContent = 'Les mods ont été installés avec succès.'
  } else {
    statusMessage.textContent = 'Une erreur est survenue lors de l\'installation des mods.'
  }
})