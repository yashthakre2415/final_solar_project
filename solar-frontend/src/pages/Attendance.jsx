import { useState } from 'react';
import { attendanceApi, employeeApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { Card, Empty, EmployeeSelect, Field, Notice, PageHeader, Spinner, StatusBadge, fmtDate, useFetch, useNotice } from '../components/ui';

// Allowed by the backend CreateAttendance()
const STATUSES = ['present', 'paid_leave', 'unpaid_leave', 'half_day', 'absent'];
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

export default function Attendance() {
  const emps = useFetch(() => employeeApi.list());
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState('present');
  const [saving, setSaving] = useState(false);
  const { notice, show, clear } = useNotice();

  const ready = Boolean(employeeId);
  const list = useFetch(() => attendanceApi.list(employeeId, month, year), [employeeId, month, year], { skip: !ready });
  const summary = useFetch(() => attendanceApi.summary(employeeId, month, year), [employeeId, month, year], { skip: !ready });

  const mark = async (ev) => {
    ev.preventDefault();
    clear();
    if (!ready) { show('error', 'Select an employee first'); return; }
    setSaving(true);
    try {
      const res = await attendanceApi.mark({ employee_id: Number(employeeId), attendance_date: date, status });
      if (!res.success) throw new Error(res.message);
      show('success', res.message);
      // jump to the month that was just edited so the saved row is visible
      const [y, m] = date.split('-').map(Number);
      if (y !== year || m !== month) { setYear(y); setMonth(m); } else { list.reload(); summary.reload(); }
    } catch (e) { show('error', e.response || e.request ? errMsg(e) : e.message); } finally { setSaving(false); }
  };

  const s = summary.data?.summary;

  return (
    <>
      <PageHeader title="Attendance" subtitle="Mark and review employee attendance" />
      <Notice type={notice?.type} onClose={clear}>{notice?.text}</Notice>
      {emps.error && <Notice type="error">{emps.error}</Notice>}

      <Card title="Mark attendance">
        <form onSubmit={mark} className="toolbar">
          <Field label="Employee"><EmployeeSelect employees={emps.data?.employees} value={employeeId} onChange={setEmployeeId} /></Field>
          <Field label="Date"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></Field>
          <Field label="Status">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((x) => <option key={x} value={x}>{x.replace(/_/g, ' ')}</option>)}
            </select>
          </Field>
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </form>
      </Card>

      <Card title="Monthly record">
        <div className="toolbar">
          <Field label="Month">
            <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('en', { month: 'long' })}</option>)}
            </select>
          </Field>
          <Field label="Year"><input className="input" type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} /></Field>
        </div>
        {!ready && <Empty>Select an employee to see attendance.</Empty>}
        {ready && (list.loading || summary.loading) && <Spinner />}
        {ready && list.error && <Notice type="error">{list.error}</Notice>}
        {ready && s && (
          <div className="stats">
            <div className="stat"><div className="stat-label">Marked days</div><div className="stat-value">{s.totalDays ?? 0}</div></div>
            <div className="stat navy"><div className="stat-label">Present</div><div className="stat-value">{s.presentCount ?? 0}</div></div>
            <div className="stat navy"><div className="stat-label">Paid leave</div><div className="stat-value">{s.paidLeaveCount ?? 0}</div></div>
            <div className="stat navy"><div className="stat-label">Unpaid leave</div><div className="stat-value">{s.unpaidLeaveCount ?? 0}</div></div>
            <div className="stat navy"><div className="stat-label">Half day</div><div className="stat-value">{s.halfDayCount ?? 0}</div></div>
            <div className="stat navy"><div className="stat-label">Absent</div><div className="stat-value">{s.absentCount ?? 0}</div></div>
          </div>
        )}
        {ready && !list.loading && !list.error && (list.data?.records || []).length === 0 && <Empty>No attendance marked for this month.</Empty>}
        {(list.data?.records || []).length > 0 && (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Date</th><th>Status</th></tr></thead>
            <tbody>{list.data.records.map((r) => <tr key={r.id}><td>{fmtDate(r.attendance_date)}</td><td><StatusBadge status={r.status} /></td></tr>)}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
