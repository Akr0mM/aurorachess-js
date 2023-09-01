/* eslint-disable no-alert */
import { Template } from 'meteor/templating';
import { Aurora } from '../aurora/aurora';

import './play.html';
import './play.css';

const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
// const rooksFen = '8/8/pp3R1p/8/p2R1p1p/8/4Rp2/8 w - - 0 1';
// const knightsFen = 'N7/2p1p1N1/1P2p3/3N4/1N4p1/4N3/2P4N/5P2 w - - 0 1';
// const kingsFen = '8/8/P1pP3P/Kp1Kp1PK/p1PpP1pp/8/Pp4Pp/KP4pK w - - 0 1';

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

  function onDragStart(source, piece) {}

  // eslint-disable-next-line consistent-return
  function onDrop(source, target, piece) {
    // const move = aurora.isLegalMove(source, target);
    // if (move) {
    //   aurora.playMove(move);
    //   aurora.update();
    // } else {
    //   return 'snapback';
    // }
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
  };

  // eslint-disable-next-line new-cap, no-undef
  board = Chessboard('board', boardConfig);

  const config = {
    fen,
    board,
  };

  aurora = new Aurora(config);
});
