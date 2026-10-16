import { useState } from 'react';
import { authApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { Card, Empty, Field, Notice, PageHeader, fmtDateTime, useNotice } from '../components/ui';

const BLANK = { name: '', mobile_no: '', email: '', password: '', City: '', address: '', subscription_title: '' };
const FIELDS = [
  ['name', 'Name'], ['mobile_no', 'Mobile'], ['email', 'Email'], ['password', 'Password'],
  ['City', 'City'], ['address', 'Address'], ['subscription_title', 'Subscription title'],
];

// SuperAdmin only. Backend routes: POST /Junior_Admin/Junior_Admin_register and GET /Junior_Admin/junior_Admin/:id.
// There is no "list all junior admins" route, so admins are looked up by ID.
export default function JuniorAdmins() {
  const [f, setF] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [lookupId, setLookupId] = useState('');
  const [found, setFound] = useState(null);
  const { notice, show, clear } = useNotice();

  const create = async (ev) => {
    ev.preventDefault();
    clear();
    const missing = FIELDS.filter(([k]) => !String(f[k]).trim()).map(([, l]) => l);
    if (missing.length) { show('error', `Please fill: ${missing.join(', ')}`); return; }
    setSaving(true);
    try {
      const body = Object.fromEntries(FIELDS.map(([k]) => [k, k === 'password' ? f[k] : f[k].trim()]));
      const res = await authApi.registerJuniorAdmin(body);
      if (!res.success) throw new Error(res.message);
      show('success', `${res.message}. Log in as this admin with the email and password you set. (Their ID can be found by trying IDs below.)`);
      setF(BLANK);
    } catch (e) { show('error', e.response || e.request ? errMsg(e) : e.message); } finally { setSaving(false); }
  };

  const lookup = async (ev) => {
    ev.preventDefault();
    clear(); setFound(null);
    if (!(Number(lookupId) > 0)) { show('error', 'Enter a valid admin ID'); return; }
    try {
      const res = await authApi.getJuniorAdmin(lookupId);
      setFound(Array.isArray(res.result) ? res.result[0] : res.result);
    } catch (e) { show('error', errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Junior Admins" subtitle="SuperAdmin only" />
      <Notice type={notice?.type} onClose={clear}>{notice?.text}</Notice>
      <Card title="Register Junior Admin">
        <form onSubmit={create} noValidate>
          <div className="form-grid">
            {FIELDS.map(([k, label]) => (
              <Field key={k} label={`${label} *`}>
                <input className="input" type={k === 'password' ? 'password' : 'text'} autoComplete="off" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
              </Field>
            ))}
          </div>
          <div className="form-actions"><button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Register'}</button></div>
        </form>
      </Card>
      <Card title="Look up a Junior Admin by ID">
        <form onSubmit={lookup} className="toolbar">
          <Field label="Admin ID"><input className="input" type="number" min="1" value={lookupId} onChange={(e) => setLookupId(e.target.value)} /></Field>
          <button className="btn btn-navy">Find</button>
        </form>
        {found ? (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>ID</th><th>Name</th><th>Mobile</th><th>Email</th><th>City</th><th>Address</th><th>Subscription</th><th>Created</th></tr></thead>
            <tbody><tr><td>{found.id}</td><td>{found.name}</td><td>{found.mobile_no}</td><td>{found.email}</td><td>{found.City}</td><td>{found.address}</td><td>{found.subscription_title}</td><td>{fmtDateTime(found.created_at)}</td></tr></tbody>
          </table></div>
        ) : <Empty>Enter an ID to view details.</Empty>}
      </Card>
    </>
  );
}
