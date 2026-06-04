import {useState} from 'react'

import { Editor } from '@monaco-editor/react'
import "./App.css"
function App() {
  const [count, setCount] = useState(0)

  return (
    <main
    className = "h-screen w-full bg-gray-950 flex gap-3 p-4">
      <aside className = "h-full w-1/4 bg-amber-100 rounded-lg">

      </aside>
      <section className = "w-3/4 h-full bg-neutral-800 rounded-lg">
      <Editor
      height="100%"
      defaultLanguage='javascript'
      defaultValue='enter your code here'
      theme= 'vs-dark'
      />

      </section>
    
    {/* <h1 className = "text-amber-300">hello</h1> */}
    </main>
  )}

export default App
