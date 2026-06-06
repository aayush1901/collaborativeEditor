import { useState, useEffect } from 'react'
import { MonacoBinding } from 'y-monaco'
import { Editor } from '@monaco-editor/react'
import * as Y from 'yjs'
import { SocketIOProvider } from 'y-socket.io'
import "./App.css"

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '🟨' },
  { id: 'python', name: 'Python', icon: '🟦' },
  { id: 'cpp', name: 'C++', icon: '🔵' },
  { id: 'java', name: 'Java', icon: '🔴' },
  { id: 'go', name: 'Go Lang', icon: '🌐' }
]

function App() {
  const [editor, setEditor] = useState(null)
  const [language, setLanguage] = useState('javascript')
  const [sharedMap, setSharedMap] = useState(null)
  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || ""
  });
  const [users, setUsers] = useState([])

  const handleMount = (editorInstance) => {
    setEditor(editorInstance);
  }

  const handleJoin = (e) => {
    e.preventDefault()
    const enteredName = e.target.username.value.trim();
    if (!enteredName) return;

    setUsername(enteredName);
    window.history.pushState({}, "", "?username=" + enteredName);
  }

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    if (sharedMap) {
      sharedMap.set("lang", selectedLang);
    }
  }

  useEffect(() => {
    if (!username || !editor) return;

    const ydoc = new Y.Doc();
    const yText = ydoc.getText("monaco");
    const yMap = ydoc.getMap("config");
    setSharedMap(yMap);

    const provider = new SocketIOProvider("http://localhost:3000", "monaco", ydoc, {
      autoConnect: true
    });
    
    if (yMap.has("lang")) {
      setLanguage(yMap.get("lang"));
    }

    yMap.observe((event) => {
      if (event.keysChanged.has("lang")) {
        setLanguage(yMap.get("lang"));
      }
    });
    
    provider.awareness.setLocalStateField("user", { username })
    
    const handleAwarenessChange = () => {
      const states = Array.from(provider.awareness.getStates().values())
      const activeUsers = states
        .filter(state => state.user && state.user.username)
        .map(state => state.user);
      setUsers(activeUsers);
    }
    
    provider.awareness.on("change", handleAwarenessChange)

    const binding = new MonacoBinding(
      yText,
      editor.getModel(), 
      new Set([editor]),
      provider.awareness
    );

    function handleBeforeUnload() {
      provider.awareness.setLocalStateField("user", null);
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      binding.destroy()
      provider.disconnect()
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [username, editor])   

  if (!username) {
    return (
      <main className="h-screen w-full bg-[#0B0F19] flex items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />

        <div className="w-full max-w-md bg-[#131B2E]/70 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Collaborative Sandbox
            </h1>
            <p className="text-slate-400 text-sm mt-1">Real-time synchronized workspace</p>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-5">
            <div className="relative">
              <input
                type="text"
                placeholder="Choose a workspace alias"
                className="w-full p-3.5 pl-4 rounded-xl bg-[#0B0F19]/90 text-white border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500 text-sm tracking-wide"
                name="username"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full p-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-[0.98] transition-all tracking-wide text-sm"
            >
              Enter Room
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen w-full bg-[#0B0F19] flex gap-4 p-4 font-sans text-slate-200 selection:bg-indigo-500/30">
      <aside className="h-full w-72 bg-[#131B2E] border border-slate-800/80 rounded-2xl flex flex-col shadow-2xl overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-800 bg-[#162035]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-sm tracking-wide text-slate-300">Workspace Hub</span>
          </div>
          <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700/60 font-mono text-slate-400">
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </span>
        </div>
        
        <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
          <ul className="flex flex-col gap-1.5">
            {users.map((user, index) => {
              const isSelf = user.username === username;
              return (
                <li 
                  key={index} 
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 ${
                    isSelf 
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' 
                      : 'bg-slate-900/40 border-slate-800/40 text-slate-300 hover:bg-slate-900/80 hover:border-slate-700/60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-inner ${
                    isSelf 
                      ? 'bg-indigo-500/20 text-indigo-300' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium truncate flex-1">{user.username}</span>
                  {isSelf && <span className="text-[10px] tracking-wider uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">You</span>}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-3 bg-[#0E1424] border-t border-slate-800/60 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Connected As</p>
            <p className="text-xs font-semibold text-slate-300 truncate">{username}</p>
          </div>
        </div>
      </aside>
      
      <section className="flex-1 h-full bg-[#1E1E1E] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col relative">
        <div className="h-14 w-full bg-[#181818] border-b border-[#2d2d2d] flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            
            <div className="ml-6 relative">
              <select 
                value={language}
                onChange={handleLanguageChange}
                className="bg-[#222] text-slate-300 text-xs font-mono py-1.5 pl-3 pr-8 rounded border border-[#3d3d3d] focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none tracking-wide"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.icon} {lang.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-500 text-[10px]">
                ▼
              </div>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        </div>
        <div className="flex-1 w-full pt-2">
          <Editor
            height="100%"
            language={language}
            theme='vs-dark'
            onMount={handleMount}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: true,
              scrollBeyondLastLine: false,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              padding: { top: 8, bottom: 8 },
              fontFamily: 'Fira Code, JetBrains Mono, Source Code Pro, monospace',
              fontLigatures: true
            }}
          />
        </div>
      </section>
    </main>
  )
}

export default App;