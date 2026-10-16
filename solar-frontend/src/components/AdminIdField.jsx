import { useState } from 'react';
import { authApi } from '../api/endpoints';
import { errMsg } from '../api/client';
import { Field } from './ui';

// SuperAdmin must pass admin_id (an existing Junior Admin) when creating employees/customers.
// The backend has no "list junior admins" route, so the id is typed and verified with
// GET /Junior_Admin/junior_Admin/:id. Junior admins never see this field (their id comes from the JWT).
export default function AdminIdField({ value, onChange, error }) {
  const [info, setInfo] = useState('');
  const [bad, setBad] = useState('');

  const verify = async () => {
    setInfo(''); setBad('');
    if (!value) return;
    try {
      const res = await authApi.getJuniorAdmin(value);
      const a = Array.isArray(res.result) ? res.result[0] : res.result;
      setInfo(a ? `Junior Admin: ${a.name} (${a.City || 'no city'})` : 'Found');
    } catch (e) {
      setBad(errMsg(e));
    }
  };

  return (
    <Field label="Junior Admin ID *" hint="Required for SuperAdmin. The record will belong to this Junior Admin." error={error || bad}>
      <input className="input" type="number" min="1" value={value} onChange={(e) => { setInfo(''); setBad(''); onChange(e.target.value); }} onBlur={verify} placeholder="e.g. 1" />
      {info && <span className="field-ok">{info}</span>}
    </Field>
  );
}
