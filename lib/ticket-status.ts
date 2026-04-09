<<<<<<< HEAD
export type TicketLifecycleState = "towatch" | "used" | "expired" | "cancelled";

type TicketLike = {
  status?: string | null;
  booking?: {
    isScanned?: boolean | null;
    bookingStatus?: string | null;
    showtime?: {
      endTime?: string | null;
    } | null;
  } | null;
};

function toTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isCancelledStatus(status?: string | null) {
  const normalized = (status || "").toLowerCase();
  return normalized === "cancelled" || normalized === "canceled" || normalized === "refunded";
}

export function getTicketLifecycleState(ticket: TicketLike, currentTime = Date.now()): TicketLifecycleState {
  const bookingStatus = ticket.booking?.bookingStatus || ticket.status;

  if (isCancelledStatus(bookingStatus)) {
    return "cancelled";
  }

  if (ticket.booking?.isScanned) {
    return "used";
  }

  const endTime = toTimestamp(ticket.booking?.showtime?.endTime);
  if (endTime !== null && currentTime > endTime) {
    return "expired";
  }

  return "towatch";
}

export function getTicketBadgeLabel(state: TicketLifecycleState) {
  switch (state) {
    case "used":
      return "Used";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Cancelled";
    case "towatch":
    default:
      return "Active";
  }
}

=======
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
>>>>>>> e5e1fb5 (fix: resolve build errors from customer merge)
