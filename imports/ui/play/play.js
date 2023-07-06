import { Template } from 'meteor/templating';
import { Aurora } from '../aurora/aurora';

import './play.html';
import './play.css';

Template.play.onRendered(() => {
  let board = null;
  const aurora = new Aurora();
  // const game = new Chess();
  // const aurora = new Aurora(board, game, 'b', false);
  // $('#depth-input').attr('max', aurora.MAX_DEPTH);
  // $('#depth-input').val(aurora.DEFAULT_DEPTH);

  function onDragStart(source, piece, position, orientation) {
    // console.log(source, piece, position, orientation);
  }

  // eslint-disable-next-line consistent-return
  function onDrop(source, target) {
    const move = aurora.isMove(source, target);

    if (move) aurora.playMove(move);
    else return 'snapback';
  }

  // eslint-disable-next-line consistent-return
  function onSnapEnd() {
    // $('#evaluation').text(aurora.evaluatePosition(game.fen()));
    // const depthInput = parseInt($('#depth-input').val(), 10);
    // aurora.makeMove(depthInput);
    // $('#evaluation').text(aurora.evaluatePosition(game.fen()));
    // if (game.isCheckmate()) {
    //   if (game.turn() === 'w') return console.log('Black won');
    //   else return console.log('White won');
    // }
    // if (
    //   game.isDraw() ||
    //   game.isInsufficientMaterial() ||
    //   game.isStalemate() ||
    //   game.isThreefoldRepetition()
    // ) {
    //   console.log('Draw');
    // }
  }

  const config = {
    pieceTheme: '/chesspieces/wikipedia/{piece}.png',
    draggable: true,
    position: 'start',
    promotion: 'q',
    onDragStart,
    onDrop,
    onSnapEnd,
  };

  // eslint-disable-next-line no-undef
  board = Chessboard('board', config);
  // if (aurora.selfPlay) aurora.autoPlay(board);
});
