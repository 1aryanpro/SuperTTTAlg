const MCTS = require('mcts').MCTS;
const chalk = require('chalk');
const readlineSync = require('readline-sync');

function dec2bin(dec) {
  return (dec >>> 0).toString(2);
}

class Utils {

  static BoardWins = [
    0b111000000,
    0b000111000,
    0b000000111,
    0b100100100,
    0b010010010,
    0b001001001,
    0b100010001,
    0b001010100,
  ]

  // Tic Tac Toe board is defined as an array of 9 elements
  // 0 is empty, 1 is X, 2 is 0
  static checkBoardWin(board, lastPlayer) {
    let curr = board[lastPlayer];
    return this.BoardWins.some((b) => b == (b & curr)) ? 1 : 0;
  }

  static emptyBoard() {
    return new Uint16Array(2);
  }

  static displayBoard(board, print = true) {
    const pb = [];
    const p0 = board[0];
    const p1 = board[1];

    for (let i = 8; i >= 0; i--) {
      const mask = 1 << i;
      const player0Bit = (p0 & mask) != 0 ? chalk.blue(' O ') : '';
      const player1Bit = (p1 & mask) != 0 ? chalk.red(' X ') : '';
      const emptyBit = ((p0 & mask) | (p1 & mask)) == 0 ? chalk.grey(String(1 << i).padStart(3)) : '';
      pb.unshift(player0Bit + player1Bit + emptyBit);
    }


    let out = [
      `${pb[0]}┃${pb[1]}┃${pb[2]}`,
      '━━━╋━━━╋━━━',
      `${pb[3]}┃${pb[4]}┃${pb[5]}`,
      '━━━╋━━━╋━━━',
      `${pb[6]}┃${pb[7]}┃${pb[8]}`
    ];

    if (print) out.forEach(l => console.log(l))
    else return out;
  }

  static displaySuperBoard(superboard) {
    console.log();
    let pbs = superboard.map(b => this.displayBoard(b, false));

    let dash = '━━━━━━━━━━━━━';
    dash = `${dash}█${dash}█${dash}`;

    let out = [];

    [[0, 3], [3, 6], [6, 9]].forEach(bounds => {
      for (let j = 0; j < 5; j++) {
        let line = ' ';
        for (let i = bounds[0]; i < bounds[1]; i++) {
          line += pbs[i][j];
          if (i != bounds[1] - 1) line += ' █ '
        }
        out.push(line);
      }
      out.push(dash);
    });
    out.pop();
    out.push('');

    out.map(m => console.log(m))
  }
}

class Game {
  constructor(dev = false) {
    this.dev = dev;

    this.player = 0;

    this.boards = Array(9).fill().map(() => Utils.emptyBoard());
    this.superBoard = Utils.emptyBoard();

    this.nextMoveLocation = -1;
    this.lastMove = null;
  }

  getPossibleMoves() {
    let locations = 0;
    if (this.nextMoveLocation == -1) {
      locations = 0b111111111;
    } else if ((this.superBoard[0] | this.superBoard[1]) & (1 << this.nextMoveLocation) != 0) {
      locations = ~(this.superBoard[0] | this.superBoard[1]);
    } else {
      locations = 1 << this.nextMoveLocation;
    }

    let location = 0;
    let moves = [];

    while (locations != 0) {
      if (locations % 2 == 0) {
        location++;
        locations >>= 1;

        if (location >= 9) break;
        continue;
      }

      let currBoard = this.boards[location];
      let movesMask = ~(currBoard[0] | currBoard[1]);

      for (let i = 0; i < 9; i++) {
        if ((movesMask & (1 << i)) != 0) moves.push([location, 1 << i]);
      }

      location++;
      if (location >= 9) break;
      locations >>= 1;
    }

    return moves;
  }

  getCurrentPlayer() {
    return this.player;
  }

  performMove([loc, move]) {
    let currBoard = this.boards[loc];
    currBoard[this.player] |= move;

    let check = Utils.checkBoardWin(currBoard, this.player);
    this.superBoard[this.player] |= check << loc;

    this.nextMoveLocation = Math.log2(move);


    this.player += 1;
    this.player %= 2;
  }

  getWinner() {
    let p0win = Utils.checkBoardWin(this.superBoard, 0);
    let p1win = Utils.checkBoardWin(this.superBoard, 1);

    if (p0win) return 0;
    if (p1win) return 1;
    return undefined;
  }
}

let game = new Game();
let history = [];

history.forEach(h => game.performMove(h));

while (game.getWinner() == undefined) {
  console.log(game.player);
  let mcts = new MCTS(game, 1000, game.player);
  let move = mcts.selectMove();
  game.performMove(move);
  history.push(move);

  Utils.displaySuperBoard(game.boards);
  Utils.displayBoard(game.superBoard);

  console.log('\nNext board: ' + game.nextMoveLocation);
  let b = readlineSync.question("Board: ");
  let p = readlineSync.question("Pos: ");


  let nextMove = [Number.parseInt(b), Number.parseInt(p)];
  history.push(nextMove);
  game.performMove(nextMove);

  console.log(history);
}


