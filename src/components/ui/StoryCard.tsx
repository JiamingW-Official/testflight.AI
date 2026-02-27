"use client";

// ============================================
// SKYLOG — StoryCard
// Full-screen immersive passenger story
// with choices and butterfly effect reveal
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStoryStore } from "@/stores/storyStore";
import { useStory } from "@/hooks/useStory";
import type { PassengerStory } from "@/types";

type Phase = "story" | "choosing" | "outcome" | "butterfly";

export default function StoryCard() {
  const pendingStory = useStoryStore((s) => s.pendingStory);
  const setPendingStory = useStoryStore((s) => s.setPendingStory);

  if (!pendingStory) return null;

  return (
    <AnimatePresence>
      <StoryCardInner
        key={pendingStory.id}
        story={pendingStory}
        onClose={() => setPendingStory(null)}
      />
    </AnimatePresence>
  );
}

function StoryCardInner({
  story,
  onClose,
}: {
  story: PassengerStory;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("story");
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [effects, setEffects] = useState<string[]>([]);
  const { makeChoice } = useStory();

  const handleReadStory = () => {
    setPhase("choosing");
  };

  const handleChoice = (choiceId: string) => {
    const choice = story.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    setChosenId(choiceId);
    setOutcome(choice.consequence);
    makeChoice(story.id, choiceId);

    // Generate butterfly effects from storyPrompts
    import("@/lib/ai/storyPrompts").then(({ generateButterflyEffects }) => {
      const effs = generateButterflyEffects(
        story.passengerName,
        choice.text,
        choice.consequence,
      );
      setEffects(effs);
    });

    setPhase("outcome");
  };

  const handleSeeButterfly = () => {
    setPhase("butterfly");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* Cinematic backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/98 via-navy/95 to-navy-dark/98 backdrop-blur-xl" />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6">

        <AnimatePresence mode="wait">
          {/* ── Phase: Story ── */}
          {phase === "story" && (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full text-center"
            >
              {/* Passenger badge */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-skyblue/10"
              >
                <span className="text-3xl">👤</span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-2 text-xs text-skyblue/60"
              >
                航班上的一位乘客
              </motion.p>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-8 text-xl font-bold text-cream"
              >
                {story.passengerName}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mb-10 text-sm leading-relaxed text-cream/75"
              >
                {story.content}
              </motion.p>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                onClick={handleReadStory}
                className="rounded-full bg-skyblue/20 px-8 py-3 text-sm font-medium text-skyblue transition-all hover:bg-skyblue/30 active:scale-95"
              >
                你决定...
              </motion.button>
            </motion.div>
          )}

          {/* ── Phase: Choosing ── */}
          {phase === "choosing" && (
            <motion.div
              key="choosing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <p className="mb-6 text-center text-xs text-cream/40">
                作为机长，你选择...
              </p>

              <div className="space-y-3">
                {story.choices.map((choice, i) => (
                  <motion.button
                    key={choice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    onClick={() => handleChoice(choice.id)}
                    className="group w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:border-skyblue/30 hover:bg-skyblue/10 active:scale-[0.98]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-skyblue/10 text-xs font-bold text-skyblue">
                        {choice.id.toUpperCase()}
                      </span>
                      <p className="text-sm text-cream/80 group-hover:text-cream">
                        {choice.text}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={onClose}
                className="mx-auto mt-6 block text-xs text-cream/20 transition-colors hover:text-cream/40"
              >
                跳过
              </motion.button>
            </motion.div>
          )}

          {/* ── Phase: Outcome ── */}
          {phase === "outcome" && outcome && (
            <motion.div
              key="outcome"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber/10"
              >
                <span className="text-2xl">✨</span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-3 text-xs text-amber/60"
              >
                你的选择
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-8 px-2 text-sm leading-relaxed text-cream/75"
              >
                {outcome}
              </motion.p>

              {effects.length > 0 ? (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  onClick={handleSeeButterfly}
                  className="rounded-full bg-amber/10 px-8 py-3 text-sm font-medium text-amber transition-all hover:bg-amber/20 active:scale-95"
                >
                  蝴蝶效应...
                </motion.button>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  onClick={onClose}
                  className="rounded-full bg-white/5 px-8 py-3 text-sm text-cream/50 transition-all hover:bg-white/10 active:scale-95"
                >
                  继续
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ── Phase: Butterfly Effect ── */}
          {phase === "butterfly" && (
            <motion.div
              key="butterfly"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10"
              >
                <span className="text-3xl">🦋</span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-xs text-purple-300/60"
              >
                你的一个小选择，引发了涟漪...
              </motion.p>

              <div className="space-y-3 mb-8">
                {effects.map((effect, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.3 }}
                    className="rounded-xl bg-purple-500/5 border border-purple-500/10 px-4 py-3"
                  >
                    <p className="text-sm text-purple-200/70">
                      🦋 {effect}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + effects.length * 0.3 + 0.3 }}
                onClick={onClose}
                className="rounded-full bg-white/5 px-8 py-3 text-sm text-cream/50 transition-all hover:bg-white/10 active:scale-95"
              >
                继续飞行
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
