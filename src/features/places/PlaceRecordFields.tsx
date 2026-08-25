"use client";

import type { PlaceRecord } from "@/types/user";

interface RatingPickerProps {
  value: number | null;
  disabled?: boolean;
  onChange: (rating: number) => void;
}

export function RatingPicker({ value, disabled, onChange }: RatingPickerProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: 10 }, (_, index) => {
        const score = index + 1;
        const selected = value === score;
        return (
          <button
            key={score}
            type="button"
            disabled={disabled}
            onClick={() => onChange(score)}
            className={`h-8 w-8 rounded-sm text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? "bg-[var(--accent)] text-white"
                : "bg-white/70 text-[var(--ink)] hover:bg-[var(--accent-soft)]"
            }`}
            aria-label={`评分 ${score}`}
            aria-pressed={selected}
          >
            {score}
          </button>
        );
      })}
    </div>
  );
}

interface NoteEditorProps {
  value: string;
  pending?: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}

export function NoteEditor({ value, pending, onChange, onSave }: NoteEditorProps) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onSave();
          }
        }}
        rows={4}
        maxLength={2000}
        placeholder="写一点这个地方留给你的印象。"
        className="w-full resize-y rounded-sm border border-[var(--line)] bg-white/80 px-3 py-2 text-sm leading-6 outline-none ring-[var(--accent)] focus:ring-2"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-[var(--muted)]">{value.length}/2000</span>
        <button
          type="button"
          disabled={pending}
          onClick={onSave}
          className="rounded-sm bg-[var(--accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {pending ? "保存中…" : "保存感想"}
        </button>
      </div>
    </div>
  );
}

interface PhotoGalleryProps {
  photos: PlaceRecord["photos"];
  pending?: boolean;
  onAdd: (url: string) => Promise<void>;
}

export function PhotoGallery({ photos, pending, onAdd }: PhotoGalleryProps) {
  return (
    <div>
      {photos.length > 0 ? (
        <ul className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="relative aspect-[4/3] overflow-hidden rounded-sm bg-[var(--accent-soft)]"
            >
              {/* User-supplied URLs are unknown hosts; keep native img for now. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-[var(--muted)]">
          还没有照片。这一版用图片链接保存，文件上传会在之后接上。
        </p>
      )}

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const input = form.elements.namedItem("photoUrl") as HTMLInputElement;
          const url = input.value.trim();
          if (!url) return;
          try {
            await onAdd(url);
            form.reset();
          } catch {
            // Parent surfaces the error message.
          }
        }}
      >
        <input
          name="photoUrl"
          type="url"
          required
          placeholder="https://…"
          className="min-w-0 flex-1 rounded-sm border border-[var(--line)] bg-white/80 px-3 py-2 text-sm outline-none ring-[var(--accent)] focus:ring-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "添加中…" : "添加照片"}
        </button>
      </form>
    </div>
  );
}
