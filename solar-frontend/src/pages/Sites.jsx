import { useState } from 'react';
import { customerApi, siteApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Card, Empty, Field, Notice, PageHeader, Spinner, useFetch, useNotice } from '../components/ui';

export default function Sites() {
  const { isSuper } = useAuth();
  const sites = useFetch(() => siteApi.list());
  const customers = useFetch(async () => {
    const res = await customerApi.list();
    const seen = new Map();
    (res.Customers || []).forEach((r) => { if (!seen.has(r.customer_id)) seen.set(r.customer_id, { id: r.customer_id, name: r.name }); });
    return [...seen.values()];
  });
  const [customerId, setCustomerId] = useState('');
  const [saving, setSaving] = useState(false);
  const { notice, show, clear } = useNotice();

  const add = async (ev) => {
    ev.preventDefault();
    clear();
    if (!customerId) { show('error', 'Select a customer'); return; }
    setSaving(true);
    try {
      const res = await siteApi.create(Number(customerId));
      if (!res.success) throw new Error(res.message);
      show('success', res.message || 'Site entry created.');
      setCustomerId('');
      sites.reload();
    } catch (e) { show('error', e.response || e.request ? errMsg(e) : e.message); } finally { setSaving(false); }
  };

  const rows = sites.data?.sites || [];

  return (
    <>
      <PageHeader title="Site Names" subtitle="Site entries linked to customers" />
      <Notice type={notice?.type} onClose={clear}>{notice?.text}</Notice>
      <Card title="Add site entry">
        <Notice type="info">The backend already creates a site entry automatically whenever a customer or an extra customer address is added. Use this only if you need an additional entry.</Notice>
        <form onSubmit={add} className="toolbar">
          <Field label="Customer">
            <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select customer</option>
              {(customers.data || []).map((c) => <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>)}
            </select>
          </Field>
          <button className="btn" disabled={saving}>{saving ? 'Adding…' : 'Add Site'}</button>
        </form>
      </Card>
      <Card title="All site entries" actions={<button className="btn btn-ghost btn-sm" onClick={sites.reload}>↻ Refresh</button>}>
        {sites.loading && !sites.data && <Spinner />}
        {sites.error && <Notice type="error">{sites.error}</Notice>}
        {!sites.loading && !sites.error && rows.length === 0 && <Empty>No site entries yet.</Empty>}
        {rows.length > 0 && (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Site ID</th><th>Customer ID</th><th>Customer</th>{isSuper && <th>Admin ID</th>}</tr></thead>
            <tbody>{rows.map((s) => <tr key={s.id}><td>{s.id}</td><td>{s.customer_id}</td><td>{s.customer_name}</td>{isSuper && <td>{s.admin_id}</td>}</tr>)}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
