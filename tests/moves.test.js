/* eslint-disable prefer-arrow-callback */
import Chess from 'chess.js';
import { assert } from 'chai';

describe('Chess Moves Test', function () {
  it('should test all moves at depth 2', function () {
    const chess = new Chess();
    const movesTested = [];

    function testAllMovesAtDepth(board, depth) {
      if (depth === 0) {
        // Ajoutez les assertions ou les opérations souhaitées ici
        movesTested.push(board.fen());
        return;
      }

      const moves = board.moves();
      moves.forEach(move => {
        board.move(move);
        testAllMovesAtDepth(board, depth - 1);
        board.undo();
      });
    }

    testAllMovesAtDepth(chess, 2);

    // Vérifiez que tous les coups possibles ont été testés
    assert.strictEqual(movesTested.length, chess.moves().length);
  });
});
