import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Filter states
  const [instituteSearch, setInstituteSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All districts");
  const [selectedStatus, setSelectedStatus] = useState("All statuses");
  const [validUdiseFilter, setValidUdiseFilter] = useState("Duplicated");
  const [udiseUpdated, setUdiseUpdated] = useState("All schools");
  const [expandedRow, setExpandedRow] = useState(null);

  // Define column mapping based on your API data structure
  const columnMapping = {
    timestamp: 0,
    instituteName: 1,
    address: 2,
    totalParticipants: 3,
    totalGirls: 4,
    totalFaculty: 5,
    stateDistrict: 6,
    campusAmbassadors: 7,
    eventDate: 8,
    email: 9,
    score: 10,
    emailAddress: 11,
    reportLink: 12,
    coordinatorDetails: 13,
    feedback: 14,
    mediaLink: 15,
    newspaperPhotos: 16,
    photosVideos: 17,
    empty: 18,
    column8: 19
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);

      const res = await axios.get(
        "https://googlesheetdatabakend.onrender.com/get-data"
      );

      // Handle the API response format
      let apiData = [];
      if (Array.isArray(res.data)) {
        // Check if it's an array of arrays (your format)
        if (res.data.length > 0 && Array.isArray(res.data[0])) {
          // Skip header row (index 0) and map the data
          apiData = res.data.slice(1).map((row, index) => ({
            id: index + 1,
            timestamp: row[columnMapping.timestamp] || "",
            instituteName: row[columnMapping.instituteName] || "",
            address: row[columnMapping.address] || "",
            totalParticipants: row[columnMapping.totalParticipants] || "0",
            totalGirls: row[columnMapping.totalGirls] || "0",
            totalFaculty: row[columnMapping.totalFaculty] || "0",
            stateDistrict: row[columnMapping.stateDistrict] || "",
            campusAmbassadors: row[columnMapping.campusAmbassadors] || "",
            eventDate: row[columnMapping.eventDate] || "",
            email: row[columnMapping.email] || "",
            score: row[columnMapping.score] || "0",
            emailAddress: row[columnMapping.emailAddress] || "",
            reportLink: row[columnMapping.reportLink] || "",
            coordinatorDetails: row[columnMapping.coordinatorDetails] || "",
            feedback: row[columnMapping.feedback] || "",
            mediaLink: row[columnMapping.mediaLink] || "",
            newspaperPhotos: row[columnMapping.newspaperPhotos] || "",
            photosVideos: row[columnMapping.photosVideos] || "",
            // For DRSC display
            udiseCode: "N/A",
            district: extractDistrict(row[columnMapping.stateDistrict] || ""),
            validUdiseCode: "Yes",
            approved: Math.random() > 0.3 ? "✓" : "X",
            duplicatedFrom: "-",
          }));
        }
      }

      setData(apiData);
      setCurrentPage(1);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(true);
      setLoading(false);
    }
  };

  // Helper function to extract district from "State and District" field
  const extractDistrict = (stateDistrict) => {
    if (!stateDistrict) return "Not Specified";
    // Try to extract district name
    const parts = stateDistrict.split(/[,|-|and]/);
    if (parts.length > 1) {
      return parts[1].trim();
    }
    return stateDistrict.trim();
  };

  // Get unique districts for filter dropdown
  const districts = useMemo(() => {
    const uniqueDistricts = ["All districts", ...new Set(
      data.map(item => item.district).filter(Boolean)
    )];
    return uniqueDistricts;
  }, [data]);

  // Apply filters - Now filtering by institute name
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Institute name search (case insensitive)
      const matchesInstitute = instituteSearch === "" || 
        row.instituteName?.toLowerCase().includes(instituteSearch.toLowerCase());
      
      // District filter
      const matchesDistrict = selectedDistrict === "All districts" || 
        row.district === selectedDistrict;
      
      return matchesInstitute && matchesDistrict;
    });
  }, [data, instituteSearch, selectedDistrict]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Toggle row expansion
  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Format campus ambassadors for display
  const formatAmbassadors = (ambassadors) => {
    if (!ambassadors) return "No data";
    return ambassadors.split('\n').map((line, i) => (
      <div key={i} className="text-xs py-1 border-b last:border-0">{line}</div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-lg">
        
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">DRSC Campaign</h1>
          <p className="text-gray-600 text-sm mt-1">Monitor Disaster Ready School Campaign submissions</p>
        </div>

        {/* Filters Section */}
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Institute Name Search */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                Search by Institute Name
              </label>
              <input
                type="text"
                placeholder="Enter institute name..."
                value={instituteSearch}
                onChange={(e) => {
                  setInstituteSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* District Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Date Range</label>
              <input
                type="text"
                placeholder="Select date"
                className="w-full border rounded px-3 py-2 text-sm bg-gray-100"
                disabled
              />
            </div>

            {/* Approval Status */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Approval Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option>All statuses</option>
                <option>Approved</option>
                <option>Not Approved</option>
              </select>
            </div>

            {/* Valid Udise Code */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Valid Udise Code</label>
              <select
                value={validUdiseFilter}
                onChange={(e) => {
                  setValidUdiseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option>Duplicated</option>
                <option>All</option>
                <option>Valid</option>
                <option>Invalid</option>
              </select>
            </div>

            {/* UDISE Updated */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">UDISE Updated</label>
              <select
                value={udiseUpdated}
                onChange={(e) => {
                  setUdiseUpdated(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option>All schools</option>
                <option>Updated</option>
                <option>Not updated</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={fetchData}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
            >
              Refresh Data
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition flex items-center gap-2">
              <span>📥</span> Download PDF ({filteredData.length})
            </button>
          </div>
        </div>

        {/* Loading/Error States */}
        {loading && (
          <div className="p-8 text-center text-blue-600">Loading data...</div>
        )}

        {error && (
          <div className="p-8 text-center text-red-600">Error fetching API. Please try again.</div>
        )}

        {/* Summary Cards */}
        {!loading && !error && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Institutes</p>
              <p className="text-2xl font-bold text-blue-600">{data.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Participants</p>
              <p className="text-2xl font-bold text-green-600">
                {data.reduce((sum, item) => sum + (parseInt(item.totalParticipants) || 0), 0)}
              </p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Girls Trained</p>
              <p className="text-2xl font-bold text-pink-600">
                {data.reduce((sum, item) => sum + (parseInt(item.totalGirls) || 0), 0)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Faculty Trained</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.reduce((sum, item) => sum + (parseInt(item.totalFaculty) || 0), 0)}
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        {currentData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    S.No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Institute Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Girls
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Faculty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Event Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((row, index) => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRowExpansion(row.id)}>
                      <td className="px-4 py-3 text-sm text-gray-900">{startIndex + index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {row.instituteName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        <span title={row.address}>{row.address}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.totalParticipants}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.totalGirls}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.totalFaculty}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.district}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.eventDate}</td>
                      <td className="px-4 py-3 text-sm">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(row.id);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {expandedRow === row.id ? "▼" : "▶"} View Details
                        </button>
                      </td>
                    </tr>
                    {expandedRow === row.id && (
                      <tr className="bg-blue-50">
                        <td colSpan="9" className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left Column */}
                            <div>
                              <h3 className="font-semibold text-gray-700 mb-2">Event Details</h3>
                              <div className="space-y-2">
                                <p><span className="font-medium">Email:</span> {row.email}</p>
                                <p><span className="font-medium">Email Address:</span> {row.emailAddress}</p>
                                <p><span className="font-medium">Score:</span> {row.score}</p>
                                <p><span className="font-medium">Coordinator:</span> {row.coordinatorDetails}</p>
                                <p><span className="font-medium">Feedback:</span> {row.feedback || "Not provided"}</p>
                              </div>
                              
                              <h3 className="font-semibold text-gray-700 mt-4 mb-2">Links</h3>
                              <div className="space-y-2">
                                {row.reportLink && (
                                  <p>
                                    <span className="font-medium">Report:</span>{' '}
                                    <a href={row.reportLink} target="_blank" rel="noopener noreferrer" 
                                       className="text-blue-600 hover:underline break-all">
                                      View Report
                                    </a>
                                  </p>
                                )}
                                {row.mediaLink && (
                                  <p>
                                    <span className="font-medium">Media:</span>{' '}
                                    <a href={row.mediaLink} target="_blank" rel="noopener noreferrer"
                                       className="text-blue-600 hover:underline break-all">
                                      View Media
                                    </a>
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Right Column */}
                            <div>
                              <h3 className="font-semibold text-gray-700 mb-2">Campus Ambassadors</h3>
                              <div className="bg-white p-3 rounded border max-h-48 overflow-y-auto">
                                {formatAmbassadors(row.campusAmbassadors)}
                              </div>
                              
                              <h3 className="font-semibold text-gray-700 mt-4 mb-2">Additional Info</h3>
                              <p><span className="font-medium">State & District:</span> {row.stateDistrict}</p>
                              <p><span className="font-medium">Timestamp:</span> {row.timestamp}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Pagination Info */}
            <div className="px-4 py-3 bg-white border-t text-sm text-gray-600 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span>
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} institutes
              </span>
              
              {/* Pagination Controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-100"
                >
                  Previous
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 border rounded text-sm ${
                        currentPage === pageNum 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && data.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No data available. Click "Refresh Data" to fetch.
          </div>
        )}
      </div>
    </div>
  );
};

export default App;