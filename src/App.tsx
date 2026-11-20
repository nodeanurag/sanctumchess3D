import { useEffect, useRef, useState } from 'react';
import { initWizardChess } from './wizardChessEngine.js';
import { LandingPage, SoundGlyph } from './components/LandingPage';
import { MoveLedger, MoveRecord } from './components/MoveLedger';
import { Graveyard } from './components/Graveyard';
import { sanctumAudio } from './audio/sanctumAudio';
import { analytics } from './analytics';

export default function App() {
  const initializedRef = useRef(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'landing' | 'arena'>('landing');
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => sanctumAudio.getMuted());
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<string[]>([]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Attach procedural audio engine to global window for 3D engine hooks
    (window as unknown as { sanctumAudio?: typeof sanctumAudio }).sanctumAudio = sanctumAudio;

    initWizardChess();

  }, []);

  useEffect(() => {
    const handleReady = () => document.getElementById('btn-cam-wide')?.click();
    window.addEventListener('sanctum-ready', handleReady);
    return () => window.removeEventListener('sanctum-ready', handleReady);
  }, []);

  useEffect(() => {
    const handleSanctumMove = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;

      setMoves((prev) => [
        ...prev,
        {
          notation: detail.notation,
          turn: detail.turn,
          from: detail.from,
          to: detail.to,
          piece: detail.piece,
          isCapture: detail.isCapture
        }
      ]);

      if (detail.notation) {
        analytics.trackMove(detail.notation, detail.turn, Boolean(detail.isCapture));
      }

      if (detail.capturedPiecesWhite) {
        setCapturedWhite(detail.capturedPiecesWhite);
      }
      if (detail.capturedPiecesBlack) {
        setCapturedBlack(detail.capturedPiecesBlack);
      }
    };

    const handleSanctumReset = () => {
      setMoves([]);
      setCapturedWhite([]);
      setCapturedBlack([]);
    };
    const handleSanctumRestore = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setMoves(detail.moves);
      setCapturedWhite(detail.capturedPiecesWhite);
      setCapturedBlack(detail.capturedPiecesBlack);
    };

    window.addEventListener('sanctum-move', handleSanctumMove);
    window.addEventListener('sanctum-reset', handleSanctumReset);
    window.addEventListener('sanctum-restore', handleSanctumRestore);

    return () => {
      window.removeEventListener('sanctum-move', handleSanctumMove);
      window.removeEventListener('sanctum-reset', handleSanctumReset);
      window.removeEventListener('sanctum-restore', handleSanctumRestore);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false);
        setLedgerOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileSheetOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // Drift the live altar to the right while the landing page is open so the
    // hero copy and the 3D scene share the frame, then recentre for play.
    document.body.classList.toggle('landing-active', viewMode === 'landing');
    return () => document.body.classList.remove('landing-active');
  }, [viewMode]);

  const handleStartGame = (side: 'w' | 'b') => {
    sanctumAudio.playClick();
    const sideToggleBtn = document.getElementById('btn-side-toggle');
    const modeBadge = document.getElementById('mode-badge');
    const isCurrentlyWhite = modeBadge ? modeBadge.textContent?.includes('White') : true;

    if (side === 'b' && isCurrentlyWhite && sideToggleBtn) {
      sideToggleBtn.click();
    } else if (side === 'w' && !isCurrentlyWhite && sideToggleBtn) {
      sideToggleBtn.click();
    }

    const engine = (window as unknown as {
      wizardChess?: { setCameraPreset: (preset: string, flipActive: boolean) => void }
    }).wizardChess;
    engine?.setCameraPreset('player', false);
    analytics.trackGameStart(side);
    setViewMode('arena');
  };

  const handleTriggerAIMove = () => {
    sanctumAudio.playClick();
    setViewMode('arena');
    setTimeout(() => {
      document.getElementById('btn-ai-move')?.click();
    }, 400);
  };

  const handleSetCameraPreset = (preset: 'wide' | 'side' | 'top' | 'player') => {
    sanctumAudio.playClick();
    analytics.trackCameraPreset(preset);
    document.getElementById(`btn-cam-${preset}`)?.click();
  };

  const handleReturnToTitle = () => {
    sanctumAudio.playClick();
    setViewMode('landing');
    handleSetCameraPreset('wide');
  };

  const handleToggleSound = () => {
    const muted = sanctumAudio.toggleMute();
    setIsMuted(muted);
    analytics.trackSoundToggle(muted);
    if (!muted) sanctumAudio.playClick();
  };

  const handleRestoreUI = () => {
    sanctumAudio.playClick();
    const win = window as unknown as { wizardChess?: { toggleUI?: (force?: boolean) => void } };
    if (win.wizardChess?.toggleUI) {
      win.wizardChess.toggleUI(false);
    } else {
      document.body.classList.remove('cinematic-ui-hidden');
      const btnHide = document.getElementById('btn-hide-ui');
      if (btnHide) btnHide.textContent = 'Hide UI [H]';
    }
  };

  return (
    <>
      <div id="loading-overlay">
        <div className="loader-title">Sanctum Chess</div>
        <div className="loader-bar-wrap">
          <div className="loader-bar" id="loader-bar"></div>
        </div>
        <div id="loader-text">Summoning Sanctum Architecture &amp; Sculpted Relics...</div>
      </div>

      <div id="canvas-container"></div>

      {/* Atmospheric Gothic Title Screen & Grimoire Codex */}
      <LandingPage
        isDismissed={viewMode === 'arena'}
        onStartGame={handleStartGame}
        onTriggerAIMove={handleTriggerAIMove}
        onSetCameraPreset={handleSetCameraPreset}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
      />

      {/* Real-Time Move Ledger Panel */}
      <MoveLedger
        isOpen={viewMode === 'arena' && ledgerOpen}
        onToggle={() => setLedgerOpen((prev) => !prev)}
        moves={moves}
        onPlayClick={() => sanctumAudio.playClick()}
      />

      <button
        type="button"
        className={`hud-btn mobile-only-restore-ui ${viewMode === 'landing' ? 'hud-hidden-landing' : ''}`}
        id="btn-mobile-show-ui"
        onClick={handleRestoreUI}
        title="Show HUD Controls"
      >
        Show UI
      </button>

      {/* Primary In-Arena HUD */}
      <div id="hud-top" inert={viewMode === 'landing'} className={viewMode === 'landing' ? 'hud-hidden-landing' : ''}>
        <div className="hud-group" id="hud-left">
          <button
            type="button"
            className="btn-arena-sanctum-title"
            onClick={handleReturnToTitle}
            title="Return to Sanctum Title Screen"
          >
            <span aria-hidden="true">♜</span> Sanctum
          </button>
          <div className="brand-pill">
            <span className="brand-title">Sanctum Chess</span>
          </div>
          <div className="status-pill" id="status-pill">
            <span className="turn-dot" id="turn-dot"></span>
            <span id="turn-text">White to Move</span>
            <span className="mode-badge" id="mode-badge">Playing as White</span>
          </div>
        </div>

        <button
          type="button"
          className={`hud-btn mobile-controls-trigger ${mobileSheetOpen ? 'active' : ''}`}
          id="btn-mobile-controls"
          aria-expanded={mobileSheetOpen}
          aria-controls="hud-right"
          onClick={() => {
            sanctumAudio.playClick();
            setMobileSheetOpen((prev) => !prev);
          }}
        >
          {mobileSheetOpen ? 'Close' : 'Controls'}
        </button>

        <div
          className={`mobile-sheet-backdrop ${mobileSheetOpen ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setMobileSheetOpen(false);
          }}
          aria-hidden="true"
        ></div>

        <div
          className={`hud-group ${mobileSheetOpen ? 'mobile-sheet-open' : ''}`}
          id="hud-right"
        >
          <div
            className="mobile-sheet-handle-wrap"
            onClick={(e) => {
              e.stopPropagation();
              setMobileSheetOpen(false);
            }}
            aria-hidden="true"
          >
            <div className="mobile-sheet-handle"></div>
          </div>

          <div className="mobile-sheet-header">
            <span className="mobile-sheet-title">Controls</span>
            <button
              type="button"
              className="mobile-sheet-close"
              id="btn-mobile-sheet-close"
              onClick={(e) => {
                e.stopPropagation();
                setMobileSheetOpen(false);
              }}
              aria-label="Close Controls"
            >
              Close ✕
            </button>
          </div>

          <div className="mobile-sheet-section-label">Altar Tools</div>

          {/* Sound FX Toggle Button */}
          <button
            type="button"
            className={`btn-sound-toggle ${isMuted ? 'muted' : ''}`}
            onClick={handleToggleSound}
            aria-pressed={!isMuted}
            title={isMuted ? 'Unmute procedural sound FX' : 'Mute procedural sound FX'}
          >
            <SoundGlyph muted={isMuted} />
            <span>{isMuted ? 'Muted' : 'Sound FX'}</span>
          </button>

          {/* Ledger Toggle Button */}
          <button
            type="button"
            className={`hud-btn ${ledgerOpen ? 'active' : ''}`}
            aria-expanded={ledgerOpen}
            onClick={() => {
              sanctumAudio.playClick();
              setLedgerOpen((prev) => !prev);
              setMobileSheetOpen(false);
            }}
            title="Toggle Move Notation Ledger"
          >
            Move Ledger {moves.length > 0 ? `(${moves.length})` : ''}
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">Game Actions</div>

          <button
            className="hud-btn"
            id="btn-side-toggle"
            title="Switch between Playing as White and Playing as Black"
            onClick={() => {
              sanctumAudio.playClick();
              setMobileSheetOpen(false);
            }}
          >
            Play as Black
          </button>
          <button
            className="hud-btn"
            id="btn-ai-move"
            title="Let the AI make the next move immediately"
            onClick={() => {
              sanctumAudio.playClick();
              setMobileSheetOpen(false);
            }}
          >
            AI Move
          </button>
          <button
            className="hud-btn"
            id="btn-reset"
            title="Start a fresh game on the altar"
            onClick={() => {
              sanctumAudio.playClick();
              setMobileSheetOpen(false);
            }}
          >
            New Game
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">
            <span>Camera Views</span>
            <span className="mobile-sheet-section-sub">Tap active view to flip</span>
          </div>

          <button
            className="hud-btn active"
            id="btn-cam-player"
            title="Player Camera (Click again to flip White / Black view)"
          >
            Player Cam
          </button>
          <button
            className="hud-btn"
            id="btn-cam-top"
            title="Overhead Board View (Click again to flip White / Black orientation)"
          >
            Overhead
          </button>
          <button
            className="hud-btn"
            id="btn-cam-side"
            title="Side Profile View (Click again to switch East / West side)"
          >
            Side
          </button>
          <button
            className="hud-btn"
            id="btn-cam-wide"
            title="Wide Cathedral View (Click again to switch North Rose / South Narthex)"
          >
            Cathedral
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">Display &amp; Gestures</div>

          <button
            className="hud-btn"
            id="btn-hide-ui"
            title="Toggle HUD visibility (Shortcut: H)"
            onClick={() => {
              sanctumAudio.playClick();
              setMobileSheetOpen(false);
            }}
          >
            Hide UI [H]
          </button>

          <div className="mobile-sheet-hint">
            <strong>Touch:</strong> Tap Piece to Move &nbsp;•&nbsp; 1-Finger Drag: Orbit &nbsp;•&nbsp; 2-Finger Drag: Pan &nbsp;•&nbsp; Pinch: Zoom
          </div>
        </div>
      </div>

      {/* Bottom Bar: Key Hints & Tactile Graveyard Tray */}
      <div id="hud-bottom" inert={viewMode === 'landing'} className={viewMode === 'landing' ? 'hud-hidden-landing' : ''}>
        <div className="hint-pill" id="controls-hint">
          <strong>Controls:</strong> Click Piece to Move &nbsp;•&nbsp; Left-Drag: Orbit &nbsp;•&nbsp; Right-Drag: Pan &nbsp;•&nbsp; Scroll: Zoom &nbsp;•&nbsp; WASD + R/F: Fly Cam &nbsp;•&nbsp; H: Hide UI
        </div>
        <div className="captured-pill" id="captured-tray">
          <Graveyard capturedWhite={capturedWhite} capturedBlack={capturedBlack} />
        </div>
      </div>

      <div id="checkmate-overlay" role="status" aria-live="polite">
        <div className="checkmate-banner">
          <div className="checkmate-ornament">✦ &nbsp; Sanctum Judgment &nbsp; ✦</div>
          <div className="checkmate-crown" id="checkmate-crown">♔</div>
          <div className="checkmate-title" id="checkmate-title">Checkmate</div>
          <div className="checkmate-rule"></div>
          <div className="checkmate-subtitle" id="checkmate-subtitle">
            White Triumphs • The Black King Has Fallen
          </div>
          <div className="checkmate-actions">
            <button className="checkmate-btn" id="btn-checkmate-replay">
              Replay King Fall
            </button>
            <button className="checkmate-btn" id="btn-checkmate-newgame">
              New Game
            </button>
            <button className="checkmate-btn secondary" id="btn-checkmate-dismiss">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
