export type TicketLifecycleState =
  | "BOOKED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export function getTicketLifecycleState(
  scannedAt: string | null,
  completedAt: string | null,
  cancelledAt: string | null,
): TicketLifecycleState {
  if (cancelledAt) return "CANCELLED";
  if (completedAt) return "COMPLETED";
  if (scannedAt) return "IN_PROGRESS";
  if (scannedAt) return "CHECKED_IN";
  return "BOOKED";
}

export function getTicketStatusLabel(state: TicketLifecycleState): string {
  const labels: Record<TicketLifecycleState, string> = {
    BOOKED: "Booked",
    CHECKED_IN: "Checked In",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return labels[state] || "Unknown";
}

export function getTicketStatusColor(state: TicketLifecycleState): string {
  const colors: Record<TicketLifecycleState, string> = {
    BOOKED: "blue",
    CHECKED_IN: "yellow",
    IN_PROGRESS: "orange",
    COMPLETED: "green",
    CANCELLED: "red",
  };
  return colors[state] || "gray";
}