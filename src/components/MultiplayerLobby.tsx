import { useEffect, useState } from 'react';
import { buildJoinLink } from '../multiplayer/lanLink';
import type { ConnectionStatus } from '../multiplayer/types';
import { audioManager } from '../audio/audioManager';

interface HostLobbyProps {
  roomCode: string;
  status: ConnectionStatus;
  onCancel: () => void;
}

export function HostLobby({ roomCode, status, onCancel }: HostLobbyProps) {
  const [link, setLink] = useState<string | null>(null);
  const [reachable, setReachable] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    buildJoinLink(roomCode).then((result) => {
      if (cancelled) return;
      setLink(result.link);
      setReachable(result.reachable);
    });
    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked — the link is still shown as selectable text.
    }
  };

  return (
    <div className="overlay-screen overlay-screen-light">
      <div className="overlay-title overlay-round">Waiting For Opponent</div>
      <p className="overlay-subtitle">
        Share this link with the other person on your wifi network. Once they open it, the match begins.
      </p>
      {link ? (
        <>
          <div className="lobby-link">{link}</div>
          {!reachable && (
            <p className="overlay-subtitle lobby-warning">
              Couldn't detect your network address — this link may only work on this machine. Replace "{window.location.hostname}"
              with your computer's wifi IP address if the other person can't connect.
            </p>
          )}
          <button type="button" className="action-btn" onClick={copyLink}>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </>
      ) : (
        <p className="overlay-subtitle">Finding your network address…</p>
      )}
      <p className="overlay-subtitle lobby-status">
        {status === 'error' ? 'Connection error — try restarting the dev server.' : 'Listening for a connection…'}
      </p>
      <button
        type="button"
        className="action-btn action-btn-secondary"
        onClick={() => {
          audioManager.click();
          onCancel();
        }}
      >
        Cancel
      </button>
    </div>
  );
}

interface GuestLobbyProps {
  status: ConnectionStatus;
  onCancel: () => void;
}

export function GuestLobby({ status, onCancel }: GuestLobbyProps) {
  const message =
    status === 'connecting'
      ? 'Connecting to host…'
      : status === 'connected'
        ? 'Connected — waiting for the host to start the match…'
        : status === 'error'
          ? "Couldn't connect. Make sure you're on the same wifi network as the host."
          : 'Connection closed.';

  return (
    <div className="overlay-screen overlay-screen-light">
      <div className="overlay-title overlay-round">Joining Match</div>
      <p className="overlay-subtitle">{message}</p>
      <button
        type="button"
        className="action-btn action-btn-secondary"
        onClick={() => {
          audioManager.click();
          onCancel();
        }}
      >
        Cancel
      </button>
    </div>
  );
}
