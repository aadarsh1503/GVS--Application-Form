const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
const fs = require('fs');

// File download/view route
app.get('/uploads/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }

    if (req.query.download === 'true') {
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).send('Error downloading file');
        }
      });
    } else {
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('File send error:', err);
          res.status(500).send('Error loading file');
        }
      });
    }
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).send('Server error');
  }
});

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to MySQL');
});

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Signup
app.post('/admin/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const hashedPassword = await bcrypt.hash(password, 10);
  db.query('INSERT INTO admin_users (email, password) VALUES (?, ?)', [email, hashedPassword], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'User already exists' });
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.status(201).json({ message: 'Admin user registered' });
  });
});

// Login
app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM admin_users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'your_secret', { expiresIn: '1h' });
    res.json({ token });
  });
});

// Multer config for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

app.get('/admin/form-entries', (req, res) => {
  let baseQuery = 'SELECT * FROM form_entries';
  const conditions = [];
  const values = [];

  // Search term (name, email, skills)
  if (req.query.searchTerm) {
    conditions.push('(fullName LIKE ? OR email LIKE ? OR skills LIKE ?)');
    values.push(`%${req.query.searchTerm}%`, `%${req.query.searchTerm}%`, `%${req.query.searchTerm}%`);
  }

  // Email filter
  if (req.query.email) {
    conditions.push('email LIKE ?');
    values.push(`%${req.query.email}%`);
  }

  // Nationality filter
  if (req.query.nationality) {
    conditions.push('LOWER(nationality) LIKE LOWER(?)');
    values.push(`%${req.query.nationality}%`);
  }

  // 🛑 currentlyEmployed filtering removed

  // Education level
  if (req.query.educationLevel) {
    conditions.push('educationLevel = ?');
    values.push(req.query.educationLevel);
  }

  // Visa status
  if (req.query.visaStatus) {
    if (req.query.visaStatus === 'Expired') {
      conditions.push('(passportValidity IS NOT NULL AND passportValidity < CURRENT_DATE)');
    } else if (req.query.visaStatus === 'Valid') {
      conditions.push('(passportValidity IS NOT NULL AND passportValidity >= CURRENT_DATE)');
    } else if (req.query.visaStatus === 'None') {
      conditions.push('passportValidity IS NULL');
    }
  }

  // Date range filtering (unchanged)
  if (req.query.dateRange && req.query.dateRange !== 'all') {
    switch (req.query.dateRange) {
      case 'today':
        conditions.push('DATE(submittedAt) = CURRENT_DATE');
        break;
      case '24h':
        conditions.push('submittedAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)');
        break;
      case '7d':
        conditions.push('submittedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
        break;
      case '30d':
        conditions.push('submittedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
        break;
      case '1y':
        conditions.push('submittedAt >= DATE_SUB(NOW(), INTERVAL 1 YEAR)');
        break;
      case 'custom':
        if (req.query.customStart) {
          conditions.push('submittedAt >= ?');
          values.push(new Date(req.query.customStart).toISOString().slice(0, 19).replace('T', ' '));
        }
        if (req.query.customEnd) {
          conditions.push('submittedAt <= ?');
          values.push(new Date(req.query.customEnd).toISOString().slice(0, 19).replace('T', ' '));
        }
        break;
    }
  }

  baseQuery += conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
  baseQuery += ' ORDER BY submittedAt DESC';

  db.query(baseQuery, values, (err, results) => {
    if (err) {
      console.error('Error fetching form entries:', err);
      return res.status(500).send('Error retrieving data');
    }

    const processedResults = results.map(entry => ({
      ...entry,
      currentlyEmployed: entry.currentlyEmployed,
      visaStatus: entry.visaStatus || null
    }));

    res.status(200).json(processedResults);
  });
});


// Route to handle form submission with file upload
app.post('/submit-form', upload.single('file'), (req, res) => {
  console.log('--- Form submission received ---');

  const data = req.body;
  const file = req.file;

  console.log('Received form data:', data);
  if (file) {
    console.log('Uploaded file info:', {
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
    });
  } else {
    console.log('No file uploaded.');
  }

  const sql = `
    INSERT INTO form_entries (
      email, fullName, dateOfBirth, nationality, mobileContact, whatsapp, currentAddress,
      cprNationalId, passportId, passportValidity, educationLevel, courseDegree, currentlyEmployed,
      employmentDesired, availableStart, shiftAvailable, canTravel, drivingLicense, skills,
      ref1Name, ref1Contact, ref1Email, ref2Name, ref2Contact, ref2Email, ref3Name, ref3Contact, ref3Email,
      visaStatus, visaValidity, expectedSalary, clientLeadsStrategy, resumeFile
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.email, data.fullName, data.dateOfBirth, data.nationality, data.mobileContact, data.whatsapp, data.currentAddress,
    data.cprNationalId, data.passportId, data.passportValidity, data.educationLevel, data.courseDegree, data.currentlyEmployed,
    data.employmentDesired, data.availableStart, data.shiftAvailable, data.canTravel, data.drivingLicense, data.skills,
    data.ref1Name, data.ref1Contact, data.ref1Email, data.ref2Name, data.ref2Contact, data.ref2Email,
    data.ref3Name, data.ref3Contact, data.ref3Email,
    data.visaStatus, data.visaValidity, data.expectedSalary, data.clientLeadsStrategy,
    file ? file.filename : null
  ];

  console.log('Prepared SQL query:', sql);
  console.log('Values to insert:', values);

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).send('Error saving data');
    }
    console.log('Data inserted successfully with ID:', result.insertId);
    res.status(200).send('Form and file submitted successfully!');
  });
});

app.get('/', (req, res) => {
  res.send('Server is working!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});