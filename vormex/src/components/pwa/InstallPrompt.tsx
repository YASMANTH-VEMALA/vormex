'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    if (deferredPrompt) setCanInstall(true)

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }

    const installed = () => {
      setCanInstall(false)
      deferredPrompt = null
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    setCanInstall(false)
    return outcome === 'accepted'
  }

  return { canInstall, install }
}

export function InstallBanner() {
  const [show, setShow] = useState(false)
  const { canInstall, install } = usePWAInstall()

  useEffect(() => {
    if (!canInstall) return
    const dismissed = localStorage.getItem('install_dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 86400000) return
    setTimeout(() => setShow(true), 2000)
  }, [canInstall])

  if (!show || !canInstall) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 lg:bottom-8 lg:right-8 lg:left-auto lg:max-w-sm z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 shadow-2xl">
        <button
          onClick={() => {
            setShow(false)
            localStorage.setItem('install_dismissed', Date.now().toString())
          }}
          className="absolute top-2 right-2 p-1.5 text-white/60 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">V</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">Install Vormex</h3>
            <p className="text-white/70 text-sm">Add to home screen</p>
          </div>
        </div>

        <button
          onClick={async () => {
            const success = await install()
            if (success) setShow(false)
          }}
          className="mt-4 w-full bg-white text-indigo-600 font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Install App
        </button>
      </div>
    </div>
  )
}

export function InstallButton() {
  const { canInstall, install } = usePWAInstall()
  if (!canInstall) return null

  return (
    <button
      onClick={install}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800/50 hover:text-green-400 w-full"
    >
      <Download className="w-5 h-5" />
      <span className="font-medium">Install App</span>
    </button>
  )
}
