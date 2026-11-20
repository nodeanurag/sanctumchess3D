import React, { useEffect, useRef } from 'react';

export interface MoveRecord {
  notation: string;
  turn: 'w' | 'b';
  from: string;
  to: string;
  piece: string;
  isCapture: boolean;
}

interface MoveLedgerProps {
  isOpen: boolean;
  onToggle: () => void;
  moves: MoveRecord[];
  onPlayClick?: () => void;
}

export const MoveLedger: React.FC<MoveLedgerProps> = ({ isOpen, onToggle, moves, onPlayClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  // Group moves into pairs (White & Black)
  const movePairs = Array.from({ length: Math.ceil(moves.length / 2) }, (_, i) => ({
    num: i + 1,
    white: moves[i * 2].notation,
    black: moves[i * 2 + 1]?.notation
  }));

  const handleCopyPGN = () => {
    if (onPlayClick) onPlayClick();
    const pgnText = movePairs
      .map((p) => `${p.num}. ${p.white}${p.black ? ' ' + p.black : ''}`)
      .join(' ');
    navigator.clipboard?.writeText(pgnText);
  };

  return (
    <aside
      className={`sanctum-ledger-panel ${isOpen ? 'open' : ''}`}
      aria-label="Sanctum Move Ledger"
    >
      <div className="ledger-header">
        <div className="ledger-header-title">
          <span className="ledger-crest">✦</span>
          <span>Move Ledger</span>
          <span className="ledger-count-tag">{moves.length} ply</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {moves.length > 0 && (
            <button
              type="button"
              className="ledger-action-btn"
              onClick={handleCopyPGN}
              title="Copy PGN Notation to clipboard"
            >
              Copy PGN
            </button>
          )}
          <button
            type="button"
            className="ledger-close-btn"
            onClick={() => {
              if (onPlayClick) onPlayClick();
              onToggle();
            }}
            title="Collapse Move Ledger"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="ledger-body" ref={scrollRef}>
        {movePairs.length === 0 ? (
          <div className="ledger-empty-state">
            <div className="ledger-empty-ornament">✠</div>
            <p>The altar awaits the first command.</p>
            <span>Move a piece to record the chronicle.</span>
          </div>
        ) : (
          <table className="ledger-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>White</th>
                <th>Black</th>
              </tr>
            </thead>
            <tbody>
              {movePairs.map((pair, idx) => {
                const isLatestPair = idx === movePairs.length - 1;
                return (
                  <tr key={pair.num} className={isLatestPair ? 'latest-row' : ''}>
                    <td className="ledger-num-col">{pair.num}.</td>
                    <td className={`ledger-move ${!pair.black && isLatestPair ? 'active-move' : ''}`}>
                      {pair.white}
                    </td>
                    <td className={`ledger-move ${pair.black && isLatestPair ? 'active-move' : ''}`}>
                      {pair.black || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="ledger-footer">
        <span>Gothic Cathedral Altar Records</span>
        <span>Standard Algebraic</span>
      </div>
    </aside>
  );
};
