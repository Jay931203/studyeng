import { BottomNav } from '@/components/BottomNav'
import { LevelUpModal } from '@/components/LevelUpModal'

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-dvh flex flex-col">
      <main className="flex-1 overflow-hidden">{children}</main>
      <BottomNav />
      <LevelUpModal />
    </div>
  )
}
