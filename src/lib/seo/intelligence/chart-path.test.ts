import { describe, expect, it } from "vitest";
import { pointsToAreaPath, pointsToLinePath, scaleToPoints } from "./chart-path";

describe("scaleToPoints", () => {
  it("scales values to their own max, not an external one", () => {
    const points = scaleToPoints([0, 50, 100], 100, 100);
    expect(points[0].y).toBe(100); // 0 -> bottom
    expect(points[1].y).toBe(50); // half of max -> mid-height
    expect(points[2].y).toBe(0); // max -> top
  });

  it("spaces x evenly across the width", () => {
    const points = scaleToPoints([1, 1, 1, 1], 90, 10);
    expect(points.map((p) => p.x)).toEqual([0, 30, 60, 90]);
  });

  it("returns an empty array for no values", () => {
    expect(scaleToPoints([], 100, 100)).toEqual([]);
  });

  it("places a single value at x=0 without dividing by zero", () => {
    const points = scaleToPoints([42], 100, 100);
    expect(points).toEqual([{ x: 0, y: 0 }]);
  });

  it("flattens an all-zero series to the baseline instead of dividing by zero", () => {
    const points = scaleToPoints([0, 0, 0], 100, 50);
    expect(points.every((p) => p.y === 50)).toBe(true);
  });
});

describe("pointsToLinePath", () => {
  it("builds an SVG path starting with M and continuing with L", () => {
    const path = pointsToLinePath([
      { x: 0, y: 10 },
      { x: 50, y: 0 },
      { x: 100, y: 20 },
    ]);
    expect(path).toBe("M0.00,10.00 L50.00,0.00 L100.00,20.00");
  });

  it("returns an empty string for no points", () => {
    expect(pointsToLinePath([])).toBe("");
  });
});

describe("pointsToAreaPath", () => {
  it("closes the line down to the baseline at both ends", () => {
    const path = pointsToAreaPath(
      [
        { x: 0, y: 10 },
        { x: 100, y: 5 },
      ],
      50,
    );
    expect(path).toBe("M0.00,10.00 L100.00,5.00 L100.00,50.00 L0.00,50.00 Z");
  });

  it("returns an empty string for no points", () => {
    expect(pointsToAreaPath([], 50)).toBe("");
  });
});
