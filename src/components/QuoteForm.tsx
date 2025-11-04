'use client';

import { useState } from 'react';

const QuoteForm = () => {
  const [domainName, setDomainName] = useState('');
  const [requestDetails, setRequestDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain_name: domainName,
          request_details: requestDetails,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quote');
      }

      setSuccess(true);
      setDomainName('');
      setRequestDetails('');
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="domainName" className="block text-sm font-medium text-gray-700">
          Domain Name
        </label>
        <input
          type="text"
          id="domainName"
          value={domainName}
          onChange={(e) => setDomainName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="requestDetails" className="block text-sm font-medium text-gray-700">
          Request Details
        </label>
        <textarea
          id="requestDetails"
          value={requestDetails}
          onChange={(e) => setRequestDetails(e.target.value)}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">Quote submitted successfully!</p>}
    </form>
  );
};

export default QuoteForm;
