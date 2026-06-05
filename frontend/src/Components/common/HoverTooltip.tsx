import React, { useState, useRef, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './HoverTooltip.css';

interface HoverTooltipProps {
  content: ReactNode;
  children: React.ReactElement;
  positionMode?: 'follow' | 'fixed';
}

// ── Global: solo un tooltip activo a la vez ──────────────────────────────────
let activeDismiss: (() => void) | null = null;

export default function HoverTooltip({ content, children, positionMode = 'follow' }: HoverTooltipProps) {
  const [tooltip, setTooltip] = useState<{ x: number, y: number } | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const cancelHide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    cancelHide();
    setTooltip(null);
    setIsInteracting(false);
  }, [cancelHide]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isInteracting) return;

    if (positionMode === 'fixed') {
      if (tooltip) return;
      const rect = e.currentTarget.getBoundingClientRect();
      // Si no cabe a la derecha, mostrar abajo
      const spaceRight = window.innerWidth - rect.right;
      const x = spaceRight > 320 ? rect.right + 10 : Math.max(10, rect.left - 310);
      setTooltip({ x, y: rect.top });
    } else {
      setTooltip({ x: e.clientX, y: e.clientY });
    }

    if (activeDismiss && activeDismiss !== dismiss) {
      activeDismiss();
    }
    activeDismiss = dismiss;
    cancelHide();
  }, [dismiss, cancelHide, isInteracting, positionMode, tooltip]);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (!isInteracting) {
        setTooltip(null);
        if (activeDismiss === dismiss) activeDismiss = null;
      }
    }, 400);
  }, [dismiss, isInteracting]);

  const handleTooltipMouseEnter = useCallback(() => {
    cancelHide();
    setIsInteracting(true);
  }, [cancelHide]);

  const handleTooltipMouseLeave = useCallback(() => {
    setIsInteracting(false);
    setTooltip(null);
    if (activeDismiss === dismiss) activeDismiss = null;
  }, [dismiss]);

  if (!content) {
    return <>{children}</>;
  }

  const child = React.cloneElement(children, {
    ref: (node: HTMLElement) => {
      triggerRef.current = node;
      const { ref } = children as any;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    onMouseMove: (e: React.MouseEvent) => {
      handleMouseMove(e);
      if (children.props.onMouseMove) {
        children.props.onMouseMove(e);
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      if (positionMode === 'fixed') {
        const rect = e.currentTarget.getBoundingClientRect();
        const spaceRight = window.innerWidth - rect.right;
        const x = spaceRight > 320 ? rect.right + 10 : Math.max(10, rect.left - 310);
        setTooltip({ x, y: rect.top });
      }
      if (children.props.onMouseEnter) children.props.onMouseEnter(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave();
      if (children.props.onMouseLeave) {
        children.props.onMouseLeave(e);
      }
    }
  });

  return (
    <>
      {child}
      {tooltip && createPortal(
        <div
          className="custom-tooltip"
          style={{
            top: tooltip.y + (positionMode === 'fixed' ? 0 : 8),
            left: Math.min(tooltip.x + (positionMode === 'fixed' ? 0 : 8), window.innerWidth - 420),
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
  