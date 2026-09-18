import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import styles from "../styles/components/Project256Vault.module.scss";
import {
  PROJECT256_CONTRACT,
  PROJECT256_LOCK_BLOCK,
  PROJECT256_OWNER,
  PROJECT256_OWNER_ENS,
  PROJECT256_PROOF,
  PROJECT256_SOLIDITY_EXCERPT,
  PROJECT256_TILE_ID,
  PROJECT256_UNLOCK_BLOCK,
  etherscanAddressUrl,
  etherscanTxUrl,
} from "../constants/project256";
import {
  blocksRemaining,
  estimateUnlockDate,
  fallbackUnlockDate,
  fetchProject256Status,
  formatBlock,
  formatUtc,
  lockProgress,
  Project256Status,
  splitDuration,
} from "../utils/project256";

interface Project256VaultProps {
  isOpen: boolean;
  onClose: () => void;
}

const TAUNTS = [
  "Nope.",
  "Still locked.",
  "The chain does not negotiate.",
  "Come back in 2036.",
  "require(block.number >= unlockBlock) says no.",
  "Not even zacks.eth can open this early.",
  "Patience is stored on-chain too.",
];

const REFRESH_MS = 60_000;

export default function Project256Vault({ isOpen, onClose }: Project256VaultProps) {
  const [status, setStatus] = useState<Project256Status | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [rattling, setRattling] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Live chain data: fetch on open, refresh every minute.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const load = async () => {
      try {
        const next = await fetchProject256Status();
        if (!cancelled) {
          setStatus(next);
          setFetchedAt(new Date());
          setStatusError(false);
        }
      } catch (error) {
        if (!cancelled) setStatusError(true);
      }
    };

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOpen]);

  // One-second heartbeat for the countdown.
  useEffect(() => {
    if (!isOpen) return;
    setNow(new Date());
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, [isOpen]);

  // Escape closes the vault.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Reset the taunt counter each time the vault is opened.
  useEffect(() => {
    if (isOpen) setAttempts(0);
  }, [isOpen]);

  const rattle = useCallback(() => {
    setAttempts((count) => count + 1);
    setRattling(true);
    setTimeout(() => setRattling(false), 500);
  }, []);

  const unlockBlock = status?.unlockBlock ?? PROJECT256_UNLOCK_BLOCK;
  const currentBlock = status?.currentBlock ?? null;
  // Anchor the estimate to the moment the block number was read (not to `now`),
  // otherwise the remaining time would stay constant and the clock would never tick.
  const unlockDate = useMemo(
    () =>
      currentBlock === null || fetchedAt === null
        ? fallbackUnlockDate()
        : estimateUnlockDate(currentBlock, fetchedAt, unlockBlock),
    [currentBlock, fetchedAt, unlockBlock],
  );
  const remainingMs = unlockDate.getTime() - now.getTime();
  const parts = splitDuration(remainingMs);
  const remainingBlocks = currentBlock === null ? unlockBlock - PROJECT256_LOCK_BLOCK : blocksRemaining(currentBlock, unlockBlock);
  const progress = currentBlock === null ? 0 : lockProgress(currentBlock, unlockBlock);
  const unlocked = currentBlock !== null && remainingBlocks === 0;

  if (!isOpen) return null;

  const pad = (value: number): string => value.toString().padStart(2, "0");
  const taunt = attempts === 0 ? "" : TAUNTS[(attempts - 1) % TAUNTS.length];

  // The map container is CSS-transformed, which would trap a fixed overlay inside it,
  // so the vault is portalled to the document body.
  const vault = (
    <div
      className={styles.backdrop}
      data-testid="project256-vault"
      role="dialog"
      aria-modal="true"
      aria-label={`PixelMap tile ${PROJECT256_TILE_ID} is locked in Project256`}
      onClick={onClose}
    >
      <div className={styles.vault} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close vault">
          ×
        </button>

        <h2 className={styles.title}>TILE #{PROJECT256_TILE_ID} IS IN THE VAULT</h2>
        <p className={styles.subtitle}>
          Locked in Project256 until block {formatBlock(unlockBlock)}. Click the padlock if you dare.
        </p>

        <div
          className={styles.stage}
          data-testid="project256-padlock"
          onClick={rattle}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              rattle();
            }
          }}
          aria-label="Try the lock"
        >
          <div className={styles.tileFrame}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.tileImage}
              src={`https://pixelmap.art/${PROJECT256_TILE_ID}/large.png`}
              alt={`Tile ${PROJECT256_TILE_ID}`}
            />
          </div>
          <div className={`${styles.chain} ${styles.chainA}`} />
          <div className={`${styles.chain} ${styles.chainB}`} />
          <div className={`${styles.padlock} ${rattling ? styles.rattle : ""}`}>
            <div className={styles.shackle} />
            <div className={styles.lockBody}>
              <div className={styles.keyhole} />
            </div>
          </div>
        </div>
        <p className={styles.taunt} data-testid="project256-taunt" aria-live="polite">
          {taunt}
        </p>

        {unlocked ? (
          <p className={styles.estimate} data-testid="project256-unlocked">
            Block {formatBlock(unlockBlock)} has arrived. The time lock has expired and the owner may now release the tile.
          </p>
        ) : (
          <div className={styles.countdown} data-testid="project256-countdown">
            <div className={styles.unit}>
              <span className={styles.unitValue}>{parts.years}</span>
              <span className={styles.unitLabel}>years</span>
            </div>
            <div className={styles.unit}>
              <span className={styles.unitValue}>{parts.days}</span>
              <span className={styles.unitLabel}>days</span>
            </div>
            <div className={styles.unit}>
              <span className={styles.unitValue}>{pad(parts.hours)}</span>
              <span className={styles.unitLabel}>hours</span>
            </div>
            <div className={styles.unit}>
              <span className={styles.unitValue}>{pad(parts.minutes)}</span>
              <span className={styles.unitLabel}>min</span>
            </div>
            <div className={styles.unit}>
              <span className={styles.unitValue}>{pad(parts.seconds)}</span>
              <span className={styles.unitLabel}>sec</span>
            </div>
          </div>
        )}

        <div className={styles.blocks}>
          <div className={styles.blockStat}>
            Current block
            <span className={styles.blockValue} data-testid="project256-current-block">
              {currentBlock === null ? "…" : formatBlock(currentBlock)}
            </span>
          </div>
          <div className={styles.blockStat}>
            Blocks to go
            <span className={styles.blockValue} data-testid="project256-blocks-remaining">
              {formatBlock(remainingBlocks)}
            </span>
          </div>
          <div className={styles.blockStat}>
            Unlock block
            <span className={styles.blockValue} data-testid="project256-unlock-block">
              {formatBlock(unlockBlock)}
            </span>
          </div>
        </div>

        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${(progress * 100).toFixed(2)}%` }} />
        </div>
        <p className={styles.estimate} data-testid="project256-estimate">
          {(progress * 100).toFixed(3)}% served. Estimated unlock: {formatUtc(unlockDate)} (assuming 12-second blocks).
        </p>
        <p className={styles.status}>
          {statusError && currentBlock === null && "Live chain data unavailable, showing the estimate from the lock transaction."}
          {status?.framesMinted !== null && status?.framesMinted !== undefined &&
            `${status.framesMinted} frames minted onto this tile so far.`}
        </p>

        <h3 className={styles.proofHeading}>PROOF, STRAIGHT FROM THE CHAIN</h3>
        <ul className={styles.proofList}>
          {PROJECT256_PROOF.map((entry) => (
            <li key={entry.tx} className={styles.proofItem}>
              <a href={etherscanTxUrl(entry.tx)} target="_blank" rel="noreferrer">
                {entry.label}
              </a>
              <div>{entry.detail}</div>
              <div className={styles.proofMeta}>
                Block {formatBlock(entry.block)} · {entry.timestamp.replace("T", " ").replace("Z", " UTC")}
              </div>
            </li>
          ))}
        </ul>
        <pre className={styles.code}>{PROJECT256_SOLIDITY_EXCERPT}</pre>
        <p className={styles.estimate}>
          The 2016 PixelMap contract only changes owners through buyTile, which requires a non-zero price.
          Project256 sets the price to 0 on every update and the only function that can set a price again is unwrap.
        </p>

        <div className={styles.footer}>
          <a href={etherscanAddressUrl(PROJECT256_CONTRACT)} target="_blank" rel="noreferrer">
            Project256 contract
          </a>
          <a href={etherscanAddressUrl(PROJECT256_OWNER)} target="_blank" rel="noreferrer">
            Owner: {PROJECT256_OWNER_ENS}
          </a>
          <Link href={`/tile/${PROJECT256_TILE_ID}`}>Tile #{PROJECT256_TILE_ID} page</Link>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return vault;
  return createPortal(vault, document.body);
}
