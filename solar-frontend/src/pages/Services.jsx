import { useMemo, useState } from 'react';
import { customerApi, employeeApi, serviceApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { Card, Empty, Field, Modal, Notice, PageHeader, Spinner, StatusBadge, fmtDate, fmtDateTime, useFetch, useNotice } from '../components/ui';

const FILTERS = ['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'HOLD', 'COMPLETED'];

function CreateForm({ customers, onSaved, onCancel }) {
  const [f, setF] = useState({ customer_id: '', service_type: '', problem: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (ev) => {
    ev.preventDefault();
    if (!f.customer_id || !f.service_type.trim()) { setErr('Customer and service type are required'); return; }
    setBusy(true); setErr('');
    try {
      const body = { customer_id: Number(f.customer_id), service_type: f.service_type.trim() };
      if (f.problem.trim()) body.problem = f.problem.trim();
      const res = await serviceApi.create(body);
      if (!res.success) throw new Error(res.message);
      onSaved(res);
    } catch (e) { setErr(e.response || e.request ? errMsg(e) : e.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} noValidate>
      <Notice type="error">{err}</Notice>
      <Field label="Customer *">
        <select className="input" value={f.customer_id} onChange={(e) => setF({ ...f, customer_id: e.target.value })}>
          <option value="">Select customer</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>)}
        </select>
      </Field>
      <Field label="Service Type *"><input className="input" value={f.service_type} onChange={(e) => setF({ ...f, service_type: e.target.value })} placeholder="e.g. Panel cleaning, Installation" /></Field>
      <Field label="Problem"><textarea className="input" value={f.problem} onChange={(e) => setF({ ...f, problem: e.target.value })} /></Field>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create Service'}</button>
      </div>
    </form>
  );
}

function AssignForm({ service, employees, onSaved, onCancel }) {
  const [emp, setEmp] = useState(service.employee_id ? String(service.employee_id) : '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  // Backend rule: the employee must belong to the same admin as the customer.
  const options = employees.filter((e) => e.admin_id === service.admin_id);
  const submit = async (ev) => {
    ev.preventDefault();
    if (!emp) { setErr('Select an employee'); return; }
    setBusy(true); setErr('');
    try {
      const res = await serviceApi.assign(service.id, Number(emp));
      if (!res.success) throw new Error(res.message);
      onSaved();
    } catch (e) { setErr(e.response || e.request ? errMsg(e) : e.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} noValidate>
      <p className="muted">Service #{service.id} · {service.customer_name} · {service.service_type}</p>
      <Notice type="error">{err}</Notice>
      <Field label="Employee *" hint="Only employees of the same Junior Admin as this customer can be assigned.">
        <select className="input" value={emp} onChange={(e) => setEmp(e.target.value)}>
          <option value="">Select employee</option>
          {options.map((e) => <option key={e.id} value={e.id}>{e.name} (#{e.id})</option>)}
        </select>
      </Field>
      {options.length === 0 && <Notice type="warn">No employees exist for this customer's admin. Add an employee first.</Notice>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Assigning…' : 'Assign'}</button>
      </div>
    </form>
  );
}

function HoldForm({ service, onSaved, onCancel }) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (ev) => {
    ev.preventDefault();
    if (!reason.trim()) { setErr('Hold reason is required'); return; }
    setBusy(true); setErr('');
    try {
      const res = await serviceApi.hold(service.id, reason.trim());
      if (!res.success) throw new Error(res.message);
      onSaved();
    } catch (e) { setErr(e.response || e.request ? errMsg(e) : e.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} noValidate>
      <Notice type="error">{err}</Notice>
      <Field label="Hold reason *"><textarea className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" disabled={busy}>{busy ? 'Saving…' : 'Put on Hold'}</button>
      </div>
    </form>
  );
}

export default function Services() {
  const services = useFetch(() => serviceApi.list());
  const lookups = useFetch(async () => {
    const [c, e] = await Promise.all([customerApi.list(), employeeApi.list()]);
    const seen = new Map();
    (c.Customers || []).forEach((r) => { if (!seen.has(r.customer_id)) seen.set(r.customer_id, { id: r.customer_id, name: r.name, admin_id: r.admin_id }); });
    return { customers: [...seen.values()], employees: e.employees || [] };
  });
  const { notice, show, clear } = useNotice();
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [busyId, setBusyId] = useState(null);

  const rows = services.data?.services || [];
  const filtered = useMemo(() => (filter === 'ALL' ? rows : rows.filter((s) => s.status === filter)), [rows, filter]);

  const act = async (service, fn, okMsg) => {
    setBusyId(service.id); clear();
    try {
      const res = await fn(service.id);
      if (!res.success) throw new Error(res.message);
      show('success', okMsg);
      await services.reload();
    } catch (e) { show('error', e.response || e.request ? errMsg(e) : e.message); } finally { setBusyId(null); }
  };
  const done = (msg) => { setModal(null); show('success', msg); services.reload(); };

  return (
    <>
      <PageHeader title="Services" subtitle={`${rows.length} service(s)`}>
        <button className="btn" onClick={() => { clear(); setModal({ type: 'create' }); }}>+ New Service</button>
      </PageHeader>
      <Notice type={notice?.type} onClose={clear}>{notice?.text}</Notice>
      <Card>
        <div className="toolbar">
          <Field label="Status">
            <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
              {FILTERS.map((f) => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
            </select>
          </Field>
          <button className="btn btn-ghost" onClick={services.reload}>↻ Refresh</button>
        </div>
        {services.loading && !services.data && <Spinner />}
        {services.error && <Notice type="error">{services.error}</Notice>}
        {lookups.error && <Notice type="warn">Customer/employee lists could not be loaded: {lookups.error}</Notice>}
        {!services.loading && !services.error && filtered.length === 0 && <Empty>No services found.</Empty>}
        {filtered.length > 0 && (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>#</th><th>Customer</th><th>Type</th><th>Problem</th><th>Status</th><th>Employee</th><th>Created</th><th>Completed</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td><td>{s.customer_name}</td><td>{s.service_type}</td>
                <td>{s.problem || '-'}{s.hold_reason && <div className="muted">Hold: {s.hold_reason}</div>}</td>
                <td><StatusBadge status={s.status} /></td><td>{s.employee_name || '-'}</td>
                <td>{fmtDateTime(s.created_at)}</td><td>{s.completed_at ? fmtDateTime(s.completed_at) : '-'}</td>
                <td><div className="row-actions">
                  {(s.status === 'PENDING' || s.status === 'ASSIGNED') && <button className="btn btn-sm btn-navy" onClick={() => setModal({ type: 'assign', service: s })}>{s.status === 'PENDING' ? 'Assign' : 'Re-assign'}</button>}
                  {s.status === 'ASSIGNED' && <button className="btn btn-sm" disabled={busyId === s.id} onClick={() => act(s, serviceApi.start, 'Service started.')}>Start</button>}
                  {s.status === 'IN_PROGRESS' && <button className="btn btn-sm btn-ghost" onClick={() => setModal({ type: 'hold', service: s })}>Hold</button>}
                  {s.status === 'IN_PROGRESS' && <button className="btn btn-sm" disabled={busyId === s.id} onClick={() => act(s, serviceApi.complete, 'Service completed.')}>Complete</button>}
                  {s.status === 'HOLD' && <button className="btn btn-sm" disabled={busyId === s.id} onClick={() => act(s, serviceApi.resume, 'Service resumed.')}>Resume</button>}
                  {s.status === 'COMPLETED' && <span className="muted">{fmtDate(s.completed_at)}</span>}
                </div></td>
              </tr>
            ))}</tbody></table></div>
        )}
      </Card>

      {modal?.type === 'create' && (
        <Modal title="New Service" onClose={() => setModal(null)}>
          {lookups.loading ? <Spinner /> : <CreateForm customers={lookups.data?.customers || []} onCancel={() => setModal(null)} onSaved={(res) => done(`Service #${res.service.id} created (PENDING).`)} />}
        </Modal>
      )}
      {modal?.type === 'assign' && (
        <Modal title="Assign Employee" onClose={() => setModal(null)}>
          <AssignForm service={modal.service} employees={lookups.data?.employees || []} onCancel={() => setModal(null)} onSaved={() => done('Employee assigned successfully.')} />
        </Modal>
      )}
      {modal?.type === 'hold' && (
        <Modal title={`Hold Service #${modal.service.id}`} onClose={() => setModal(null)}>
          <HoldForm service={modal.service} onCancel={() => setModal(null)} onSaved={() => done('Service put on hold.')} />
        </Modal>
      )}
    </>
  );
}
