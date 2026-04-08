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

