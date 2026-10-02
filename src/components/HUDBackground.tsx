import React, { useEffect, useRef } from 'react';

interface HudNode {
  x: number; y: number; vx: number; vy: number;
  radius: number; pulsePhase: number; pulseSpeed: number;
  tier: 0 | 1 | 2; // 0=hub, 1=relay, 2=leaf
}

interface StreamParticle {
  sx: number; sy: number; tx: number; ty: number;
  progress: number; speed: number; size: number;
  colorIdx: number; trail: { x: number; y: number }[];
}

interface Ring {
  x: number; y: number; radius: number; maxRadius: number;
  alpha: number; speed: number;
}

const HUDBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<HudNode[]>([]);
  const streamsRef = useRef<StreamParticle[]>([]);
  const ringsRef = useRef<Ring[]>([]);
  const isDarkRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getIsDark = () => document.documentElement.classList.contains('dark');
    isDarkRef.current = getIsDark();

    // ── palette ────────────────────────────────────────────────────
    const darkPalette = {
      bg1: '#020817', bg2: '#030d1a',
      hubNode: [59, 130, 246],   // blue-500
      relayNode: [56, 189, 248], // sky-400
      leafNode: [99, 102, 241],  // indigo-500
      stream: [[147, 210, 255], [56, 189, 248], [167, 139, 250], [34, 211, 238]],
      grid: [30, 80, 160],
      hex: [59, 130, 246],
      ring: [56, 189, 248],
      orb: [[30, 80, 200], [10, 50, 150]],
      scanLine: [96, 165, 250],
    };
    const lightPalette = {
      bg1: '#f0f4ff', bg2: '#e8f0fe',
      hubNode: [37, 99, 235],
      relayNode: [6, 182, 212],
      leafNode: [79, 70, 229],
      stream: [[37, 99, 235], [6, 182, 212], [124, 58, 237], [14, 165, 233]],
      grid: [147, 197, 253],
      hex: [99, 102, 241],
      ring: [37, 99, 235],
      orb: [[147, 197, 253], [196, 224, 255]],
      scanLine: [37, 99, 235],
    };

    const pal = () => (isDarkRef.current ? darkPalette : lightPalette);
    const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    // ── resize & init ──────────────────────────────────────────────
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
    };

    const initNodes = () => {
      const area = canvas.width * canvas.height;
      const count = Math.min(80, Math.floor(area / 18000));
      nodesRef.current = Array.from({ length: count }, (_, i) => {
        const tier = i < 6 ? 0 : i < 22 ? 1 : 2;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * (tier === 0 ? 0.18 : tier === 1 ? 0.28 : 0.42),
          vy: (Math.random() - 0.5) * (tier === 0 ? 0.18 : tier === 1 ? 0.28 : 0.42),
          radius: tier === 0 ? 4.5 : tier === 1 ? 2.8 : 1.6,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.018 + 0.006,
          tier,
        };
      });
    };

    // ── background gradient orbs ────────────────────────────────────
    const drawOrbs = () => {
      const p = pal();
      const w = canvas.width, h = canvas.height;
      const positions = [[w * 0.15, h * 0.25], [w * 0.82, h * 0.6], [w * 0.5, h * 0.85]];
      const sizes = [w * 0.35, w * 0.28, w * 0.22];
      positions.forEach(([ox, oy], i) => {
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, sizes[i]);
        g.addColorStop(0, rgba(p.orb[0], isDarkRef.current ? 0.12 : 0.10));
        g.addColorStop(0.5, rgba(p.orb[1], isDarkRef.current ? 0.06 : 0.05));
        g.addColorStop(1, rgba(p.orb[1], 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
    };

    // ── scrolling grid ─────────────────────────────────────────────
    const drawGrid = (t: number) => {
      const p = pal();
      const spacing = 72;
      const a = isDarkRef.current ? 0.07 : 0.06;
      ctx.strokeStyle = rgba(p.grid, a);
      ctx.lineWidth = 0.5;
      const ox = (t * 0.006) % spacing;
      const oy = (t * 0.004) % spacing;
      ctx.beginPath();
      for (let x = -spacing + ox; x < canvas.width + spacing; x += spacing) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
      }
      for (let y = -spacing + oy; y < canvas.height + spacing; y += spacing) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      // diagonal accent lines
      ctx.strokeStyle = rgba(p.grid, isDarkRef.current ? 0.035 : 0.025);
      ctx.lineWidth = 0.3;
      const ds = spacing * 3;
      const dox = (t * 0.003) % ds;
      ctx.beginPath();
      for (let x = -ds * 2 + dox; x < canvas.width + ds * 2; x += ds) {
        ctx.moveTo(x, 0); ctx.lineTo(x + canvas.height, canvas.height);
      }
      ctx.stroke();
    };

    // ── network edges (multi-layer) ────────────────────────────────
    const drawEdges = () => {
      const nodes = nodesRef.current;
      const p = pal();
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const ni = nodes[i], nj = nodes[j];
          const dx = nj.x - ni.x, dy = nj.y - ni.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxD = ni.tier === 0 || nj.tier === 0 ? 320 : ni.tier === 1 || nj.tier === 1 ? 220 : 140;
          if (dist < maxD) {
            const fadeAlpha = (1 - dist / maxD);
            const baseAlpha = (ni.tier + nj.tier === 0 ? 0.55 : ni.tier + nj.tier <= 2 ? 0.35 : 0.18);
            const a = fadeAlpha * baseAlpha * (isDarkRef.current ? 1 : 0.7);
            const nodeColor = ni.tier === 0 ? p.hubNode : ni.tier === 1 ? p.relayNode : p.leafNode;
            ctx.beginPath();
            ctx.strokeStyle = rgba(nodeColor, a);
            ctx.lineWidth = ni.tier === 0 || nj.tier === 0 ? 1.2 : 0.7;
            ctx.moveTo(ni.x, ni.y);
            ctx.lineTo(nj.x, nj.y);
            ctx.stroke();
          }
        }
      }
    };

    // ── nodes with glow rings ──────────────────────────────────────
    const drawNodes = () => {
      const nodes = nodesRef.current;
      const p = pal();
      nodes.forEach((node) => {
        const pulse = Math.sin(node.pulsePhase) * 0.5 + 0.5;
        const color = node.tier === 0 ? p.hubNode : node.tier === 1 ? p.relayNode : p.leafNode;
        const glowR = node.radius * (node.tier === 0 ? 8 : node.tier === 1 ? 6 : 4) * (0.7 + pulse * 0.3);

        // outer glow
        const g = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
        g.addColorStop(0, rgba(color, isDarkRef.current ? 0.55 + pulse * 0.2 : 0.45 + pulse * 0.15));
        g.addColorStop(0.4, rgba(color, isDarkRef.current ? 0.2 : 0.15));
        g.addColorStop(1, rgba(color, 0));
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // hub ring
        if (node.tier === 0) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 3.5 * (0.85 + pulse * 0.15), 0, Math.PI * 2);
          ctx.strokeStyle = rgba(color, 0.25 + pulse * 0.15);
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // core dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = rgba(color, 0.9 + pulse * 0.1);
        ctx.fill();

        node.pulsePhase += node.pulseSpeed;
        node.x += node.vx; node.y += node.vy;
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));
      });
    };

    // ── stream particles with trails ───────────────────────────────
    const spawnStream = () => {
      const nodes = nodesRef.current;
      if (nodes.length < 2) return;
      const hubs = nodes.filter((n) => n.tier <= 1);
      if (hubs.length < 2) return;
      const a = hubs[Math.floor(Math.random() * hubs.length)];
      let b = hubs[Math.floor(Math.random() * hubs.length)];
      let tries = 0;
      while (b === a && tries++ < 10) b = hubs[Math.floor(Math.random() * hubs.length)];
      if (b === a) return;
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      if (dist > 450) return;
      const p = pal();
      streamsRef.current.push({
        sx: a.x, sy: a.y, tx: b.x, ty: b.y,
        progress: 0,
        speed: 0.006 + Math.random() * 0.008,
        size: 1.5 + Math.random() * 2,
        colorIdx: Math.floor(Math.random() * p.stream.length),
        trail: [],
      });
    };

    const drawStreams = () => {
      const p = pal();
      streamsRef.current = streamsRef.current.filter((s) => s.progress < 1.05);
      streamsRef.current.forEach((s) => {
        s.progress += s.speed;
        const x = s.sx + (s.tx - s.sx) * Math.min(s.progress, 1);
        const y = s.sy + (s.ty - s.sy) * Math.min(s.progress, 1);
        s.trail.push({ x, y });
        if (s.trail.length > 22) s.trail.shift();

        const col = p.stream[s.colorIdx % p.stream.length];
        s.trail.forEach((pt, ti) => {
          const tf = ti / s.trail.length;
          const alpha = tf * Math.sin(s.progress * Math.PI) * (isDarkRef.current ? 0.85 : 0.65);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, s.size * tf * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = rgba(col, alpha);
          ctx.fill();
        });

        // head glow
        const headAlpha = Math.sin(s.progress * Math.PI) * (isDarkRef.current ? 1 : 0.8);
        ctx.beginPath();
        ctx.arc(x, y, s.size * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = rgba(col, headAlpha);
        ctx.fill();
      });
    };

    // ── expanding rings ────────────────────────────────────────────
    const spawnRing = () => {
      const nodes = nodesRef.current.filter((n) => n.tier === 0);
      if (!nodes.length) return;
      const n = nodes[Math.floor(Math.random() * nodes.length)];
      const p = pal();
      ringsRef.current.push({
        x: n.x, y: n.y, radius: n.radius * 2,
        maxRadius: 60 + Math.random() * 40,
        alpha: isDarkRef.current ? 0.5 : 0.4,
        speed: 0.6 + Math.random() * 0.4,
      });
    };

    const drawRings = () => {
      const p = pal();
      ringsRef.current = ringsRef.current.filter((r) => r.alpha > 0.01);
      ringsRef.current.forEach((r) => {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(p.ring, r.alpha);
        ctx.lineWidth = 1;
        ctx.stroke();
        r.radius += r.speed;
        r.alpha *= 0.97;
      });
    };

    // ── rotating hex grid layer ────────────────────────────────────
    const drawHexes = (t: number) => {
      const p = pal();
      const hexDefs = [
        { x: 0.08, y: 0.18, sz: 50, sp: 0.00025 },
        { x: 0.91, y: 0.72, sz: 42, sp: -0.0003 },
        { x: 0.05, y: 0.82, sz: 34, sp: 0.00035 },
        { x: 0.94, y: 0.12, sz: 38, sp: -0.00028 },
        { x: 0.5, y: 0.08, sz: 28, sp: 0.0004 },
        { x: 0.5, y: 0.95, sz: 32, sp: -0.00032 },
      ];
      hexDefs.forEach(({ x, y, sz, sp }, i) => {
        const cx = canvas.width * x, cy = canvas.height * y;
        const rotation = t * sp;
        const phase = (t * 0.0009 + i * 1.1) % (Math.PI * 2);
        const a = (Math.sin(phase) * 0.5 + 0.5) * (isDarkRef.current ? 0.28 : 0.18);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const ang = (s / 6) * Math.PI * 2 - Math.PI / 6;
          const px = sz * Math.cos(ang), py = sz * Math.sin(ang);
          s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = rgba(p.hex, a);
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // inner hex
        const innerSz = sz * 0.6;
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const ang = (s / 6) * Math.PI * 2 - Math.PI / 6;
          const px = innerSz * Math.cos(ang), py = innerSz * Math.sin(ang);
          s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = rgba(p.hex, a * 0.5);
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.restore();
      });
    };

    // ── scan line ──────────────────────────────────────────────────
    const drawScan = (t: number) => {
      const p = pal();
      const period = 7000;
      const progress = (t % period) / period;
      const y = progress * (canvas.height + 120) - 60;
      const g = ctx.createLinearGradient(0, y - 80, 0, y + 80);
      g.addColorStop(0, rgba(p.scanLine, 0));
      g.addColorStop(0.45, rgba(p.scanLine, isDarkRef.current ? 0.04 : 0.025));
      g.addColorStop(0.5, rgba(p.scanLine, isDarkRef.current ? 0.1 : 0.06));
      g.addColorStop(0.55, rgba(p.scanLine, isDarkRef.current ? 0.04 : 0.025));
      g.addColorStop(1, rgba(p.scanLine, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, y - 80, canvas.width, 160);
    };

    // ── data burst effect ──────────────────────────────────────────
    const drawDataBurst = (t: number) => {
      const p = pal();
      const period = 4200;
      const phase = (t % period) / period;
      if (phase > 0.3) return; // only visible fraction of cycle
      const bursts = [
        { x: canvas.width * 0.85, y: canvas.height * 0.15 },
        { x: canvas.width * 0.15, y: canvas.height * 0.85 },
      ];
      bursts.forEach(({ x, y }) => {
        const r = phase * 90;
        const a = (1 - phase / 0.3) * (isDarkRef.current ? 0.18 : 0.12);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(p.hubNode, a * 1.5));
        g.addColorStop(0.6, rgba(p.relayNode, a * 0.6));
        g.addColorStop(1, rgba(p.relayNode, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      });
    };

    // ── main loop ──────────────────────────────────────────────────
    let lastStream = 0, lastRing = 0;
    const animate = (t: number) => {
      isDarkRef.current = getIsDark();
      const p = pal();

      // background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (isDarkRef.current) {
        const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bg.addColorStop(0, p.bg1);
        bg.addColorStop(1, p.bg2);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      drawOrbs();
      drawGrid(t);
      drawHexes(t);
      drawScan(t);
      drawDataBurst(t);
      drawEdges();
      drawStreams();
      drawRings();
      drawNodes();

      if (t - lastStream > 80) { spawnStream(); lastStream = t; }
      if (t - lastRing > 1200) { spawnRing(); lastRing = t; }

      animRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default HUDBackground;
