import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Filters from '../../Filters/Filters';
import Skeleton from '../../Skeleton/Skeleton';
import Toggle from '../../Toggle/Toggle';
import AdminNavbar from '../../AdminNavbar/AdminNavbar';

const Dashboard = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPDF, setShowPDF] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    email: '',
    nationality: '',
    currentlyEmployed: '',
    dateRange: 'all',
    customStart: '',
    customEnd: '',
    educationLevel: '',
    searchTerm: ''
  });

  // Apply dark mode class to HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Fetch entries from API
  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://gvs-application-form-1.onrender.com/admin/form-entries');
      setEntries(response.data);
      setFilteredEntries(response.data); // Initialize filtered entries
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters locally
  const applyFilters = () => {
    let result = [...entries];
    
    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(entry => 
        (entry.fullName?.toLowerCase().includes(term)) ||
        (entry.email?.toLowerCase().includes(term)) ||
        (entry.skills?.toLowerCase().includes(term))
      );
    }

    // Nationality filter
    if (filters.nationality) {
      result = result.filter(entry => 
        entry.nationality?.toLowerCase().includes(filters.nationality.toLowerCase())
      );
    }

    // Employment status filter
    if (filters.currentlyEmployed) {
      result = result.filter(entry => 
        String(entry.currentlyEmployed).toUpperCase() === filters.currentlyEmployed.toUpperCase()
      );
    }

    // Education level filter
    if (filters.educationLevel) {
      result = result.filter(entry => 
        entry.educationLevel === filters.educationLevel
      );
    }
      if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    let startDate = new Date();
    
    switch (filters.dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        if (filters.customStart) {
          startDate = new Date(filters.customStart);
        }
        break;
    }

    result = result.filter(entry => {
      const entryDate = new Date(entry.submittedAt);
      return entryDate >= startDate && entryDate <= now;
    });
  }

    setFilteredEntries(result);
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchEntries();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    if (entries.length > 0) {
      applyFilters();
    }
  }, [filters, entries]);

  // Other helper functions remain the same...
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const openModal = (entry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };
  const clearAllFilters = () => {
    setFilters({
      email: '',
      nationality: '',
      currentlyEmployed: '',
      dateRange: 'all',
      customStart: '',
      customEnd: '',
      educationLevel: '',
      searchTerm: ''
    });
  };
  const renderField = (label, value) => {
    if (!value) return null;
    return (
      <p className={`mt-1 text-sm font-noto-serif ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <strong className={darkMode ? 'text-indigo-400' : 'text-indigo-600'}>{label}:</strong> {value}
      </p>
    );
  };
  return (
    <div className={`min-h-screen transition-colors font-noto-serif duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <AdminNavbar />
      <div className="p-6  max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-3xl mt-20 font-noto-serif font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}
          >
            Applications Dashboard
          </motion.h1>
          <div className='mt-20'>
          <Toggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          </div>
        </div>

        <Filters 
          filters={filters} 
          setFilters={setFilters} 
          darkMode={darkMode} 
          clearAllFilters={clearAllFilters}
        />

{loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[...Array(6)].map((_, idx) => (
              <Skeleton key={idx} darkMode={darkMode} />
            ))}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mt-6 mb-4">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{filteredEntries.length}</span> candidates
              </p>
              <div className="flex space-x-2">
                <button 
                  onClick={fetchEntries}
                  className={`px-3 py-1 cursor-pointer text-xs rounded-full transition-colors ${
                    darkMode ? 'bg-indigo-900 text-indigo-200 hover:bg-indigo-800' 
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  }`}
                >
                  Refresh
                </button>
              </div>
            </div>

            {filteredEntries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                {/* No results message */}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                <AnimatePresence>
                  {filteredEntries.map((entry) => (
                    <motion.div
                      key={entry._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className={`rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex items-start">
                          <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
                            darkMode ? 'bg-indigo-900' : 'bg-indigo-100'
                          }`}>
                            <span className={darkMode ? 'text-indigo-300' : 'text-indigo-600'}>
                              {entry.fullName?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <h2 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {entry.fullName || 'No Name'}
                            </h2>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {entry.nationality} • {String(entry.currentlyEmployed).toUpperCase() === 'YES' ? 'Employed' : 'Not Employed'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {renderField('Email', entry.email)}
                          {renderField('Contact', entry.mobileContact)}
                          {renderField('Education', entry.educationLevel)}
                          
                          {entry.skills && (
                            <div className="mt-2">
                              <p className={`text-xs ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>SKILLS</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {entry.skills.split(',').slice(0, 3).map((skill, i) => (
                                  <span 
                                    key={i} 
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                                    }`}
                                  >
                                    {skill.trim()}
                                  </span>
                                ))}
                                {entry.skills.split(',').length > 3 && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    +{entry.skills.split(',').length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className={`mt-6 pt-4 flex justify-between items-center ${
                          darkMode ? 'border-gray-700' : 'border-gray-200'
                        } border-t`}>
                          <div className="flex items-center space-x-2">
                            {entry.resumeFile && (
                              <a
                                href={`https://gvs-application-form-1.onrender.com/uploads/${entry.resumeFile}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs flex items-center ${
                                  darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'
                                }`}
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Resume
                              </a>
                            )}
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Submitted at: {new Date(entry.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => openModal(entry)}
                            className="px-4 py-2 cursor-pointer bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            View Now
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* Detailed Modal View */}
        <AnimatePresence>
          {isModalOpen && selectedEntry && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className={`relative max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={closeModal}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
                >
                  <svg className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="p-8">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 h-20 w-20 rounded-full flex items-center justify-center ${
                      darkMode ? 'bg-indigo-900' : 'bg-indigo-100'
                    }`}>
                      <span className={`text-2xl ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                        {selectedEntry.fullName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="ml-6">
                      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {selectedEntry.fullName || 'No Name'}
                      </h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedEntry.nationality}
                        </span>
                        {/* <span className={`px-3 py-1 text-xs rounded-full ${
                          selectedEntry.currentlyEmployed === 'Yes' 
                            ? darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                            : darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedEntry.currentlyEmployed === 'Yes' ? 'Currently Employed' : 'Available'}
                        </span> */}
                        {/* {selectedEntry.visaStatus && (
                          <span className={`px-3 py-1 text-xs rounded-full ${
                            selectedEntry.visaStatus === 'Expired'
                              ? darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                              : darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {selectedEntry.visaStatus}
                          </span>
                        )} */}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className={`font-semibold text-lg mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                          Personal Details
                        </h3>
                        {renderField('Email', selectedEntry.email)}
                        {renderField('Nationality', selectedEntry.nationality)}
                        {renderField('Date of Birth', selectedEntry.dateOfBirth)}
                        {renderField('Mobile Contact', selectedEntry.mobileContact)}
                        {renderField('WhatsApp', selectedEntry.whatsapp)}
                        {renderField('Current Address', selectedEntry.currentAddress)}
                      </div>

                      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className={`font-semibold text-lg mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                          Identification
                        </h3>
                        {renderField('CPR/National ID', selectedEntry.cprNationalId)}
                        {renderField('Passport ID', selectedEntry.passportId)}
                        {renderField('Passport Validity', selectedEntry.passportValidity)}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className={`font-semibold text-lg mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                          Education & Employment
                        </h3>
                        {renderField('Education Level', selectedEntry.educationLevel)}
                        {renderField('Course/Degree', selectedEntry.courseDegree)}
                        {renderField('Currently Employed', selectedEntry.currentlyEmployed)}
                        {renderField('Employment Desired', selectedEntry.employmentDesired)}
                        {renderField('Available Start Date', selectedEntry.availableStart)}
                        {renderField('Shift Available', selectedEntry.shiftAvailable)}
                        {renderField('Can Travel', selectedEntry.canTravel)}
                        {renderField('Driving License', selectedEntry.drivingLicense)}
                      </div>

                      {selectedEntry.skills && (
                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <h3 className={`font-semibold text-lg mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            Skills
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedEntry.skills.split(',').map((skill, i) => (
                              <span 
                                key={i} 
                                className={`px-3 py-1 rounded-full text-sm ${
                                  darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                                }`}
                              >
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* References Section */}
                  {(selectedEntry.ref1Name || selectedEntry.ref2Name || selectedEntry.ref3Name) && (
                    <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h3 className={`font-semibold text-lg mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        References
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedEntry.ref1Name && (
                          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                            <h4 className={darkMode ? 'text-white' : 'text-gray-800'}>Reference 1</h4>
                            {renderField('Name', selectedEntry.ref1Name)}
                            {renderField('Contact', selectedEntry.ref1Contact)}
                            {renderField('Email', selectedEntry.ref1Email)}
                          </div>
                        )}
                        {selectedEntry.ref2Name && (
                          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                            <h4 className={darkMode ? 'text-white' : 'text-gray-800'}>Reference 2</h4>
                            {renderField('Name', selectedEntry.ref2Name)}
                            {renderField('Contact', selectedEntry.ref2Contact)}
                            {renderField('Email', selectedEntry.ref2Email)}
                          </div>
                        )}
                        {selectedEntry.ref3Name && (
                          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                            <h4 className={darkMode ? 'text-white' : 'text-gray-800'}>Reference 3</h4>
                            {renderField('Name', selectedEntry.ref3Name)}
                            {renderField('Contact', selectedEntry.ref3Contact)}
                            {renderField('Email', selectedEntry.ref3Email)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h3 className={`font-semibold text-lg mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Visa & Salary
                      </h3>
                      {renderField('Visa Status', selectedEntry.visaStatus)}
                      {renderField('Visa Validity', selectedEntry.visaValidity)}
                      {renderField('Expected Salary', selectedEntry.expectedSalary)}
                    </div>

                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h3 className={`font-semibold text-lg mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Strategy
                      </h3>
                      {renderField('Client Leads Strategy', selectedEntry.clientLeadsStrategy)}
                    </div>
                  </div>
                  {selectedEntry.resumeFile && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowPDF(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download Full Resume
          </button>
        </div>
      )}

    {/* PDF Modal Viewer */}
    {showPDF && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg overflow-hidden w-[90%] h-[90%] relative shadow-lg">
      
      {/* Close Button */}
      <button
        onClick={() => setShowPDF(false)}
        className="absolute top-2 right-3 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-50 hover:bg-red-500 hover:text-white transition"
        title="Close"
      >
        &times;
      </button>

      {/* Download Button */}
      <button
        onClick={() => {
          // Create a hidden anchor tag to trigger download
          const link = document.createElement('a');
          link.href = `https://gvs-application-form-1.onrender.com/uploads/${selectedEntry.resumeFile}?download=true`;
          link.download = selectedEntry.resumeFile || 'resume.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
        className="absolute top-2 right-18 bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-50 hover:bg-blue-800 transition"
        title="Download"
      >
        ⬇
      </button>

      {/* PDF Viewer */}
      <iframe
        src={`https://gvs-application-form-1.onrender.com/uploads/${selectedEntry.resumeFile}`}
        title="Resume Viewer"
        className="w-full h-full border-none"
      ></iframe>
    </div>
  </div>
)}


                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;