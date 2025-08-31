import { Matrix, SingularValueDecomposition } from "ml-matrix";
import { similarity } from "ml-distance";
const cosine = similarity.cosine;
import type { User, Item, Rating } from "@prisma/client";

function buildMatrix(users: User[], items: Item[], ratings: Rating[]) {
  const userIndex = new Map(users.map((u, i) => [u.id, i]));
  const itemIndex = new Map(items.map((it, j) => [it.id, j]));

  const matrix = Matrix.zeros(users.length, items.length);

  ratings.forEach(r => {
    const ui = userIndex.get(r.userId);
    const ii = itemIndex.get(r.itemId);
    if (ui !== undefined && ii !== undefined) {
      matrix.set(ui, ii, r.rating);
    }
  });

  return { matrix, userIndex, itemIndex };
}

function predictMF(matrix: Matrix) {
  const svd = new SingularValueDecomposition(matrix, { autoTranspose: true });
  const U = svd.leftSingularVectors;
  const S = Matrix.diag(svd.diagonal);
  const Vt = svd.rightSingularVectors.transpose();
  return U.mmul(S).mmul(Vt);
}

function buildItemSimilarity(matrix: Matrix) {
  const items = matrix.columns;
  const sim = Matrix.zeros(items, items);

  for (let i = 0; i < items; i++) {
    for (let j = 0; j < items; j++) {
      if (i === j) {
        sim.set(i, j, 1);
      } else {
        const colI = matrix.getColumn(i);
        const colJ = matrix.getColumn(j);
        const similarity = 1 - cosine(colI, colJ);
        sim.set(i, j, similarity);
      }
    }
  }

  return sim;
}

export function recommendHybrid(
  userId: string,
  users: User[],
  items: Item[],
  ratings: Rating[],
  topN = 10
) {
  const { matrix, userIndex, itemIndex } = buildMatrix(users, items, ratings);
  const mfApprox = predictMF(matrix);
  const itemSim = buildItemSimilarity(matrix);

  const uIdx = userIndex.get(userId);
  if (uIdx === undefined) {
    throw new Error(`User ${userId} not found in index`);
  }

  const userRatings = matrix.getRow(uIdx);
  const predictedRatings = mfApprox.getRow(uIdx);

  const scores: { itemId: string; score: number }[] = [];

  items.forEach((item, j) => {
    if (userRatings[j] === 0) {
      let score = predictedRatings[j];
      let simBoost = 0;
      let simCount = 0;

      items.forEach((_, k) => {
        if (userRatings[k] > 0) {
          simBoost += itemSim.get(j, k) * userRatings[k];
          simCount++;
        }
      });

      if (simCount > 0) {
        score = 0.7 * score + 0.3 * (simBoost / simCount);
      }

      scores.push({ itemId: item.id, score });
    }
  });

  return scores.sort((a, b) => b.score - a.score).slice(0, topN);
}
