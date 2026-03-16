import { useEffect, useRef } from 'react';
import { initGame } from './game';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && minimapRef.current) {
      initGame(canvasRef.current, minimapRef.current);
    }
  }, []);

  return (
    <div className="relative w-full h-full font-crimson text-[#c8961e]">
      <div id="cursor" className="fixed w-3 h-3 border border-[#d2aa64]/80 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 z-[9999]"></div>
      
      <canvas ref={canvasRef} id="gameCanvas" className="block fixed inset-0 w-full h-full"></canvas>
      
      <div className="fixed inset-0 pointer-events-none z-[90] mix-blend-multiply bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.75)_100%)]"></div>
      <div className="fixed inset-0 pointer-events-none z-[92] opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg_viewBox=%220_0_256_256%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22n%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.9%22_numOctaves=%224%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23n)%22/%3E%3C/svg%3E')]"></div>
      
      <div id="weather-overlay" className="fixed inset-0 pointer-events-none z-[95] opacity-0 transition-opacity duration-[3s]"></div>
      <div id="campfire-glow" className="fixed inset-0 pointer-events-none z-[88] opacity-0 transition-opacity duration-[2s] bg-[radial-gradient(ellipse_at_50%_80%,rgba(200,100,20,0.18)_0%,transparent_65%)]"></div>

      {/* Title Screen */}
      <div id="title-screen" className="fixed inset-0 bg-[#0a0705] flex flex-col items-center justify-center z-[200] transition-opacity duration-[2s]">
        <div className="font-cinzel text-[clamp(48px,10vw,120px)] font-black text-[#c8961e] tracking-[0.3em] animate-titlePulse">MERIDIAN</div>
        <div className="font-crimson text-[clamp(12px,2vw,18px)] text-[#b48c50]/70 tracking-[0.5em] uppercase mt-3">El último horizonte</div>
        <div className="font-cinzel text-[clamp(10px,1.5vw,14px)] text-[#966e3c]/50 tracking-[0.8em] mt-2">v2.1 · 100 Misiones</div>
        
        <div className="flex flex-col gap-4 mt-16 items-center">
          <div className="font-crimson text-[clamp(14px,2vw,20px)] text-[#c8a050]/60 tracking-[0.3em] cursor-pointer transition-colors hover:text-[#c8a050]" onClick={() => (window as any).startGame(false)}>— Nueva Partida —</div>
          <div className="font-cinzel text-sm text-[#64c8c8]/80 tracking-[0.2em] cursor-pointer border border-[#64c8c8]/40 px-5 py-2.5 mt-2 hover:bg-[#64c8c8]/10 hover:text-white transition-colors" onClick={() => (window as any).startGame(true)}>🎓 TUTORIAL · Aprende a jugar</div>
          <div id="loadBtn" className="hidden font-cinzel text-sm text-[#64c864]/70 tracking-[0.2em] cursor-pointer border border-[#64c864]/30 px-5 py-2.5 hover:bg-[#64c864]/10 hover:text-white transition-colors" onClick={() => (window as any).loadGame()}>📂 CONTINUAR PARTIDA</div>
        </div>
      </div>

      {/* World Map */}
      <div id="world-map" className="fixed inset-0 bg-[#040201]/95 z-[300] hidden flex-col p-5 overflow-auto backdrop-blur-sm">
        <div className="flex justify-between items-center border-b border-[#b4823c]/30 pb-2.5 mb-5">
          <div className="font-cinzel text-xl text-[#c8961e] tracking-[0.5em]">MAPA DEL TERRITORIO — La Llanura de Ceniza</div>
          <div className="font-crimson text-sm text-[#b4823c]/80 cursor-pointer px-4 py-1.5 border border-[#b4823c]/30 hover:bg-[#b4823c]/10 transition-colors" onClick={() => (window as any).closeWorldMap()}>[ M ] Cerrar</div>
        </div>
        <div className="flex gap-1.5 my-2 flex-wrap">
          <button id="mtab-all" className="map-tab active font-cinzel text-[10px] tracking-[0.2em] px-3 py-1 border border-[#b4823c]/30 text-[#7a6040] cursor-pointer uppercase transition-all bg-transparent hover:text-[#c8a860] hover:border-[#c8a860]/50 [&.active]:text-[#c8a860] [&.active]:border-[#c8a860] [&.active]:bg-[#c8a860]/10" onClick={() => (window as any).setMapTab('all')}>Todo</button>
          <button id="mtab-missions" className="map-tab font-cinzel text-[10px] tracking-[0.2em] px-3 py-1 border border-[#b4823c]/30 text-[#7a6040] cursor-pointer uppercase transition-all bg-transparent hover:text-[#c8a860] hover:border-[#c8a860]/50 [&.active]:text-[#c8a860] [&.active]:border-[#c8a860] [&.active]:bg-[#c8a860]/10" onClick={() => (window as any).setMapTab('missions')}>Misiones activas</button>
          <button id="mtab-npcs" className="map-tab font-cinzel text-[10px] tracking-[0.2em] px-3 py-1 border border-[#b4823c]/30 text-[#7a6040] cursor-pointer uppercase transition-all bg-transparent hover:text-[#c8a860] hover:border-[#c8a860]/50 [&.active]:text-[#c8a860] [&.active]:border-[#c8a860] [&.active]:bg-[#c8a860]/10" onClick={() => (window as any).setMapTab('npcs')}>Personajes</button>
          <button id="mtab-fragments" className="map-tab font-cinzel text-[10px] tracking-[0.2em] px-3 py-1 border border-[#b4823c]/30 text-[#7a6040] cursor-pointer uppercase transition-all bg-transparent hover:text-[#c8a860] hover:border-[#c8a860]/50 [&.active]:text-[#c8a860] [&.active]:border-[#c8a860] [&.active]:bg-[#c8a860]/10" onClick={() => (window as any).setMapTab('fragments')}>Fragmentos</button>
          <button id="mtab-visited" className="map-tab font-cinzel text-[10px] tracking-[0.2em] px-3 py-1 border border-[#b4823c]/30 text-[#7a6040] cursor-pointer uppercase transition-all bg-transparent hover:text-[#c8a860] hover:border-[#c8a860]/50 [&.active]:text-[#c8a860] [&.active]:border-[#c8a860] [&.active]:bg-[#c8a860]/10" onClick={() => (window as any).setMapTab('visited')}>Visitados</button>
        </div>
        <canvas id="mapCanvas" className="w-full h-[60vh] bg-[#0e0a05] border border-[#b4823c]/40 cursor-grab mx-auto block shadow-[0_0_30px_rgba(0,0,0,0.8)]"></canvas>
        <div id="map-tooltip" className="fixed bg-[#0a0602]/95 border border-[#b4823c]/50 text-[#c8a860] font-cinzel text-[11px] px-3 py-1.5 pointer-events-none hidden z-[400] max-w-[200px] leading-relaxed shadow-lg"></div>
        <div id="map-info-panel" className="flex gap-5 mt-2 flex-wrap font-cinzel text-[10px] text-[#7a6040] tracking-[0.1em]">
          <div>Misiones activas: <span id="map-stat-missions" className="text-[#c8a860]">0</span></div>
          <div>Personajes visitados: <span id="map-stat-visited" className="text-[#c8a860]">0</span></div>
          <div>Fragmentos encontrados: <span id="map-stat-fragments" className="text-[#c8a860]">0</span></div>
          <div>Hora: <span id="map-stat-time" className="text-[#c8a860]">—</span></div>
        </div>
        <div className="text-[9px] text-[#50402a] text-center mt-1.5 tracking-[0.2em]">🖱 Arrastra · Rueda = zoom · Hover = información</div>
      </div>

      {/* Tutorial Overlay */}
      <div id="tutorial-overlay" className="fixed inset-0 bg-black/80 z-[400] hidden flex-col items-center justify-center p-5 backdrop-blur-sm">
        <div className="max-w-[600px] bg-[#1a1208] border-2 border-[#c8961e] rounded-xl p-8 text-[#dcbe8c]/90 font-crimson text-lg leading-relaxed shadow-[0_0_50px_rgba(200,150,50,0.2)]">
          <h2 className="font-cinzel text-[#c8961e] text-center mb-5 text-2xl tracking-[0.2em]">🎓 BIENVENIDO, FORASTERO</h2>
          <p className="mb-4">Este es el <span className="text-[#c8961e] font-bold border-b border-dashed border-[#c8961e]">Territorio de Meridian</span>. Aquí tus decisiones escribirán tu historia.</p>
          <p className="mb-4"><span className="text-[#c8961e] font-bold">🔹 MOVIMIENTO:</span> Usa <strong>WASD</strong> o las flechas para caminar. Mantén <strong>SHIFT</strong> para correr.</p>
          <p className="mb-4"><span className="text-[#c8961e] font-bold">🔹 INTERACCIÓN:</span> Acércate a un personaje y presiona <strong>E</strong> para hablar.</p>
          <p className="mb-4"><span className="text-[#c8961e] font-bold">🔹 CENIZA (tu caballo):</span> Presiona <strong>F</strong> cerca de él para montar/desmontar.</p>
          <p className="mb-4"><span className="text-[#c8961e] font-bold">🔹 MENÚS:</span> <strong>J</strong> para Diario · <strong>I</strong> para Mochila · <strong>M</strong> para Mapa · <strong>K</strong> para Guardar</p>
          <p className="mb-4"><span className="text-[#c8961e] font-bold">🔹 FOGATA:</span> Presiona <strong>C</strong> para encender fuego y reflexionar.</p>
          <p className="mb-4"><span className="text-[#c8961e] font-bold">🔹 COMBATE:</span> Presiona <strong>Q</strong> para desenfundar. <strong>Clic</strong> para disparar. <strong>R</strong> para recargar.</p>
          <p className="mt-5 text-[#c8961e]">¿Estás listo para cabalgar hacia el horizonte?</p>
          <div className="mt-5 text-center font-cinzel text-sm text-[#c8961e] cursor-pointer px-5 py-2.5 border border-[#c8961e] inline-block hover:bg-[#c8961e] hover:text-[#1a1208] transition-colors" onClick={() => (window as any).closeTutorial()}>COMENZAR</div>
        </div>
      </div>

      {/* Cinematic Bars */}
      <div id="barTop" className="fixed top-0 left-0 right-0 bg-black z-[150] h-0 transition-[height] duration-1000 [&.active]:h-[50px]"></div>
      <div id="barBottom" className="fixed bottom-0 left-0 right-0 bg-black z-[150] h-0 transition-[height] duration-1000 [&.active]:h-[50px]"></div>

      {/* Monologue Screen */}
      <div id="monologue-screen" className="fixed inset-0 bg-[#040201]/90 flex-col items-center justify-center z-[180] opacity-0 transition-opacity duration-[1.5s] pointer-events-none hidden [&.visible]:flex [&.visible]:opacity-100 [&.visible]:pointer-events-auto backdrop-blur-md">
        <div className="max-w-[580px] text-center p-10">
          <div className="text-4xl mb-6 animate-fireFlicker drop-shadow-[0_0_20px_rgba(255,100,0,0.8)]">🔥</div>
          <div id="monologueText" className="font-crimson italic text-[clamp(18px,3vw,26px)] text-[#dcb46e]/90 leading-loose animate-monologueIn"></div>
          <div id="monologueAttr" className="mt-6 font-cinzel text-[11px] text-[#a0783c]/45 tracking-[0.6em] uppercase"></div>
          <div className="mt-8 font-crimson text-[15px] text-[#b48c46]/50 tracking-[0.3em] animate-blink cursor-pointer" onClick={() => (window as any).closeMonologue()}>— Presiona cualquier tecla para continuar —</div>
        </div>
      </div>

      {/* Inventory */}
      <div id="inventory" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(700px,94vw)] max-h-[82vh] bg-[#1a1208]/95 border border-[#b4823c]/40 z-[190] opacity-0 transition-opacity duration-500 pointer-events-none hidden flex-col rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-md [&.visible]:flex [&.visible]:opacity-100 [&.visible]:pointer-events-auto">
        <div className="p-4 px-6 border-b border-[#b4823c]/20 flex justify-between items-center shrink-0">
          <div className="font-cinzel text-[13px] text-[#c8961e] tracking-[0.5em] uppercase">Mochila</div>
          <div className="font-crimson text-[12px] text-[#b4823c]/50 tracking-[0.3em] cursor-pointer hover:text-[#b4823c] transition-colors" onClick={() => (window as any).closeInventory()}>[ cerrar — I ]</div>
        </div>
        <div id="invGrid" className="grid grid-cols-4 gap-2 p-4 px-6 overflow-y-auto flex-1"></div>
        <div id="inv-detail" className="p-3 px-6 border-t border-[#b4823c]/10 shrink-0 min-h-[70px] bg-black/20">
          <div id="invDetailName" className="font-cinzel text-[13px] text-[#c8961e] tracking-[0.4em] mb-1.5"></div>
          <div id="invDetailText" className="font-crimson italic text-[clamp(15px,1.8vw,17px)] text-[#d2b482]/85 leading-relaxed">Selecciona un objeto para leer sobre él.</div>
          <div className="mt-2.5 flex gap-2.5 flex-wrap">
            <button className="font-cinzel text-[11px] tracking-[0.18em] uppercase px-3 py-2 bg-[#b4823c]/10 border border-[#b4823c]/30 text-[#dcbe82]/95 cursor-pointer hover:bg-[#b4823c]/20 transition-colors" onClick={() => (window as any).useSelectedItem()}>Usar</button>
            <button className="font-cinzel text-[11px] tracking-[0.18em] uppercase px-3 py-2 bg-[#c8503c]/10 border border-[#c8503c]/30 text-[#f0a096]/95 cursor-pointer hover:bg-[#c8503c]/20 transition-colors" onClick={() => (window as any).dropSelectedItem()}>Soltar</button>
          </div>
        </div>
      </div>

      {/* Journal */}
      <div id="journal" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(680px,92vw)] max-h-[80vh] bg-[#1a1208]/95 border border-[#b4823c]/35 z-[190] opacity-0 transition-opacity duration-500 pointer-events-none hidden flex-col rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-md [&.visible]:flex [&.visible]:opacity-100 [&.visible]:pointer-events-auto">
        <div className="p-5 px-7 border-b border-[#b4823c]/20 flex justify-between items-center shrink-0">
          <div className="font-cinzel text-[14px] text-[#c8961e] tracking-[0.5em] uppercase">Diario del Protagonista</div>
          <div className="font-crimson text-[12px] text-[#b4823c]/50 tracking-[0.3em] cursor-pointer hover:text-[#b4823c] transition-colors" onClick={() => (window as any).closeJournal()}>[ cerrar — J ]</div>
        </div>
        <div id="journalBody" className="p-5 px-7 overflow-y-auto flex-1"></div>
      </div>

      {/* Main HUD */}
      <div id="game-ui" className="fixed inset-0 pointer-events-none z-[100] opacity-0 transition-opacity duration-[2s] [&.visible]:opacity-100">
        <div id="timeIndicator" className="absolute top-[58px] left-1/2 -translate-x-1/2 font-cinzel text-[11px] text-[#b48c50]/50 tracking-[0.5em] uppercase drop-shadow-md">Amanecer</div>
        <div id="weatherIndicator" className="absolute top-[60px] left-5 font-cinzel text-[10px] text-[#c8a050]/60 tracking-[0.4em] opacity-0 transition-opacity duration-1000 [&.visible]:opacity-100"></div>
        
        <div id="minimap" className="absolute top-[58px] right-4 w-[160px] h-[160px] border-[3px] border-[#b4823c]/60 overflow-hidden bg-[#0a0705]/90 rounded-full shadow-[0_0_25px_rgba(0,0,0,0.9)] backdrop-blur-md flex items-center justify-center">
          <canvas ref={minimapRef} id="minimapCanvasVisible" width="160" height="160" className="rounded-full absolute inset-0"></canvas>
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_25px_rgba(0,0,0,1)] pointer-events-none"></div>
          
          {/* Compass Markers */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-cinzel font-bold text-[#c8961e] drop-shadow-md z-10">N</div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-cinzel font-bold text-[#b4823c]/70 drop-shadow-md z-10">S</div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-cinzel font-bold text-[#b4823c]/70 drop-shadow-md z-10">E</div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-cinzel font-bold text-[#b4823c]/70 drop-shadow-md z-10">W</div>
          
          {/* Center Dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ffffff] rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)] z-20"></div>
        </div>
        
        <div className="absolute bottom-[65px] left-5 flex flex-col gap-2 drop-shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="font-cinzel text-[10px] text-[#b48c50]/60 tracking-[0.3em] w-[58px]">SALUD</div>
            <div className="w-[100px] h-[3px] bg-white/10 rounded-full overflow-hidden">
              <div id="healthBar" className="h-full bg-gradient-to-r from-[#8b4513] to-[#c8961e] transition-all duration-500" style={{width: '100%'}}></div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="font-cinzel text-[10px] text-[#b48c50]/60 tracking-[0.3em] w-[58px]">HONOR</div>
            <div className="w-[100px] h-[3px] bg-white/10 rounded-full overflow-hidden">
              <div id="honorBar" className="h-full bg-gradient-to-r from-[#2a4a6b] to-[#4a8fbd] transition-all duration-500" style={{width: '70%'}}></div>
            </div>
          </div>
          <div id="staminaRow" className="flex items-center gap-2.5 opacity-0 transition-opacity duration-500">
            <div className="font-cinzel text-[10px] text-[#b48c50]/60 tracking-[0.3em] w-[58px]">CENIZA</div>
            <div className="w-[100px] h-[3px] bg-white/10 rounded-full overflow-hidden">
              <div id="staminaBar" className="h-full bg-gradient-to-r from-[#2a6b3a] to-[#4abd6a] transition-all duration-500" style={{width: '100%'}}></div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            <div className="font-cinzel text-[10px] text-[#b48c50]/60 tracking-[0.3em] w-[58px]">DINERO</div>
            <div id="moneyDisplay" className="font-crimson italic text-[14px] text-[#c8a860]">$15</div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="font-cinzel text-[10px] text-[#b48c50]/60 tracking-[0.3em] w-[58px]">BALAS</div>
            <div id="ammoDisplay" className="font-sans text-[10px] tracking-[0.2em] text-[#c8c8c8]">●●●●●●</div>
          </div>
        </div>

        <div id="journal-hint-ui" className="absolute bottom-[15px] left-5 font-cinzel text-[9px] text-[#b4823c]/40 tracking-[0.3em]">
          [ J ] Diario | [ I ] Mochila | [ M ] Mapa | [ K ] Guardar | [ Q ] Arma
        </div>

        <div id="rep-badge" className="absolute bottom-[165px] left-5 opacity-0 transition-opacity duration-700 [&.visible]:opacity-100">
          <div className="font-cinzel text-[9px] text-[#b4823c]/40 tracking-[0.4em] uppercase mb-0.5">Reputación</div>
          <div id="repValue" className="font-crimson italic text-[13px] tracking-[0.1em] text-[#c8961e]">Desconocido</div>
        </div>

        <div id="locationName" className="absolute bottom-[75px] left-1/2 -translate-x-1/2 text-center drop-shadow-lg">
          <div className="font-cinzel text-[clamp(14px,2.5vw,22px)] text-[#d2aa64]/90 tracking-[0.4em] uppercase">Llanura de Ceniza</div>
          <div className="font-crimson text-[clamp(10px,1.3vw,13px)] text-[#a0783c]/60 tracking-[0.5em] uppercase mt-1">Territorio del Oeste</div>
        </div>

        <div id="mission-tracker" className="absolute top-[58px] left-1/2 -translate-x-1/2 flex flex-col gap-1.5 items-center pointer-events-none"></div>

        {/* Reload Circle */}
        <div id="reload-ui" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 transition-opacity duration-300">
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(200, 150, 30, 0.2)" strokeWidth="4" />
            <circle id="reload-progress" cx="30" cy="30" r="25" fill="none" stroke="#c8961e" strokeWidth="4" strokeDasharray="157" strokeDashoffset="157" transform="rotate(-90 30 30)" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-cinzel text-[10px] text-[#c8961e]">RECARGANDO</div>
        </div>

        <div id="campfire-prompt" className="absolute bottom-[145px] left-1/2 -translate-x-1/2 font-cinzel text-[11px] text-[#d2aa50]/70 tracking-[0.4em] text-center opacity-0 transition-opacity duration-500 pointer-events-none [&.visible]:opacity-100 drop-shadow-md">
          [C] Encender fogata · Reflexionar
        </div>

        {/* Dialogue Box */}
        <div id="dialogue" className="absolute bottom-[75px] left-1/2 -translate-x-1/2 w-[min(720px,95vw)] bg-[#0a0603]/95 border border-[#b4823c]/30 p-0 opacity-0 transition-opacity duration-500 pointer-events-none hidden rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-sm [&.visible]:flex [&.visible]:opacity-100 [&.visible]:pointer-events-auto">
          <div id="dialoguePortrait" className="w-[100px] bg-[#1a100a] flex flex-col items-center justify-end p-4 px-1 border-r border-[#b4823c]/30 shrink-0">
            <div id="portraitIcon" className="text-5xl mb-1 drop-shadow-[0_0_5px_rgba(200,150,50,0.5)]">👤</div>
            <div id="portraitName" className="font-cinzel text-[12px] text-[#c8961e] tracking-[0.2em] text-center leading-tight">—</div>
            <div id="portraitTone" className="font-crimson text-[10px] text-[#b48c50]/60 mt-1 italic text-center"></div>
          </div>
          <div className="flex-1 p-5 px-6 flex flex-col">
            <div id="dialogueSpeaker" className="font-cinzel text-[11px] text-[#c8961e] tracking-[0.4em] uppercase mb-2">—</div>
            <div id="dialogueText" className="font-crimson italic text-[clamp(16px,2.2vw,20px)] text-[#dcbe8c]/90 leading-[1.85] whitespace-pre-line flex-1"></div>
            <div id="dlgHint" className="font-cinzel text-[9px] text-[#b4823c]/40 tracking-[0.4em] text-right mt-2.5 transition-colors duration-300">[ X ] o [ Espacio ] para continuar</div>
          </div>
        </div>

        {/* Choice Box */}
        <div id="choice-box" className="absolute bottom-[75px] left-1/2 -translate-x-1/2 w-[min(650px,92vw)] bg-[#040201]/95 border border-[#b4823c]/30 p-5 px-6 opacity-0 transition-opacity duration-500 pointer-events-none hidden rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-sm [&.visible]:block [&.visible]:opacity-100 [&.visible]:pointer-events-auto">
          <div id="choiceQuestion" className="font-cinzel text-[11px] text-[#c8961e] tracking-[0.3em] mb-3.5">¿QUÉ HARÁS?</div>
          <div id="choiceButtons" className="flex flex-col gap-2"></div>
        </div>

        <div className="absolute bottom-[18px] right-7 text-right font-crimson text-[11px] text-[#966e3c]/45 tracking-[0.12em] leading-[1.9] hidden md:block">
          WASD — Mover &nbsp;|&nbsp; Shift — Correr<br/>
          F — Montar / Desmontar Ceniza<br/>
          E — Interactuar &nbsp;|&nbsp; C — Fogata<br/>
          J — Diario &nbsp;|&nbsp; I — Mochila &nbsp;|&nbsp; M — Mapa &nbsp;|&nbsp; K — Guardar<br/>
          Q — Arma &nbsp;|&nbsp; R — Recargar &nbsp;|&nbsp; Clic — Disparar<br/>
          X / Clic — Cerrar diálogo &nbsp;|&nbsp; Esc — Cerrar paneles
        </div>
      </div>

      {/* Shop UI */}
      <div id="shop-ui" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,92vw)] max-h-[80vh] bg-[#1a1208]/98 border border-[#c8961e]/40 z-[350] opacity-0 transition-opacity duration-500 pointer-events-none hidden flex-col rounded-lg shadow-[0_30px_80px_rgba(0,0,0,0.9)] backdrop-blur-lg [&.visible]:flex [&.visible]:opacity-100 [&.visible]:pointer-events-auto">
        <div className="p-5 px-7 border-b border-[#c8961e]/20 flex justify-between items-center shrink-0">
          <div className="font-cinzel text-[14px] text-[#c8961e] tracking-[0.5em] uppercase">Almacén de Suministros</div>
          <div className="font-crimson text-[12px] text-[#b4823c]/50 tracking-[0.3em] cursor-pointer hover:text-[#b4823c] transition-colors" onClick={() => (window as any).closeShop()}>[ cerrar ]</div>
        </div>
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-center p-4 bg-black/30 border border-[#c8961e]/10 rounded hover:border-[#c8961e]/30 transition-colors">
            <div>
              <div className="font-cinzel text-sm text-[#c8961e]">Caja de Balas (x6)</div>
              <div className="font-crimson italic text-xs text-[#b48c50]">Munición estándar para tu revólver.</div>
            </div>
            <button className="font-cinzel text-xs px-4 py-2 border border-[#c8961e] hover:bg-[#c8961e] hover:text-[#1a1208] transition-all" onClick={() => (window as any).buyItem('ammo', 5)}>$5</button>
          </div>
          <div className="flex justify-between items-center p-4 bg-black/30 border border-[#c8961e]/10 rounded hover:border-[#c8961e]/30 transition-colors">
            <div>
              <div className="font-cinzel text-sm text-[#c8961e]">Tónico de Salud</div>
              <div className="font-crimson italic text-xs text-[#b48c50]">Restaura 50 puntos de vida.</div>
            </div>
            <button className="font-cinzel text-xs px-4 py-2 border border-[#c8961e] hover:bg-[#c8961e] hover:text-[#1a1208] transition-all" onClick={() => (window as any).buyItem('health', 10)}>$10</button>
          </div>
          <div className="flex justify-between items-center p-4 bg-black/30 border border-[#c8961e]/10 rounded hover:border-[#c8961e]/30 transition-colors">
            <div>
              <div className="font-cinzel text-sm text-[#c8961e]">Manzana para Ceniza</div>
              <div className="font-crimson italic text-xs text-[#b48c50]">Restaura la estamina de tu caballo.</div>
            </div>
            <button className="font-cinzel text-xs px-4 py-2 border border-[#c8961e] hover:bg-[#c8961e] hover:text-[#1a1208] transition-all" onClick={() => (window as any).buyItem('stamina', 8)}>$8</button>
          </div>
        </div>
        <div className="p-4 px-7 border-t border-[#c8961e]/10 bg-black/20 text-center">
          <div className="font-cinzel text-xs text-[#b48c50]/60 tracking-[0.2em]">TU DINERO: <span id="shop-money" className="text-[#c8961e]">$15</span></div>
        </div>
      </div>

      <div id="honor-flash" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-cinzel text-[clamp(14px,2vw,18px)] tracking-[0.5em] uppercase opacity-0 transition-opacity duration-400 pointer-events-none z-[300] drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] [&.show]:opacity-100"></div>
      
      <div id="notification" className="fixed bottom-[90px] left-5 font-crimson italic text-[clamp(13px,1.8vw,16px)] text-[#d2aa64]/95 bg-[#040201]/90 border border-[#b4823c]/20 px-5 py-3 opacity-0 transition-opacity duration-500 pointer-events-none z-[250] text-center max-w-[90vw] rounded-md shadow-lg backdrop-blur-sm [&.show]:opacity-100"></div>

      {/* Epilogue Screen */}
      <div id="epilogue-screen" className="fixed inset-0 bg-black z-[500] hidden flex-col items-center justify-center opacity-0 transition-opacity duration-[3s] overflow-y-auto py-10 [&.visible]:flex [&.visible]:opacity-100 [&.solid]:bg-[#050302]">
        <div className="max-w-[800px] w-full px-8 flex flex-col items-center">
            <div id="epi-badge" className="text-6xl mb-6 drop-shadow-[0_0_15px_rgba(200,150,50,0.4)]"></div>
            <div id="epi-ending-title" className="font-cinzel text-3xl md:text-5xl text-[#c8961e] tracking-[0.3em] text-center mb-10 drop-shadow-lg"></div>
            
            <div id="epi-narrative" className="font-crimson italic text-lg md:text-xl text-[#dcb46e]/90 leading-relaxed space-y-6 mb-12 text-center"></div>
            
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c8961e]/30 to-transparent mb-10"></div>
            
            <div id="epi-stats" className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 w-full mb-12"></div>
            
            <div id="epi-fragments" className="w-full mb-12"></div>
            
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c8961e]/30 to-transparent mb-10"></div>
            
            <div className="text-center max-w-[600px] mb-16">
                <div id="epi-quote" className="font-crimson italic text-2xl text-[#e6c88c] leading-relaxed drop-shadow-md"></div>
                <div id="epi-quote-attr" className="font-cinzel text-xs text-[#a0783c]/70 tracking-[0.4em] uppercase mt-6"></div>
            </div>
            
            <div className="flex gap-6 flex-wrap justify-center">
                <button className="font-cinzel text-sm text-[#c8961e] tracking-[0.2em] px-6 py-3 border border-[#c8961e]/50 hover:bg-[#c8961e]/10 transition-colors" onClick={() => (window as any).continueAfterEpilogue()}>Continuar Explorando</button>
                <button className="font-cinzel text-sm text-[#a0783c] tracking-[0.2em] px-6 py-3 border border-[#a0783c]/30 hover:bg-[#a0783c]/10 transition-colors" onClick={() => (window as any).restartGame()}>Nueva Partida</button>
            </div>
        </div>
      </div>

    </div>
  );
}
