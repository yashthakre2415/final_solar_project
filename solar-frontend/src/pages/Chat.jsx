import { useEffect, useRef, useState } from 'react';
import { chatApi } from '../api/endpoints';
import { assetUrl, errMsg } from '../api/client';
import { Card, Empty, Field, Notice, PageHeader, Spinner, fmtDateTime, useFetch, useNotice } from '../components/ui';

const MAX_BYTES = 5 * 1024 * 1024; // backend multer limit
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Backend limitation: there is no "list groups" endpoint. Support groups are created when a customer
// opens chat, and staff must supply the group_id to read/write it.
export default function Chat() {
  const info = useFetch(() => chatApi.userInfo());
  const me = info.data?.loggedInUser;
  const [groupInput, setGroupInput] = useState('');
  const [groupId, setGroupId] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [auto, setAuto] = useState(true);
  const fileRef = useRef(null);
  const boxRef = useRef(null);
  const { notice, show, clear } = useNotice();

  const load = async (gid = groupId, quiet = false) => {
    if (!gid) return;
    if (!quiet) setLoading(true);
    try {
      const res = await chatApi.history(gid);
      setMessages(res.messages || []);
    } catch (e) {
      if (!quiet) { setMessages([]); show('error', errMsg(e)); }
    } finally { if (!quiet) setLoading(false); }
  };

  useEffect(() => {
    if (!groupId || !auto) return undefined;
    const t = setInterval(() => load(groupId, true), 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, auto]);

  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [messages]);

  const openGroup = (ev) => {
    ev.preventDefault();
    clear();
    const n = Number(groupInput);
    if (!Number.isInteger(n) || n <= 0) { show('error', 'Enter a valid group ID (positive number)'); return; }
    setGroupId(String(n));
    load(String(n));
  };

  const sendText = async (ev) => {
    ev.preventDefault();
    if (!groupId) { show('error', 'Open a group first'); return; }
    if (!text.trim()) return;
    setSending(true); clear();
    try {
      const res = await chatApi.send({ group_id: Number(groupId), type: 'text', message: text.trim() });
      if (!res.success) throw new Error(res.message);
      setText('');
      await load(groupId, true);
    } catch (e) { show('error', e.response || e.request ? errMsg(e) : e.message); } finally { setSending(false); }
  };

  const sendImage = async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    if (!groupId) { show('error', 'Open a group first'); return; }
    if (!ALLOWED.includes(file.type)) { show('error', 'Only JPG, PNG, WEBP and GIF images are allowed'); return; }
    if (file.size > MAX_BYTES) { show('error', 'Image size cannot exceed 5 MB'); return; }
    setSending(true); clear();
    try {
      const up = await chatApi.uploadImage(file);
      if (!up.success || !up.imageUrl) throw new Error(up.message || 'Upload failed');
      const res = await chatApi.send({ group_id: Number(groupId), type: 'image', imageUrl: up.imageUrl });
      if (!res.success) throw new Error(res.message);
      await load(groupId, true);
    } catch (e) { show('error', e.response || e.request ? errMsg(e) : e.message); } finally { setSending(false); }
  };

  const remove = async (m) => {
    if (!window.confirm('Delete this message?')) return;
    clear();
    try {
      const res = await chatApi.remove(m.id);
      if (!res.success) throw new Error(res.message);
      setMessages((x) => x.filter((y) => y.id !== m.id));
    } catch (e) { show('error', e.response || e.request ? errMsg(e) : e.message); }
  };

  const markSeen = async (m) => {
    try {
      const res = await chatApi.markSeen(m.id);
      if (!res.success) throw new Error(res.message);
      setMessages((x) => x.map((y) => (y.id === m.id ? { ...y, my_status: 'seen' } : y)));
    } catch (e) { show('error', e.response || e.request ? errMsg(e) : e.message); }
  };

  const isMine = (m) => me && Number(m.sender_id) === Number(me.id) && m.sender_role === me.role;

  return (
    <>
      <PageHeader title="Chat" subtitle="Customer support groups" />
      <Notice type={notice?.type} onClose={clear}>{notice?.text}</Notice>
      {info.error && <Notice type="error">{info.error}</Notice>}
      <Card title="Open a support group">
        <Notice type="info">The backend has no endpoint that lists support groups, so enter the group ID. A group is created when a customer first opens support chat.</Notice>
        <form onSubmit={openGroup} className="toolbar">
          <Field label="Group ID"><input className="input" type="number" min="1" value={groupInput} onChange={(e) => setGroupInput(e.target.value)} /></Field>
          <button className="btn">Open</button>
          {groupId && <button type="button" className="btn btn-ghost" onClick={() => load()}>↻ Refresh</button>}
          {groupId && <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto-refresh (8s)</label>}
        </form>
        {info.data && <p className="muted">Logged in as {me?.role} #{me?.id} · {(info.data.employees || []).length} staff member(s) in the support directory</p>}
      </Card>

      {groupId && (
        <Card title={`Group #${groupId}`}>
          {loading && <Spinner />}
          <div className="chat-box" ref={boxRef}>
            {!loading && messages.length === 0 && <Empty>No messages yet.</Empty>}
            {messages.map((m) => (
              <div key={m.id} className={`bubble ${isMine(m) ? 'mine' : ''}`}>
                {m.type === 'image' && m.imageUrl
                  ? <a href={assetUrl(m.imageUrl)} target="_blank" rel="noreferrer"><img src={assetUrl(m.imageUrl)} alt="Chat upload" /></a>
                  : <div>{m.message}</div>}
                <div className="bubble-meta">
                  <span>{m.sender_role} #{m.sender_id}</span><span>{fmtDateTime(m.created_at)}</span>
                  {isMine(m)
                    ? <button type="button" className="link-btn" onClick={() => remove(m)}>Delete</button>
                    : m.my_status === 'unread' && <button type="button" className="link-btn" onClick={() => markSeen(m)}>Mark seen</button>}
                </div>
              </div>
            ))}
          </div>
          <form className="chat-send" onSubmit={sendText}>
            <input className="input" placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} />
            <input ref={fileRef} type="file" accept={ALLOWED.join(',')} hidden onChange={sendImage} />
            <button type="button" className="btn btn-ghost" disabled={sending} onClick={() => fileRef.current?.click()}>📎 Image</button>
            <button className="btn" disabled={sending || !text.trim()}>Send</button>
          </form>
        </Card>
      )}
    </>
  );
}
