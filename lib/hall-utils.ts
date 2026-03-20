import { Prisma } from "@/app/generated/prisma/client";
import { getRowLabel, rowToIndex } from "./seat-logic";
export { getRowLabel };
import { SeatType } from "@/types/seat";

export interface RowConfig {
  startRow: string;
  endRow: string;
  seatType: string;
}

export interface HallFormData {
  name: string;
  hallType: string;
  screenType: string;
  rows: number;
  columns: number;
  isActive: boolean;
  rowConfigs: RowConfig[];
}

export function generateSeatsFromRowConfigs(
  rows: number,
  columns: number,
  rowConfigs: RowConfig[],
  hallId: string
): Prisma.SeatCreateManyInput[] {
  const seats: Prisma.SeatCreateManyInput[] = [];

  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
    const rowLabel = getRowLabel(rowIdx);

    const matchingConfig = rowConfigs.find((config) => {
      const startIdx = rowToIndex(config.startRow);
      const endIdx = rowToIndex(config.endRow);
      return rowIdx >= startIdx && rowIdx <= endIdx;
    });

    const seatType = matchingConfig?.seatType || "REGULAR";

    for (let col = 0; col < columns; col++) {
      seats.push({
        id: crypto.randomUUID(),
        hallId,
        row: rowLabel,
        column: col,
        number: col + 1,
        seatNumber: col + 1,
        seatType: seatType as "REGULAR" | "VIP" | "TWINSEAT",
        isActive: true,
        status: "AVAILABLE",
      });
    }
  }

  return seats;
}

export function getRowOptions(maxRows: number): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < maxRows; i++) {
    options.push({
      value: getRowLabel(i),
      label: getRowLabel(i),
    });
  }
  return options;
}

export function validateRowConfigs(
  rowConfigs: RowConfig[],
  totalRows: number
): string | null {
  if (rowConfigs.length === 0) {
    return "At least one row configuration is required";
  }

  for (const config of rowConfigs) {
    const startIdx = rowToIndex(config.startRow);
    const endIdx = rowToIndex(config.endRow);

    if (startIdx > endIdx) {
      return `Invalid range: ${config.startRow} > ${config.endRow}`;
    }

    if (startIdx < 0 || endIdx >= totalRows) {
      return `Row range exceeds maximum rows (${totalRows})`;
    }
  }

  const ranges = rowConfigs.map((c) => ({
    start: rowToIndex(c.startRow),
    end: rowToIndex(c.endRow),
  }));

  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (
        ranges[i].start <= ranges[j].end &&
        ranges[j].start <= ranges[i].end
      ) {
        return "Row ranges cannot overlap";
      }
    }
  }

  return null;
}

export const seatTypeOptions = [
  { value: "REGULAR", label: "Regular" },
  { value: "VIP", label: "VIP" },
  { value: "TWINSEAT", label: "Twinseat" },
];

export const hallTypeOptions = [
  { value: "STANDARD", label: "Standard" },
  { value: "VIP", label: "VIP" },
];

export const screenTypeOptions = [
  { value: "STANDARD_2D", label: "2D" },
  { value: "THREE_D", label: "3D" },
  { value: "SCREENX", label: "ScreenX" },
];
