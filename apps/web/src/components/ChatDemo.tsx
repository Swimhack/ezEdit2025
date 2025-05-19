import { useState } from 'react';
import { sendChat } from '../api/chat';

export function ChatDemo() {
  const [msg, setMsg] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const ask = async () => {
    if (!msg.trim()) return;
    setLog(l => [...l, `🧑‍💻 ${msg}`]);
    const reply = await sendChat([{ role: 'user', content: msg }]);
    setLog(l => [...l, `🤖 ${reply}`]);
    setMsg('');
  };

  return (
    <div className="flex flex-col gap-2 max-w-md mx-auto">
      <div className="border p-2 h-60 overflow-y-auto">
        {log.map((l,i) => <p key={i}>{l}</p>)}
      </div>
      <input
        className="border px-2 py-1"
        value={msg}
        onChange={e => setMsg(e.target.value)}
        placeholder="Ask GPT-4…"
        onKeyDown={e => e.key==='Enter' && ask()}
      />
      <button className="bg-brand text-white py-1" onClick={ask}>Send</button>
    </div>
  );
} 