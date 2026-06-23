import Link from "next/link";
import { BarChart3, Database, Goal, LineChart, Megaphone, WalletCards } from "lucide-react";

const navItems = [
  { href: "/sales", label: "销售总览", icon: LineChart },
  { href: "/ads", label: "流量广告", icon: Megaphone },
  { href: "/profit", label: "利润分析", icon: WalletCards },
  { href: "/targets", label: "目标达成", icon: Goal },
  { href: "/data-status", label: "数据状态", icon: Database },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-line bg-ink text-white lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <BarChart3 className="h-5 w-5 text-teal-300" />
          <div className="text-sm font-semibold leading-5">电商运营数据看板</div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-slate-200 hover:bg-white/10 hover:text-white"
                href={item.href}
                prefetch={false}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="lg:pl-56">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-white/95 px-5 backdrop-blur">
          <div>
            <div className="text-base font-semibold text-ink">运营经营数据</div>
            <div className="text-xs text-muted">销售、广告、利润、目标与采集状态</div>
          </div>
          <div className="text-xs text-muted">数据非实时，请以状态页最新日期为准</div>
        </header>
        <div className="mx-auto max-w-[1480px] px-5 py-5">{children}</div>
      </main>
    </div>
  );
}
