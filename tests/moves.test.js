/* eslint-disable no-undef */
/* eslint-disable prefer-arrow-callback */
import { assert } from 'chai';
import { Aurora } from '../imports/ui/aurora/aurora';

const fen = {
  start: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  random:
    'kQqNrBPR/rRbnQbQp/RbQQkPNQ/pBnRPqPp/QbpkKNKK/NqKBpBrp/pkRqnkKp/KrBpKRqr w - - 0 1',
};

describe('Aurora Bitboards Initialization ', function () {
  let aurora;

  it('give all the bitboards from starting position', function () {
    aurora = new Aurora({ fen: fen.start });
    assert.strictEqual(aurora.wp.toString(16), 'ff00'); // bitboard des pions blanc a la position de depart
    assert.strictEqual(aurora.wr.toString(16), '81'); // bitboard des tours blanche a la position de depart
    assert.strictEqual(aurora.wn.toString(16), '42'); // bitboard des cavaliers blanc a la position de depart
    assert.strictEqual(aurora.wb.toString(16), '24'); // bitboard des fous blanc a la position de depart
    assert.strictEqual(aurora.wq.toString(16), '10'); // bitboard des dames blanche a la position de depart
    assert.strictEqual(aurora.wk.toString(16), '8'); // bitboard des rois blanc a la position de depart
    assert.strictEqual(aurora.bp.toString(16), 'ff000000000000'); // bitboard des pions noir a la position de depart
    assert.strictEqual(aurora.br.toString(16), '8100000000000000'); // bitboard des tours noire a la position de depart
    assert.strictEqual(aurora.bn.toString(16), '4200000000000000'); // bitboard des cavaliers noir a la position de depart
    assert.strictEqual(aurora.bb.toString(16), '2400000000000000'); // bitboard des fous noir a la position de depart
    assert.strictEqual(aurora.bq.toString(16), '1000000000000000'); // bitboard des dames noire a la position de depart
    assert.strictEqual(aurora.bk.toString(16), '800000000000000'); // bitboard des rois noir a la position de depart
  });

  it('give all the bitboards from random position', function () {
    aurora = new Aurora({ fen: fen.random });
    assert.strictEqual(aurora.wp.toString(16), '200040a00000000'); // bitboard des pions blanc a la position random
    assert.strictEqual(aurora.wr.toString(16), '140801000002004'); // bitboard des tours blanche a la position random
    assert.strictEqual(aurora.wn.toString(16), '1000020004800000'); // bitboard des cavaliers blanc a la position random
    assert.strictEqual(aurora.wb.toString(16), '400004000140020'); // bitboard des fous blanc a la position random
    assert.strictEqual(aurora.wq.toString(16), '400a310080000000'); // bitboard des dames blanche a la position random
    assert.strictEqual(aurora.wk.toString(16), 'b200288'); // bitboard des rois blanc a la position random
    assert.strictEqual(aurora.bp.toString(16), '1008120098110'); // bitboard des pions noir a la position random
    assert.strictEqual(aurora.br.toString(16), '880000000020041'); // bitboard des tours noire a la position random
    assert.strictEqual(aurora.bn.toString(16), '10002000000800'); // bitboard des cavaliers noir a la position random
    assert.strictEqual(aurora.bb.toString(16), '24400040000000'); // bitboard des fous noir a la position random
    assert.strictEqual(aurora.bq.toString(16), '2000000400401002'); // bitboard des dames noire a la position random
    assert.strictEqual(aurora.bk.toString(16), '8000080010004400'); // bitboard des rois noir a la position random
  });
});

describe('Aurora Get Moves', function () {
  let aurora;

  it('should give 20 moves from the starting position', function () {
    aurora = new Aurora({ fen: fen.start });

    const moves = aurora.getMoves();

    assert.strictEqual(moves.length, 16);
  });
});
