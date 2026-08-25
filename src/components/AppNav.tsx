import Link from "next/link";

export function AppNav() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-4 py-4 sm:px-6">
      <Link
        href="/"
        className="pointer-events-auto rounded-sm bg-[var(--panel)] px-3 py-2 backdrop-blur-sm"
      >
        <div className="font-[family-name:var(--font-display)] text-lg tracking-wide">
          Explorer Grid
        </div>
        <div className="text-xs text-[var(--muted)]">东京探索原型</div>
      </Link>

      <nav className="pointer-events-auto flex gap-2 rounded-sm bg-[var(--panel)] p-1 backdrop-blur-sm">
        <Link
          href="/"
          className="rounded-sm px-3 py-2 text-sm transition hover:bg-[var(--accent-soft)]"
        >
          地图
        </Link>
        <Link
          href="/grid"
          className="rounded-sm px-3 py-2 text-sm transition hover:bg-[var(--accent-soft)]"
        >
          图鉴
        </Link>
      </nav>
    </header>
  );
}
