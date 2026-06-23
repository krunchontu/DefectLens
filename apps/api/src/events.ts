import { prisma } from "./prisma";

export type EventType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "ANALYSIS_GENERATED"
  | "PREVENTION_UPDATED"
  | "DELETED";

/**
 * Records an audit event for a defect.
 * Never throws — errors are caught and logged so the primary request path is unaffected.
 */
export async function recordEvent(
  defectId: string,
  type: EventType,
  summary: string,
  detail?: unknown
): Promise<void> {
  try {
    await prisma.defectEvent.create({
      data: {
        defectId,
        type,
        summary,
        detail: detail != null ? JSON.stringify(detail) : null
      }
    });
  } catch (error) {
    console.error("[recordEvent] Failed to record event:", error);
  }
}
