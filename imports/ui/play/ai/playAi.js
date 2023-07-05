/* eslint-disable new-cap */
/* eslint-disable no-unused-vars */
import { Chess } from 'chess.js';
import { Template } from 'meteor/templating';
import { Aurora } from '../../aurora/aurora';

import './playAi.html';
import './playAi.css';

Template.playai.onRendered(() => {
  let board = null;
  const game = new Chess();
  const aurora = new Aurora(board, game, 'b', false);
  $('#depth-input').attr('max', aurora.MAX_DEPTH);
  $('#depth-input').val(aurora.DEFAULT_DEPTH);

  function onDragStart(source, piece, position, orientation) {}

  // eslint-disable-next-line consistent-return
  function onDrop(source, target, piece, position) {
    const from = source;
    const to = target;

    try {
      const move = game.move({ from, to, promotion: 'q' });
    } catch (error) {
      return 'snapback';
    }
  }

  // eslint-disable-next-line consistent-return
  function onSnapEnd() {
    // $('#evaluation').text(aurora.evaluatePosition(game.fen()));

    const depthInput = parseInt($('#depth-input').val(), 10);
    aurora.playMoves(aurora.searchMoves(depthInput), 50, board, depthInput); // tu peux gerer la speed des coups ici (50ms)

    // $('#evaluation').text(aurora.evaluatePosition(game.fen()));

    if (game.isCheckmate()) {
      if (game.turn() === 'w') return console.log('Black won');
      else return console.log('White won');
    }

    if (
      game.isDraw() ||
      game.isInsufficientMaterial() ||
      game.isStalemate() ||
      game.isThreefoldRepetition()
    ) {
      console.log('Draw');
    }
  }

  const config = {
    pieceTheme: '/img/chesspieces/wikipedia/{piece}.png',
    draggable: true,
    position: 'start',
    promotion: 'q',
    onDragStart,
    onDrop,
    onSnapEnd,
  };

  // eslint-disable-next-line no-undef
  board = Chessboard('board', config);
  if (aurora.selfPlay) aurora.autoPlay(board);
  aurora.playMoves(
    aurora.searchMoves($('#depth-input').val()),
    parseInt($('#depth-input').val(), 10),
    board,
  );
});
