import { useMemo, useState } from 'react';
import { employeeApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AdminIdField from '../components/AdminIdField';
import { Card, Empty, Field, Modal, Notice, PageHeader, Spinner, fmtDate, useFetch, useNotice } from '../components/ui';

// Same rules as the backend validateEmployee() in employecontroller.js
const MOBILE_RE = /^[0-9+\-\s]{7,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { name: '', mobile: '', email: '', designation: '', address: '', admin_id: '' };

function validate(f, isSuper, editing) {
  const e = {};
  if (!f.name.trim()) e.name = 'Name is required';
  if (!f.mobile.trim()) e.mobile = 'Mobile is required';
  else if (!MOBILE_RE.test(f.mobile.trim())) e.mobile = 'Mobile must be 7-15 digits (digits, +, -, space)';
  if (!f.email.trim()) e.email = 'Email is required';
  else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Email is not valid';
  if (!f.designation.trim()) e.designation = 'Designation is required';
  if (!f.address.trim()) e.address = 'Address is required';
  if (isSuper && !editing && !(Number(f.admin_id) > 0)) e.admin_id = 'Junior Admin ID is required';
  return e;
}

function EmployeeForm({ initial, editing, isSuper, onSaved, onCancel }) {
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    const errs = validate(f, isSuper, editing);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const body = {
      name: f.name.trim(), mobile: f.mobile.trim(), email: f.email.trim(),
      designation: f.designation.trim(), address: f.address.trim(),
    };
    setBusy(true);
    try {
      let res;
      if (editing) {
        res = await employeeApi.update(editing.id, body);
      } else {
        // Junior admin: backend takes admin_id from the JWT. SuperAdmin: must send it.
        if (isSuper) body.admin_id = Number(f.admin_id);
        res = await employeeApi.create(body);
      }
      if (!res.success) throw new Error(res.message || 'Request failed');
      onSaved(res);
    } catch (err) {
      setServerError(err.response || err.request ? errMsg(err) : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <Notice type="error">{serverError}</Notice>
      <div className="form-grid">
        <Field label="Full Name *" error={errors.name}><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="Mobile *" error={errors.mobile}><input className="input" value={f.mobile} onChange={set('mobile')} inputMode="tel" /></Field>
        <Field label="Email *" error={errors.email}><input className="input" type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Designation *" error={errors.designation}><input className="input" value={f.designation} onChange={set('designation')} placeholder="e.g. Technician" /></Field>
        <div className="full">
          <Field label="Address *" error={errors.address}><textarea className="input" value={f.address} onChange={set('address')} /></Field>
        </div>
        {isSuper && !editing && (
          <div className="full"><AdminIdField value={f.admin_id} onChange={(v) => setF((s) => ({ ...s, admin_id: v }))} error={errors.admin_id} /></div>
        )}
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : editing ? 'Update Employee' : 'Add Employee'}</button>
      </div>
    </form>
  );
}

export default function Employees() {
  const { isSuper } = useAuth();
  const { data, loading, error, reload } = useFetch(() => employeeApi.list());
  const { notice, show, clear } = useNotice();
  const [modal, setModal] = useState(null); // null | { editing? }
  const [q, setQ] = useState('');
  const [deleting, setDeleting] = useState(null);

  const employees = data?.employees || [];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return employees;
    return employees.filter((e) => [e.name, e.mobile, e.email, e.designation, e.address].some((v) => String(v || '').toLowerCase().includes(s)));
  }, [employees, q]);

  // After a successful create: re-fetch the list from the backend and confirm the new row is really there.
  const onSaved = async (res) => {
    const wasEdit = Boolean(modal?.editing);
    setModal(null);
    const fresh = await reload();
    if (wasEdit) {
      show('success', 'Employee updated successfully.');
    } else {
      const created = res.Employee;
      const found = created && fresh?.employees?.some((e) => e.id === created.id);
      show(found ? 'success' : 'warn',
        found
          ? `Employee "${created.name}" created (ID ${created.id}) and confirmed in the employee list.`
          : 'Backend reported success but the new employee was not found in the refreshed list. Please refresh the page.');
    }
  };

  const remove = async (emp) => {
    if (!window.confirm(`Delete employee "${emp.name}"?`)) return;
    setDeleting(emp.id);
    clear();
    try {
      const res = await employeeApi.remove(emp.id);
      if (!res.success) throw new Error(res.message);
      show('success', 'Employee deleted successfully.');
      await reload();
    } catch (e) {
      show('error', e.response || e.request ? errMsg(e) : e.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <PageHeader title="Employees" subtitle={`${employees.length} employee(s)`}>
        <button className="btn" onClick={() => { clear(); setModal({}); }}>+ Add Employee</button>
      </PageHeader>
      <Notice type={notice?.type} onClose={clear}>{notice?.text}</Notice>
      <Card>
        <div className="toolbar">
          <Field label="Search"><input className="input" placeholder="Name, mobile, email…" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
          <button className="btn btn-ghost" onClick={reload}>↻ Refresh</button>
        </div>
        {loading && !data && <Spinner />}
        {error && <Notice type="error">{error}</Notice>}
        {!loading && !error && filtered.length === 0 && <Empty>{employees.length ? 'No employees match your search.' : 'No employees yet. Click "Add Employee" to create one.'}</Empty>}
        {filtered.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Mobile</th><th>Email</th><th>Designation</th><th>Address</th>{isSuper && <th>Admin ID</th>}<th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td>{e.id}</td><td><strong>{e.name}</strong></td><td>{e.mobile}</td><td>{e.email}</td><td>{e.designation}</td><td>{e.address}</td>
                    {isSuper && <td>{e.admin_id}</td>}
                    <td>{fmtDate(e.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-sm btn-navy" onClick={() => { clear(); setModal({ editing: e }); }}>Edit</button>
                        <button className="btn btn-sm btn-danger" disabled={deleting === e.id} onClick={() => remove(e)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {modal && (
        <Modal title={modal.editing ? 'Edit Employee' : 'Add Employee'} onClose={() => setModal(null)}>
          <EmployeeForm
            initial={modal.editing ? { ...EMPTY, ...modal.editing, admin_id: '' } : EMPTY}
            editing={modal.editing}
            isSuper={isSuper}
            onSaved={onSaved}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </>
  );
}
