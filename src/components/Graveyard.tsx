import React from 'react';

interface GraveyardProps {
  capturedWhite: string[]; // Pieces captured by White (i.e. slain Black pieces)
  capturedBlack: string[]; // Pieces captured by Black (i.e. slain White pieces)
}

const PIECE_VALUES: Record<string, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9
};

const PIECE_SYMBOLS: Record<string, string> = {
  pawn: '♟',
  knight: '♞',
  bishop: '♝',
  rook: '♜',
  queen: '♛'
};

const PIECE_ORDER = ['queen', 'rook', 'bishop', 'knight', 'pawn'];

export const Graveyard: React.FC<GraveyardProps> = ({ capturedWhite, capturedBlack }) => {
  // Aggregate counts
  const countPieces = (list: string[]) =>
    list.reduce(
      (acc, p) => {
        const type = p.toLowerCase();
        if (acc.counts[type] !== undefined) {
          acc.counts[type]++;
          acc.score += PIECE_VALUES[type] || 0;
        }
        return acc;
      },
      { counts: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0 } as Record<string, number>, score: 0 }
    );

  const whiteTrophies = countPieces(capturedWhite);
  const blackTrophies = countPieces(capturedBlack);

  const materialDiff = whiteTrophies.score - blackTrophies.score;

  const totalCaptured = capturedWhite.length + capturedBlack.length;

  if (totalCaptured === 0) {
    return (
      <div className="graveyard-idle-state">
        <span className="graveyard-crest">✦</span>
        <span>Altar Pristine • No Slain Relics</span>
      </div>
    );
  }

  return (
    <div className="graveyard-container">
      {/* White Trophies (Slain Black Army) */}
      <div className="graveyard-side white-side">
        <div className="graveyard-side-label">
          <span className="graveyard-side-dot white"></span>
          <span>White Trophies</span>
          {materialDiff > 0 && <span className="graveyard-adv-badge">+{materialDiff}</span>}
        </div>
        <div className="graveyard-pieces-row">
          {PIECE_ORDER.map((type) => {
            const count = whiteTrophies.counts[type];
            if (!count) return null;
            return (
              <span key={type} className="graveyard-piece-chip" title={`${count} Black ${type}(s) slain`}>
                <span className="graveyard-symbol black-piece">{PIECE_SYMBOLS[type]}</span>
                {count > 1 && <span className="graveyard-chip-count">×{count}</span>}
              </span>
            );
          })}
        </div>
      </div>

      <div className="graveyard-divider" aria-hidden="true" />

      {/* Black Trophies (Slain White Army) */}
      <div className="graveyard-side black-side">
        <div className="graveyard-side-label">
          <span className="graveyard-side-dot black"></span>
          <span>Black Trophies</span>
          {materialDiff < 0 && <span className="graveyard-adv-badge">+{Math.abs(materialDiff)}</span>}
        </div>
        <div className="graveyard-pieces-row">
          {PIECE_ORDER.map((type) => {
            const count = blackTrophies.counts[type];
            if (!count) return null;
            return (
              <span key={type} className="graveyard-piece-chip" title={`${count} White ${type}(s) slain`}>
                <span className="graveyard-symbol white-piece">{PIECE_SYMBOLS[type]}</span>
                {count > 1 && <span className="graveyard-chip-count">×{count}</span>}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
