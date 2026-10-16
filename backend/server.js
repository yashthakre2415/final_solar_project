const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const router = require('./src/router/Superadminrouter');
const router1 = require('./src/router/customerrouter');
const router2 = require('./src/router/Adminrouter');
const routerEmploye = require('./src/router/Employerouter');
const routerService = require('./src/router/Servicerouter');
const liverouter = require('./src/router/Liverouter');
const Attendencerouter = require('./src/router/attendancerouter');
const salaryrouter = require('./src/router/salaryrouter');
const expencerouter = require('./src/router/expenserouter');
const salarysliprouter = require('./src/router/SalarySliprouter');
const boardouter = require('./src/router/weeklyleaderboardrouter');
const officerouter = require('./src/router/officeexpenserouter');
const chatrouter = require('./src/router/chatrouter');
const routersite = require('./src/router/siteNameRoutes');


app.use(express.json());
// Allowed browser origins (comma separated in .env). Default: Vite dev server.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
    origin: (origin, cb) => (!origin || allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error('Origin not allowed by CORS'))),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 3000;

app.use('/SuperAdmin',router);
app.use('/Customer',router1);
app.use('/Junior_Admin',router2);
app.use('/Employe',routerEmploye);
app.use('/Service',routerService);
app.use('/Livelocation',liverouter);
app.use('/Hr',Attendencerouter);
app.use('/Hr',salaryrouter);
app.use('/Hr',expencerouter);
app.use('/Hr',salarysliprouter);
app.use('/Hr',boardouter);
app.use('/admin',officerouter);
app.use('/admin',chatrouter);
app.use(
    '/uploads',
    express.static(path.join(__dirname, 'src', 'uploads'))
);

app.use('/Site',routersite);

app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));

// Unknown route / unhandled error handlers (JSON, never HTML)
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
    if (err && err.message === 'Origin not allowed by CORS') {
        return res.status(403).json({ success: false, message: err.message });
    }
    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, message: 'Invalid JSON body' });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT,()=>{
    console.log(`server is running on ${PORT}`);
})