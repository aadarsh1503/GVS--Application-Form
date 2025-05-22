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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
