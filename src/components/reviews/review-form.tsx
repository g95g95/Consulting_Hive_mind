"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";

interface ReviewFormProps {
  engagementId: string;
  revieweeId: string;
  revieweeName: string;
  type: "CLIENT_TO_CONSULTANT" | "CONSULTANT_TO_CLIENT";
  onSuccess?: () => void;
}

export function ReviewForm({
  engagementId,
  revieweeId,
  revieweeName,
  type,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engagementId,
          revieweeId,
          type,
          rating,
          comment: comment || null,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        onSuccess?.();
      } else {
        throw new Error("Failed to submit review");
      }
    } catch (error) {
      console.error("Review submission error:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-green-500/10 border-green-500/30">
        <CardContent className="py-6 text-center">
          <Star className="h-12 w-12 text-green-400 mx-auto mb-3 fill-current" />
          <p className="text-green-400 font-medium">Review Submitted!</p>
          <p className="text-green-300/80 text-sm mt-1">
            Thank you for your feedback
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Leave a Review</CardTitle>
        <CardDescription className="text-slate-400">
          Rate your experience with {revieweeName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div className="space-y-2">
          <Label className="text-slate-300">Rating</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-600"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-slate-400">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label htmlFor="comment" className="text-slate-300">
            Comment (optional)
          </Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="bg-slate-700 border-slate-600 text-white"
            rows={3}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
