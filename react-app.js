import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const injectedStyles = `
:root {
    --bg: #151516;
    --fg: #F3F3E1;
    --fg-dim: rgba(243, 243, 225, 0.6);
    --blue: #1C00FF;
    --grid-line: 1px solid var(--fg);
    --font-main: 'Inter', -apple-system, sans-serif;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

body, html {
    background-color: var(--bg);
    color: var(--fg);
    font-family: var(--font-main);
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overscroll-behavior-y: none;
}

#glcanvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0;
    pointer-events: none;
}

.marquee-container {
    overflow: hidden;
    white-space: nowrap;
    background: var(--fg);
    color: var(--bg);
    padding: 4px 0;
    display: flex;
    border-bottom: var(--grid-line);
}

.marquee-content {
    display: inline-block;
    animation: marquee 25s linear infinite;
}

@keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}

.label-badge {
    position: absolute;
    top: -1px; 
    right: -1px; 
    background: var(--bg);
    border-left: var(--grid-line);
    border-bottom: var(--grid-line);
    padding: 4px 12px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    z-index: 20;
}

.label-badge.left-badge {
    right: auto;
    left: -1px;
    border-left: none;
    border-right: var(--grid-line);
}

.stage-title {
    display: flex;
    align-items: center;
    gap: 6px;
}

.stage-title::before {
    content: '>';
    font-weight: 700;
}

.separator {
    font-weight: 300;
    opacity: 0.5;
    margin: 0 4px;
}

.interactive-cell {
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
}
.interactive-cell:hover, .interactive-cell:active {
    background: var(--fg);
    color: var(--bg);
}
.interactive-cell:hover svg, .interactive-cell:active svg {
    stroke: var(--bg);
    fill: var(--bg);
}
.interactive-cell:hover .separator, .interactive-cell:active .separator { 
    opacity: 1; 
}

::-webkit-scrollbar {
    width: 10px;
}
::-webkit-scrollbar-track {
    background: var(--bg);
    border-left: var(--grid-line);
}
::-webkit-scrollbar-thumb {
    background: var(--fg);
}

.brutalist-border { border: var(--grid-line); }
.brutalist-border-t { border-top: var(--grid-line); }
.brutalist-border-b { border-bottom: var(--grid-line); }
.brutalist-border-l { border-left: var(--grid-line); }
.brutalist-border-r { border-right: var(--grid-line); }

.glass-bg {
    background: rgba(21, 21, 22, 0.4);
    backdrop-filter: blur(4px);
}

.solid-bg {
    background: var(--bg);
}
`;

const WebGLBackground = () => {
  const canvasRef = useRef(null);
  const scrollYRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vsSource = `
      attribute vec4 aVertexPosition;
      void main() {
        gl_Position = aVertexPosition;
      }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_scroll;
      const vec3 COLOR_BG = vec3(0.082, 0.082, 0.086);
      const vec3 COLOR_BLOB = vec3(0.11, 0.0, 1.0);
      const vec3 COLOR_FIG = vec3(0.953, 0.953, 0.882);
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      float noise(in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      float fbm(in vec2 st) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
        for (int i = 0; i < 5; ++i) {
          v += a * noise(st);
          st = rot * st * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }
      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        st.x *= u_resolution.x / u_resolution.y;
        vec2 blob_uv = st + vec2(sin(u_time*0.1)*0.2, cos(u_time*0.15)*0.2);
        blob_uv += u_scroll * 0.2;
        float shape_val = fbm(blob_uv * 1.5 - u_time * 0.03);
        vec2 center = vec2(0.6 * (u_resolution.x/u_resolution.y), 0.4);
        float dist = distance(st, center + vec2(sin(u_time*0.2)*0.3, cos(u_time*0.1)*0.2));
        float blob_field = (shape_val * 1.5) - (dist * 1.0);
        float dither_val = random(gl_FragCoord.xy * 0.1 + u_time * 0.01); 
        float is_blob = step(0.1 + dither_val*0.4, blob_field);
        float fig_field = fbm(st * 3.0 + u_time * 0.1);
        float fig_mask = step(0.8 + dither_val*0.2, fig_field) * step(0.4, dist); 
        vec3 final_color = COLOR_BG;
        if (is_blob > 0.5) {
          float internal_grain = random(gl_FragCoord.xy * 0.5);
          final_color = mix(COLOR_BLOB * 0.8, COLOR_BLOB, internal_grain);
        }
        if (fig_mask > 0.5) {
          final_color = mix(final_color, COLOR_FIG, 0.7); 
        }
        gl_FragColor = vec4(final_color, 1.0);
      }
    `;

    function createShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(shaderProgram));
      return;
    }

    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      },
      uniformLocations: {
        resolution: gl.getUniformLocation(shaderProgram, 'u_resolution'),
        time: gl.getUniformLocation(shaderProgram, 'u_time'),
        scroll: gl.getUniformLocation(shaderProgram, 'u_scroll'),
      },
    };

    const positions = [
      -1.0,  1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
    ];

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const handleScroll = () => {
      scrollYRef.current = window.scrollY / window.innerHeight;
    };
    window.addEventListener('scroll', handleScroll);

    let startTime = Date.now();

    function resizeCanvasToDisplaySize() {
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      }
    }

    function render() {
      resizeCanvasToDisplaySize();
      gl.useProgram(programInfo.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
      gl.uniform2f(programInfo.uniformLocations.resolution, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(programInfo.uniformLocations.time, (Date.now() - startTime) * 0.001);
      gl.uniform2f(programInfo.uniformLocations.scroll, 0.0, scrollYRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      gl.deleteProgram(shaderProgram);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return <canvas ref={canvasRef} id="glcanvas" />;
};

const HomePage = () => {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-start pb-12 pointer-events-none">
      <main className="w-full max-w-[1440px] flex flex-col brutalist-border-l brutalist-border-r bg-transparent pointer-events-auto min-h-screen">
        <header className="sticky top-0 z-50 solid-bg brutalist-border-b">
          <div className="marquee-container text-[0.65rem] font-bold uppercase tracking-widest">
            <div className="marquee-content">
              SYSTEM ACTIVE /// EGDA ONLINE /// SUPPORTING ESTONIAN GAME DEVELOPMENT /// OPEN FOR MEMBERSHIP /// SYSTEM ACTIVE /// EGDA ONLINE /// SUPPORTING ESTONIAN GAME DEVELOPMENT /// OPEN FOR MEMBERSHIP /// SYSTEM ACTIVE /// EGDA ONLINE /// SUPPORTING ESTONIAN GAME DEVELOPMENT /// OPEN FOR MEMBERSHIP ///
            </div>
          </div>
          <div className="grid grid-cols-12 relative">
            <div
              className="col-span-12 md:col-span-3 brutalist-border-r flex items-center justify-center p-4 interactive-cell"
              onClick={handleScrollToTop}
              role="button"
              tabIndex={0}
            >
              <span className="text-4xl font-black uppercase tracking-tighter leading-none">EGDA.</span>
            </div>
            <div className="col-span-12 md:col-span-6 brutalist-border-r flex items-center p-4 px-6 hidden md:flex">
              <span className="text-sm font-medium uppercase tracking-tight">Estonian Game Developers Association</span>
            </div>
            <div className="col-span-6 md:col-span-2 brutalist-border-r flex items-center justify-center p-4 interactive-cell">
              <a href="mailto:info.egda@gmail.com" className="flex items-center gap-2 w-full h-full justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <span className="text-xs font-bold uppercase">Contact</span>
              </a>
            </div>
            <div className="col-span-6 md:col-span-1 flex items-center justify-center p-4 interactive-cell">
              <a href="https://discord.gg/mTkj64Aj4" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full h-full justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
              </a>
            </div>
          </div>
        </header>

        <section className="relative brutalist-border-b glass-bg p-8 md:p-16 lg:p-24 min-h-[40vh] flex flex-col justify-center">
          <div className="label-badge">Mission Status</div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] max-w-6xl mb-8">
            Strengthen the <br />growth of game <br />development in Estonia.
          </h1>
          <div className="max-w-4xl">
            <p className="text-xl md:text-2xl font-light uppercase tracking-tight leading-snug">
              <span className="font-bold">EGDA</span> is a new non-profit organisation representing and supporting Estonia’s video game industry. We exist to bring together people and organisations working in and around games.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 brutalist-border-b solid-bg">
          <div className="relative p-8 md:p-12 brutalist-border-r">
            <div className="label-badge">Core Directives</div>
            <div className="text-sm font-light italic uppercase stage-title mb-6 text-[#F3F3E1]/70">Objectives</div>
            <div className="space-y-6 text-lg md:text-xl font-medium tracking-tight">
              <p>The main goal of the website is to explain what EGDA is, why it exists and how people can get involved.</p>
              <p>We build trust, improve the reputation of game development in Estonia and make the local game development community easier to find, join and support.</p>
              <p>Our mission is achieved by connecting people, sharing opportunities, supporting talent development, improving industry visibility and encouraging collaboration between the games industry, education, culture and the public sector.</p>
            </div>
          </div>
          <div className="relative p-8 md:p-12 flex flex-col">
            <div className="label-badge">Network</div>
            <div className="text-sm font-light italic uppercase stage-title mb-6 text-[#F3F3E1]/70">Representing</div>
            <div className="mt-auto mb-auto">
              <h2 className="text-2xl font-bold uppercase tracking-tight mb-8">Everyone is welcome to apply and contribute to the ecosystem.</h2>
              <div className="flex flex-wrap gap-y-4 gap-x-2 text-xl md:text-3xl font-black uppercase tracking-tighter leading-none">
                <span>Developers</span> <span className="separator">//</span>
                <span>Studios</span> <span className="separator">//</span>
                <span>Students</span> <span className="separator">//</span>
                <span>Educators</span> <span className="separator">//</span>
                <span>Researchers</span> <span className="separator">//</span>
                <span>Publishers</span> <span className="separator">//</span>
                <span>Cultural Institutions</span> <span className="separator">//</span>
                <span>Non-Profits</span> <span className="separator">//</span>
                <span>Public Sector Partners</span> <span className="separator">//</span>
                <span>Hobbyists</span>
              </div>
            </div>
          </div>
        </section>

        <section className="relative brutalist-border-b solid-bg flex flex-col">
          <div className="label-badge">Join the Array</div>
          <div className="grid grid-cols-1 lg:grid-cols-4 w-full h-full">
            <div className="col-span-1 lg:col-span-3 p-8 md:p-12 brutalist-border-r flex flex-col justify-center">
              <div className="text-sm font-light italic uppercase stage-title mb-8 text-[#F3F3E1]/70">Membership Benefits</div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                  <p className="text-xl md:text-2xl font-bold uppercase tracking-tight">Representation in Estonia’s game development community</p>
                </div>
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                  <p className="text-xl md:text-2xl font-bold uppercase tracking-tight">Access to shared industry contacts and platforms <span className="font-light italic text-[#F3F3E1]/60">(with consent)</span></p>
                </div>
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                  <p className="text-xl md:text-2xl font-bold uppercase tracking-tight">Participation in general meetings and voting</p>
                </div>
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                  <p className="text-xl md:text-2xl font-bold uppercase tracking-tight">Updates about EGDA activities and budget use</p>
                </div>
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                  <p className="text-xl md:text-2xl font-bold uppercase tracking-tight">Opportunity to help shape the future of game development in Estonia</p>
                </div>
              </div>
            </div>
            <a href="https://forms.gle/4EGerrgaZxP6MWcAA" target="_blank" rel="noopener noreferrer" className="col-span-1 p-8 md:p-12 interactive-cell flex flex-col items-center justify-center min-h-[300px] text-center group relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 block group-hover:scale-110 transition-transform duration-300">Apply<br />Now</span>
                <svg className="w-12 h-12 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                </svg>
              </div>
              <div className="absolute inset-0 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
            </a>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 flex-grow solid-bg">
          <div className="relative p-8 md:p-12 brutalist-border-r brutalist-border-b md:brutalist-border-b-0 min-h-[400px] flex flex-col">
            <div className="label-badge">Data Link 01</div>
            <div className="text-sm font-light italic uppercase stage-title mb-8 text-[#F3F3E1]/70">EGDA Transmissions</div>
            <div className="flex-grow flex items-center justify-center border border-dashed border-[#F3F3E1]/30 p-8">
              <div className="text-center opacity-50">
                <svg className="w-8 h-8 mx-auto mb-4 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
                </svg>
                <p className="text-sm font-bold uppercase tracking-widest mb-2">[ Awaiting Signal ]</p>
                <p className="text-xs font-light uppercase">No official announcements logged.</p>
              </div>
            </div>
          </div>
          <div className="relative p-8 md:p-12 min-h-[400px] flex flex-col brutalist-border-b md:brutalist-border-b-0">
            <div className="label-badge">Data Link 02</div>
            <div className="text-sm font-light italic uppercase stage-title mb-8 text-[#F3F3E1]/70">Estonian Gamedev Intel</div>
            <div className="flex-grow flex items-center justify-center border border-dashed border-[#F3F3E1]/30 p-8">
              <div className="text-center opacity-50">
                <svg className="w-8 h-8 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
                <p className="text-sm font-bold uppercase tracking-widest mb-2">[ Scanning Frequencies ]</p>
                <p className="text-xs font-light uppercase">Monitoring local industry nodes.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="solid-bg brutalist-border-t p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-black uppercase tracking-tighter">EGDA</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-xs md:text-sm font-medium uppercase leading-relaxed text-[#F3F3E1]/80 space-y-1">
                <p>Estonian Game Developers Association</p>
                <p>&gt; Uniting the local ecosystem</p>
                <p className="pt-4 opacity-50">© SYSTEM YEAR 2024</p>
              </div>
            </div>
            <div className="flex flex-col md:items-end justify-end space-y-4">
              <a href="mailto:info.egda@gmail.com" className="text-xl font-bold uppercase tracking-tight hover:underline underline-offset-4 decoration-2">
                info.egda@gmail.com
              </a>
              <a href="https://discord.gg/mTkj64Aj4" target="_blank" rel="noopener noreferrer" className="text-xl font-bold uppercase tracking-tight hover:underline underline-offset-4 decoration-2 flex items-center gap-2">
                Join Discord Hub
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = injectedStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Router basename="/">
      <div className="selection:bg-[#F3F3E1] selection:text-[#151516]">
        <WebGLBackground />
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;