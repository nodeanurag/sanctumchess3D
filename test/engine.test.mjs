import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';

const source = fs.readFileSync(new URL('../src/wizardChessEngine.js', import.meta.url), 'utf8');

// Execute production function bodies with real Three.js math and stubbed rendering.
// Keep extraction tied to the engine's enclosing indentation, not copied chess rules.
function engineFunction(name) {
  const start = source.indexOf(`    function ${name}(`);
  assert.notEqual(start, -1, `Missing engine function ${name}`);
  const end = source.indexOf('\n    }', start);
  return source.slice(start, end + '\n    }'.length);
}

function engineConstant(name) {
  const start = source.indexOf(`    const ${name} =`);
  assert.notEqual(start, -1, `Missing engine constant ${name}`);
  return source.slice(start, source.indexOf(';', start) + 1);
}

function harness() {
  const elements = new Map();
  for (const id of ['turn-dot', 'turn-text', 'mode-badge', 'btn-ai-move', 'btn-side-toggle',
    'btn-cam-player', 'btn-cam-top', 'btn-cam-side', 'btn-cam-wide', 'captured-tray']) {
    const classes = new Set();
    elements.set(id, {
      textContent: id === 'captured-tray' ? 'React graveyard' : '',
      style: {},
      classList: {
        add: (name) => classes.add(name),
        remove: (name) => classes.delete(name),
        contains: (name) => classes.has(name)
      }
    });
  }
  const events = [];
  const scene = new THREE.Scene();
  const context = vm.createContext({
    THREE, console, performance, scene, elements, events,
    document: { getElementById: (id) => elements.get(id) || null },
    window: { dispatchEvent: (event) => events.push(event) },
    CustomEvent: class {
      constructor(type, options = {}) { this.type = type; this.detail = options.detail; }
    },
    boardState: Array.from({ length: 8 }, () => Array(8).fill(null)),
    currentTurn: 'w', gameOver: false, isAnimatingMove: false,
    playerColor: 'w', gameMode: 'single', aiAutoPlay: false, aiTimer: null,
    capturedByWhite: 0, capturedByBlack: 0, capturedPiecesWhite: [], capturedPiecesBlack: [],
    moveHistory: [], scriptCursor: 0, scriptMoves: [], scriptedGameActive: false, scriptDeviated: false,
    preMoveHighlightTask: null, activeDuelSavedCam: null, activeCamTransition: null,
    selectedSquare: null, validMoves: [], activeMixers: [], activeMoveTweens: [], shatterDebris: [],
    checkmateState: { active: false },
    renderer: { shadowMap: {} },
    camera: new THREE.PerspectiveCamera(),
    orbitControls: { target: new THREE.Vector3(), enabled: true, update() {} },
    impactFlashLight: { position: new THREE.Vector3(), intensity: 0, visible: false },
    squareHighlightsGroup: new THREE.Group(),
    cameraTelemetry: { attackCount: 0, maxStepDelta: 0 },
    playerCamSide: 'w', overheadCamSide: 'w', sideCamSide: 'east', cathedralWideSide: 'north',
    playPieceClip() {}, spawnStoneShatter() {}, updateScriptBarUI() {},
    triggerCheckmateSequence() {}, flushOrbitControlsDamping() {},
    clearTimeout() {},
    setTimeout(callback) { context.pendingAI = callback; return 1; },
    smoothCameraTo(position, target) {
      context.camera.position.copy(position);
      context.orbitControls.target.copy(target);
    },
    setActiveCamButton(id) {
      for (const [key, element] of elements) {
        if (key.startsWith('btn-cam-')) element.classList.remove('active');
      }
      elements.get(id).classList.add('active');
    }
  });
  context.instantiatePiece = (type, color, r, c) => {
    const mesh = new THREE.Object3D();
    mesh.position.copy(context.boardToWorld(r, c));
    scene.add(mesh);
    return { type, color, r, c, mesh, hasMoved: false };
  };
  const constants = ['PIECE_VALUES', 'BOARD_SQ_SIZE', 'BOARD_SURFACE_Y',
    'ATTACK_SYNC_PROFILES', 'PIECE_HEIGHTS', 'MIN_PIECE_SEP', 'MELEE_STANDOFF', 'DEFAULT_DIRECTOR_NOTATION'];
  const functions = ['boardToWorld', 'easeInOutCubic', 'clearAllPieces', 'clearCheckmateSequence',
    'captureBoardSnapshot', 'restoreBoardSnapshot', 'resetChessBoard',
    'getPseudoMovesForPiece', 'isKingInCheck', 'getLegalMovesForPiece', 'getAllLegalMoves',
    'clearSquareHighlights', 'showSquareHighlights', 'executeChessMove', 'chooseSmartAIMove',
    'triggerAIMoveNow', 'maybeScheduleAIMove', 'createInitialVirtualBoard',
    'getVirtualLegalMovesForSquare', 'parseNotationToMoves', 'loadNotationScript',
    'completeCurrentMoveImmediately', 'isScriptMoveLegalOnCurrentBoard', 'stepScriptForward',
    'stepScriptBackward', 'setCameraForSide', 'setCameraPreset', 'updateTurnUI'];
  vm.runInContext([...constants.map(engineConstant), ...functions.map(engineFunction)].join('\n'), context);
  context.resetChessBoard();
  return context;
}

function finish(game) {
  let steps = 0;
  while (game.activeMoveTweens.length && steps++ < 300) {
    for (let i = game.activeMoveTweens.length - 1; i >= 0; i--) {
      if (game.activeMoveTweens[i](0.05)) game.activeMoveTweens.splice(i, 1);
    }
  }
  assert.equal(game.activeMoveTweens.length, 0, 'Animation must complete');
}

function move(game, from, to, options) {
  const square = (name) => [8 - Number(name[1]), name.charCodeAt(0) - 97];
  assert.equal(game.executeChessMove(...square(from), ...square(to), options), true, `${from}-${to}`);
  finish(game);
}

function scenario(game, pieces, turn = 'w') {
  game.clearAllPieces();
  game.boardState.enPassantTarget = null;
  game.currentTurn = turn;
  game.gameOver = false;
  for (const [type, color, r, c] of pieces) {
    game.boardState[r][c] = game.instantiatePiece(type, color, r, c);
  }
}

test('starting position has 20 legal moves and turn updates preserve the React graveyard', () => {
  const game = harness();
  assert.equal(game.getAllLegalMoves('w').length, 20);
  assert.equal(game.elements.get('captured-tray').textContent, 'React graveyard');
  move(game, 'e2', 'e4');
  assert.equal(game.elements.get('captured-tray').textContent, 'React graveyard');
});

test('white en passant captures, records, rewinds, and replays the correct pawn', () => {
  const game = harness();
  move(game, 'e2', 'e4');
  move(game, 'a7', 'a6');
  move(game, 'e4', 'e5');
  move(game, 'd7', 'd5');
  assert.ok(game.getLegalMovesForPiece(3, 4).some((m) => m.r === 2 && m.c === 3 && m.enPassant));
  move(game, 'e5', 'd6');
  assert.equal(game.boardState[3][3], null);
  assert.equal(game.boardState[2][3].color, 'w');
  assert.deepEqual([...game.capturedPiecesWhite], ['pawn']);
  assert.equal(game.moveHistory.at(-1).record.notation, 'exd6');
  assert.equal(game.stepScriptBackward(), true);
  assert.equal(game.boardState[3][3].color, 'b');
  assert.deepEqual([...game.capturedPiecesWhite], []);
  assert.equal(game.events.at(-1).type, 'sanctum-restore');
  assert.equal(game.events.at(-1).detail.moves.length, 4);
  move(game, 'e5', 'd6');
  assert.deepEqual([...game.capturedPiecesWhite], ['pawn']);
});

test('black en passant is legal only immediately after the double pawn push', () => {
  const game = harness();
  move(game, 'a2', 'a3');
  move(game, 'e7', 'e5');
  move(game, 'a3', 'a4');
  move(game, 'e5', 'e4');
  move(game, 'd2', 'd4');
  assert.ok(game.getLegalMovesForPiece(4, 4).some((m) => m.enPassant));
  const snap = game.captureBoardSnapshot();
  move(game, 'h7', 'h6');
  move(game, 'h2', 'h3');
  assert.ok(!game.getLegalMovesForPiece(4, 4).some((m) => m.enPassant));
  game.restoreBoardSnapshot(snap);
  move(game, 'e4', 'd3');
  assert.equal(game.boardState[4][3], null);
  assert.deepEqual([...game.capturedPiecesBlack], ['pawn']);
});

test('en passant cannot expose the moving side king to a rook', () => {
  const game = harness();
  scenario(game, [['king', 'w', 3, 7], ['king', 'b', 0, 0],
    ['rook', 'b', 3, 0], ['pawn', 'w', 3, 6], ['pawn', 'b', 3, 5]]);
  game.boardState.enPassantTarget = { r: 2, c: 5 };
  assert.ok(game.getPseudoMovesForPiece(3, 6).some((m) => m.enPassant));
  assert.ok(!game.getLegalMovesForPiece(3, 6).some((m) => m.enPassant));
});

test('notation parser carries en passant into subsequent moves', () => {
  const game = harness();
  const moves = game.parseNotationToMoves('1. e4 a6 2. e5 d5 3. exd6 exd6');
  assert.equal(moves.length, 6);
  assert.equal(moves[4].capture, true);
  assert.equal(moves[5].capture, true);
});

for (const color of ['w', 'b']) {
  for (const promotion of ['queen', 'rook', 'bishop', 'knight']) {
    test(`${color} promotion respects ${promotion} and records its notation`, () => {
      const game = harness();
      const r = color === 'w' ? 1 : 6;
      const toR = color === 'w' ? 0 : 7;
      scenario(game, [['king', 'w', 7, 7], ['king', 'b', 0, 7], ['pawn', color, r, 0]], color);
      assert.equal(game.executeChessMove(r, 0, toR, 0, { promotion }), true);
      finish(game);
      assert.equal(game.boardState[toR][0].type, promotion);
      const suffix = promotion === 'knight' ? 'N' : promotion[0].toUpperCase();
      assert.match(game.moveHistory.at(-1).record.notation, new RegExp(`=${suffix}[+#]?$`));
    });
  }
}

test('invalid promotion and illegal remote moves do not mutate history', () => {
  const game = harness();
  assert.equal(game.executeChessMove(6, 4, 4, 4, { promotion: 'king' }), false);
  assert.equal(game.executeChessMove(6, 4, 1, 4, { fromRemote: true }), false);
  assert.equal(game.moveHistory.length, 0);
});

test('scripted underpromotion survives immediate and highlighted execution paths', () => {
  for (const highlighted of [false, true]) {
    const game = harness();
    scenario(game, [['king', 'w', 7, 7], ['king', 'b', 0, 7], ['pawn', 'w', 1, 0]]);
    game.scriptedGameActive = true;
    game.scriptMoves = [{ fromR: 1, fromC: 0, toR: 0, toC: 0, color: 'w', promotion: 'knight' }];
    game.elements.set('chk-premove-highlight', { checked: highlighted });
    assert.equal(game.stepScriptForward(), true);
    game.completeCurrentMoveImmediately();
    assert.equal(game.boardState[0][0].type, 'knight');
  }
});

test('undo restores captures and publishes the rewound ledger without replaying moves', () => {
  const game = harness();
  move(game, 'e2', 'e4');
  move(game, 'd7', 'd5');
  move(game, 'e4', 'd5');
  assert.equal(game.capturedByWhite, 1);
  assert.equal(game.stepScriptBackward(), true);
  assert.equal(game.capturedByWhite, 0);
  const event = game.events.at(-1);
  assert.equal(event.type, 'sanctum-restore');
  assert.equal(event.detail.moves.length, 2);
  assert.deepEqual([...event.detail.capturedPiecesWhite], []);
  assert.equal(game.boardState[3][3].color, 'b');
  move(game, 'e4', 'e5');
  assert.deepEqual([...game.capturedPiecesWhite], []);
});

test('new game exits script mode and schedules the automatic opponent again', () => {
  const game = harness();
  assert.equal(game.loadNotationScript('1. e4 e5').ok, true);
  assert.equal(game.scriptedGameActive, true);
  game.playerColor = 'b';
  game.aiAutoPlay = true;
  game.resetChessBoard();
  assert.equal(game.scriptedGameActive, false);
  assert.equal(game.scriptMoves.length, 0);
  assert.equal(game.scriptCursor, 0);
  assert.equal(typeof game.pendingAI, 'function');
});

test('explicit player view respects Black while repeated camera-button clicks still flip', () => {
  const game = harness();
  game.playerColor = 'b';
  game.resetChessBoard();
  game.setCameraPreset('player', false);
  assert.equal(game.playerCamSide, 'b');
  assert.ok(game.camera.position.z < 0);
  game.setCameraPreset('player');
  assert.equal(game.playerCamSide, 'w');
});

test('highlight cleanup disposes every geometry and material across repeated selections', () => {
  const game = harness();
  for (let round = 0; round < 5; round++) {
    game.showSquareHighlights(6, 4, game.getLegalMovesForPiece(6, 4));
    const meshes = [...game.squareHighlightsGroup.children];
    let geometries = 0;
    let materials = 0;
    for (const mesh of meshes) {
      mesh.geometry.addEventListener('dispose', () => geometries++);
      mesh.material.addEventListener('dispose', () => materials++);
    }
    game.clearSquareHighlights();
    assert.equal(geometries, meshes.length);
    assert.equal(materials, meshes.length);
    assert.equal(game.squareHighlightsGroup.children.length, 0);
  }
});
