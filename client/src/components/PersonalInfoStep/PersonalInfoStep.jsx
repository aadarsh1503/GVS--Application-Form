import { motion } from 'framer-motion';
import { useState,useEffect } from 'react';
const PersonalInfoStep = ({ formData, errors, handleChange }) => {
  const [countries, setCountries] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all')
      .then(res => res.json())
      .then(data => {
        const countryNames = data.map(c => c.name.common).sort();
        setCountries(countryNames);
      });
  }, []);

  const handleNationalityChange = (e) => {
    const input = e.target.value;
    handleChange(e);

    if (input.length > 0) {
      const filtered = countries.filter(country =>
        country.toLowerCase().startsWith(input.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleChange({ target: { name: 'nationality', value: suggestion } });
    setShowSuggestions(false);
    setSuggestions([]);
  };
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <h2 className="text-2xl font-bold text-dark mb-6">Personal Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
  type="email"
  name="email"
  value={formData.email}
  onChange={handleChange}
  required
  className={`w-full px-4 py-2 border rounded-lg  focus:ring-primary focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
  placeholder="your@email.com"
/>

          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg  focus:ring-primary focus:border-transparent ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="As printed on passport/ID"
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg  focus:ring-primary focus:border-transparent ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
        </div>
        
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
        <div className="relative">
          <input
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleNationalityChange}
            className={`w-full px-4 py-2 border rounded-lg  focus:ring-primary focus:border-transparent ${errors.nationality ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Your nationality"
            autoComplete="off"
          />
          {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded max-h-40 overflow-auto">
              {suggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Contact</label>
          <input
  type="tel"
  name="mobileContact"
  value={formData.mobileContact}
  onChange={handleChange}
  required
  inputMode="numeric"
  pattern="[0-9]+"
  maxLength={15}
  className={`w-full px-4 py-2 border rounded-lg  focus:ring-primary focus:border-transparent ${errors.mobileContact ? 'border-red-500' : 'border-gray-300'}`}
  placeholder="+1234567890"
/>

          {errors.mobileContact && <p className="text-red-500 text-xs mt-1">{errors.mobileContact}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
          <input
  type="tel"
  name="whatsapp"
  value={formData.whatsapp}
  onChange={handleChange}
  required
  inputMode="numeric"
  pattern="[0-9]+"
  maxLength={15}
  className={`w-full px-4 py-2 border rounded-lg  focus:ring-primary focus:border-transparent ${errors.whatsapp ? 'border-red-500' : 'border-gray-300'}`}
  placeholder="+1234567890"
/>

          {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Address</label>
        <input
          type="text"
          name="currentAddress"
          value={formData.currentAddress}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg  focus:ring-primary focus:border-transparent ${errors.currentAddress ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Your current address"
        />
        {errors.currentAddress && <p className="text-red-500 text-xs mt-1">{errors.currentAddress}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CPR/National ID</label>
          <input
  type="text"
  name="cprNationalId"
  value={formData.cprNationalId}
  onChange={handleChange}
  required
  inputMode="numeric"
  pattern="[0-9]+"
  maxLength={15}
  className={`w-full px-4 py-2 border rounded-lg  focus:ring-primary focus:border-transparent ${errors.cprNationalId ? 'border-red-500' : 'border-gray-300'}`}
  placeholder="Your national ID number"
/>

          {errors.cprNationalId && <p className="text-red-500 text-xs mt-1">{errors.cprNationalId}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passport ID Number</label>
          <input
            type="text"
            name="passportId"
            value={formData.passportId}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg  focus:ring-primary focus:border-transparent ${errors.passportId ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Your passport number"
          />
          {errors.passportId && <p className="text-red-500 text-xs mt-1">{errors.passportId}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passport Validity Date</label>
          <input
            type="date"
            name="passportValidity"
            value={formData.passportValidity}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg  focus:ring-primary focus:border-transparent ${errors.passportValidity ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.passportValidity && <p className="text-red-500 text-xs mt-1">{errors.passportValidity}</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default PersonalInfoStep;
