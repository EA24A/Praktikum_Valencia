export const GRID_SIZE = 5;

export function snapToGrid(value: number, gridSize = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

export function clampPercent(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function clampTablePosition(
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: clampPercent(x, 0, 100 - width),
    y: clampPercent(y, 0, 100 - height),
  };
}

export function nextTableNumber(existing: string[]): string {
  const numbers = existing
    .map((value) => {
      const match = value.match(/^T(\d+)$/i);
      return match ? Number.parseInt(match[1], 10) : 0;
    })
    .filter((value) => value > 0);

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `T${next}`;
}

export type TableShape = "rectangle" | "circle";

export interface TableLayoutItem {
  id?: string;
  number: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shape: TableShape;
  isActive: boolean;
}

export interface EditorTable extends TableLayoutItem {
  clientKey: string;
}

export function createDraftTable(
  existingNumbers: string[],
  position: { x: number; y: number },
): TableLayoutItem {
  return {
    number: nextTableNumber(existingNumbers),
    x: position.x,
    y: position.y,
    width: 12,
    height: 12,
    color: "#3b82f6",
    shape: "rectangle",
    isActive: true,
  };
}
