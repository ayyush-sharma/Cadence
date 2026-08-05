"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Input, Label, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  DEFAULT_CATEGORY_ID,
  UI,
  WEEKDAYS,
  WEEKDAY_ORDER,
} from "@/lib/constants";
import {
  formatDuration,
  minutesToTime,
  overlaps,
  timeOptions,
} from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Block, BlockDraft, CategoryId, WeekdayIndex } from "@/lib/types";

interface BlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Block being edited, or `undefined` when creating. */
  block?: Block;
  /** Preselected weekday when adding from a specific day column. */
  defaultDay?: WeekdayIndex;
  /** Existing blocks, used to warn about time clashes. */
  siblings: Block[];
  onSubmit: (draft: BlockDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const DEFAULT_START = 9 * 60;
const DEFAULT_END = 11 * 60;

/** Create/edit form for a recurring block. */
export function BlockDialog({
  open,
  onOpenChange,
  block,
  defaultDay,
  siblings,
  onSubmit,
  onDelete,
}: BlockDialogProps) {
  // The inner form owns all field state and is remounted whenever the dialog
  // opens on a different block. Resetting via `key` rather than an effect means
  // there is no stale-state window and no setState during render.
  const formKey = `${open ? "open" : "closed"}:${block?.id ?? "new"}:${defaultDay ?? "any"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <BlockForm
          key={formKey}
          block={block}
          defaultDay={defaultDay}
          siblings={siblings}
          onSubmit={onSubmit}
          onDelete={onDelete}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function BlockForm({
  block,
  defaultDay,
  siblings,
  onSubmit,
  onDelete,
  onClose,
}: {
  block?: Block;
  defaultDay?: WeekdayIndex;
  siblings: Block[];
  onSubmit: (draft: BlockDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(block?.title ?? "");
  const [category, setCategory] = useState<CategoryId>(
    block?.category ?? (DEFAULT_CATEGORY_ID as CategoryId),
  );
  const [days, setDays] = useState<WeekdayIndex[]>(
    block?.days ?? (defaultDay === undefined ? [] : [defaultDay]),
  );
  const [start, setStart] = useState(block?.startMinutes ?? DEFAULT_START);
  const [end, setEnd] = useState(block?.endMinutes ?? DEFAULT_END);
  const [notes, setNotes] = useState(block?.notes ?? "");
  const [busy, setBusy] = useState(false);

  const options = useMemo(() => timeOptions(), []);

  const durationInvalid = end <= start;
  const canSubmit =
    title.trim().length > 0 && days.length > 0 && !durationInvalid;

  /** Existing blocks that would clash on a shared weekday. */
  const conflicts = useMemo(() => {
    if (durationInvalid) return [];

    return siblings.filter(
      (candidate) =>
        candidate.id !== block?.id &&
        !candidate.archived &&
        candidate.days.some((day) => days.includes(day)) &&
        overlaps(start, end, candidate.startMinutes, candidate.endMinutes),
    );
  }, [siblings, block?.id, days, start, end, durationInvalid]);

  const toggleDay = (day: WeekdayIndex) =>
    setDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day],
    );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onSubmit({
        title,
        category,
        days,
        startMinutes: start,
        endMinutes: end,
        notes,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{block ? "Edit block" : "New block"}</DialogTitle>
        <DialogDescription>
          Blocks repeat every week on the days you pick.
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-5">
        <Field>
          <Label htmlFor="block-title">Title</Label>
          <Input
            id="block-title"
            value={title}
            maxLength={UI.maxBlockTitleLength}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Study Java"
            autoFocus
          />
        </Field>

        <Field>
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as CategoryId)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full"
                      style={
                        {
                          "--block-color-light": option.light,
                          "--block-color-dark": option.dark,
                          backgroundColor: "var(--block-color)",
                        } as React.CSSProperties
                      }
                    />
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <Label>Repeats on</Label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_ORDER.map((index) => {
              const weekday = WEEKDAYS[index];
              const active = days.includes(index as WeekdayIndex);
              return (
                <button
                  key={weekday.key}
                  type="button"
                  onClick={() => toggleDay(index as WeekdayIndex)}
                  aria-pressed={active}
                  className={cn(
                    "h-9 min-w-11 rounded-lg border px-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    active
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
                  )}
                >
                  {weekday.short}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <Label htmlFor="block-start">Starts</Label>
            <TimeSelect
              id="block-start"
              value={start}
              options={options}
              onChange={(next) => {
                setStart(next);
                // Keep the duration intact when the start moves past the end.
                if (next >= end) setEnd(Math.min(next + 60, 24 * 60));
              }}
            />
          </Field>
          <Field>
            <Label htmlFor="block-end">Ends</Label>
            <TimeSelect
              id="block-end"
              value={end}
              options={options}
              onChange={setEnd}
            />
          </Field>
        </div>

        {durationInvalid ? (
          <p role="alert" className="text-xs text-danger">
            The end time must come after the start time.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Duration · {formatDuration(end - start)}
          </p>
        )}

        {conflicts.length > 0 ? (
          <div className="rounded-lg border border-accent/35 bg-accent-soft px-3 py-2.5 text-xs">
            <p className="font-medium text-accent">Overlaps another block</p>
            <ul className="mt-1 space-y-0.5 text-muted-foreground">
              {conflicts.slice(0, 3).map((conflict) => (
                <li key={conflict.id}>
                  {conflict.title} · {minutesToTime(conflict.startMinutes)}–
                  {minutesToTime(conflict.endMinutes)}
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-muted-foreground">
              That&apos;s allowed — they&apos;ll sit side by side.
            </p>
          </div>
        ) : null}

        <Field>
          <Label htmlFor="block-notes">Notes (optional)</Label>
          <Textarea
            id="block-notes"
            value={notes}
            maxLength={UI.maxNoteLength}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="What exactly are you working on?"
          />
        </Field>
      </DialogBody>

      <DialogFooter>
        {block && onDelete ? (
          <Button
            variant="ghost"
            className="text-danger hover:bg-danger-soft sm:mr-auto"
            onClick={() => void onDelete()}
            disabled={busy}
          >
            <Trash2 />
            Delete
          </Button>
        ) : null}

        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          loading={busy}
        >
          {block ? "Save changes" : "Add block"}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Native `<select>` of quarter-hour options.
 *
 * Chosen over a custom picker deliberately: mobile browsers render this as a
 * platform wheel, which beats any bespoke dropdown for entering a time.
 */
function TimeSelect({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (value: number) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm shadow-sm transition-colors hover:border-border-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
