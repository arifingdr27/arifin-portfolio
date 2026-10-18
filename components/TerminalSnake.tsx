'use client';

import { useEffect, useRef, useState } from 'react';

const COLS = 20;
const ROWS = 14;
const TICK_MS = 140;
const CELL = '·';
const FOOD = '*';
const HEAD = '@';
const BODY = 'o';

type Point = { x: number; y: number };
type Dir = 'up' | 'down' | 'left' | 'right';

const opposite: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const delta: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function same(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function randomFood(snake: Point[]): Point {
  const taken = new Set(snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 };
}

function initialSnake(): Point[] {
  const midY = Math.floor(ROWS / 2);
  const midX = Math.floor(COLS / 2);
  return [
    { x: midX, y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY },
  ];
}

function renderBoard(snake: Point[], food: Point): string[] {
  const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => CELL));
  for (let i = snake.length - 1; i >= 0; i -= 1) {
    const part = snake[i];
    if (part.x < 0 || part.x >= COLS || part.y < 0 || part.y >= ROWS) continue;
    grid[part.y][part.x] = i === 0 ? HEAD : BODY;
  }
  if (food.x >= 0 && food.x < COLS && food.y >= 0 && food.y < ROWS) {
    grid[food.y][food.x] = FOOD;
  }
  const top = `┌${'─'.repeat(COLS)}┐`;
  const bottom = `└${'─'.repeat(COLS)}┘`;
  const rows = grid.map((row) => `│${row.join('')}│`);
  return [top, ...rows, bottom];
}

const snakeCss = `
.snake-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  outline: none;
}
.snake-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: #00ff00;
  font-family: 'Courier New', Courier, monospace;
  font-size: inherit;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
}
.snake-meta span { white-space: nowrap; }
.snake-board {
  margin: 0;
  white-space: pre;
  line-height: 1.15;
  letter-spacing: 0.05em;
  overflow: auto;
  color: #00ff00;
  font-family: 'Courier New', Courier, monospace;
  font-size: clamp(10px, 2.4vw, 15px);
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
}
.snake-hint {
  color: #7dff7d;
  font-family: 'Courier New', Courier, monospace;
  font-size: inherit;
  line-height: 1.4;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.4);
}
.snake-accent {
  color: #ffffff;
  text-shadow: 0 0 5px #ffffff;
}
.snake-over {
  color: #ff3333;
  text-shadow: 0 0 5px #ff3333;
}
.snake-pad {
  display: none;
  margin-top: auto;
  gap: 6px;
  justify-items: center;
  grid-template-columns: repeat(3, 52px);
  grid-template-rows: repeat(3, 44px);
  width: max-content;
  align-self: center;
}
.snake-pad button {
  width: 52px;
  height: 44px;
  border: 1px solid #00ff00;
  background: rgba(0, 255, 0, 0.08);
  color: #00ff00;
  font-family: 'Courier New', Courier, monospace;
  font-size: 16px;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
  cursor: pointer;
  touch-action: manipulation;
}
.snake-pad button:active {
  background: rgba(0, 255, 0, 0.22);
}
.snake-pad .up { grid-column: 2; grid-row: 1; }
.snake-pad .left { grid-column: 1; grid-row: 2; }
.snake-pad .down { grid-column: 2; grid-row: 2; }
.snake-pad .right { grid-column: 3; grid-row: 2; }
.snake-pad .quit { grid-column: 1 / 4; grid-row: 3; width: 100%; }
.snake-pad .quit.restart { grid-column: 1 / 2; }
.snake-pad .quit.leave { grid-column: 2 / 4; }
@media (max-width: 768px) {
  .snake-pad { display: grid; }
  .snake-hint.desktop-only { display: none; }
}
@media (min-width: 769px) {
  .snake-pad { display: none; }
}
`;

export default function TerminalSnake({
  active,
  onQuit,
}: {
  active: boolean;
  onQuit: (score: number) => void;
}) {
  const [snake, setSnake] = useState<Point[]>(initialSnake);
  const [food, setFood] = useState<Point>(() => randomFood(initialSnake()));
  const [score, setScore] = useState(0);
  const [alive, setAlive] = useState(true);

  const panelRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef<Dir>('right');
  const nextDirRef = useRef<Dir>('right');
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const scoreRef = useRef(score);
  const aliveRef = useRef(alive);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);
  useEffect(() => {
    foodRef.current = food;
  }, [food]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    aliveRef.current = alive;
  }, [alive]);

  function reset() {
    const next = initialSnake();
    dirRef.current = 'right';
    nextDirRef.current = 'right';
    snakeRef.current = next;
    foodRef.current = randomFood(next);
    scoreRef.current = 0;
    aliveRef.current = true;
    setSnake(next);
    setFood(foodRef.current);
    setScore(0);
    setAlive(true);
  }

  function queueDir(dir: Dir) {
    if (!aliveRef.current) return;
    if (dir === opposite[dirRef.current]) return;
    nextDirRef.current = dir;
  }

  useEffect(() => {
    if (!active) return;
    panelRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'escape' || key === 'q') {
        event.preventDefault();
        onQuit(scoreRef.current);
        return;
      }
      if (!aliveRef.current) {
        if (key === 'r' || key === ' ') {
          event.preventDefault();
          reset();
        }
        return;
      }
      if (key === 'arrowup' || key === 'w') {
        event.preventDefault();
        queueDir('up');
      } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault();
        queueDir('down');
      } else if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        queueDir('left');
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        queueDir('right');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onQuit]);

  useEffect(() => {
    if (!active || !alive) return;

    const id = window.setInterval(() => {
      const dir = nextDirRef.current;
      dirRef.current = dir;
      const head = snakeRef.current[0];
      const nextHead = { x: head.x + delta[dir].x, y: head.y + delta[dir].y };

      const hitWall =
        nextHead.x < 0 || nextHead.x >= COLS || nextHead.y < 0 || nextHead.y >= ROWS;
      const hitSelf = snakeRef.current.some((part) => same(part, nextHead));
      if (hitWall || hitSelf) {
        aliveRef.current = false;
        setAlive(false);
        return;
      }

      const ate = same(nextHead, foodRef.current);
      const nextSnake = [nextHead, ...snakeRef.current];
      if (!ate) nextSnake.pop();
      snakeRef.current = nextSnake;
      setSnake(nextSnake);
      if (ate) {
        const nextFood = randomFood(nextSnake);
        foodRef.current = nextFood;
        setFood(nextFood);
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [active, alive]);

  const board = renderBoard(snake, food);

  return (
    <div className="snake-panel" ref={panelRef} tabIndex={0}>
      <style href="terminal-snake" precedence="default">
        {snakeCss}
      </style>
      <div className="snake-meta">
        <span>
          SNAKE <span className="snake-accent">v1</span>
        </span>
        <span>score: {score}</span>
        <span>{alive ? 'running' : 'game over'}</span>
      </div>
      <pre className="snake-board">{board.join('\n')}</pre>
      {!alive ? (
        <div className="snake-hint snake-over">
          Game over. Skor: {score}. Tekan <span className="snake-accent">R</span> untuk ulang,{' '}
          <span className="snake-accent">Q</span> untuk keluar.
        </div>
      ) : (
        <div className="snake-hint desktop-only">
          Panah / WASD bergerak · <span className="snake-accent">Q</span> / Esc keluar
        </div>
      )}
      <div className="snake-pad" aria-label="Kontrol snake">
        <button type="button" className="up" onClick={() => queueDir('up')} aria-label="Atas">
          ↑
        </button>
        <button type="button" className="left" onClick={() => queueDir('left')} aria-label="Kiri">
          ←
        </button>
        <button type="button" className="down" onClick={() => queueDir('down')} aria-label="Bawah">
          ↓
        </button>
        <button type="button" className="right" onClick={() => queueDir('right')} aria-label="Kanan">
          →
        </button>
        {!alive ? (
          <>
            <button type="button" className="quit restart" onClick={reset}>
              ULANG
            </button>
            <button type="button" className="quit leave" onClick={() => onQuit(score)}>
              KELUAR
            </button>
          </>
        ) : (
          <button type="button" className="quit" onClick={() => onQuit(score)}>
            KELUAR
          </button>
        )}
      </div>
    </div>
  );
}
