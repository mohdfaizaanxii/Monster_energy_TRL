'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import './OptionWheel.css';

/**
 * OptionWheel Component
 * A 3D curved, cylindrical option selector wheel with dragging, inertia, and audio clicks.
 */
const OptionWheel = ({
  items = ['Ambient', 'House', 'Techno', 'Jazz', 'Lo-Fi', 'Synthwave'],
  defaultSelected = 0,
  textColor = '#a6a6a6',
  activeColor = '#39ff14',
  side = 'left',
  fontSize = 3, // rem
  spacing = 1.4,
  curve = 1,
  tilt = 6, // deg
  blur = 2, // px
  fade = 0.25,
  smoothing = 200, // ms
  inset = 80, // px
  loop = false,
  draggable = true,
  soundUrl = '/sounds/click-soft.mp3',
  soundVolume = 0.5,
  onChange = () => {},
  className = '',
  style = {},
  ...props
}) => {
  const containerRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(defaultSelected);
  const [currentOffset, setCurrentOffset] = useState(defaultSelected);
  const [isDragging, setIsDragging] = useState(false);

  // Dragging and animation tracking
  const dragStartY = useRef(0);
  const dragStartOffset = useRef(0);
  const lastY = useRef(0);
  const velocity = useRef(0);
  const lastTime = useRef(0);
  const rafId = useRef(null);
  const targetOffset = useRef(defaultSelected);
  const lastClickIndex = useRef(defaultSelected);

  // Web Audio Context fallback for tactile clicks
  const audioCtxRef = useRef(null);
  const audioElRef = useRef(null);

  // Initialize audio
  useEffect(() => {
    if (soundUrl && typeof window !== 'undefined') {
      try {
        const audio = new Audio(soundUrl);
        audio.volume = soundVolume;
        audioElRef.current = audio;
      } catch (e) {
        // Fallback to Web Audio API
      }
    }
  }, [soundUrl, soundVolume]);

  const playClickSound = useCallback(() => {
    // 1. Try HTML Audio
    if (audioElRef.current) {
      audioElRef.current.currentTime = 0;
      audioElRef.current.play().catch(() => playWebAudioClick());
      return;
    }
    // 2. Fallback to Web Audio API
    playWebAudioClick();
  }, []);

  const playWebAudioClick = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.035);
        gain.gain.setValueAtTime(0.18 * soundVolume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      }
    } catch (e) {
      // Audio autoplay policy ignored
    }
  };

  // Clamp or wrap offset
  const clampOffset = useCallback(
    val => {
      if (loop) {
        const count = items.length;
        return ((val % count) + count) % count;
      }
      return Math.max(0, Math.min(items.length - 1, val));
    },
    [loop, items.length]
  );

  // Smooth animation loop towards target offset
  const animateToTarget = useCallback(() => {
    const step = () => {
      setCurrentOffset(prev => {
        const diff = targetOffset.current - prev;
        if (Math.abs(diff) < 0.002) {
          const finalIndex = Math.round(targetOffset.current);
          if (finalIndex !== selectedIndex) {
            setSelectedIndex(finalIndex);
            onChange(finalIndex, items[finalIndex]);
          }
          return targetOffset.current;
        }

        // Spring easing
        const next = prev + diff * (1 / (smoothing / 16.6));

        // Check if crossed an item boundary for sound click
        const rounded = Math.round(next);
        if (rounded !== lastClickIndex.current) {
          lastClickIndex.current = rounded;
          playClickSound();
        }

        rafId.current = requestAnimationFrame(step);
        return next;
      });
    };

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(step);
  }, [onChange, items, selectedIndex, smoothing, playClickSound]);

  // Handle direct selection
  const selectItem = useCallback(
    index => {
      const clamped = clampOffset(index);
      targetOffset.current = clamped;
      animateToTarget();
    },
    [clampOffset, animateToTarget]
  );

  // Mouse / Touch Dragging
  const handlePointerDown = e => {
    if (!draggable) return;
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartOffset.current = currentOffset;
    lastY.current = e.clientY;
    lastTime.current = performance.now();
    velocity.current = 0;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = e => {
    if (!isDragging) return;

    const currentY = e.clientY;
    const deltaY = dragStartY.current - currentY;
    const now = performance.now();
    const dt = Math.max(1, now - lastTime.current);

    velocity.current = ((lastY.current - currentY) / dt) * 16.6;
    lastY.current = currentY;
    lastTime.current = now;

    // Convert pixel delta to wheel index delta
    const pixelPerItem = fontSize * 16 * spacing * 1.5;
    const newOffset = dragStartOffset.current + deltaY / pixelPerItem;

    const clamped = clampOffset(newOffset);
    setCurrentOffset(clamped);

    // Audio tick on drag
    const rounded = Math.round(clamped);
    if (rounded !== lastClickIndex.current) {
      lastClickIndex.current = rounded;
      playClickSound();
    }
  };

  const handlePointerUp = e => {
    if (!isDragging) return;
    setIsDragging(false);

    // Apply momentum throw
    const throwDistance = velocity.current * 0.15;
    const rawTarget = currentOffset + throwDistance;
    const finalTarget = Math.round(rawTarget);

    targetOffset.current = clampOffset(finalTarget);
    animateToTarget();

    if (e.target.releasePointerCapture) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  // Wheel scroll interaction
  const handleWheel = e => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    const newTarget = Math.round(currentOffset + direction);
    selectItem(newTarget);
  };

  // Synchronize on defaultSelected prop change
  useEffect(() => {
    targetOffset.current = defaultSelected;
    setCurrentOffset(defaultSelected);
    setSelectedIndex(defaultSelected);
    lastClickIndex.current = defaultSelected;
  }, [defaultSelected]);

  return (
    <div
      ref={containerRef}
      className={`option-wheel-container ${className}`.trim()}
      style={{
        '--wheel-text-color': textColor,
        '--wheel-active-color': activeColor,
        '--wheel-font-size': `${fontSize}rem`,
        ...style
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      {...props}
    >
      <div className="option-wheel-viewport">
        {items.map((item, index) => {
          let delta = index - currentOffset;

          if (loop) {
            const count = items.length;
            delta = ((delta % count) + count) % count;
            if (delta > count / 2) delta -= count;
          }

          const absDelta = Math.abs(delta);
          const isSelected = Math.round(currentOffset) === index;

          // 3D Cylinder curve calculations
          const angleStep = 0.35 * curve;
          const angle = delta * angleStep;

          // Vertical displacement
          const y = Math.sin(angle) * (fontSize * 16 * spacing * 4.2);

          // Horizontal curvature offset
          const curveDirection = side === 'left' ? 1 : -1;
          const x = (1 - Math.cos(angle)) * inset * curveDirection;

          // Depth z
          const z = (Math.cos(angle) - 1) * 180;

          // Rotations
          const rotateX = -delta * (tilt * 4.5);
          const rotateY = side === 'left' ? -delta * 4 : delta * 4;

          // Scale & Opacity falloff
          const scale = Math.max(0.65, 1 - absDelta * 0.12);
          const opacity = Math.max(fade, 1 - absDelta * 0.28);
          const itemBlur = Math.min(8, absDelta * blur);

          return (
            <div
              key={`${index}-${item}`}
              className={`option-wheel-item ${isSelected ? 'active' : ''}`}
              style={{
                transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                filter: itemBlur > 0.1 ? `blur(${itemBlur}px)` : 'none',
                color: isSelected ? activeColor : textColor
              }}
              onClick={() => selectItem(index)}
            >
              <span className="option-wheel-label">{item}</span>
              {isSelected && <span className="option-wheel-active-marker" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OptionWheel;
