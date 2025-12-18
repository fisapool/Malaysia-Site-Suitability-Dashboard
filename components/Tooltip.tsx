import React, { useState, useRef, useEffect, useCallback } from 'react';

// Constants
const DEFAULT_DELAY = 400;
const DEFAULT_MAX_WORDS = 4;
const TOOLTIP_MAX_WIDTH = 200;
const TOOLTIP_FONT_SIZE = '10px';
const TOOLTIP_PADDING = '8px 10px';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  delay?: number;
  maxWords?: number;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

/**
 * Reusable Tooltip component with smart positioning, accessibility, and animations
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = DEFAULT_DELAY,
  maxWords = DEFAULT_MAX_WORDS,
  className = '',
  position = 'auto'
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [calculatedPosition, setCalculatedPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Truncate content to max words
  const truncatedContent = useCallback(() => {
    if (!content) return '';
    const words = content.split(' ');
    return words.slice(0, maxWords).join(' ');
  }, [content, maxWords]);

  // Calculate smart positioning to avoid overflow
  const calculatePosition = useCallback(() => {
    if (position !== 'auto' || !tooltipRef.current || !triggerRef.current) {
      return position === 'auto' ? 'bottom' : position;
    }

    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check available space (with padding)
    const spaceBelow = viewportHeight - rect.bottom - 20;
    const spaceAbove = rect.top - 20;
    const spaceRight = viewportWidth - rect.left - 20;
    const spaceLeft = rect.right - 20;

    // Determine best position - prioritize bottom, then top, then sides
    if (spaceBelow >= tooltipRect.height) {
      return 'bottom';
    }
    if (spaceAbove >= tooltipRect.height) {
      return 'top';
    }
    if (spaceRight >= tooltipRect.width) {
      return 'right';
    }
    if (spaceLeft >= tooltipRect.width) {
      return 'left';
    }
    // Fallback to bottom if no space available
    return 'bottom';
  }, [position]);

  // Update position when tooltip becomes visible
  useEffect(() => {
    if (tooltipVisible && tooltipRef.current) {
      const pos = calculatePosition();
      setCalculatedPosition(pos);
    }
  }, [tooltipVisible, calculatePosition]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && tooltipVisible) {
      setTooltipVisible(false);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    } else if ((e.key === 'Enter' || e.key === ' ') && !tooltipVisible) {
      e.preventDefault();
      setTooltipVisible(true);
    }
  }, [tooltipVisible]);

  // Handle mouse enter
  const handleMouseEnter = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setTooltipVisible(true);
    }, delay);
  }, [delay]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setTooltipVisible(false);
  }, []);

  // Handle touch/click for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setTooltipVisible(!tooltipVisible);
  }, [tooltipVisible]);

  // Handle click outside to close (mobile)
  useEffect(() => {
    if (!tooltipVisible) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setTooltipVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [tooltipVisible]);

  // Get positioning classes based on calculated position
  const getPositionClasses = () => {
    switch (calculatedPosition) {
      case 'top':
        return 'bottom-full mb-1 right-0';
      case 'left':
        return 'right-full mr-1 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-1 top-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        return 'top-full mt-1 right-0';
    }
  };

  // Get arrow classes based on position
  const getArrowClasses = () => {
    switch (calculatedPosition) {
      case 'top':
        return {
          className: 'top-full right-2',
          style: {
            borderTop: '6px solid rgb(30 41 55)',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: 'none',
          }
        };
      case 'left':
        return {
          className: 'left-full top-1/2 -translate-y-1/2',
          style: {
            borderLeft: '6px solid rgb(30 41 55)',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: 'none',
          }
        };
      case 'right':
        return {
          className: 'right-full top-1/2 -translate-y-1/2',
          style: {
            borderRight: '6px solid rgb(30 41 55)',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: 'none',
          }
        };
      case 'bottom':
      default:
        return {
          className: 'bottom-full right-2',
          style: {
            borderBottom: '6px solid rgb(30 41 55)',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: 'none',
          }
        };
    }
  };

  if (!content) {
    return <>{children}</>;
  }

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Show tooltip for ${truncatedContent()}`}
      aria-expanded={tooltipVisible}
    >
      {children}
      {tooltipVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 bg-slate-800 text-white rounded-lg shadow-xl border border-slate-700 pointer-events-none transition-all duration-200 ease-out ${
            tooltipVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } ${getPositionClasses()}`}
          style={{
            maxWidth: `${TOOLTIP_MAX_WIDTH}px`,
            width: 'max-content',
            wordWrap: 'break-word',
            overflowWrap: 'anywhere',
            whiteSpace: 'normal',
            overflow: 'hidden',
            textOverflow: 'clip',
            fontSize: TOOLTIP_FONT_SIZE,
            lineHeight: '1.4',
            padding: TOOLTIP_PADDING,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          role="tooltip"
          aria-live="polite"
        >
          <div
            className="text-gray-200"
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'anywhere',
              whiteSpace: 'normal',
              overflow: 'hidden',
              textOverflow: 'clip',
              lineHeight: '1.4',
              display: 'block',
              width: '100%',
            }}
          >
            {truncatedContent()}
          </div>
          <div
            className={`absolute w-0 h-0 ${getArrowClasses().className}`}
            style={getArrowClasses().style}
          />
        </div>
      )}
    </div>
  );
};

