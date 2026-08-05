"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarPlus,
  Plus,
  Trash2,
} from "lucide-react";
import { BlockDialog } from "@/components/schedule/block-dialog";
import { WeekGrid } from "@/components/schedule/week-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Badge,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/misc";
import { useBlocks } from "@/hooks/use-blocks";
import { WEEKDAYS } from "@/lib/constants";
import { categoryMeta } from "@/lib/schedule";
import { formatDuration, formatRange } from "@/lib/time";
import type { Block, BlockDraft, WeekdayIndex } from "@/lib/types";

/** Weekly template editor: the grid view plus a flat list and the archive. */
export function ScheduleView() {
  const {
    blocks,
    activeBlocks,
    archivedBlocks,
    loading,
    addBlock,
    editBlock,
    archiveBlock,
    removeBlock,
  } = useBlocks();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Block | undefined>();
  const [defaultDay, setDefaultDay] = useState<WeekdayIndex | undefined>();

  const openCreate = (day?: WeekdayIndex) => {
    setEditing(undefined);
    setDefaultDay(day);
    setDialogOpen(true);
  };

  const openEdit = (block: Block) => {
    setEditing(block);
    setDefaultDay(undefined);
    setDialogOpen(true);
  };

  const handleSubmit = async (draft: BlockDraft) => {
    if (editing) {
      await editBlock(editing.id, draft);
    } else {
      await addBlock(draft);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    await removeBlock(editing.id);
    setDialogOpen(false);
  };

  const weeklyMinutes = useMemo(
    () =>
      activeBlocks.reduce(
        (sum, block) =>
          sum + (block.endMinutes - block.startMinutes) * block.days.length,
        0,
      ),
    [activeBlocks],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {loading
              ? "Loading your week…"
              : activeBlocks.length === 0
                ? "No recurring blocks yet."
                : `${activeBlocks.length} block${activeBlocks.length === 1 ? "" : "s"} · ${formatDuration(weeklyMinutes)} planned each week`}
          </p>
        </div>

        <Button onClick={() => openCreate()} size="sm">
          <Plus />
          New block
        </Button>
      </header>

      {loading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : activeBlocks.length === 0 && archivedBlocks.length === 0 ? (
        <EmptyState onCreate={() => openCreate()} />
      ) : (
        <Tabs defaultValue="week">
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
            {archivedBlocks.length > 0 ? (
              <TabsTrigger value="archive">
                Archive ({archivedBlocks.length})
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="week" className="mt-4">
            <WeekGrid
              blocks={activeBlocks}
              onSelectBlock={openEdit}
              onAddToDay={openCreate}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-4 space-y-2.5">
            {activeBlocks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Everything is archived.
              </p>
            ) : (
              activeBlocks.map((block) => (
                <BlockRow
                  key={block.id}
                  block={block}
                  onEdit={() => openEdit(block)}
                  onArchive={() => void archiveBlock(block.id, true)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="archive" className="mt-4 space-y-2.5">
            {archivedBlocks.map((block) => (
              <BlockRow
                key={block.id}
                block={block}
                archived
                onEdit={() => openEdit(block)}
                onRestore={() => void archiveBlock(block.id, false)}
                onDelete={() => void removeBlock(block.id)}
              />
            ))}
          </TabsContent>
        </Tabs>
      )}

      <BlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        block={editing}
        defaultDay={defaultDay}
        siblings={blocks}
        onSubmit={handleSubmit}
        onDelete={editing ? handleDelete : undefined}
      />
    </div>
  );
}

function BlockRow({
  block,
  archived = false,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  block: Block;
  archived?: boolean;
  onEdit: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}) {
  const meta = categoryMeta(block.category);

  return (
    <Card
      style={
        {
          "--block-color-light": meta.light,
          "--block-color-dark": meta.dark,
        } as React.CSSProperties
      }
    >
      <CardContent className="flex items-center gap-3 py-3.5">
        <span
          aria-hidden
          className="h-9 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: "var(--block-color)" }}
        />

        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 flex-1 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <p className="truncate text-sm font-medium">{block.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatRange(block.startMinutes, block.endMinutes)} ·{" "}
            {block.days.length === 7
              ? "Every day"
              : block.days
                  .slice()
                  .sort()
                  .map((day) => WEEKDAYS[day].short)
                  .join(", ")}
          </p>
        </button>

        <Badge className="hidden shrink-0 sm:inline-flex">{meta.label}</Badge>

        <div className="flex shrink-0 items-center gap-0.5">
          {archived ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onRestore}
                aria-label="Restore block"
              >
                <ArchiveRestore />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDelete}
                aria-label="Delete block permanently"
                className="text-danger hover:bg-danger-soft"
              >
                <Trash2 />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onArchive}
              aria-label="Archive block"
            >
              <Archive />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-16 text-center">
        <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
          <CalendarPlus className="size-5" />
        </span>
        <p className="mt-4 text-sm font-medium">Build your weekly rhythm</p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Add the blocks that repeat each week — study sessions, work hours, the
          gym. Every day then fills itself in, ready to tick off.
        </p>
        <Button className="mt-5" size="sm" onClick={onCreate}>
          <Plus />
          Add your first block
        </Button>
      </CardContent>
    </Card>
  );
}
