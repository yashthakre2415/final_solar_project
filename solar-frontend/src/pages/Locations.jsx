import { useState } from 'react';
import { employeeApi, locationApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { Card, Empty, EmployeeSelect, Field, Notice, PageHeader, Spinner, fmtDateTime, useFetch, useNotice } from '../components/ui';

const mapLink = (lat, lng) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

// The backend only STORES location updates (POST) and reads the latest / history. There is no live
// push channel, so this page shows the last stored point - it does not claim real-time tracking.
export default function Locations() {
  const emps = useFetch(() => employeeApi.list());
  const [employeeId, setEmployeeId] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [saving, setSaving] = useState(false);
  const { notice, show, clear } = useNotice();
  const ready = Boolean(employeeId);

  const current = useFetch(async () => {
    try { return (await locationApi.current(employeeId)).location; } catch (e) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  }, [employeeId], { skip: !ready });
  const history = useFetch(async () => {
    try { return (await locationApi.history(employeeId)).history || []; } catch (e) {
      if (e.response?.status === 404) return [];
      throw e;
    }
  }, [employeeId], { skip: !ready });

  const record = async (ev) => {
    ev.preventDefault();
    clear();
    if (!ready) { show('error', 'Select an employee first'); return; }
    if (lat === '' || lng === '' || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) { show('error', 'Latitude and longitude must be numbers'); return; }
    setSaving(true);
    try {
      const res = await locationApi.record({ employee_id: Number(employeeId), latitude: Number(lat), longitude: Number(lng) });
      if (!res.success) throw new Error(res.message);
      show('success', 'Location update stored.');
      current.reload(); history.reload();
    } catch (e) { show('error', e.response || e.request ? errMsg(e) : e.message); } finally { setSaving(false); }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { show('error', 'Geolocation is not supported by this browser'); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setLat(p.coords.latitude.toFixed(6)); setLng(p.coords.longitude.toFixed(6)); },
      (e) => show('error', `Could not read your location: ${e.message}`),
    );
  };

  const cur = current.data;

  return (
    <>
      <PageHeader title="Employee Locations" subtitle="Last stored location and location history (stored updates, not live tracking)" />
      <Notice type={notice?.type} onClose={clear}>{notice?.text}</Notice>
      {emps.error && <Notice type="error">{emps.error}</Notice>}
      <Card title="Employee">
        <div className="toolbar">
          <Field label="Employee"><EmployeeSelect employees={emps.data?.employees} value={employeeId} onChange={setEmployeeId} /></Field>
        </div>
        {!ready && <Empty>Select an employee.</Empty>}
        {ready && current.loading && <Spinner />}
        {ready && current.error && <Notice type="error">{current.error}</Notice>}
        {ready && !current.loading && !current.error && !cur && <Notice type="warn">No location has been stored for this employee yet.</Notice>}
        {cur && (
          <p>Last stored location: <strong>{cur.latitude}, {cur.longitude}</strong> <span className="muted">· {fmtDateTime(cur.created_at)}</span>{' '}
            <a href={mapLink(cur.latitude, cur.longitude)} target="_blank" rel="noreferrer">Open map ↗</a></p>
        )}
      </Card>

      {ready && (
        <Card title="Store a location update">
          <form onSubmit={record} className="toolbar">
            <Field label="Latitude"><input className="input" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="23.2599" /></Field>
            <Field label="Longitude"><input className="input" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="77.4126" /></Field>
            <button type="button" className="btn btn-ghost" onClick={useMyLocation}>Use my location</button>
            <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save Location'}</button>
          </form>
        </Card>
      )}

      {ready && (
        <Card title="Location history">
          {history.loading && <Spinner />}
          {history.error && <Notice type="error">{history.error}</Notice>}
          {!history.loading && !history.error && (history.data || []).length === 0 && <Empty>No location history.</Empty>}
          {(history.data || []).length > 0 && (
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Time</th><th>Latitude</th><th>Longitude</th><th>Map</th></tr></thead>
              <tbody>{history.data.map((h, i) => (
                <tr key={`${h.created_at}-${i}`}><td>{fmtDateTime(h.created_at)}</td><td>{h.latitude}</td><td>{h.longitude}</td><td><a href={mapLink(h.latitude, h.longitude)} target="_blank" rel="noreferrer">Open ↗</a></td></tr>
              ))}</tbody></table></div>
          )}
        </Card>
      )}
    </>
  );
}
