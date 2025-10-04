import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation, Navigate } from "react-router-dom";

// Enable JSX support for <webview> in TSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: any;
    }
  }
}

/**
 * ГКС 1.1 — приложение с навигацией и встроенным браузером/графиком
 * - Сайдбар с разделами СИ/АУП, без поиска (по просьбе)
 * - Верхняя панель с центральной надписью «ГКС 1.1»
 * - Все внешние ссылки открываются внутри приложения (веб: <iframe>, Electron: <webview>)
 * - Экран «График» грузится из /gks-chart/index.html БЕЗ изменений
 * - Стартовый маршрут: / (Навигация)
 * - Тёмная/светлая тема
 */

// ===== ДАННЫЕ =====
export type LinkItem = { label: string; href: string };
export type Links = { si: LinkItem[]; aup: LinkItem[] };

const LINKS: Links = {
  si: [
    { label: "График", href: "https://gks11beeline.netlify.app/" },
    { label: "Ключи от ТКД", href: "https://script.google.com/macros/s/AKfycbzogHDbKKTJMMXIPTocRd_0pbcBz3W7L3x4L1W7-LVymdcyaWtYfpnh4mGMzkjv8Tbr/exec" },
    { label: "Долги по Договорам", href: "https://docs.google.com/spreadsheets/d/1x_viBnGjuiZc5x8doxtXbdx43SxusDuGBowFnOmT9TY/edit#gid=1384100435" },
    { label: "Подача данных Коммутаторы", href: "https://docs.google.com/forms/d/e/1FAIpQLSfT5sBFrRZzVX7hlaPoEPZd7YBWjV0YLOrpvXxc9SdQaHwlWA/viewform" },
    { label: "Завести Продажу", href: "https://partnerweb.beeline.ru/" },
    { label: "Ключи от домофона", href: "https://t.me/DomoKeyBot" },
  ],
  aup: [
    { label: "АО 1.1", href: "https://docs.google.com/spreadsheets/d/1QDlI5D57K5ewh2Ao-LOYvJP2ext6ROKLB1xGn4PdlcA/edit#gid=0" },
    { label: "Рабочий стол", href: "https://docs.google.com/spreadsheets/d/15nwERRF4j87HRHChzY2VH06ItasP92Jph1m-070kf1E/edit#gid=0" },
    { label: "Данные PartnerWeb", href: "https://docs.google.com/spreadsheets/d/1n-Ur_i7zf23T-78myZWKHNkca0Y4qgTjclaryNTe5bs/edit?gid=430194426#gid=430194426" },
    { label: "Информация по коммутаторам", href: "https://docs.google.com/spreadsheets/d/1SnRDhHsCB2t3lbfQtkK0-YRT9O3wWTNT_UJaGW2Gook/edit?gid=1320999918#gid=1320999918" },
    { label: "Контроль ЛЗ 24ч", href: "https://docs.google.com/spreadsheets/d/1OENmnDKoh9vbgqUth-3twH8DcqD_cBAq5aWkW-wEuY/edit?gid=567091246#gid=567091246" },
  ],
};

// ===== УТИЛИТЫ =====
function useTheme() {
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem("gks-theme") === "dark");
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark"); else root.classList.remove("dark");
    localStorage.setItem("gks-theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark(d => !d) };
}

function openInsideApp(navigate: ReturnType<typeof useNavigate>, href: string) {
  navigate(`/browse?url=${encodeURIComponent(href)}`);
}

// ===== КОМПОНЕНТЫ =====
function TopBar() {
  const { dark, toggle } = useTheme();
  const location = useLocation();
  const isChart = location.pathname.startsWith("/chart");
  return (
    <div className="sticky top-0 z-40 border-b bg-white/75 dark:bg-neutral-900/75 backdrop-blur">
      <div className="max-w-7xl mx-auto px-3 py-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div />
        <div className="flex items-center justify-center gap-2">
          <div className="h-6 w-6 rounded bg-[#FFD700] border border-black" />
          <div className="font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 text-lg">ГКС 1.1</div>
        </div>
        <div className="flex items-center justify-end gap-2">
          {isChart ? (
            <span className="hidden sm:block text-xs text-neutral-500 dark:text-neutral-400">График: /gks-chart/index.html</span>
          ) : null}
          <button onClick={toggle} className="px-2 py-1 rounded border text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700">
            {dark ? "Светлая" : "Тёмная"}
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-3 pb-2 flex items-center justify-center gap-1 text-xs">
        <NavLink to="/" end className={({isActive})=>`px-2 py-1 rounded ${isActive?"bg-[#FFD700] text-black":"text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}>Навигация</NavLink>
        <NavLink to="/chart" className={({isActive})=>`px-2 py-1 rounded ${isActive?"bg-[#FFD700] text-black":"text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}>График</NavLink>
      </div>
    </div>
  );
}

function Sidebar() {
  const navigate = useNavigate();
  const si = useMemo(()=>LINKS.si,[]);
  const aup = useMemo(()=>LINKS.aup,[]);

  const Section = ({ title, items }: { title: string; items: LinkItem[] }) => (
    <div>
      <div className="px-2 text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">{title}</div>
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <motion.button
            key={it.label}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={()=>openInsideApp(navigate, it.href)}
            className={`text-left px-3 py-2 rounded-xl border transition shadow-sm ${i%2===0?"bg[#FFD700] text-black border-black":"bg-black text-[#FFD700] border-[#FFD700]"}`.replace("bg[#", "bg-[#")}
          >
            {it.label}
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full w-full md:w-80 p-3 md:p-4 border-r bg-white dark:bg-neutral-900">
      <div className="space-y-6">
        <Section title="СИ" items={si} />
        <Section title="АУП" items={aup} />
      </div>
    </div>
  );
}

function NavigationPage() {
  return (
    <div className="h-[calc(100vh-48px)] grid grid-cols-1 md:grid-cols-[320px_1fr]">
      <Sidebar />
      <div className="p-4 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl border-4 border-black bg-[#FFD700] text-black text-center font-bold text-4xl py-8 shadow">
            ГКС 1.1
          </div>
          <div className="mt-4 text-center text-sm text-neutral-700 dark:text-neutral-300">
            Выберите ссылку слева — она откроется во встроенном браузере.
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Экран графика =====
function ChartEmbed() {
  const src = "/gks-chart/index.html"; // без изменений
  const isElectron = /Electron/i.test(navigator.userAgent);
  const [reloadKey, setReloadKey] = useState(0);

  const onReload = () => setReloadKey(k => k + 1);
  const onOpenExternal = () => window.open(src, "_blank", "noreferrer");

  return (
    <div className="h-[calc(100vh-48px)] w-full bg-white dark:bg-neutral-900">
      <div className="px-3 py-2 border-b dark:border-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
        <div className="text-xs md:text-sm truncate" title={src}>📊 График — {src}</div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={onReload} className="px-2 py-1 text-xs rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800">⟲ Обновить</button>
          <button onClick={onOpenExternal} className="px-2 py-1 text-xs rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800">↗ Открыть отдельно</button>
        </div>
      </div>
      <div className="w-full h-[calc(100%-40px)] bg-black">
        {isElectron ? (
          // @ts-ignore — webview доступен в Electron
          <webview key={reloadKey} src={src} allowpopups style={{ width: '100%', height: '100%', border: '0' }} />
        ) : (
          <iframe
            key={reloadKey}
            src={src}
            title="ГКС 1.1 — График"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>
    </div>
  );
}

// ===== Встроенный браузер =====
function InAppBrowser() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialUrl = params.get("url") || "about:blank";
  const isElectron = /Electron/i.test(navigator.userAgent);

  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const webviewEl = useRef<any>(null);

  useEffect(()=>{ setCurrentUrl(initialUrl); }, [initialUrl]);

  useEffect(() => {
    if (!isElectron) return;
    const node = webviewEl.current as any;
    if (!node) return;
    const start = () => setLoading(true);
    const stop = () => setLoading(false);
    const updateNav = () => {
      try {
        setCanBack(!!node.canGoBack?.());
        setCanForward(!!node.canGoForward?.());
        setCurrentUrl(node.getURL?.() || currentUrl);
      } catch {}
    };
    node.addEventListener('did-start-loading', start);
    node.addEventListener('did-stop-loading', stop);
    node.addEventListener('did-navigate', updateNav);
    node.addEventListener('did-navigate-in-page', updateNav);
    updateNav();
    return () => {
      node.removeEventListener('did-start-loading', start);
      node.removeEventListener('did-stop-loading', stop);
      node.removeEventListener('did-navigate', updateNav);
      node.removeEventListener('did-navigate-in-page', updateNav);
    };
  }, [isElectron, currentUrl]);

  const onBack = () => {
    if (isElectron) webviewEl.current?.goBack?.(); else window.history.back();
  };
  const onForward = () => {
    if (isElectron) webviewEl.current?.goForward?.(); else window.history.forward();
  };
  const onReload = () => {
    if (isElectron) webviewEl.current?.reload?.(); else setReloadKey(k => k + 1);
  };
  const onStop = () => {
    if (isElectron) webviewEl.current?.stop?.();
  };
  const onOpenExternal = () => window.open(currentUrl, "_blank", "noreferrer");
  const onCopy = async () => { try { await navigator.clipboard.writeText(currentUrl); } catch {} };

  return (
    <div className="h-[calc(100vh-48px)] w-full bg-white dark:bg-neutral-900">
      <div className="px-3 py-2 border-b dark:border-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
        <div className="flex items-center gap-2">
          <button disabled={!canBack} onClick={onBack} className="px-2 py-1 text-xs rounded border disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800">← Назад</button>
          <button disabled={!canForward} onClick={onForward} className="px-2 py-1 text-xs rounded border disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800">Вперёд →</button>
          <button onClick={onReload} className="px-2 py-1 text-xs rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800">⟲ Обновить</button>
          <button onClick={onStop} className="px-2 py-1 text-xs rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800">■ Стоп</button>
        </div>
        <div className="mx-2 text-xs md:text-sm truncate flex-1" title={currentUrl}>{loading ? '⏳ ' : '🔗 '} {currentUrl}</div>
        <div className="flex items-center gap-1">
          <button onClick={onCopy} className="px-2 py-1 text-xs rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800">⧉ Копировать</button>
          <button onClick={onOpenExternal} className="px-2 py-1 text-xs rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800">↗ Внешне</button>
        </div>
      </div>

      {isElectron ? (
        // @ts-ignore — webview доступен в Electron
        <webview
          key={currentUrl + '#' + reloadKey}
          src={currentUrl}
          allowpopups
          ref={webviewEl}
          style={{ width: '100%', height: 'calc(100% - 40px)', border: '0' }}
        />
      ) : (
        <iframe
          key={currentUrl + '#' + reloadKey}
          src={currentUrl}
          title="Встроенный браузер"
          className="w-full h-[calc(100%-40px)] border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      )}
    </div>
  );
}

// ===== КАРКАС =====
function Layout() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <TopBar />
      <Routes>
        <Route path="/" element={<NavigationPage />} />
        <Route path="/chart" element={<ChartEmbed />} />
        <Route path="/browse" element={<InAppBrowser />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function AppShell() {
  // ===== Простые самотесты ("test cases") =====
  useEffect(() => {
    const tests: { name: string; pass: boolean; details?: string }[] = [];
    const isHttp = (u: string) => /^https?:\/\//i.test(u);

    // 1) Не пустые разделы
    tests.push({ name: 'SI non-empty', pass: LINKS.si.length > 0 });
    tests.push({ name: 'AUP non-empty', pass: LINKS.aup.length > 0 });

    // 2) Все ссылки валидные http(s)
    const invalid = [...LINKS.si, ...LINKS.aup].filter(l => !isHttp(l.href));
    tests.push({ name: 'All href are http(s)', pass: invalid.length === 0, details: invalid.map(x=>x.label).join(', ') });

    // 3) Метки уникальны
    const labels = [...LINKS.si, ...LINKS.aup].map(l => l.label);
    const uniq = new Set(labels);
    tests.push({ name: 'Unique labels', pass: uniq.size === labels.length });

    // 4) Маршруты существуют
    tests.push({ name: 'Has /, /chart, /browse routes', pass: true });

    const failed = tests.filter(t => !t.pass);
    if (failed.length) {
      console.group('%cGKS self-tests FAILED','color:#b91c1c;font-weight:bold');
      failed.forEach(t => console.error(`✗ ${t.name}`, t.details || ''));
      console.groupEnd();
    } else {
      console.log('%cGKS self-tests passed','color:#16a34a');
    }
  }, []);

  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}


/* =========================
   DEPLOY ASSETS — ADD THESE FILES
   ========================= */

/* package.json */
/* Save as package.json at repo root */
/**
{
  "name": "gks-1-1",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --open",
    "electron": "cross-env VITE_DEV_SERVER_URL=http://localhost:5173 electron ./electron/main.ts",
    "dist:electron": "vite build && cross-env NODE_ENV=production electron-builder",
    "postinstall": "electron-builder install-app-deps"
  },
  "dependencies": {
    "framer-motion": "^11.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "cross-env": "^7.0.3",
    "electron": "^30.0.0",
    "electron-builder": "^24.13.3",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.4.5",
    "vite": "^5.4.0"
  },
  "build": {
    "appId": "gks.1.1.desktop",
    "productName": "ГКС 1.1",
    "files": [
      "dist/**",
      "electron/**",
      "package.json"
    ],
    "directories": { "output": "release" },
    "asar": true,
    "mac": { "target": ["dmg"] },
    "win": { "target": ["nsis"], "icon": "public/icon.ico" },
    "linux": { "target": ["AppImage"], "category": "Utility" }
  }
}
*/

/* netlify.toml */
/* Place at repo root for one-click deploy */
/**
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/gks-chart"
  to = "/gks-chart/index.html"
  status = 200

# SPA fallback
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[headers]
  for = "/gks-chart/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
*/

/* vite.config.ts */
/**
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: { outDir: 'dist' }
});
*/

/* tsconfig.json */
/**
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "allowJs": false
  },
  "include": ["src", "electron", "*.d.ts"]
}
*/

/* index.html */
/**
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ГКС 1.1</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
*/

/* src/main.tsx */
/**
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './index';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
*/

/* public/gks-chart/index.html */
/* Place your existing chart HTML here exactly as-is */

/* electron/main.ts */
/**
import { app, BrowserWindow } from 'electron';
import path from 'node:path';

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
*/

/* electron/preload.ts */
/**
// empty for now; keep contextIsolation true
*/

/* .gitignore */
/**
node_modules
.DS_Store
release
/dist
/.vite
.idea
.vscode
*/

/* README.md — quick deploy */
/**
# ГКС 1.1 — Deploy

## Web (Netlify)
1. Push repo to GitHub.
2. Netlify → New site from Git → select repo.
3. Build command: `npm run build`, Publish dir: `dist`.

## Desktop (Electron)
- Dev: `npm run dev` (tab 1) + `npm run electron` (tab 2)
- Build installer: `npm run dist:electron`
*/
