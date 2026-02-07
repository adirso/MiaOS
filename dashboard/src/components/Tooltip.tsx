import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
};

const SHOW_DELAY_MS = 150;
const HIDE_DELAY_MS = 80;
const GAP_PX = 6;

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleShow = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    showTimeoutRef.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
  };

  const scheduleHide = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    hideTimeoutRef.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
  };

  useLayoutEffect(() => {
    if (!visible || !triggerRef.current) {
      setStyle(null);
      return;
    }
    const el = triggerRef.current;
    const rect = el.getBoundingClientRect();
    const left = rect.left + rect.width / 2;
    if (position === 'bottom') {
      setStyle({
        position: 'fixed',
        left,
        top: rect.bottom + GAP_PX,
        transform: 'translate(-50%, 0)',
      });
    } else {
      setStyle({
        position: 'fixed',
        left,
        bottom: window.innerHeight - rect.top + GAP_PX,
        transform: 'translate(-50%, 0)',
      });
    }
  }, [visible, position]);

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={scheduleShow}
        onMouseLeave={scheduleHide}
        onFocus={scheduleShow}
        onBlur={scheduleHide}
      >
        {children}
      </span>
      {visible && style &&
        createPortal(
          <span className={`tooltip-bubble tooltip-bubble--${position}`} role="tooltip" style={style}>
            {content}
          </span>,
          document.body
        )}
    </>
  );
}
