import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { customerApi, employeeApi, serviceApi, siteApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { Card, Empty, Notice, PageHeader, Spinner, StatusBadge, fmtDate, useFetch } from '../components/ui';

const STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'HOLD', 'COMPLETED'];

// All numbers come from the list endpoints; nothing is hard-coded.
export default function Dashboard() {
  const load = useCallback(async () => {
    const [emp, cus, srv, site] = await Promise.allSettled([
      employeeApi.list(), customerApi.list(), serviceApi.list(), siteApi.list(),
    ]);
    const failures = [['Employees', emp], ['Customers', cus], ['Services', srv], ['Sites', site]]
      .filter(([, r]) => r.status === 'rejected')
      .map(([n, r]) => `${n}: ${errMsg(r.reason)}`);
    return {
      employees: emp.status === 'fulfilled' ? emp.value.employees || [] : null,
      customers: cus.status === 'fulfilled' ? new Set((cus.value.Customers || []).map((c) => c.customer_id)).size : null,
      services: srv.status === 'fulfilled' ? srv.value.services || [] : null,
      sites: site.status === 'fulfilled' ? (site.value.sites || []).length : null,
      failures,
    };
  }, []);
  const { data, loading, reload } = useFetch(load);

  if (loading && !data) return <Spinner />;
  if (!data) return null;

  const { employees, customers, services, sites, failures } = data;
  const count = (s) => (services ? services.filter((x) => x.status === s).length : '-');
  const max = services ? Math.max(1, ...STATUSES.map((s) => services.filter((x) => x.status === s).length)) : 1;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Live figures from the backend">
        <button className="btn btn-ghost" onClick={reload}>↻ Refresh</button>
      </PageHeader>
      {failures.length > 0 && <Notice type="error">Some figures could not be loaded — {failures.join(' | ')}</Notice>}

      <div className="stats">
        <div className="stat"><div className="stat-label">Employees</div><div className="stat-value">{employees ? employees.length : '-'}</div></div>
        <div className="stat"><div className="stat-label">Customers</div><div className="stat-value">{customers ?? '-'}</div></div>
        <div className="stat"><div className="stat-label">Total Services</div><div className="stat-value">{services ? services.length : '-'}</div></div>
        <div className="stat navy"><div className="stat-label">Pending</div><div className="stat-value">{count('PENDING')}</div></div>
        <div className="stat navy"><div className="stat-label">In Progress</div><div className="stat-value">{count('IN_PROGRESS')}</div></div>
        <div className="stat navy"><div className="stat-label">On Hold</div><div className="stat-value">{count('HOLD')}</div></div>
        <div className="stat navy"><div className="stat-label">Completed</div><div className="stat-value">{count('COMPLETED')}</div></div>
        <div className="stat"><div className="stat-label">Site Entries</div><div className="stat-value">{sites ?? '-'}</div></div>
      </div>

      <div className="form-grid" style={{ alignItems: 'start' }}>
        <Card title="Services by status">
          {!services || services.length === 0 ? <Empty>No services yet.</Empty> : STATUSES.map((s) => {
            const n = services.filter((x) => x.status === s).length;
            return (
              <div className="bar-row" key={s}>
                <StatusBadge status={s} />
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(n / max) * 100}%` }} /></div>
                <strong>{n}</strong>
              </div>
            );
          })}
        </Card>
        <Card title="Recent services" actions={<Link to="/services">View all</Link>}>
          {!services || services.length === 0 ? <Empty>No services yet.</Empty> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>#</th><th>Customer</th><th>Type</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {services.slice(0, 6).map((s) => (
                    <tr key={s.id}><td>{s.id}</td><td>{s.customer_name}</td><td>{s.service_type}</td><td><StatusBadge status={s.status} /></td><td>{fmtDate(s.created_at)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
