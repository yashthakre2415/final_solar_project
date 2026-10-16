// Every call below maps 1:1 to a route in the provided backend (server.js + src/router/*).
import api from './client';

const data = (p) => p.then((r) => r.data);

export const authApi = {
  superAdminLogin: (email, password) =>
    data(api.post('/SuperAdmin/SuperAdmin_Login', { email, password }, { skipAuthRedirect: true })),
  juniorAdminLogin: (email, password) =>
    data(api.post('/Junior_Admin/junior_Admin_Login', { email, password }, { skipAuthRedirect: true })),
  registerJuniorAdmin: (body) => data(api.post('/Junior_Admin/Junior_Admin_register', body)),
  getJuniorAdmin: (id) => data(api.get(`/Junior_Admin/junior_Admin/${id}`)),
};

export const employeeApi = {
  create: (body) => data(api.post('/Employe/Employe_create', body)),
  list: () => data(api.get('/Employe/Employees')),
  get: (id) => data(api.get(`/Employe/Employees/${id}`)),
  update: (id, body) => data(api.put(`/Employe/Employees/${id}`, body)),
  remove: (id) => data(api.delete(`/Employe/Employees/${id}`)),
};

export const customerApi = {
  create: (body) => data(api.post('/Customer/Customer_Create', body)),
  list: () => data(api.get('/Customer/Customers')),
  get: (id) => data(api.get(`/Customer/Customers/${id}`)),
  update: (id, body) => data(api.put(`/Customer/Customers/${id}`, body)),
  addAddress: (id, body) => data(api.post(`/Customer/Customers/${id}/addresses`, body)),
  remove: (id) => data(api.delete(`/Customer/Customers/${id}`)),
};

export const serviceApi = {
  create: (body) => data(api.post('/Service/service_create', body)),
  list: () => data(api.get('/Service/services')),
  get: (id) => data(api.get(`/Service/services/${id}`)),
  assign: (id, employee_id) => data(api.put(`/Service/services/${id}/Assign`, { employee_id })),
  start: (id) => data(api.put(`/Service/services/${id}/Start`)),
  hold: (id, hold_reason) => data(api.put(`/Service/services/${id}/Hold`, { hold_reason })),
  resume: (id) => data(api.put(`/Service/services/${id}/Resume`)),
  complete: (id) => data(api.put(`/Service/services/${id}/Complete`)),
  // NOTE: the :id here is a CUSTOMER id (backend naming).
  historyByCustomer: (customerId) => data(api.get(`/Service/services/${customerId}/History`)),
};

export const attendanceApi = {
  mark: (body) => data(api.post('/Hr/attendance', body)),
  list: (employeeId, month, year) => data(api.get(`/Hr/attendance/${employeeId}`, { params: { month, year } })),
  summary: (employeeId, month, year) => data(api.get(`/Hr/attendance/${employeeId}/summary`, { params: { month, year } })),
};

export const salaryApi = {
  set: (employeeId, monthlySalary) => data(api.put(`/Hr/salary/${employeeId}`, { monthlySalary })),
  get: (employeeId) => data(api.get(`/Hr/salary/${employeeId}`)),
  calculate: (employeeId, month, year) => data(api.get(`/Hr/salary/${employeeId}/calculate`, { params: { month, year } })),
};

export const locationApi = {
  record: (body) => data(api.post('/Livelocation/live-user', body)),
  current: (employeeId) => data(api.get(`/Livelocation/live-user/${employeeId}`)),
  history: (employeeId) => data(api.get(`/Livelocation/live-user/history/${employeeId}`)),
};

export const siteApi = {
  create: (customer_id) => data(api.post('/Site/sitename', { customer_id })),
  list: () => data(api.get('/Site/sitenames')),
};

export const chatApi = {
  userInfo: () => data(api.get('/admin/user-info')),
  history: (group_id) => data(api.get('/admin/user-chat/history', { params: { group_id } })),
  // multipart field name must be "image"
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return data(api.post('/admin/chat-upload-image', fd));
  },
  send: (body) => data(api.post('/admin/chat-message', body)),
  markSeen: (id) => data(api.patch(`/admin/messages/${id}/seen`)),
  remove: (id) => data(api.delete(`/admin/messages/${id}`)),
  alertAll: (title, message) => data(api.post('/admin/alert-all', { title, message })),
};
