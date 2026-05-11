import { scoreEmbedding } from "./training";
import type { Detection, Model } from "@/lib/db/schemas";

export type Tile = {
  col: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Generate a uniform grid over the image. Caller embeds each tile region;
// we then assemble the per-tile distances into the heatmap structure stored
// alongside the detection.
export function generateGrid(
  imageWidth: number,
  imageHeight: number,
  cols = 4,
  rows = 4,
): Tile[] {
  const tileW = imageWidth / cols;
  const tileH = imageHeight / rows;
  const tiles: Tile[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({
        col: c,
        row: r,
        x: c * tileW,
        y: r * tileH,
        width: tileW,
        height: tileH,
      });
    }
  }
  return tiles;
}

// Normalize per-tile anomaly scores into [0..1] using whatever scoring
// method the model is set up for (centroid distance, description-distance,
// or the refined combination). Each cell is the `confidence` returned by
// scoreEmbedding for that tile's vector.
export function tilesToHeatmap(
  cols: number,
  rows: number,
  model: Pick<
    Model,
    "centroid" | "threshold" | "descriptionEmbedding" | "algorithm"
  >,
  vectors: number[][],
): { heatmap: NonNullable<Detection["heatmap"]>; cells: number[] } {
  const cells = vectors.map((v) => {
    const { isAnomaly, confidence } = scoreEmbedding(model, v);
    // Heatmap cells weight visible alarm intensity; pin non-anomaly tiles
    // close to zero so the overlay doesn't paint the whole image red.
    return Math.min(1, Math.max(0, isAnomaly ? confidence : confidence * 0.2));
  });
  return {
    heatmap: { cols, rows, cells },
    cells,
  };
}

// Connected-component pass over a binarized score grid. Returns axis-aligned
// bounding boxes in image coordinates for every contiguous run of cells
// above the alarm threshold (default 0.6 of the normalized score scale).
export function deriveBBoxes(
  heatmap: NonNullable<Detection["heatmap"]>,
  imageWidth: number,
  imageHeight: number,
  alarmScore = 0.6,
): { x: number; y: number; width: number; height: number; score: number }[] {
  const { cols, rows, cells } = heatmap;
  if (cols * rows !== cells.length) return [];
  const visited = new Array<boolean>(cells.length).fill(false);
  const tileW = imageWidth / cols;
  const tileH = imageHeight / rows;
  const out: ReturnType<typeof deriveBBoxes> = [];
  const idx = (c: number, r: number) => r * cols + c;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = idx(c, r);
      if (visited[i] || cells[i] < alarmScore) continue;
      // BFS over 4-connected neighbors above threshold.
      const queue: [number, number][] = [[c, r]];
      visited[i] = true;
      let minC = c;
      let maxC = c;
      let minR = r;
      let maxR = r;
      let scoreSum = 0;
      let scoreCount = 0;
      while (queue.length) {
        const [cc, rr] = queue.shift()!;
        const ii = idx(cc, rr);
        scoreSum += cells[ii];
        scoreCount += 1;
        minC = Math.min(minC, cc);
        maxC = Math.max(maxC, cc);
        minR = Math.min(minR, rr);
        maxR = Math.max(maxR, rr);
        for (const [dc, dr] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nc = cc + dc;
          const nr = rr + dr;
          if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
          const ni = idx(nc, nr);
          if (!visited[ni] && cells[ni] >= alarmScore) {
            visited[ni] = true;
            queue.push([nc, nr]);
          }
        }
      }
      out.push({
        x: minC * tileW,
        y: minR * tileH,
        width: (maxC - minC + 1) * tileW,
        height: (maxR - minR + 1) * tileH,
        score: scoreSum / Math.max(1, scoreCount),
      });
    }
  }
  return out;
}
