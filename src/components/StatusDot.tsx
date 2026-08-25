import type { UserPlaceStatus } from "@/types/user";

export function StatusDot({ status }: { status: UserPlaceStatus | null }) {
  if (status === "visited") {
    return (
      <span className="inline-block text-[var(--visited)]" aria-label="已访问">
        ●
      </span>
    );
  }

  if (status === "want_to_go") {
    return (
      <span className="inline-block text-[var(--want)]" aria-label="想去">
        ◐
      </span>
    );
  }

  return (
    <span className="inline-block text-[var(--muted)]" aria-label="未访问">
      ○
    </span>
  );
}
