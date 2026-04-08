"use client";

import { X, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import ButtonGray from "@/components/ui/ButtonGray";
import { ButtonRed } from "@/components/ui/ButtonRed";

type RatingMovieProps = {
  open: boolean;
  title: string;
  ratingValue: number;
  ratingSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onRatingChange: (value: number) => void;
};

export default function RatingMovie({
  open,
  title,
  ratingValue,
  ratingSubmitting,
  onClose,
  onSubmit,
  onRatingChange,
}: RatingMovieProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Rate Movie</p>
            <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white"
            aria-label="Close rating dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-sm text-zinc-400">
            Pick a score from 1 to 5 stars. Your rating will be saved to this movie.
          </p>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => onRatingChange(score)}
                className="rounded-full p-1 transition-transform hover:scale-110"
                aria-label={`Set rating to ${score} star${score > 1 ? "s" : ""}`}
              >
                <Star
                  className={`h-8 w-8 ${
                    score <= ratingValue ? "fill-yellow-500 text-yellow-500" : "text-zinc-700"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <ButtonGray
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-zinc-800 py-3 text-base"
            >
              Cancel
            </ButtonGray>
            <ButtonRed
              type="button"
              onClick={onSubmit}
              disabled={ratingSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-700 py-3 text-base font-bold"
            >
              {ratingSubmitting ? "Saving..." : "Submit Rating"}
            </ButtonRed>
          </div>
        </div>
      </Card>
    </div>
  );
}
