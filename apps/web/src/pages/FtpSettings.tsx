import { useState, useEffect } from 'react';
import { z } from 'zod';
import { testConnection } from '../lib/api';

const credSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  rootPath: z.string().optional().default('/')
});

type Site = {
  id?: string;
  name: string;
  host: string;
  username: string;
  password: string;
  rootPath: string;
};

export default function FtpSettings() {
  const [sites, setSites] = useState<Site[]>([]);
  const [form, setForm] = useState<Site>({ name: '', host: '', username: '', password: '', rootPath: '/' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [json, setJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { fetchSites(); }, []);

  async function fetchSites() {
    try {
      setSites([
        { id: '1', name: 'Demo Site', host: 'ftp.demo.com', username: 'demo', password: '******', rootPath: '/' }
      ]);
    } catch (e: any) {
      setError(e.message);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f: Site) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleJsonPaste() {
    try {
      const parsed = JSON.parse(json);
      const valid = credSchema.parse(parsed);
      setForm(valid);
      setError(null);
    } catch (e: any) {
      setError('Invalid JSON or missing fields');
    }
  }

  async function handleSave() {
    setError(null); setSuccess(null);
    try {
      credSchema.parse(form);
      if (editingId) {
        console.log('Would update site:', editingId, form);
        setSuccess('Site updated');
      } else {
        console.log('Would create site:', form);
        setSuccess('Site saved');
      }
      setForm({ name: '', host: '', username: '', password: '', rootPath: '/' });
      setEditingId(null);
      fetchSites();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function handleEdit(site: Site) {
    setForm(site);
    setEditingId(site.id!);
    setError(null);
    setSuccess(null);
  }

  async function handleDelete(id: string) {
    setError(null); setSuccess(null);
    try {
      console.log('Would delete site:', id);
      setSuccess('Site deleted');
      fetchSites();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', background: 'var(--ezedit-dark-blue)', borderRadius: 8, padding: 32, color: 'var(--ezedit-white)' }}>
      <h2>FTP Settings</h2>
      <div style={{ marginBottom: 16 }}>
        <input name="name" placeholder="Site Name" value={form.name} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
        <input name="host" placeholder="Host" value={form.host} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
        <input name="password" placeholder="Password" type="password" value={form.password} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
        <input name="rootPath" placeholder="Root Path" value={form.rootPath} onChange={handleChange} style={{ width: '100%', marginBottom: 8 }} />
        <button onClick={handleSave} style={{ background: 'var(--ezedit-blue)', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4, marginRight: 8 }}>{editingId ? 'Update' : 'Save'}</button>
        <button onClick={() => { setForm({ name: '', host: '', username: '', password: '', rootPath: '/' }); setEditingId(null); }} style={{ background: '#555', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4, marginRight: 8 }}>Clear</button>
        <button 
          onClick={() => {
            testConnection({
              host: form.host,
              username: form.username,
              password: form.password
            }).then(() => {
              setSuccess("Test connection successful");
            }).catch(err => {
              setError("Connection failed: " + err.message);
            });
          }} 
          style={{ background: 'var(--ezedit-light-blue)', color: '#222', padding: '8px 16px', border: 'none', borderRadius: 4 }}
        >
          Test Connection
        </button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <textarea placeholder="Paste JSON here" value={json} onChange={e => setJson(e.target.value)} style={{ width: '100%', minHeight: 60 }} />
        <button onClick={handleJsonPaste} style={{ background: 'var(--ezedit-light-blue)', color: '#222', padding: '6px 12px', border: 'none', borderRadius: 4, marginTop: 4 }}>Paste JSON</button>
      </div>
      {error && <div style={{ color: 'salmon', marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: 'lightgreen', marginBottom: 8 }}>{success}</div>}
      <h3>Saved Sites</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {sites.map(site => (
          <li key={site.id} style={{ background: '#222', borderRadius: 4, marginBottom: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{site.name} ({site.host})</span>
            <span>
              <button onClick={() => handleEdit(site)} style={{ marginRight: 8, background: 'var(--ezedit-blue)', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px' }}>Edit</button>
              <button onClick={() => handleDelete(site.id!)} style={{ background: 'crimson', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px' }}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
} 