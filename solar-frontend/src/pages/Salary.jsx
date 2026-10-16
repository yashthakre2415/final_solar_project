import { useState } from 'react';
import { employeeApi, salaryApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { Card, Empty, EmployeeSelect, Field, Notice, PageHeader, Spinner, fmtDateTime, fmtMoney, useFetch, useNotice } from '../components/ui';

const now = new Date();

export default function Salary() {
  const emps = useFetch(() => employeeApi.list());
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [saving, setSaving] = useState(false);
  const { notice, show, clear } = useNotice();
  const ready = Boolean(employeeId);

  // GET /Hr/salary/:id answers 404 "Salary not found" when no salary has been set - treat as empty, not error.
  const salary = useFetch(async () => {
    try { return (await salaryApi.get(employeeId)).salary; } catch (e) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  }, [employeeId], { skip: !ready });

  const calc = useFetch(async () => {
    const res = await salaryApi.calculate(employeeId, month, year);
    // backend returns [] (not 404) when the employee has no salary row
    return Array.isArray(res.salary) ? null : res.salary;
  }, [employeeId, month, year], { skip: !ready });

  const save = async (ev) => {
    ev.preventDefault();
    clear();
    const n = Number(amount);
    if (!ready) { show('error', 'Select an employee first'); return; }
    if (amount === '' || Number.isNaN(n) || n < 0) { show('error', 'Enter a valid, non-negative monthly salary'); return; }
    setSaving(true);
    try {
      const res = await salaryApi.set(employeeId, n);
      if (!res.success) throw new Error(res.message);
      show('success', 'Monthly salary saved.');
      setAmount('');
      salary.reload(); calc.reload();
    } catch (e) { show('error', e.response || e.request ? errMsg(e) : e.message); } finally { setSaving(false); }
  };

  const c = calc.data;

  return (
    <>
      <PageHeader title="Employee Salary" subtitle="Set monthly salary and calculate payable amount from attendance" />
      <Notice type={notice?.type} onClose={clear}>{notice?.text}</Notice>
      {emps.error && <Notice type="error">{emps.error}</Notice>}
      <Card title="Salary record">
        <div className="toolbar">
          <Field label="Employee"><EmployeeSelect employees={emps.data?.employees} value={employeeId} onChange={setEmployeeId} /></Field>
        </div>
        {!ready && <Empty>Select an employee.</Empty>}
        {ready && salary.loading && <Spinner />}
        {ready && salary.error && <Notice type="error">{salary.error}</Notice>}
        {ready && !salary.loading && !salary.error && (
          salary.data
            ? <p>Current monthly salary: <strong>{fmtMoney(salary.data.monthly_salary)}</strong> <span className="muted">· updated {fmtDateTime(salary.data.updated_at)}</span></p>
            : <Notice type="warn">No salary has been set for this employee yet.</Notice>
        )}
        {ready && (
          <form onSubmit={save} className="toolbar">
            <Field label="Monthly salary (₹)"><input className="input" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
            <button className="btn" disabled={saving}>{saving ? 'Saving…' : salary.data ? 'Update Salary' : 'Set Salary'}</button>
          </form>
        )}
      </Card>

      <Card title="Calculate salary">
        <div className="toolbar">
          <Field label="Month">
            <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('en', { month: 'long' })}</option>)}
            </select>
          </Field>
          <Field label="Year"><input className="input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></Field>
        </div>
        {!ready && <Empty>Select an employee.</Empty>}
        {ready && calc.loading && <Spinner />}
        {ready && calc.error && <Notice type="error">{calc.error}</Notice>}
        {ready && !calc.loading && !calc.error && !c && <Empty>Cannot calculate: set a monthly salary first.</Empty>}
        {c && (
          <>
            <div className="stats">
              <div className="stat"><div className="stat-label">Days in month</div><div className="stat-value">{c.totalDays}</div></div>
              <div className="stat navy"><div className="stat-label">Per day</div><div className="stat-value">{fmtMoney(c.perDay)}</div></div>
              <div className="stat navy"><div className="stat-label">Present</div><div className="stat-value">{c.presentCount}</div></div>
              <div className="stat navy"><div className="stat-label">Paid leave</div><div className="stat-value">{c.paidLeaveCount}</div></div>
              <div className="stat navy"><div className="stat-label">Half day</div><div className="stat-value">{c.halfDayCount}</div></div>
              <div className="stat navy"><div className="stat-label">Unpaid leave</div><div className="stat-value">{c.unpaidLeaveCount}</div></div>
              <div className="stat navy"><div className="stat-label">Absent</div><div className="stat-value">{c.absentCount}</div></div>
              <div className="stat"><div className="stat-label">Final salary</div><div className="stat-value">{fmtMoney(c.finalSalary)}</div></div>
            </div>
            <p className="muted">Earned base {fmtMoney(c.earnedBase)} + approved expenses {fmtMoney(c.totalApprovedExpenses)} (as returned by the backend).</p>
          </>
        )}
      </Card>
    </>
  );
}
