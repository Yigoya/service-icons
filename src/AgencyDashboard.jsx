// AgencyDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const AgencyDashboard = () => {
  const { token, agencyId, isAuthenticated } = useSelector(state => state);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [darkMode, setDarkMode] = useState(true); // Toggle for dark/light mode

  useEffect(() => {
    if (isAuthenticated && agencyId) {
      fetchDashboardData();
    }
  }, [agencyId, isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/agency/dashboard?agencyId=${agencyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTenderStatus = async (tenderId) => {
    try {
      const response = await axios.put(`/api/agency/tenders/${tenderId}/status`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: newStatus, agencyId }
      });
      setSelectedTender(response.data);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating tender status:', error);
    }
  };

  const addNewTender = async (formData) => {
    try {
      await axios.post('/api/agency/add', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        },
        params: { agencyId }
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding tender:', error);
    }
  };

  if (!isAuthenticated) {
    return <div className="text-center text-red-500">Please login to access the dashboard</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} transition-colors duration-300`}>
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-opacity-80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-2xl font-bold">{dashboardData?.agencyProfile.companyName} Dashboard</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Main Content - Bento Grid Layout */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <StatCard 
          title="Total Tenders" 
          value={dashboardData?.totalTenders} 
          bgColor="bg-blue-600 bg-opacity-80" 
        />
        <StatCard 
          title="Active Tenders" 
          value={dashboardData?.activeTenders} 
          bgColor="bg-green-600 bg-opacity-80" 
        />
        <StatCard 
          title="Closed Tenders" 
          value={dashboardData?.closedTenders} 
          bgColor="bg-red-600 bg-opacity-80" 
        />

        {/* Tender Management */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-opacity-80 backdrop-blur-md bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Tender Management</h3>
          <TenderTable 
            tenders={dashboardData?.tenderStats} 
            onSelect={setSelectedTender}
          />
          {selectedTender && (
            <div className="mt-4 flex items-center gap-4">
              <select 
                className="border rounded p-2 bg-gray-700 text-white"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Select Status</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="PENDING">Pending</option>
              </select>
              <button 
                onClick={() => updateTenderStatus(selectedTender.date)} // Using date as ID for simplicity
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Update Status
              </button>
            </div>
          )}
        </div>

        {/* New Tender Form */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-opacity-80 backdrop-blur-md bg-gray-800 rounded-xl p-6 shadow-lg">
          <NewTenderForm onSubmit={addNewTender} />
        </div>
      </div>
    </div>
  );
};

// StatCard Component with Glassmorphism
const StatCard = ({ title, value, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-6 shadow-lg backdrop-blur-md bg-opacity-80 transform hover:scale-105 transition-transform duration-200`}>
    <p className="text-sm opacity-80">{title}</p>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

// TenderTable Component
const TenderTable = ({ tenders, onSelect }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="bg-gray-700">
          <th className="p-3">Date</th>
          <th className="p-3">Status</th>
          <th className="p-3">Count</th>
          <th className="p-3">Action</th>
        </tr>
      </thead>
      <tbody>
        {tenders?.map((tender) => (
          <tr key={tender.date} className="border-b border-gray-700 hover:bg-gray-600 transition-colors">
            <td className="p-3">{new Date(tender.date).toLocaleDateString()}</td>
            <td className="p-3">{tender.status}</td>
            <td className="p-3">{tender.tenderCount}</td>
            <td className="p-3">
              <button 
                onClick={() => onSelect(tender)}
                className="text-blue-400 hover:text-blue-300"
              >
                Manage
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// NewTenderForm Component
const NewTenderForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', location: '', closingDate: '', contactInfo: '', categoryId: '', file: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });
    onSubmit(data);
    setFormData({ title: '', description: '', location: '', closingDate: '', contactInfo: '', categoryId: '', file: null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold">Add New Tender</h3>
      <input
        type="text"
        placeholder="Title"
        className="w-full border rounded p-2 bg-gray-700 text-white"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
      <textarea
        placeholder="Description"
        className="w-full border rounded p-2 bg-gray-700 text-white"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <input
        type="text"
        placeholder="Location"
        className="w-full border rounded p-2 bg-gray-700 text-white"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
      />
      <input
        type="datetime-local"
        className="w-full border rounded p-2 bg-gray-700 text-white"
        value={formData.closingDate}
        onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
      />
      <input
        type="text"
        placeholder="Contact Info"
        className="w-full border rounded p-2 bg-gray-700 text-white"
        value={formData.contactInfo}
        onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
      />
      <input
        type="number"
        placeholder="Category ID"
        className="w-full border rounded p-2 bg-gray-700 text-white"
        value={formData.categoryId}
        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
      />
      <input
        type="file"
        className="w-full border rounded p-2 bg-gray-700 text-white"
        onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
      />
      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
      >
        Add Tender
      </button>
    </form>
  );
};

export default AgencyDashboard;