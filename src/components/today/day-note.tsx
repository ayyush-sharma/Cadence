"use client";

import { useEffect, useRef, useState } from "react";
import { Check, PencilLine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { UI } from "@/lib/constants";

/**
 * Free-text reflection for the day.
 *
 * Autosaves on a debounce so there is no Save button to forget. The debounce
 * timer is cleared on unmount and any pending text is flushed, so navigating
 * away mid-sentence does not lose it.
 */
export function DayNote({
  initialNote,
  onSave,
}: {
  initialNote: string;
  onSave: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState(false);

  // Held in refs so the unmount cleanup can flush without re-subscribing on
  // every keystroke.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(initialNote);
  const persisted = useRef(initialNote);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Adopt values arriving from Firestore (initial load, or an edit on another
  // device) without clobbering text the user is actively typing.
  useEffect(() => {
    if (initialNote !== persisted.current) {
      persisted.current = initialNote;
      latest.current = initialNote;
      setNote(initialNote);
    }
  }, [initialNote]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (latest.current !== persisted.current) {
        void onSaveRef.current(latest.current);
      }
    };
  }, []);

  const handleChange = (value: string) => {
    setNote(value);
    latest.current = value;
    setSaved(false);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      persisted.current = value;
      void onSaveRef.current(value).then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 1600);
      });
    }, UI.inputDebounceMs);
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="day-note"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <PencilLine className="size-3.5" />
            Reflection
          </label>
          {saved ? (
            <span className="flex items-center gap-1 text-[11px] text-success">
              <Check className="size-3" />
              Saved
            </span>
          ) : null}
        </div>

        <Textarea
          id="day-note"
          value={note}
          maxLength={UI.maxNoteLength}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="How did today actually go?"
          className="min-h-[4.5rem] border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </CardContent>
    </Card>
  );
}
