/* eslint-disable no-undef */
/* eslint-disable prefer-arrow-callback */
import { assert } from 'chai';
import { Aurora } from '../imports/ui/aurora/aurora';

describe('Aurora Search : Start Position', function () {
  const config = {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  };
  const aurora = new Aurora(config);

  it('Depth : 1 ply : 20 positions', function () {
    const depth = 1;

    const moves = aurora.getMoves(depth);
    assert.strictEqual(moves.length, 20);
  });

  // it('Depth : 2 ply : 400 positions', function () {
  //   const depth = 2;

  //   const moves = aurora.searchMoves(depth);
  //   assert.strictEqual(moves.length, 400);
  // });

  // it('Depth : 3 ply : 8902 positions', function () {
  //   this.timeout(0);
  //   const depth = 3;

  //   const moves = aurora.searchMoves(depth);
  //   assert.strictEqual(moves.length, 8902);
  // });

  // it('Depth : 4 ply : 197281 positions', function () {
  //   const depth = 4;

  //   const moves = aurora.searchMoves(depth);
  //   assert.strictEqual(moves.length, 197281);
  // });

  // it('Depth : 5 ply : 4865609 positions', function () {
  //   const depth = 5;

  //   const moves = aurora.searchMoves(depth);
  //   assert.strictEqual(moves.length, 4865609);
  // });
});
