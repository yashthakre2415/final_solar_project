import { useMemo, useState } from 'react';
import { customerApi, serviceApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AdminIdField from '../components/AdminIdField';
import { Card, Empty, Field, Modal, Notice, PageHeader, Spinner, StatusBadge, fmtDate, useFetch, useNotice } from '../components/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const blankAddr = () => ({ address: '', latitude: '', longitude: '' });
const validCoord = (v) => String(v).trim() !== '' && !Number.isNaN(Number(v));

// GET /Customer/Customers returns one flat row per (customer, address); group them.
function groupCustomers(rows) {
  const map = new Map();
  rows.forEach((r) => {
    if (!map.has(r.customer_id)) {
      map.set(r.customer_id, { customer_id: r.customer_id, admin_id: r.admin_id, name: r.name, mobile: r.mobile, email: r.email, addresses: [] });
    }
    if (r.address_id) map.get(r.customer_id).addresses.push({ address_id: r.address_id, address: r.address, latitude: r.latitude, longitude: r.longitude });
  });
  return [...map.values()];
}

function CreateForm({ isSuper, onSaved, onCancel }) {
  const [f, setF] = useState({ name: '', mobile: '', email: '', admin_id: '' });
  const [addrs, setAddrs] = useState([blankAddr()]);
  const [errors, setErrors] = useState([]);
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setAddr = (i, k, v) => setAddrs((a) => a.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    const errs = [];
    if (!f.name.trim()) errs.push('Name is required');
    if (!f.mobile.trim()) errs.push('Mobile is required');
    if (!EMAIL_RE.test(f.email.trim())) errs.push('A valid email is required');
    addrs.forEach((a, i) => {
      if (!a.address.trim()) errs.push(`Address ${i + 1}: address text is required`);
      if (!validCoord(a.latitude) || !validCoord(a.longitude)) errs.push(`Address ${i + 1}: latitude and longitude must be numbers`);
    });
    if (isSuper && !(Number(f.admin_id) > 0)) errs.push('Junior Admin ID is required');
    setErrors(errs);
    if (errs.length) return;

    const body = {
      name: f.name.trim(), mobile: f.mobile.trim(), email: f.email.trim(),
      addresses: addrs.map((a) => ({ address: a.address.trim(), latitude: Number(a.latitude), longitude: Number(a.longitude) })),
    };
    if (isSuper) body.admin_id = Number(f.admin_id);
    setBusy(true);
    try {
      const res = await customerApi.create(body);
      if (!res.success) throw new Error(res.message);
      onSaved(res);
    } catch (e) {
      setServerError(e.response || e.request ? errMsg(e) : e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <Notice type="error">{serverError}</Notice>
      {errors.length > 0 && <Notice type="error">{errors.map((e) => <div key={e}>{e}</div>)}</Notice>}
      <div className="form-grid">
        <Field label="Customer Name *"><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="Mobile *"><input className="input" value={f.mobile} onChange={set('mobile')} /></Field>
        <div className="full"><Field label="Email *"><input className="input" type="email" value={f.email} onChange={set('email')} /></Field></div>
        {isSuper && <div className="full"><AdminIdField value={f.admin_id} onChange={(v) => setF((s) => ({ ...s, admin_id: v }))} /></div>}
      </div>
      <h2 style={{ margin: '4px 0 10px' }}>Addresses</h2>
      {addrs.map((a, i) => (
        <div key={i} className="card" style={{ background: '#fafbfe', padding: 12 }}>
          <Field label={`Address ${i + 1} *`}><input className="input" value={a.address} onChange={(e) => setAddr(i, 'address', e.target.value)} /></Field>
          <div className="form-grid">
            <Field label="Latitude *"><input className="input" value={a.latitude} onChange={(e) => setAddr(i, 'latitude', e.target.value)} placeholder="e.g. 23.2599" /></Field>
            <Field label="Longitude *"><input className="input" value={a.longitude} onChange={(e) => setAddr(i, 'longitude', e.target.value)} placeholder="e.g. 77.4126" /></Field>
          </div>
          {addrs.length > 1 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAddrs((x) => x.filter((_, j) => j !== i))}>Remove address</button>}
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddrs((a) => [...a, blankAddr()])}>+ Add another address</button>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Create Customer'}</button>
      </div>
    </form>
  );
}

function EditForm({ customer, onSaved, onCancel }) {
  const [f, setF] = useState({ name: customer.name, mobile: customer.mobile, email: customer.email });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (ev) => {
    ev.preventDefault();
    if (!f.name.trim() || !f.mobile.trim() || !f.email.trim()) { setErr('Name, mobile and email are required'); return; }
    setBusy(true); setErr('');
    try {
      const res = await customerApi.update(customer.customer_id, { name: f.name.trim(), mobile: f.mobile.trim(), email: f.email.trim() });
      if (!res.success) throw new Error(res.message);
      onSaved();
    } catch (e) { setErr(e.response || e.request ? errMsg(e) : e.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} noValidate>
      <Notice type="error">{err}</Notice>
      <Field label="Name *"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Mobile *"><input className="input" value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></Field>
      <Field label="Email *"><input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Update Customer'}</button>
      </div>
    </form>
  );
}

function Details({ customer, onChanged }) {
  const [addr, setAddr] = useState(blankAddr());
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  // 404 "No history" is a normal empty state for this endpoint.
  const hist = useFetch(async () => {
    try { return (await serviceApi.historyByCustomer(customer.customer_id)).History || []; } catch (e) {
      if (e.response?.status === 404) return [];
      throw e;
    }
  }, [customer.customer_id]);

  const addAddress = async (ev) => {
    ev.preventDefault();
    setMsg(null);
    if (!addr.address.trim() || !validCoord(addr.latitude) || !validCoord(addr.longitude)) {
      setMsg({ type: 'error', text: 'Address, numeric latitude and numeric longitude are required' });
      return;
    }
    setBusy(true);
    try {
      const res = await customerApi.addAddress(customer.customer_id, { address: addr.address.trim(), latitude: Number(addr.latitude), longitude: Number(addr.longitude) });
      if (!res.success) throw new Error(res.message);
      setAddr(blankAddr());
      setMsg({ type: 'success', text: 'Address added.' });
      onChanged();
    } catch (e) { setMsg({ type: 'error', text: e.response || e.request ? errMsg(e) : e.message }); } finally { setBusy(false); }
  };

  return (
    <>
      <p><strong>{customer.name}</strong> · {customer.mobile} · {customer.email}</p>
      <h2 style={{ margin: '12px 0 8px' }}>Addresses</h2>
      {customer.addresses.length === 0 ? <Empty>No addresses.</Empty> : (
        <table className="table"><thead><tr><th>Address</th><th>Latitude</th><th>Longitude</th></tr></thead>
          <tbody>{customer.addresses.map((a) => (
            <tr key={a.address_id}><td>{a.address}</td><td>{a.latitude}</td><td>{a.longitude}</td></tr>
          ))}</tbody></table>
      )}
      <form onSubmit={addAddress} style={{ marginTop: 12 }} noValidate>
        <Notice type={msg?.type}>{msg?.text}</Notice>
        <div className="toolbar">
          <Field label="New address"><input className="input" value={addr.address} onChange={(e) => setAddr({ ...addr, address: e.target.value })} /></Field>
          <Field label="Latitude"><input className="input" value={addr.latitude} onChange={(e) => setAddr({ ...addr, latitude: e.target.value })} /></Field>
          <Field label="Longitude"><input className="input" value={addr.longitude} onChange={(e) => setAddr({ ...addr, longitude: e.target.value })} /></Field>
          <button className="btn btn-sm" disabled={busy}>Add Address</button>
        </div>
      </form>
      <h2 style={{ margin: '16px 0 8px' }}>Service history</h2>
      {hist.loading ? <Spinner /> : hist.error ? <Notice type="error">{hist.error}</Notice> : (hist.data || []).length === 0 ? <Empty>No services for this customer yet.</Empty> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>#</th><th>Type</th><th>Problem</th><th>Status</th><th>Employee</th><th>Created</th><th>Completed</th></tr></thead>
          <tbody>{hist.data.map((s) => (
            <tr key={s.id}><td>{s.id}</td><td>{s.service_type}</td><td>{s.problem || '-'}{s.hold_reason ? ` (hold: ${s.hold_reason})` : ''}</td><td><StatusBadge status={s.status} /></td><td>{s.employee_name || '-'}</td><td>{fmtDate(s.created_at)}</td><td>{fmtDate(s.completed_at)}</td></tr>
          ))}</tbody></table></div>
      )}
    </>
  );
}

export default function Customers() {
  const { isSuper } = useAuth();
  const { data, loading, error, reload } = useFetch(() => customerApi.list());
  const { notice, show, clear } = useNotice();
  const [modal, setModal] = useState(null); // { type: 'create' | 'edit' | 'details', customer? }
  const [q, setQ] = useState('');

  const customers = useMemo(() => groupCustomers(data?.Customers || []), [data]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? customers.filter((c) => [c.name, c.mobile, c.email].some((v) => String(v || '').toLowerCase().includes(s))) : customers;
  }, [customers, q]);
  // keep the open details modal in sync after reload
  const liveCustomer = modal?.customer && customers.find((c) => c.customer_id === modal.customer.customer_id);

  const remove = async (c) => {
    if (!window.confirm(`Delete customer "${c.name}" and their addresses?`)) return;
    clear();
    try {
      const res = await customerApi.remove(c.customer_id);
      if (!res.success) throw new Error(res.message);
      show('success', 'Customer deleted successfully.');
      reload();
    } catch (e) { show('error', e.response || e.request ? errMsg(e) : e.message); }
  };

  return (
    <>
      <PageHeader title="Customers" subtitle={`${customers.length} customer(s)`}>
        <button className="btn" onClick={() => { clear(); setModal({ type: 'create' }); }}>+ Add Customer</button>
      </PageHeader>
      <Notice type={notice?.type} onClose={clear}>{notice?.text}</Notice>
      <Card>
        <div className="toolbar">
          <Field label="Search"><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, mobile, email…" /></Field>
          <button className="btn btn-ghost" onClick={reload}>↻ Refresh</button>
        </div>
        {loading && !data && <Spinner />}
        {error && <Notice type="error">{error}</Notice>}
        {!loading && !error && filtered.length === 0 && <Empty>No customers found.</Empty>}
        {filtered.length > 0 && (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>ID</th><th>Name</th><th>Mobile</th><th>Email</th><th>Addresses</th>{isSuper && <th>Admin ID</th>}<th>Actions</th></tr></thead>
            <tbody>{filtered.map((c) => (
              <tr key={c.customer_id}>
                <td>{c.customer_id}</td><td><strong>{c.name}</strong></td><td>{c.mobile}</td><td>{c.email}</td>
                <td>{c.addresses.length === 0 ? '-' : c.addresses.map((a) => <div key={a.address_id}>{a.address}</div>)}</td>
                {isSuper && <td>{c.admin_id}</td>}
                <td><div className="row-actions">
                  <button className="btn btn-sm btn-navy" onClick={() => setModal({ type: 'details', customer: c })}>Details</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setModal({ type: 'edit', customer: c })}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(c)}>Delete</button>
                </div></td>
              </tr>
            ))}</tbody></table></div>
        )}
      </Card>

      {modal?.type === 'create' && (
        <Modal title="Add Customer" wide onClose={() => setModal(null)}>
          <CreateForm isSuper={isSuper} onCancel={() => setModal(null)} onSaved={(res) => {
            setModal(null);
            show('success', `Customer created (ID ${res.customer_id}) with ${res.addresses_added} address(es) and ${res.sites_added} site entr${res.sites_added === 1 ? 'y' : 'ies'}.`);
            reload();
          }} />
        </Modal>
      )}
      {modal?.type === 'edit' && (
        <Modal title="Edit Customer" onClose={() => setModal(null)}>
          <EditForm customer={modal.customer} onCancel={() => setModal(null)} onSaved={() => { setModal(null); show('success', 'Customer updated successfully.'); reload(); }} />
        </Modal>
      )}
      {modal?.type === 'details' && (
        <Modal title="Customer Details" wide onClose={() => setModal(null)}>
          {liveCustomer ? <Details customer={liveCustomer} onChanged={reload} /> : <Empty>Customer no longer exists.</Empty>}
        </Modal>
      )}
    </>
  );
}
