/* eslint-disable no-alert */
import { Template } from 'meteor/templating';
import { Aurora } from '../aurora/aurora';

import './play.html';
import './play.css';

const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
// const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';

// let shiftKey = false;

// $(document).on('keydown keyup', event => {
//   if (event.shiftKey) {
//     shiftKey = true;
//   } else {
//     shiftKey = false;
//   }
// });

Template.play.onRendered(() => {
  console.clear();

  let board = null;
  let aurora = null;

  $('#undo-button').on('click', () => {
    if (aurora.undoHistory.length !== 0) {
      aurora.undoMove();
      board.position(aurora.getFEN());
      board.resize();
    }
  });

  function onDragStart(source, piece) {}

  // eslint-disable-next-line consistent-return
  function onDrop(source, target) {
    if (source === 'offboard' || target === 'offboard') return 'snapback';
    const move = aurora.isLegalMove(source, target);
    if (move) {
      aurora.playMove(move);
      board.position(aurora.getFEN());
    } else {
      return 'snapback';
    }
  }

  // eslint-disable-next-line consistent-return
  function onSnapEnd() {
    // board.position(aurora.getFen());
  }

  const boardConfig = {
    pieceTheme: '/chesspieces/neo/{piece}.png',
    draggable: true,
    position: fen,
    onDragStart,
    onDrop,
    onSnapEnd,
    moveSpeed: 0,
    snapSpeed: 0,
  };

  // eslint-disable-next-line new-cap, no-undef
  board = Chessboard('board', boardConfig);

  const config = {
    fen,
    board,
  };

  aurora = new Aurora(config);
});
