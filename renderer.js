const { ipcRenderer } = require('electron')
const installForgeBtn = document.getElementById('installForge')
const installModsBtn = document.getElementById('installMods')
const forgeProgress = document.getElementById('forgeProgress')
const modsProgress = document.getElementById('modsProgress')
const statusMessage = document.getElementById('statusMessage')

const bootstrap = require('bootstrap')

Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]')).forEach(tooltipTriggerEl => {
  new bootstrap.Tooltip(tooltipTriggerEl)
})

installForgeBtn.addEventListener('click', () => {
  forgeProgress.classList.remove('d-none')
  installForgeBtn.disabled = true
  statusMessage.textContent = 'Téléchargement et installation de Forge en cours...'
  ipcRenderer.invoke('install-forge')
})

ipcRenderer.on('forge-download-progress', (event, percentage) => {
  const progressBar = forgeProgress.querySelector('.progress-bar')
  progressBar.style.width = `${percentage}%`
})

ipcRenderer.on('install-forge-reply', (event, arg) => {
  forgeProgress.classList.add('d-none')
  installForgeBtn.disabled = false
  if (arg.success) {
    statusMessage.textContent = 'Forge a été installé avec succès.'
  } else {
    statusMessage.textContent = 'Une erreur est survenue lors de l\'installation de Forge.'
  }
})

installModsBtn.addEventListener('click', () => {
  modsProgress.classList.remove('d-none')
  installModsBtn.disabled = true
  statusMessage.textContent = 'Téléchargement et installation des mods en cours...'
  ipcRenderer.invoke('install-mods')
})

ipcRenderer.on('mods-download-progress', (event, data) => {
  const progressBar = modsProgress.querySelector('.progress-bar')
  progressBar.style.width = `${data.percentage}%`
})

ipcRenderer.on('install-mods-reply', (event, arg) => {
  modsProgress.classList.add('d-none')
  installModsBtn.disabled = false
  if (arg.success) {
    statusMessage.textContent = 'Les mods ont été installés avec succès.'
  } else {
    statusMessage.textContent = 'Une erreur est survenue lors de l\'installation des mods.'
  }
})