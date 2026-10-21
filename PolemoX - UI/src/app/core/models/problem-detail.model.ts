/** Shape of every error response — the backend maps all exceptions to RFC-9457 ProblemDetail. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  fieldErrors?: Record<string, string>;
}

/** Best-effort extraction of a human-readable message from any HttpErrorResponse-shaped error. */
export function problemMessage(error: unknown, fallback = 'Something went wrong.'): string {
  const err = error as { error?: ProblemDetail; status?: number };
  const problem = err?.error;
  if (problem?.fieldErrors && Object.keys(problem.fieldErrors).length > 0) {
    return Object.values(problem.fieldErrors).join(' ');
  }
  return problem?.detail || problem?.title || fallback;
}
