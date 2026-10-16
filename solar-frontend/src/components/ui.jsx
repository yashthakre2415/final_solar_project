import { useCallback, useEffect, useRef, useState } from 'react';
import { errMsg } from '../api/client';

/* ---------- data fetching hook ---------- */
// Runs `fn` on mount and whenever `deps` change. `reload()` refetches.
export function useFetch(fn, deps = [], { skip = false } = {}) {
  const [state, setState] = useState({ data: null, loading: !skip, error: '' });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const seq = useRef(0);

  const run = useCallback(async () => {
    const my = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await fnRef.current();
      if (my === seq.current) setState({ data, loading: false, error: '' });
      return data;
    } catch (e) {
      if (my === seq.current) setState({ data: null, loading: false, error: errMsg(e), status: e.response?.status });
      return null;
    }
  }, []);

  useEffect(() => {
    if (!skip) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, ...deps]);

  return { ...state, reload: run };
}

/* ---------- formatting ---------- */
const pad = (n) => String(n).padStart(2, '0');

// MySQL DATE columns are serialised by mysql2 as JS Dates -> ISO strings. Read them in local time.
export function fmtDate(v) {
  if (!v) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fmtDateTime(v) {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return `${fmtDate(v)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const fmtMoney = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/* ---------- small components ---------- */
export function Notice({ type = 'info', children, onClose }) {
  if (!children) return null;
  return (
    <div className={`notice notice-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onClose && <button type="button" className="notice-x" onClick={onClose} aria-label="Dismiss">×</button>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return <div className="spinner-row"><span className="spinner" /> {label}</div>;
}

export function Empty({ children = 'No records found.' }) {
  return <div className="empty">{children}</div>;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      <div className="page-actions">{children}</div>
    </div>
  );
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          <h2>{title}</h2>
          <div className="card-actions">{actions}</div>
        </div>
      )}
      {children}
    </section>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

const STATUS_CLASS = {
  PENDING: 'warn', ASSIGNED: 'info', IN_PROGRESS: 'orange', HOLD: 'danger', COMPLETED: 'ok',
  present: 'ok', paid_leave: 'info', unpaid_leave: 'warn', half_day: 'orange', absent: 'danger',
};

export function StatusBadge({ status }) {
  return <span className={`badge badge-${STATUS_CLASS[status] || 'info'}`}>{String(status || '-').replace(/_/g, ' ')}</span>;
}

export function EmployeeSelect({ employees, value, onChange, placeholder = 'Select employee', ...rest }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      <option value="">{placeholder}</option>
      {(employees || []).map((e) => (
        <option key={e.id} value={e.id}>{e.name} (#{e.id}{e.designation ? ` · ${e.designation}` : ''})</option>
      ))}
    </select>
  );
}

export function useNotice() {
  const [notice, setNotice] = useState(null);
  const show = useCallback((type, text) => setNotice({ type, text }), []);
  const clear = useCallback(() => setNotice(null), []);
  return { notice, show, clear };
}
