/**
 * POST /api/review
 * AI Code Reviewer: recibe un unified diff y devuelve un review
 * técnico estructurado como Server-Sent Events.
 */
export async function GET() {
  const { jsonError } = await import('../../../lib/server/review/security-headers');
  return jsonError('Method not allowed. Use POST.', 405);
}

export async function POST(request: Request): Promise<Response> {
  const { handleReview } = await import('../../../lib/server/review/reviewRoute');
  return handleReview(request);
}
