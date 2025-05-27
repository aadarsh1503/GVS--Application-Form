const express = require('express');
const mysql = require('mysql2/promise'); // Using promise-based API
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


cloudinary.config({ 
  cloud_name: 'ds1dt3qub', 
  api_key: '812267761956811', 
  api_secret: 'mSDcT7ojdMLhFUPrbPHtOeL4hqk'
});

// Remove the multer disk storage configuration and replace with memory storage
const storage = multer.memoryStorage(); // Store file in memory for Cloudinary upload
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  multipleStatements: true
});

// Verify pool connection
pool.getConnection()
  .then(connection => {
    console.log('Connected to MySQL');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

// File download/view route
// app.get('/uploads/:filename', async (req, res) => {
//   try {
//     const filename = path.basename(req.params.filename);
//     const filePath = path.join(__dirname, 'uploads', filename);
    
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).send('File not found');
//     }

//     if (req.query.download === 'true') {
//       res.download(filePath, filename);
//     } else {
//       res.sendFile(filePath);
//     }
//   } catch (error) {
//     console.error('Route error:', error);
//     res.status(500).send('Server error');
//   }
// });

// Admin authentication routes
app.post('/admin/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO admin_users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    res.status(201).json({ message: 'Admin user registered' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'User already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [results] = await pool.execute('SELECT * FROM admin_users WHERE email = ?', [email]);
    
    if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_secret',
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Multer config for file upload


// Form entries route with better error handling
app.get('/admin/form-entries', async (req, res) => {
  try {
    let baseQuery = 'SELECT * FROM form_entries';
    const conditions = [];
    const values = [];

    // Build query conditions
    if (req.query.searchTerm) {
      conditions.push('(fullName LIKE ? OR email LIKE ? OR skills LIKE ?)');
      values.push(`%${req.query.searchTerm}%`, `%${req.query.searchTerm}%`, `%${req.query.searchTerm}%`);
    }

    if (req.query.email) {
      conditions.push('email LIKE ?');
      values.push(`%${req.query.email}%`);
    }

    if (req.query.nationality) {
      conditions.push('LOWER(nationality) LIKE LOWER(?)');
      values.push(`%${req.query.nationality}%`);
    }

    if (req.query.educationLevel) {
      conditions.push('educationLevel = ?');
      values.push(req.query.educationLevel);
    }

    if (req.query.visaStatus) {
      if (req.query.visaStatus === 'Expired') {
        conditions.push('(passportValidity IS NOT NULL AND passportValidity < CURRENT_DATE)');
      } else if (req.query.visaStatus === 'Valid') {
        conditions.push('(passportValidity IS NOT NULL AND passportValidity >= CURRENT_DATE)');
      } else if (req.query.visaStatus === 'None') {
        conditions.push('passportValidity IS NULL');
      }
    }

    // Date range filtering
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

    const [results] = await pool.execute(baseQuery, values);
    
    const processedResults = results.map(entry => ({
      ...entry,
      currentlyEmployed: entry.currentlyEmployed,
      visaStatus: entry.visaStatus || null
    }));

    res.status(200).json(processedResults);
  } catch (err) {
    console.error('Error fetching form entries:', err);
    res.status(500).send('Error retrieving data');
  }
});

// Form submission with transaction support
app.post('/submit-form', upload.single('file'), async (req, res) => {
  console.log('--- Form submission received ---');
  const data = req.body;
  const file = req.file;

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      console.log('Received form data:', data);
      let fileUrl = null;
      
      if (file) {
        console.log('Uploading file to Cloudinary...');
        // Convert buffer to a data URI for Cloudinary
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataUri, {
          resource_type: "auto",
          folder: "job_applications" // Optional folder in Cloudinary
        });
        
        fileUrl = result.secure_url;
        console.log('File uploaded to Cloudinary:', fileUrl);
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
        fileUrl // Store the Cloudinary URL instead of local filename
      ];

      console.log('Prepared SQL query:', sql);
      console.log('Values to insert:', values);

      const [result] = await connection.query(sql, values);
      console.log('Data inserted successfully with ID:', result.insertId);
      
      await connection.commit();
      res.status(200).send('Form and file submitted successfully!');
    } catch (err) {
      await connection.rollback();
      console.error('Error inserting data:', err);
      res.status(500).send('Error saving data');
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error getting database connection:', err);
    res.status(500).send('Database connection error');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  pool.getConnection()
    .then(connection => {
      connection.release();
      res.status(200).json({ status: 'healthy', database: 'connected' });
    })
    .catch(err => {
      res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
    });
});

app.get('/', (req, res) => {
  res.send('Server is working!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});