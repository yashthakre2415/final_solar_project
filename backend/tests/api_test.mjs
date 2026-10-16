const B='http://localhost:3100'; let pass=0, fail=0;
const call=async(m,p,body,tok)=>{const r=await fetch(B+p,{method:m,headers:{'Content-Type':'application/json',...(tok?{Authorization:'Bearer '+tok}:{})},body:body?JSON.stringify(body):undefined});let j=null;try{j=await r.json()}catch{} return {s:r.status,j}};
const ok=(name,cond,extra='')=>{cond?pass++:fail++;console.log((cond?'PASS ':'FAIL ')+name+(cond?'':'  -> '+extra))};
let r;
r=await call('POST','/SuperAdmin/setup-first-superadmin',{name:'Root',email:'root@x.com',password:'pw',setupKey:'wrong'});ok('setup key wrong -> 403',r.s===403,r.s);
r=await call('POST','/SuperAdmin/setup-first-superadmin',{name:'Root',email:'root@x.com',password:'pw',setupKey:'setupkey'});ok('first superadmin -> 201',r.s===201,JSON.stringify(r));
r=await call('POST','/SuperAdmin/SuperAdmin_Login',{email:'root@x.com',password:'pw'});ok('superadmin login',r.s===200&&r.j.token);const SA=r.j.token;
r=await call('POST','/SuperAdmin/SuperAdmin_Login',{email:'root@x.com',password:'bad'});ok('superadmin bad password rejected',r.s>=400,r.s);
const mk=async(n)=>{const r=await call('POST','/Junior_Admin/Junior_Admin_register',{name:n,mobile_no:'9999999999',email:n+'@x.com',password:'pw',City:'Pune',address:'a',subscription_title:'basic'},SA);return r};
r=await mk('ja1');ok('register junior admin 1',r.s===201,JSON.stringify(r));await mk('ja2');
r=await call('POST','/Junior_Admin/junior_Admin_Login',{email:'ja1@x.com',password:'pw'});ok('junior admin login',r.s===200&&r.j.token);const J1=r.j.token,J1id=r.j.JuniorAdmin.id;
r=await call('POST','/Junior_Admin/junior_Admin_Login',{email:'ja2@x.com',password:'pw'});const J2=r.j.token;
r=await call('POST','/Junior_Admin/junior_Admin_Login',{email:'ja1@x.com',password:'nope'});ok('junior login wrong password -> 401',r.s===401,r.s);
r=await call('GET','/Junior_Admin/junior_Admin/1',null,SA);ok('GET junior admin by id (super)',r.s===200,r.s);
r=await call('GET','/Junior_Admin/junior_Admin/999',null,SA);ok('GET junior admin missing -> 404',r.s===404,r.s);
r=await call('GET','/Junior_Admin/junior_Admin/1',null,J1);ok('junior cannot read admin details -> 403',r.s===403,r.s);

// ---- Employees (priority) ----
const emp={name:'Ravi',mobile:'9876543210',email:'ravi@x.com',designation:'Technician',address:'Pune'};
r=await call('POST','/Employe/Employe_create',emp);ok('employee create w/o token -> 401',r.s===401,r.s);
r=await call('POST','/Employe/Employe_create',{...emp,name:''},J1);ok('employee create missing name -> 400',r.s===400,r.s);
r=await call('POST','/Employe/Employe_create',{...emp,email:'bad'},J1);ok('employee create bad email -> 400',r.s===400,r.s);
r=await call('POST','/Employe/Employe_create',{...emp,admin_id:2},J1);ok('employee create (junior) -> 201',r.s===201&&r.j.Employee.id,JSON.stringify(r));
ok('admin_id forced from token, body admin_id ignored',r.j.Employee.admin_id===J1id,JSON.stringify(r.j));const E1=r.j.Employee.id;
r=await call('POST','/Employe/Employe_create',emp,SA);ok('superadmin w/o admin_id -> 400',r.s===400,r.s);
r=await call('POST','/Employe/Employe_create',{...emp,admin_id:9999},SA);ok('superadmin bad admin_id -> 400',r.s===400,r.s);
r=await call('POST','/Employe/Employe_create',{...emp,name:'Sita',admin_id:J1id},SA);ok('superadmin create with admin_id -> 201',r.s===201,JSON.stringify(r));
r=await call('POST','/Employe/Employe_create',{...emp,name:'Other'},J2);const E2=r.j.Employee.id;
r=await call('GET','/Employe/Employees',null,J1);ok('junior1 sees only own employees (2)',r.s===200&&r.j.employees.length===2,JSON.stringify(r.j));
r=await call('GET','/Employe/Employees',null,J2);ok('junior2 sees only own (1)',r.j.employees.length===1);
r=await call('GET','/Employe/Employees',null,SA);ok('superadmin sees all (3)',r.j.employees.length===3);
r=await call('GET','/Employe/Employees/'+E2,null,J1);ok("junior1 cannot read junior2's employee -> 404",r.s===404,r.s);
r=await call('PUT','/Employe/Employees/'+E1,{...emp,designation:'Lead'},J1);ok('employee update -> 200',r.s===200,JSON.stringify(r));
r=await call('GET','/Employe/Employees/'+E1,null,J1);ok('update persisted',r.j.employee.designation==='Lead');
r=await call('PUT','/Employe/Employees/'+E2,emp,J1);ok("junior1 cannot update junior2's employee -> 404",r.s===404,r.s);
r=await call('PUT','/Employe/Employees/99999',emp,J1);ok('update missing -> 404',r.s===404,r.s);
r=await call('DELETE','/Employe/Employees/'+E2,null,J1);ok("junior1 cannot delete junior2's employee -> 404",r.s===404,r.s);
r=await call('DELETE','/Employe/Employees/99999',null,J1);ok('delete missing -> 404',r.s===404,r.s);
r=await call('GET','/Employe/Employees',null,'garbage');ok('invalid token -> 401',r.s===401,r.s);

// ---- Customers ----
const cust={name:'Cust A',mobile:'9000000001',email:'c@x.com',addresses:[{address:'Addr 1',latitude:18.52,longitude:73.85}]};
r=await call('POST','/Customer/Customer_Create',{...cust,addresses:[]},J1);ok('customer create no addresses -> 400',r.s===400,r.s);
r=await call('POST','/Customer/Customer_Create',{...cust,admin_id:2},J1);ok('customer create -> 201 w/ token admin',r.s===201&&r.j.admin_id===J1id,JSON.stringify(r));const C1=r.j.customer_id;
r=await call('POST','/Customer/Customer_Create',cust,J2);const C2=r.j.customer_id;
r=await call('GET','/Customer/Customers',null,J1);ok('customer list scoped',r.s===200&&r.j.Customers.every(x=>x.admin_id===J1id)&&r.j.Customers.length===1,JSON.stringify(r.j));
r=await call('GET','/Customer/Customers/'+C2,null,J1);ok('cross-admin customer -> 404',r.s===404,r.s);
r=await call('POST',`/Customer/Customers/${C1}/addresses`,{address:'Addr 2',latitude:19,longitude:74},J1);ok('add address -> 201',r.s===201,JSON.stringify(r));
r=await call('POST',`/Customer/Customers/${C2}/addresses`,{address:'x',latitude:19,longitude:74},J1);ok('add address to other admin customer -> 404',r.s===404,r.s);
r=await call('GET','/Customer/Customers/'+C1,null,J1);ok('customer has 2 addresses',r.j.customer.length===2,JSON.stringify(r.j));
r=await call('PUT','/Customer/Customers/'+C1,{name:'Cust A2',mobile:'9000000001',email:'c@x.com'},J1);ok('customer update -> 200',r.s===200,JSON.stringify(r));
r=await call('PUT','/Customer/Customers/'+C2,{name:'h',mobile:'1',email:'e'},J1);ok('cross-admin customer update -> 404',r.s===404,r.s);
r=await call('GET','/Site/sitenames',null,J1);ok('site names list (2 sites for customer1)',r.s===200&&r.j.sites.length===2,JSON.stringify(r.j));
r=await call('POST','/Site/sitename',{customer_id:C1},J1);ok('site create -> 201',r.s===201,JSON.stringify(r));
r=await call('POST','/Site/sitename',{customer_id:C2},J1);ok('site create other admin customer -> 404',r.s===404,r.s);

// ---- Services ----
r=await call('POST','/Service/service_create',{customer_id:C1,service_type:'Installation',problem:'panel'},J1);ok('service create -> 201',r.s===201,JSON.stringify(r));const S1=r.j.service.id;
r=await call('POST','/Service/service_create',{customer_id:C2,service_type:'x'},J1);ok('service for other admin customer -> 404',r.s===404,r.s);
r=await call('PUT',`/Service/services/${S1}/Start`,null,J1);ok('start before assign -> 409',r.s===409,JSON.stringify(r));
r=await call('PUT',`/Service/services/${S1}/Assign`,{employee_id:E2},J1);ok('assign other admin employee -> 404',r.s===404,r.s);
r=await call('PUT',`/Service/services/${S1}/Assign`,{employee_id:E1},J1);ok('assign -> 200',r.s===200,JSON.stringify(r));
r=await call('PUT',`/Service/services/${S1}/Hold`,{hold_reason:'x'},J1);ok('hold before start -> 409',r.s===409,r.s);
r=await call('PUT',`/Service/services/${S1}/Start`,null,J1);ok('start -> 200',r.s===200);
r=await call('PUT',`/Service/services/${S1}/Hold`,{},J1);ok('hold without reason -> 400',r.s===400,r.s);
r=await call('PUT',`/Service/services/${S1}/Hold`,{hold_reason:'Different problem found'},J1);ok('hold -> 200',r.s===200);
r=await call('GET','/Service/services/'+S1,null,J1);ok('hold persisted w/ reason',r.j.service.status==='HOLD'&&r.j.service.hold_reason==='Different problem found'&&r.j.service.employee_name==='Ravi',JSON.stringify(r.j));
r=await call('PUT',`/Service/services/${S1}/Complete`,null,J1);ok('complete while on hold -> 409',r.s===409,r.s);
r=await call('PUT',`/Service/services/${S1}/Resume`,null,J1);ok('resume -> 200',r.s===200);
r=await call('PUT',`/Service/services/${S1}/Complete`,null,J1);ok('complete -> 200',r.s===200);
r=await call('GET','/Service/services/'+S1,null,J1);ok('completed w/ timestamp, hold_reason cleared',r.j.service.status==='COMPLETED'&&r.j.service.completed_at&&r.j.service.hold_reason===null,JSON.stringify(r.j));
r=await call('GET','/Service/services',null,J2);ok("junior2 sees none of junior1's services",r.s===200&&r.j.services.length===0);
r=await call('GET','/Service/services/'+S1,null,J2);ok('cross-admin service -> 404',r.s===404,r.s);
r=await call('PUT',`/Service/services/${S1}/Start`,null,J2);ok('cross-admin transition -> 404',r.s===404,r.s);
r=await call('GET',`/Service/services/${C1}/History`,null,J1);ok('customer history',r.s===200&&r.j.History.length===1);
r=await call('GET',`/Service/services/${C1}/History`,null,J2);ok('customer history cross-admin -> 404',r.s===404,r.s);
r=await call('DELETE','/Employe/Employees/'+E1,null,J1);ok('delete employee referenced by service -> 409',r.s===409,JSON.stringify(r));

// ---- Attendance / salary / location ----
r=await call('POST','/Hr/attendance',{employee_id:E1,attendance_date:'2026-10-01',status:'present'},J1);ok('attendance create -> 201',r.s===201,JSON.stringify(r));
r=await call('POST','/Hr/attendance',{employee_id:E1,attendance_date:'2026-10-01',status:'absent'},J1);ok('attendance same day -> update 200',r.s===200,JSON.stringify(r));
r=await call('POST','/Hr/attendance',{employee_id:E1,attendance_date:'bad',status:'present'},J1);ok('attendance bad date -> 400',r.s===400,r.s);
r=await call('POST','/Hr/attendance',{employee_id:E2,attendance_date:'2026-10-01',status:'present'},J1);ok('attendance other admin employee -> 404',r.s===404,r.s);
r=await call('GET',`/Hr/attendance/${E1}?month=10&year=2026`,null,J1);ok('attendance list',r.s===200&&r.j.records.length===1&&r.j.records[0].status==='absent',JSON.stringify(r.j));
r=await call('GET',`/Hr/attendance/${E1}/summary?month=10&year=2026`,null,J1);ok('attendance summary',r.s===200&&Number(r.j.summary.absentCount)===1,JSON.stringify(r.j));
r=await call('PUT',`/Hr/salary/${E1}`,{monthlySalary:30000},J1);ok('salary set -> 200',r.s===200,JSON.stringify(r));
r=await call('PUT',`/Hr/salary/${E1}`,{monthlySalary:32000},J1);r=await call('GET',`/Hr/salary/${E1}`,null,J1);ok('salary upsert',r.s===200,JSON.stringify(r.j));
r=await call('GET',`/Hr/salary/${E2}`,null,J1);ok('salary other admin employee -> 404',r.s===404,r.s);
r=await call('POST','/Livelocation/live-user',{employee_id:E1,latitude:18.5,longitude:73.8},J1);ok('location record -> 201',r.s===201,JSON.stringify(r));
r=await call('GET','/Livelocation/live-user/'+E1,null,J1);ok('latest location',r.s===200);
r=await call('GET','/Livelocation/live-user/history/'+E1,null,J1);ok('location history',r.s===200&&r.j.history.length===1);
r=await call('GET','/Livelocation/live-user/'+E2,null,J1);ok('location other admin -> 404',r.s===404,r.s);
r=await call('GET','/nope',null,J1);ok('unknown route JSON 404',r.s===404&&r.j.success===false);
// CORS
const c=await fetch(B+'/health',{headers:{Origin:'http://localhost:5173'}});ok('CORS allows :5173',c.headers.get('access-control-allow-origin')==='http://localhost:5173');
const c2=await fetch(B+'/health',{headers:{Origin:'http://evil.com'}});ok('CORS blocks other origin',c2.status===403,c2.status);
// delete works
r=await call('DELETE','/Employe/Employees/'+E2,null,J2);ok('delete own employee -> 200',r.s===200,JSON.stringify(r));
r=await call('DELETE','/Customer/Customers/'+C2,null,J2);ok('delete own customer -> 200',r.s===200,JSON.stringify(r));
console.log(`\n${pass} passed, ${fail} failed`);
