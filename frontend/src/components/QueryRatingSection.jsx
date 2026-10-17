import { useEffect, useState } from "react";
import {
  fetchRatingForQuery,
  submitQueryRating,
  updateQueryRating,
} from "../api";
import { Alert } from "./ui/Card";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Label, Textarea } from "./ui/Input";

function StarButton({ filled, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        filled ? "text-amber-500" : "text-slate-300 hover:text-amber-400"
      }`}
      aria-label={label}
      aria-pressed={filled}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.064 1.976-1.064 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

export function QueryRatingSection({ queryHistoryId }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [existingId, setExistingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!queryHistoryId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await fetchRatingForQuery(queryHistoryId);
        if (cancelled) return;
        if (row) {
          setExistingId(row.id);
          setRating(row.rating);
          setFeedback(row.feedback || "");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load rating");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryHistoryId]);

  if (!queryHistoryId) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("Select a star rating from 1 to 5.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      if (existingId) {
        const updated = await updateQueryRating(existingId, { rating, feedback });
        setExistingId(updated.id);
        setMessage("Rating updated. Thank you!");
      } else {
        const created = await submitQueryRating({ queryHistoryId, rating, feedback });
        setExistingId(created.id);
        setMessage("Thanks for your feedback!");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save rating";
      if (/already rated/i.test(msg) && queryHistoryId) {
        try {
          const row = await fetchRatingForQuery(queryHistoryId);
          if (row?.id) {
            setExistingId(row.id);
            const updated = await updateQueryRating(row.id, { rating, feedback });
            setExistingId(updated.id);
            setMessage("Rating updated. Thank you!");
            setError(null);
            setSubmitting(false);
            return;
          }
        } catch {
          /* fall through */
        }
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const display = hover || rating;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-slate-900">Rate this query</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Help improve SQL generation and results quality.
        </p>
      </CardHeader>
      <CardBody className="pt-0 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading your feedback…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="sr-only">Star rating</span>
              <div
                className="flex items-center gap-0.5"
                onMouseLeave={() => setHover(0)}
                role="group"
                aria-label="Rate from 1 to 5 stars"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} onMouseEnter={() => setHover(n)}>
                    <StarButton
                      filled={n <= display}
                      label={`${n} star${n > 1 ? "s" : ""}`}
                      onClick={() => setRating(n)}
                    />
                  </span>
                ))}
                {existingId ? (
                  <span className="ml-2 text-xs text-slate-500">Previously rated</span>
                ) : null}
              </div>
            </div>

            <div>
              <Label htmlFor="query-feedback">Optional feedback</Label>
              <Textarea
                id="query-feedback"
                className="mt-1.5 min-h-[88px]"
                placeholder="What worked well or could be better?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                maxLength={2000}
                disabled={submitting}
              />
            </div>

            <Button type="submit" disabled={submitting || rating < 1} loading={submitting}>
              {existingId ? "Update rating" : "Submit rating"}
            </Button>

            {message ? <Alert variant="success">{message}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
          </form>
        )}
      </CardBody>
    </Card>
  );
}
