/**
 * The attack menu (Stage K3): right-click a province that is not yours and every way to hit it
 * appears here, with a short preview of how each would go. The options and previews are worked
 * out by the engine (sim/strike.ts); this only draws them and passes the choice back.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { attackMenu, type MenuOption } from '../../sim/strike';
import { PROVINCES } from '../../sim/map';
import { picturesOf } from '../forces';
import { useGame } from '../store';

const WIDTH = 340;

/** A small icon for each kind of option. */
const ICON: Record<MenuOption['kind'], string> = {
  joint: 'M12 3v18M3 12h18M6 6l12 12M18 6L6 18',
  land: 'M4 18l5-9 4 6 3-4 4 7z',
  army: 'M6 21V4h11l-3 4 3 4H6',
  sea: 'M3 15c3 2 6 2 9 0s6-2 9 0M5 11h14l-2-5H7z',
  drop: 'M12 3a8 6 0 0 0-8 6h16a8 6 0 0 0-8-6M4 9l8 9 8-9M12 9v9',
  support: 'M3 12l7-2 4-7 2 1-2 7 7 2v2l-7-1-2 6h-2l1-6-8-1z',
  sky: 'M2 13l9-2 5-8h2l-3 8 7 1v2l-7 1 3 8h-2l-5-8-9-2z',
  bomb: 'M10 4h4v6l3 3v6H7v-6l3-3zM9 19v2M15 19v2',
  scout: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  shell: 'M3 17h18l-3 3H6zM6 17v-4h9v4M15 13l6-5M9 13V9h4',
  guard: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
};

export function AttackMenuView({ province, x, y, width, height }: { province: number; x: number; y: number; width: number; height: number }) {
  const world = useGame((s) => s.world)!;
  const selection = useGame((s) => s.selection);
  const { strike, closeMenu } = useGame.getState();
  const me = world.player;
  const ctx = selection?.kind === 'units' ? { units: selection.ids } : selection?.kind === 'army' ? { army: selection.id } : {};
  const menu = useMemo(() => (me ? attackMenu(world, me, province, ctx, picturesOf(world)) : null), [world, me, province, selection]); // eslint-disable-line react-hooks/exhaustive-deps
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  // Focus the first option that can be used, so Enter picks it at once.
  useEffect(() => {
    const first = menu ? Math.max(0, menu.options.findIndex((o) => !o.why)) : 0;
    setActive(first);
    box.current?.querySelectorAll<HTMLButtonElement>('.mt-menu-opt')[first]?.focus({ preventScroll: true });
  }, [province]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!menu) return null;
  const p = PROVINCES[province];
  // Open beside the pointer, kept inside the map and clear of the sidebar.
  // To the right of the pointer if there is room before the sidebar, otherwise to its left, so the province stays in view.
  const left = Math.max(8, x + 16 + WIDTH <= width - 370 ? x + 16 : x - 16 - WIDTH);
  const top = Math.max(64, Math.min(y - 20, height - 120 - Math.min(560, 64 + menu.options.length * 46)));
  const usable = menu.options.filter((o) => !o.why).length;

  const onKeyDown = (e: React.KeyboardEvent) => {
    const buttons = [...(box.current?.querySelectorAll<HTMLButtonElement>('.mt-menu-opt') ?? [])];
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
      (document.querySelector('.mt-map') as HTMLElement | null)?.focus();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      const i = (active + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      setActive(i);
      buttons[i]?.focus();
    }
    // Keep the map's own keys (arrows, plus, Tab) from moving the map behind the menu.
    e.stopPropagation();
  };

  return (
    <div ref={box} className="mt-menu" role="menu" aria-label={`Ways to attack ${p.name}`} style={{ left, top, width: WIDTH }} onKeyDown={onKeyDown} onPointerDown={(e) => e.stopPropagation()} onContextMenu={(e) => (e.preventDefault(), e.stopPropagation())}>
      <header>
        <div>
          <b>{p.name}</b>
          <small>{menu.status}</small>
        </div>
        <button className="mt-menu-x" aria-label="Close the menu (Escape)" onClick={() => closeMenu()}>
          ×
        </button>
      </header>
      {usable === 0 && <p className="mt-menu-none">Nothing you have can reach {p.name} yet. Each line says why.</p>}
      <ul>
        {menu.options.map((o, i) => {
          const open = i === active;
          return (
            <li key={`${o.kind}${o.army ?? ''}`}>
              <button
                className={`mt-menu-opt${o.why ? ' off' : ''}${open ? ' on' : ''} ${o.tone ?? ''}`}
                role="menuitem"
                aria-disabled={!!o.why}
                aria-describedby={open ? `mt-menu-more-${i}` : undefined}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => !o.why && strike(o)}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
                  <path d={ICON[o.kind]} />
                </svg>
                <span className="mt-menu-txt">
                  <span className="mt-menu-label">{o.label}</span>
                  {o.why ? <span className="mt-menu-why">Cannot: {o.why}</span> : o.who && <span className="mt-menu-who">{o.who}</span>}
                  {open && !o.why && o.preview.length > 0 && (
                    <span className="mt-menu-more" id={`mt-menu-more-${i}`}>
                      {o.preview.map((line, n) => (
                        <span key={n}>{line}</span>
                      ))}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <footer>Arrow keys choose, Enter gives the order, Escape closes</footer>
    </div>
  );
}
