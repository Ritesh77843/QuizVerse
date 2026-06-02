import { HostSidebar } from '@/components/layout/HostSidebar';

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#1E5136] to-[#0A2616] text-white">
      <HostSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
