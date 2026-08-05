"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import {
  createBlock,
  deleteBlock,
  setBlockArchived,
  subscribeToBlocks,
  updateBlock,
} from "@/lib/db";
import { friendlyDataError } from "@/lib/errors";
import { createId } from "@/lib/utils";
import type { Block, BlockDraft } from "@/lib/types";

/**
 * Live weekly template for the signed-in user.
 *
 * Mutations write straight to Firestore and let the `onSnapshot` listener push
 * the result back. Firestore applies writes to its local cache immediately, so
 * the UI still updates instantly without hand-rolled optimistic state.
 */
export function useBlocks() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  /**
   * A single state object keyed by uid.
   *
   * Loading is derived from whether `forUid` matches the current user rather
   * than being toggled at the top of the effect. That keeps the effect free of
   * synchronous setState (which would cause a cascading render) and makes a
   * stale result from a previous user impossible to display.
   */
  const [state, setState] = useState<{
    forUid: string | null;
    blocks: Block[];
    error: string | null;
  }>({ forUid: null, blocks: [], error: null });

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = subscribeToBlocks(
      uid,
      (next) => setState({ forUid: uid, blocks: next, error: null }),
      (subscriptionError) =>
        setState({
          forUid: uid,
          blocks: [],
          error: friendlyDataError(subscriptionError),
        }),
    );

    return unsubscribe;
  }, [uid]);

  const settled = state.forUid === uid;
  const blocks = settled ? state.blocks : [];
  const error = settled ? state.error : null;
  // Signed-out users are not "loading"; they simply have nothing.
  const loading = uid !== null && !settled;

  const addBlock = useCallback(
    async (draft: BlockDraft) => {
      if (!uid) return;
      try {
        await createBlock(uid, createId(), draft);
        toast.success("Block added");
      } catch (mutationError) {
        toast.error(friendlyDataError(mutationError));
      }
    },
    [uid],
  );

  const editBlock = useCallback(
    async (id: string, draft: BlockDraft) => {
      if (!uid) return;
      try {
        await updateBlock(uid, id, draft);
        toast.success("Block updated");
      } catch (mutationError) {
        toast.error(friendlyDataError(mutationError));
      }
    },
    [uid],
  );

  const archiveBlock = useCallback(
    async (id: string, archived: boolean) => {
      if (!uid) return;
      try {
        await setBlockArchived(uid, id, archived);
        toast.success(archived ? "Block archived" : "Block restored");
      } catch (mutationError) {
        toast.error(friendlyDataError(mutationError));
      }
    },
    [uid],
  );

  const removeBlock = useCallback(
    async (id: string) => {
      if (!uid) return;
      try {
        await deleteBlock(uid, id);
        toast.success("Block deleted");
      } catch (mutationError) {
        toast.error(friendlyDataError(mutationError));
      }
    },
    [uid],
  );

  return {
    blocks,
    activeBlocks: blocks.filter((block) => !block.archived),
    archivedBlocks: blocks.filter((block) => block.archived),
    loading,
    error,
    addBlock,
    editBlock,
    archiveBlock,
    removeBlock,
  };
}
