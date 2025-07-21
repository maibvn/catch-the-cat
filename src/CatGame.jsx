import React, { useState, useEffect, useRef } from 'react';
import styles from './CatGame.module.css';
const electronAPI = window.electronAPI;

function HowToPlay({ onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(34,34,34,0.92)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#222',
        borderRadius: 16,
        boxShadow: '0 4px 32px #000a',
        padding: '36px 32px 28px 32px',
        maxWidth: 400,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'Comic Neue, cursive, sans-serif',
      }}>
        <h2 style={{ fontSize: 28, marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <img src="smerk_cat.png" alt="How to Play Cat" style={{ height: 48, marginBottom: 2 }} />
          How to Play
        </h2>
        <ul style={{ textAlign: 'left', fontSize: 18, margin: '0 0 18px 0', padding: 0, listStyle: 'disc inside' }}>
          <li>Start a new game.</li>
          <li>Explore the folders. Something is hidden...</li>
          <li>Let your ears guide you.</li>
          <li>When you sense the cat, click to reveal it.</li>
          <li>How fast can you find the secret?</li>
        </ul>
        <button onClick={onClose} style={{
          fontSize: 18,
          padding: '8px 28px',
          borderRadius: 8,
          border: 'none',
          background: '#ffb300',
          color: '#222',
          fontWeight: 700,
          cursor: 'pointer',
        }}>Got it!</button>
      </div>
    </div>
  );
}

const FOLDERS = [
  { name: 'Documents', clue: 'Where you keep your important papers.' },
  { name: 'Downloads', clue: 'Where things land after you fetch them from the internet.' },
  { name: 'Pictures', clue: 'Where your memories are stored as images.' },
  { name: 'Desktop', clue: 'Where things are left out in the open.' },
];
const CAT_FILENAME = 'cat.png';

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function CatGame() {
  const [gameActive, setGameActive] = useState(false);
  const HOWTO_KEY = 'cat-howto-dismissed-v2';
  const [showHowTo, setShowHowTo] = useState(() => {
    return !localStorage.getItem(HOWTO_KEY);
  });
  const [homePath, setHomePath] = useState('');
  const [catFoundCard, setCatFoundCard] = useState(false);
  const audioRef = useRef(null);
  const winAudioRef = useRef(null);
  const [targetFolder, setTargetFolder] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState([]);
  const [catFound, setCatFound] = useState(false);
  const [imageDataUrls, setImageDataUrls] = useState({});
  const [brokenImages, setBrokenImages] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [fastest, setFastest] = useState(() => {
    const val = localStorage.getItem('cat-fastest');
    return val ? parseInt(val, 10) : null;
  });
  const [winnerMsg, setWinnerMsg] = useState('');

  const winnerTexts = [
    "Meow-velous! Found in {time}s!",
    "Purr-fection! You caught the cat in {time}s.",
    "You're pawsitively amazing — {time}s!",
    "Whisker-fast! That took just {time}s.",
    "No kitten around — {time}s to glory!",
    "You’re the cat’s whiskers! Only {time}s.",
    "Paw-some reflexes! {time}s.",
    "Claw-some! Caught it in {time}s.",
    "Fur real? Only {time}s? Wow!",
    "You sniffed it out in {time}s — hiss-terical skills!"
  ];

  const startGame = async () => {
    setCatFound(false);
    setGameActive(false);
    setElapsed(0);
    setStartTime(null);
    setCatFoundCard(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    if (targetFolder) {
      try {
        await electronAPI.deleteCatFile(targetFolder, CAT_FILENAME);
      } catch {}
    }
    const idx = Math.floor(Math.random() * FOLDERS.length);
    const folder = FOLDERS[idx];
    setTargetFolder(folder.name);
    try {
      await electronAPI.hideCatFile(folder.name, CAT_FILENAME);
      setCurrentPath('');
      setGameActive(true);
      const now = Date.now();
      setStartTime(now);
      setElapsed(0);
      const interval = setInterval(() => {
        setElapsed(Date.now() - now);
      }, 1000);
      setTimerInterval(interval);
    } catch {}
  };

  const listFolder = async (folderPath) => {
    try {
      const result = await electronAPI.listFolder(folderPath);
      setEntries(result.entries);
      setCurrentPath(result.path);
      if (result.entries.some(e => e.name === CAT_FILENAME)) {
        setCatFound(true);
      } else {
        setCatFound(false);
        setCatFoundCard(false);
      }
      const imageEntries = result.entries.filter(entry => /\.(png|jpe?g|gif|bmp|webp)$/i.test(entry.name) && entry.name !== CAT_FILENAME);
      setImageDataUrls(prev => {
        const newMap = {};
        imageEntries.forEach(entry => {
          if (prev[entry.path]) newMap[entry.path] = prev[entry.path];
        });
        return newMap;
      });
      imageEntries.forEach(async entry => {
        try {
          const dataUrl = await electronAPI.getImageDataUrl(entry.path);
          setImageDataUrls(prev => ({
            ...prev,
            [entry.path]: dataUrl === null ? 'error' : dataUrl
          }));
        } catch (e) {
          setImageDataUrls(prev => ({
            ...prev,
            [entry.path]: 'error'
          }));
        }
      });
    } catch {}
  };

useEffect(() => {
  let cancelled = false;
  async function tryGetHomeDir(retries = 10) {
    for (let i = 0; i < retries; i++) {
      if (window && window.electronAPI && typeof window.electronAPI.getHomeDir === 'function') {
        try {
          const path = await window.electronAPI.getHomeDir();
          if (!cancelled) setHomePath(path);
        } catch {
          if (!cancelled) setHomePath('');
        }
        return;
      }
      await new Promise(res => setTimeout(res, 50));
    }
    if (!cancelled) setHomePath('');
  }
  tryGetHomeDir();
  return () => { cancelled = true; };
}, []);

  // Dismiss HowToPlay and remember in localStorage
  const handleHowToClose = () => {
    setShowHowTo(false);
    localStorage.setItem(HOWTO_KEY, '1');
  };

  useEffect(() => {
    if (gameActive) {
      listFolder('');
    }
  }, [gameActive]);

  const handleEntryClick = (entry) => {
    if (entry.isDirectory) {
      listFolder(entry.path);
    }
  };



  // Set winner message when cat is found
  useEffect(() => {
    if (catFoundCard) {
      const totalSec = Math.round(elapsed / 1000);
      const msg = winnerTexts[Math.floor(Math.random() * winnerTexts.length)].replace('{time}', totalSec);
      setWinnerMsg(msg);
    }
  }, [catFoundCard]);

  return (
    <div className={styles.root}>
      {showHowTo && <HowToPlay onClose={handleHowToClose} />}
      <audio ref={audioRef} src="moew_kitten.mp3" preload="auto" />
      <audio ref={winAudioRef} src="moew.mp3" preload="auto" />
      <h1 className={styles.title}>
        <img src="logo.png" alt="Cat Logo" style={{ height: 36, verticalAlign: 'middle', marginRight: 10, marginBottom: 4 }} />
        Catch the Cat
      </h1>
      <div className={styles.headerRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className={styles.howToBtn}
            title="How to Play"
            onClick={() => setShowHowTo(true)}
          >
            ❓
          </button>
          <button className={styles.homeBtn} onClick={() => listFolder('')} title="Go Home">🏠</button>
          <div className={styles.path}>{currentPath === '' ? homePath : currentPath}</div>
        </div>
        {gameActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {fastest !== null && (
              <div className={styles.timer} style={{ color: '#4fc3f7', fontWeight: 700 }}>
                🏆 Fastest: {fastest}s
              </div>
            )}
            <div className={styles.timer} style={{ minWidth: 150, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              <span style={{ flexShrink: 0 }}>⏱ Time:</span>
              <span style={{ display: 'inline-block', width: 48, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsed)}</span>
            </div>
          </div>
        )}
      </div>
      {!gameActive ? (
        <button className={styles.startBtn} onClick={startGame}>Start New Game</button>
      ) : (
        <>
          {currentPath === '' ? (
            <div className={styles.folderGrid}>
              {entries.map(entry => (
                <div
                  key={entry.path}
                  className={styles.folderItem}
                  onClick={() => handleEntryClick({ ...entry, isDirectory: true })}
                  onMouseEnter={() => {
                    if (entry.name === targetFolder && audioRef.current) {
                      audioRef.current.currentTime = 0;
                      audioRef.current.play();
                    }
                  }}
                >
                  <div className={styles.folderIcon}>📁</div>
                  <div className={styles.folderName}>{entry.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {catFoundCard && (
                <div className={styles.foundCatBox}>
                  <div className={styles.foundCatText}>
                    {winnerMsg}
                  </div>
                  <button className={styles.playAgainBtn} onClick={startGame}>Play Again</button>
                </div>
              )}
              {(() => {
                const imageEntries = entries.filter(entry => /\.(png|jpe?g|gif|bmp|webp)$/i.test(entry.name));
                const hasCat = imageEntries.some(entry => entry.name === CAT_FILENAME);
                if (imageEntries.length === 0) {
                  return (
                    <>
                      <div className={styles.noImagesBox}>
                        <div className={styles.noImagesText}>No cat or any photos found here.</div>
                      </div>
                    </>
                  );
                }
                if (!hasCat) {
                  return (
                    <div className={styles.imageGrid}>
                      {imageEntries.map(entry => (
                        <div
                          key={entry.path}
                          className={styles.imageItem}
                        >
                          {imageDataUrls[entry.path] === 'error' || brokenImages[entry.path] ? (
                            <div className={styles.brokenImg}><span>❌</span></div>
                          ) : imageDataUrls[entry.path] ? (
                            <img
                              src={imageDataUrls[entry.path]}
                              alt={entry.name}
                              className={styles.thumbImg}
                              onError={() => setBrokenImages(prev => ({ ...prev, [entry.path]: true }))}
                            />
                          ) : (
                            <div className={styles.loadingImg}><span>⏳</span></div>
                          )}
                          {/* Removed file name display, only show picture */}
                        </div>
                      ))}
                    </div>
                  );
                }
                return (
                  <div className={styles.imageGrid}>
                    {imageEntries.map(entry => (
                      <div
                        key={entry.path}
                        className={styles.imageItem}
                        onClick={() => {
                          let inCorrectFolder = false;
                          if (entry.name === CAT_FILENAME && currentPath && targetFolder) {
                            const parts = currentPath.split(/[/\\]/);
                            if (parts[parts.length - 1] === targetFolder) {
                              inCorrectFolder = true;
                            }
                          }
                          if (inCorrectFolder) {
                            if (winAudioRef.current) {
                              winAudioRef.current.currentTime = 0;
                              winAudioRef.current.play();
                            }
                            if (!catFoundCard) {
                              setCatFoundCard(true);
                              if (timerInterval) {
                                clearInterval(timerInterval);
                                setTimerInterval(null);
                              }
                              const seconds = Math.round(elapsed / 1000);
                              if (!fastest || seconds < fastest) {
                                setFastest(seconds);
                                localStorage.setItem('cat-fastest', seconds);
                              }
                            }
                          }
                        }}
                      >
                        {entry.name === CAT_FILENAME ? (
                          brokenImages[entry.path] ? (
                            <div className={styles.brokenImg}><span>❌</span></div>
                          ) : (
                            <img
                              src={'cat.png'}
                              alt={entry.name}
                              className={
                                catFoundCard
                                  ? `${styles.catImg} ${styles.catImgHover}`
                                  : styles.catImg
                              }
                              onError={() => setBrokenImages(prev => ({ ...prev, [entry.path]: true }))}
                            />
                          )
                        ) : imageDataUrls[entry.path] === 'error' || brokenImages[entry.path] ? (
                          <div className={styles.brokenImg}><span>❌</span></div>
                        ) : imageDataUrls[entry.path] ? (
                          <img
                            src={imageDataUrls[entry.path]}
                            alt={entry.name}
                            className={styles.thumbImg}
                            onError={() => setBrokenImages(prev => ({ ...prev, [entry.path]: true }))}
                          />
                        ) : (
                          <div className={styles.loadingImg}><span>⏳</span></div>
                        )}
                        {/* Removed file name display, only show picture */}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default CatGame;
