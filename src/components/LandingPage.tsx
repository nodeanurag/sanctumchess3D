import React, { useEffect, useState } from 'react';
import { sanctumAudio } from '../audio/sanctumAudio';

interface LandingPageProps {
  onStartGame: (side: 'w' | 'b') => void;
  onTriggerAIMove: () => void;
  isDismissed: boolean;
  onSetCameraPreset: (preset: 'wide' | 'side' | 'top' | 'player') => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

interface PieceCodexEntry {
  id: string;
  name: string;
  latin: string;
  symbol: string;
  role: string;
  doctrine: string;
  lore: string;
  weapon: string;
  strikeStyle: string;
  points: number;
  height: string;
  density: string;
}

const PIECE_CODEX: PieceCodexEntry[] = [
  {
    id: 'king',
    name: 'The Sovereign King',
    latin: 'Imperator Altaris',
    symbol: '♔',
    role: 'Sanctum Monarch & Altar Nexus',
    doctrine: '"A kingdom falls not by the loss of soldiers, but when the stone sovereign is shattered upon the altar."',
    lore: 'The cornerstone of the cathedral altar. Moving with solemn gravity, his presence commands the battlements. Should his marble frame crack, the cathedral itself collapses into the void.',
    weapon: 'Imperial Relic Greatsword & Gilded Scepter',
    strikeStyle: 'Slow, crushing two-handed downward execution strike',
    points: 20000,
    height: '1.24m (In-Game Scale)',
    density: 'Solid Chiseled Basalt'
  },
  {
    id: 'queen',
    name: 'The Altar Queen',
    latin: 'Regina Mortis',
    symbol: '♕',
    role: 'Unrestricted Arcane Sovereign',
    doctrine: '"No corridor of the sanctum is barred to her vengeance; she strikes from across the darkness before the bells finish tolling."',
    lore: 'The swiftest and most destructive relic on the chessboard. She stalks any line across the stone floor without restraint, pulverizing defenders with explosive kinetic shockwaves.',
    weapon: 'Dual Arcane Spikes & Fracturing Blast',
    strikeStyle: 'Instant directional dash followed by violent radial stone pulverization',
    points: 900,
    height: '1.18m (In-Game Scale)',
    density: 'Polished Black Obsidian'
  },
  {
    id: 'knight',
    name: 'The Armored Knight',
    latin: 'Equites Noctis',
    symbol: '♘',
    role: 'Geometric Flanker & Breacher',
    doctrine: '"Walls and phalanxes are illusions to the vaulting steed; he strikes from above where shields cannot turn."',
    lore: 'Master of non-linear combat. Leaping over intervening obstacles, the Knight drops from mid-air into the contested tile, wielding blunt war-hammers that shatter opponent stone to gravel.',
    weapon: 'Stone War-Hammer & Heavy Gauntlets',
    strikeStyle: 'Kinetic airborne vault into a bone-snapping downward hammer smash',
    points: 320,
    height: '0.98m (In-Game Scale)',
    density: 'Reinforced Masonry & Iron Core'
  },
  {
    id: 'bishop',
    name: 'The Shadow Bishop',
    latin: 'Episcopus Sanguinis',
    symbol: '♗',
    role: 'Corridor Stalker & Flank Executioner',
    doctrine: '"Bound to the diagonals of sacred light, his judgment arrives unannounced across the cathedral floor."',
    lore: 'Gliding along diagonal corridors of cathedral moonlight, the Bishop commands expansive sightlines, executing precision strikes with his double-headed sanctum mace.',
    weapon: 'Spired Cathedral Reliquary Mace',
    strikeStyle: 'Gliding diagonal sweep striking through the adversary center-line',
    points: 330,
    height: '1.05m (In-Game Scale)',
    density: 'Aged Altar Limestone'
  },
  {
    id: 'rook',
    name: 'The Fortress Rook',
    latin: 'Turris Obscura',
    symbol: '♖',
    role: 'Siege Bastion & Ramming Engine',
    doctrine: '"Like the towers of the cathedral nave, the fortress advances with unyielding inertia. What stands in its path is pulverized."',
    lore: 'Carved like the battlements of an ancient citadel. The Rook moves in relentless straight lines with the crushing momentum of an unyielding battering ram.',
    weapon: 'Castellated Stone Prow & Siege Shield',
    strikeStyle: 'Unstoppable horizontal bull-rush resulting in total debris fracture',
    points: 500,
    height: '0.92m (In-Game Scale)',
    density: 'Solid Granite Quoins'
  },
  {
    id: 'pawn',
    name: 'The Vanguard Pawn',
    latin: 'Custos Liminis',
    symbol: '♙',
    role: 'Sanctum Sentinel & Aspirant',
    doctrine: '"The first to bleed stone, the last to retreat. Every vanguard holds the seed of royalty within their chest."',
    lore: 'The stoic frontline guards who shield the royal sanctum. Step by step they advance toward the opposite rank, destined for heroic promotion into royalty.',
    weapon: 'Iron-Tipped Stone Halberd',
    strikeStyle: 'Close-quarters diagonal spear thrust and heavy shield impact',
    points: 100,
    height: '0.74m (In-Game Scale)',
    density: 'Rough-Hewn Sandstone'
  }
];

const CAMERA_VIEWS: { id: 'wide' | 'side' | 'top' | 'player'; label: string; title: string }[] = [
  { id: 'wide', label: 'Vista', title: 'Wide cathedral vista' },
  { id: 'side', label: 'Profile', title: 'Low altar profile' },
  { id: 'top', label: 'Overhead', title: 'Top-down tactical view' },
  { id: 'player', label: 'Duel', title: 'Player duel perspective' }
];

const ChevronRight = () => (
  <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M5.5 3.5L10 8l-4.5 4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlayGlyph = () => (
  <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M5 3.4v9.2L12.6 8z" fill="currentColor" />
  </svg>
);

export const SoundGlyph = ({ muted }: { muted: boolean }) => (
  <svg className="icon" viewBox="0 0 20 20" aria-hidden="true">
    <path
      d="M3 7.6h2.8L9.6 4v12l-3.8-3.6H3z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    {muted ? (
      <path
        d="M13.4 7.8l4 4.4m0-4.4l-4 4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    ) : (
      <>
        <path
          d="M12.8 7.4c1.3 1.5 1.3 3.7 0 5.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M15.2 5.6c2.3 2.5 2.3 6.3 0 8.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </>
    )}
  </svg>
);

const BrandSigil = () => (
  <svg className="brand-sigil" viewBox="0 0 32 40" fill="none" aria-hidden="true">
    <path
      d="M16 2.5c6.2 5.9 9.8 10.9 9.8 17.6V37H6.2V20.1C6.2 13.4 9.8 8.4 16 2.5z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M16 7.5v25M10.2 18.4h11.6M16 11.8l2.6 3.9h-5.2z"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HeroArch = () => (
  <svg className="hero-arch" viewBox="0 0 460 640" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="1">
      <path
        pathLength={1}
        d="M30 620V250c0-112 78-198 200-198s200 86 200 198v370"
      />
      <path
        pathLength={1}
        d="M58 620V258c0-98 68-174 172-174s172 76 172 174v362"
        opacity="0.55"
      />
      <path
        pathLength={1}
        d="M30 250c40-12 90-18 200-18s160 6 200 18"
        opacity="0.5"
      />
      <circle pathLength={1} cx="230" cy="178" r="60" opacity="0.65" />
      <circle pathLength={1} cx="230" cy="178" r="42" opacity="0.45" />
      <path
        pathLength={1}
        d="M230 118v120M170 178h120M188 136l84 84M272 136l-84 84"
        opacity="0.38"
      />
      <path pathLength={1} d="M230 620V356" opacity="0.22" />
    </g>
  </svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartGame,
  onTriggerAIMove,
  isDismissed,
  onSetCameraPreset,
  isMuted,
  onToggleSound
}) => {
  const [activeCam, setActiveCam] = useState<'wide' | 'side' | 'top' | 'player'>('wide');
  const [grimoireOpen, setGrimoireOpen] = useState(false);
  const [controlsModalOpen, setControlsModalOpen] = useState(false);
  const [selectedPieceId, setSelectedPieceId] = useState<string>('knight');
  const [selectedSide, setSelectedSide] = useState<'w' | 'b'>('w');

  const selectedPiece = PIECE_CODEX.find((p) => p.id === selectedPieceId) || PIECE_CODEX[0];

  useEffect(() => {
    // Deep links for reviewing the overlays directly.
    const params = new URLSearchParams(window.location.search);
    if (params.has('codex')) setGrimoireOpen(true);
    if (params.has('controls')) setControlsModalOpen(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGrimoireOpen(false);
        setControlsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCameraChange = (preset: 'wide' | 'side' | 'top' | 'player') => {
    setActiveCam(preset);
    onSetCameraPreset(preset);
  };

  const openCodex = (pieceId?: string) => {
    sanctumAudio.playClick();
    if (pieceId) setSelectedPieceId(pieceId);
    setGrimoireOpen(true);
  };

  const openControls = () => {
    sanctumAudio.playClick();
    setControlsModalOpen(true);
  };

  const toggleSound = onToggleSound;

  return (
    <>
      {/* --- Cathedral Edition Landing --- */}
      <div
        className={`sanctum-title-screen ${isDismissed ? 'dismissed' : ''}`}
        id="sanctum-title-overlay"
        inert={isDismissed || grimoireOpen || controlsModalOpen}
      >
        <div className="landing-atmosphere" aria-hidden="true" />
        <div className="sanctum-vignette-veil" aria-hidden="true" />

        {/* Medieval Corner Filigree */}
        <div className="corner-ornament corner-top-left" aria-hidden="true" />
        <div className="corner-ornament corner-top-right" aria-hidden="true" />
        <div className="corner-ornament corner-bottom-left" aria-hidden="true" />
        <div className="corner-ornament corner-bottom-right" aria-hidden="true" />

        {/* --- Site Navigation --- */}
        <header className="sanctum-nav">
          <div className="nav-brand">
            <BrandSigil />
            <div className="brand-lockup">
              <span className="brand-name">Sanctum Chess</span>
              <span className="brand-edition">Cathedral Edition</span>
            </div>
          </div>

          <nav className="nav-links" aria-label="Sanctum sections">
            <button type="button" className="nav-link" onClick={() => openCodex()}>
              The Relics
            </button>
            <button type="button" className="nav-link" onClick={() => handleCameraChange('wide')}>
              The Altar
            </button>
            <button type="button" className="nav-link" onClick={openControls}>
              Controls
            </button>
          </nav>

          <div className="nav-actions">
            <span className="nav-live">
              <span className="nav-live-dot" />
              Live altar
            </span>
            <button
              type="button"
              className="nav-icon-btn"
              onClick={toggleSound}
              title={isMuted ? 'Unmute sound' : 'Mute sound'}
              aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
            >
              <SoundGlyph muted={isMuted} />
            </button>
            <button
              type="button"
              className="nav-play"
              onClick={() => onStartGame(selectedSide)}
              title="Enter the sanctum"
            >
              Play
            </button>
          </div>
        </header>

        {/* --- Hero --- */}
        <main className="sanctum-hero">
          <section className="hero-copy">
            <HeroArch />

            <div className="hero-eyebrow">
              <span className="eyebrow-rule" />
              <span>The board is sacred. The battle is not.</span>
            </div>

            <h1 className="hero-title">
              <span className="title-line">Sanctum</span>
              <span className="title-line title-gold">Chess</span>
            </h1>

            <p className="hero-lede">
              An ancient game. A darker ritual.
            </p>
            <p className="hero-description">
              Command an army of living stone beneath cathedral moonlight.
              Outthink your opponent. Leave only rubble.
            </p>

            <div className="hero-host">
              <span className="host-label">01 / Choose your allegiance</span>
              <div className="host-options" role="group" aria-label="Choose your side">
                <button
                  type="button"
                  className={`host-option ${selectedSide === 'w' ? 'active' : ''}`}
                  onClick={() => setSelectedSide('w')}
                  aria-pressed={selectedSide === 'w'}
                  title="Command the marble host"
                >
                  <span className="host-glyph">♔</span>
                  <span className="host-copy">
                    <span className="host-name">White</span>
                    <span className="host-sub">The Marble Host</span>
                  </span>
                  <span className="host-indicator" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className={`host-option ${selectedSide === 'b' ? 'active' : ''}`}
                  onClick={() => setSelectedSide('b')}
                  aria-pressed={selectedSide === 'b'}
                  title="Command the obsidian host"
                >
                  <span className="host-glyph">♚</span>
                  <span className="host-copy">
                    <span className="host-name">Black</span>
                    <span className="host-sub">The Obsidian Host</span>
                  </span>
                  <span className="host-indicator" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="hero-actions">
              <button
                type="button"
                className="cta-primary"
                onClick={() => onStartGame(selectedSide)}
                title="Enter the sanctum and take your side of the altar"
              >
                Enter the Sanctum
                <ChevronRight />
              </button>
              <button
                type="button"
                className="cta-ghost"
                onClick={onTriggerAIMove}
                title="Let the AI make the opening move on the altar"
              >
                <PlayGlyph />
                Let the AI begin
              </button>
            </div>

            <p className="hero-footnote"><span /> Single player · Free to play · No download</p>
          </section>

          <div className="scene-caption" aria-hidden="true">
            <span className="scene-coordinate">SC / 001</span>
            <div className="scene-caption-rule" />
            <span className="scene-caption-title">The consecrated altar</span>
            <span className="scene-caption-detail">Stone remembers every battle.</span>
          </div>

          {/* Relic Index */}
          <aside className="relic-index" aria-label="Relic index">
            <span className="relic-index-label">The Six Relics</span>
            <div className="relic-index-list">
              {PIECE_CODEX.map((piece) => (
                <button
                  key={piece.id}
                  type="button"
                  className="relic-chip"
                  onClick={() => openCodex(piece.id)}
                  title={`${piece.name} — ${piece.role}`}
                  aria-label={`Open the codex entry for ${piece.name}`}
                >
                  <span className="relic-chip-glyph">{piece.symbol}</span>
                  <span className="relic-chip-name">{piece.name.replace('The ', '')}</span>
                </button>
              ))}
            </div>
          </aside>
        </main>

        {/* --- Control Deck --- */}
        <footer className="sanctum-footer">
          <div className="view-deck">
            <span className="deck-label">Explore the altar</span>
            <div className="view-options" role="group" aria-label="Camera view">
              {CAMERA_VIEWS.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  className={`view-btn ${activeCam === view.id ? 'active' : ''}`}
                  onClick={() => handleCameraChange(view.id)}
                  title={view.title}
                  aria-pressed={activeCam === view.id}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>

          <ul className="feature-deck">
            <li className="feature-item">Melee captures</li>
            <li className="feature-item">Stone shatter</li>
            <li className="feature-item">Procedural audio</li>
            <li className="feature-item">Minimax AI</li>
          </ul>
        </footer>
      </div>

      {/* =========================================================================
         The Relic Codex (Illuminated Slide-Over Grimoire)
         ========================================================================= */}
      <div
        className={`grimoire-drawer-wrap ${grimoireOpen ? 'open' : ''}`}
        onClick={() => setGrimoireOpen(false)}
        inert={!grimoireOpen}
      >
        <div className="grimoire-panel" onClick={(e) => e.stopPropagation()}>
          <div className="grimoire-header">
            <div className="grimoire-title-group">
              <span className="grimoire-tag">The Reliquary</span>
              <h2 className="grimoire-title">Relic Codex</h2>
            </div>
            <button
              type="button"
              className="grimoire-close-btn"
              onClick={() => setGrimoireOpen(false)}
              aria-label="Close the relic codex"
            >
              Close
            </button>
          </div>

          {/* Piece Switcher Tabs */}
          <div className="grimoire-tabs">
            {PIECE_CODEX.map((piece) => (
              <button
                key={piece.id}
                type="button"
                className={`grimoire-tab ${selectedPieceId === piece.id ? 'active' : ''}`}
                onClick={() => setSelectedPieceId(piece.id)}
              >
                <span className="grimoire-tab-icon">{piece.symbol}</span>
                <span>{piece.name.replace('The ', '').split(' ').slice(-1)[0]}</span>
              </button>
            ))}
          </div>

          {/* Piece Detailed Breakdown */}
          <div className="grimoire-content">
            <div className="relic-hero-box">
              <div className="relic-insignia">{selectedPiece.symbol}</div>
              <div className="relic-hero-meta">
                <span className="relic-latin">{selectedPiece.latin}</span>
                <h3 className="relic-name">{selectedPiece.name}</h3>
                <span className="relic-role">{selectedPiece.role}</span>
              </div>
            </div>

            <p className="relic-lore-p">{selectedPiece.lore}</p>

            <div className="relic-doctrine-box">{selectedPiece.doctrine}</div>

            <div className="relic-specs-grid">
              <div className="relic-spec-item">
                <div className="spec-k">Tactical Valuation</div>
                <div className="spec-v">{selectedPiece.points.toLocaleString()} pts</div>
              </div>
              <div className="relic-spec-item">
                <div className="spec-k">Physical Scale</div>
                <div className="spec-v">{selectedPiece.height}</div>
              </div>
              <div className="relic-spec-item">
                <div className="spec-k">Material Matrix</div>
                <div className="spec-v">{selectedPiece.density}</div>
              </div>
              <div className="relic-spec-item">
                <div className="spec-k">Weapon of Relic</div>
                <div className="spec-v spec-v-small">{selectedPiece.weapon}</div>
              </div>
            </div>

            <div className="relic-strike">
              <div className="spec-k">Melee Combat Style</div>
              <p>{selectedPiece.strikeStyle}</p>
            </div>
          </div>

          <div className="grimoire-footer">
            <span>Six relics · One altar</span>
            <button
              type="button"
              className="cta-primary cta-compact"
              onClick={() => {
                setGrimoireOpen(false);
                onStartGame(selectedSide);
              }}
            >
              Take the {selectedSide === 'w' ? 'White' : 'Black'} Host
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
         Controls & Architecture Modal
         ========================================================================= */}
      <div
        className={`sanctum-modal-backdrop ${controlsModalOpen ? 'open' : ''}`}
        onClick={() => setControlsModalOpen(false)}
        inert={!controlsModalOpen}
      >
        <div className="sanctum-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <span className="modal-tag">Field Manual</span>
              <h3 className="modal-title">Controls &amp; Flight</h3>
            </div>
            <button
              type="button"
              className="grimoire-close-btn"
              onClick={() => setControlsModalOpen(false)}
              aria-label="Close controls"
            >
              Close
            </button>
          </div>

          <div className="controls-key-matrix">
            <div className="key-matrix-row">
              <span className="key-matrix-action">Select &amp; command a relic</span>
              <span className="key-matrix-key">Left click / Tap</span>
            </div>
            <div className="key-matrix-row">
              <span className="key-matrix-action">Orbit the altar</span>
              <span className="key-matrix-key">Left drag</span>
            </div>
            <div className="key-matrix-row">
              <span className="key-matrix-action">Pan through the nave</span>
              <span className="key-matrix-key">Right drag</span>
            </div>
            <div className="key-matrix-row">
              <span className="key-matrix-action">Tactical zoom</span>
              <span className="key-matrix-key">Scroll / Pinch</span>
            </div>
            <div className="key-matrix-row">
              <span className="key-matrix-action">Free cathedral flight</span>
              <span className="key-matrix-key">W A S D + R / F</span>
            </div>
            <div className="key-matrix-row">
              <span className="key-matrix-action">Hide the HUD</span>
              <span className="key-matrix-key">H</span>
            </div>
          </div>

          <p className="controls-note">Press Esc to close any panel.</p>

          <div className="modal-footer">
            <span>Three.js 0.170 · WebGL 2.0 · ACES Filmic</span>
            <span className="modal-footer-mark">Sanctum Edition</span>
          </div>
        </div>
      </div>
    </>
  );
};
