import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const MAX_REFERENCES = 3;

const ReferencesStep = ({ formData, errors, handleChange }) => {
  const [referenceCount, setReferenceCount] = useState(1);

  useEffect(() => {
    // Auto-increase count if some refs are already filled (for validation reset cases)
    let filledCount = 0;
    if (formData.ref2Name || formData.ref2Contact || formData.ref2Email) filledCount++;
    if (formData.ref3Name || formData.ref3Contact || formData.ref3Email) filledCount++;
    setReferenceCount(1 + filledCount);
  }, []);
  const removeReference = (index) => {
    const refNum = index + 1;
    const updatedData = { ...formData };
  
    delete updatedData[`ref${refNum}Name`];
    delete updatedData[`ref${refNum}Contact`];
    delete updatedData[`ref${refNum}Email`];
  
    handleChange({ target: { name: `ref${refNum}Name`, value: '' } }); // force rerender
    setReferenceCount((prev) => Math.max(1, prev - 1));
  };
  const renderReference = (index) => {
    const refNum = index + 1;
  
    return (
      <div key={refNum} className="bg-gray-50 p-4 rounded-lg relative border">
        <h3 className="font-medium text-gray-800 mb-3">Reference #{refNum}</h3>
  
        {refNum > 1 && (
          <button
            type="button"
            onClick={() => removeReference(index)}
            className="absolute top-3 right-3 text-sm text-red-600 hover:underline"
          >
            Remove
          </button>
        )}
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name={`ref${refNum}Name`}
              value={formData[`ref${refNum}Name`] || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg  focus:ring-primary"
              placeholder="Full name"
            />
            {errors[`ref${refNum}Name`] && (
              <p className="text-red-500 text-sm mt-1">{errors[`ref${refNum}Name`]}</p>
            )}
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
            <input
              type="tel"
              name={`ref${refNum}Contact`}
              value={formData[`ref${refNum}Contact`] || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg  focus:ring-primary"
              placeholder="Contact number"
            />
            {errors[`ref${refNum}Contact`] && (
              <p className="text-red-500 text-sm mt-1">{errors[`ref${refNum}Contact`]}</p>
            )}
          </div>
  
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              name={`ref${refNum}Email`}
              value={formData[`ref${refNum}Email`] || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg  focus:ring-primary"
              placeholder="Email address"
            />
            {errors[`ref${refNum}Email`] && (
              <p className="text-red-500 text-sm mt-1">{errors[`ref${refNum}Email`]}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-dark mb-6">Character References</h2>
      <p className="text-gray-600 mb-4"></p>

      {/* Render references */}
      {[...Array(referenceCount)].map((_, idx) => renderReference(idx))}

      {/* Add button (only show if < 3 references) */}
      {referenceCount < MAX_REFERENCES && (
        <button
          type="button"
          onClick={() => setReferenceCount((prev) => Math.min(prev + 1, MAX_REFERENCES))}
          className="inline-block text-sm text-blue-600 hover:underline mt-2"
        >
          + Add Reference
        </button>
      )}
    </motion.div>
  );
};

export default ReferencesStep;
