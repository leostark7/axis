"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { REACTION_EMOJIS } from "@/lib/types";

interface ReactionLike {
  emoji: string;
  userId: string;
}

export default function ReactionBar({
  reactions,
  onToggle,
}: {
  reactions: ReactionLike[];
  onToggle: (emoji: string) => void;
}) {
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  function countFor(emoji: string) {
    return reactions.filter((r) => r.emoji === emoji).length;
  }

  function mineFor(emoji: string) {
    return myId ? reactions.some((r) => r.emoji === emoji && r.userId === myId) : false;
  }

  return (
    <div className="flex items-center gap-1">
      {REACTION_EMOJIS.map((emoji) => {
        const count = countFor(emoji);
        const mine = mineFor(emoji);
        return (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${
              mine
                ? "border-blue-400 bg-blue-100 text-blue-700"
                : "border-[#101a2e]/10 bg-[#101a2e]/5 text-[#101a2e]/60 hover:bg-[#101a2e]/10"
            }`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="font-semibold">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
