import BottomNav from '@/components/navigation/BottomNav'
import Sidebar from '@/components/navigation/Sidebar'
import ModerationGuard from '@/components/moderation/ModerationGuard'
import { InstallBanner } from '@/components/pwa/InstallPrompt'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ModerationGuard>
      <div className="min-h-screen bg-black">
        {/* Desktop Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="lg:ml-64">
          <div className="safe-area-top lg:hidden" />
          <main className="pb-20 lg:pb-0 min-h-screen">
            {children}
          </main>
        </div>
        
        {/* Mobile Bottom Nav */}
        <BottomNav />

        {/* PWA Install Banner - shows for first-time visitors */}
        <InstallBanner />
      </div>
    </ModerationGuard>
  )
}
