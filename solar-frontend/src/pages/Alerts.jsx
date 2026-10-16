import { useState } from 'react';
import { chatApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { Card, Empty, Field, Notice, PageHeader, fmtDateTime, useNotice } from '../components/ui';

// Backend only exposes POST /admin/alert-all (create). There is no endpoint to list past alerts,
// so the table below shows just the alerts successfully sent during this browser session.
export default function Alerts() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState([]);
  const { notice, show, clear } = useNotice();

  const submit = async (ev) => {
    ev.preventDefault();
    clear();
    if (!title.trim() || !message.trim()) { show('error', 'Title and message are required'); return; }
    setSending(true);
    try {
      const res = await chatApi.alertAll(title.trim(), message.trim());
      if (!res.success) throw new Error(res.message);
      setSent((s) => [{ id: res.alert_id, title: title.trim(), message: message.trim(), at: new Date().toISOString() }, ...s]);
      setTitle(''); setMessage('');
      show('success', `Alert saved (ID ${res.alert_id}).`);
    } catch (e) { show('error', e.response || e.request ? errMsg(e) : e.message); } finally { setSending(false); }
  };

  return (
    <>
      <PageHeader title="Alerts" subtitle="Create an alert for all users" />
      <Notice type={notice?.type} onClose={clear}>{notice?.text}</Notice>
      <Card title="New alert">
        <form onSubmit={submit} noValidate>
          <Field label="Title *"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Message *"><textarea className="input" value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
          <div className="form-actions"><button className="btn" disabled={sending}>{sending ? 'Sending…' : 'Send Alert'}</button></div>
        </form>
      </Card>
      <Card title="Sent in this session">
        {sent.length === 0 ? <Empty>No alerts sent yet in this session.</Empty> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>ID</th><th>Title</th><th>Message</th><th>Sent</th></tr></thead>
            <tbody>{sent.map((a) => <tr key={a.id}><td>{a.id}</td><td>{a.title}</td><td>{a.message}</td><td>{fmtDateTime(a.at)}</td></tr>)}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
