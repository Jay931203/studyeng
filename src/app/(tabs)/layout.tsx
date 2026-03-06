import { BottomNav } from '@/components/BottomNav'

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-dvh flex flex-col">
      <main className="flex-1 overflow-hidden">{children}</main>
      <BottomNav />
    </div>
  )
}
