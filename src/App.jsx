import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [instituteSearch, setInstituteSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All districts");
  const [selectedStatus, setSelectedStatus] = useState("All statuses");
  const [validUdiseFilter, setValidUdiseFilter] = useState("Duplicated");
  const [udiseUpdated, setUdiseUpdated] = useState("All schools");
  const [expandedRow, setExpandedRow] = useState(null);

  // Responsive items per page based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(5);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(8);
      } else {
        setItemsPerPage(10);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <div key={i} className="text-xs sm:text-sm py-1 border-b last:border-0 whitespace-pre-wrap break-words">{line}</div>
    ));
  };

  // Mobile card view for small screens
  const MobileCard = ({ row, index }) => (
    <div className="bg-white border rounded-lg p-4 mb-3 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-gray-500">#{startIndex + index + 1}</span>
        <button 
          onClick={() => toggleRowExpansion(row.id)}
          className="text-blue-600 text-sm"
        >
          {expandedRow === row.id ? "▼ Show Less" : "▶ View Details"}
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <span className="text-xs font-semibold text-gray-600">Institute:</span>
          <p className="text-sm font-medium text-gray-900">{row.instituteName}</p>
        </div>
        
        <div>
          <span className="text-xs font-semibold text-gray-600">Address:</span>
          <p className="text-sm text-gray-600">{row.address}</p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="bg-blue-50 p-2 rounded">
            <span className="text-xs text-gray-600 block">Participants</span>
            <span className="text-sm font-bold text-blue-600">{row.totalParticipants}</span>
          </div>
          <div className="bg-pink-50 p-2 rounded">
            <span className="text-xs text-gray-600 block">Girls</span>
            <span className="text-sm font-bold text-pink-600">{row.totalGirls}</span>
          </div>
          <div className="bg-purple-50 p-2 rounded">
            <span className="text-xs text-gray-600 block">Faculty</span>
            <span className="text-sm font-bold text-purple-600">{row.totalFaculty}</span>
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-600">
          <span>📍 {row.district}</span>
          <span>📅 {row.eventDate}</span>
        </div>
      </div>
      
      {expandedRow === row.id && (
        <div className="mt-4 pt-4 border-t">
          <MobileExpandedDetails row={row} />
        </div>
      )}
    </div>
  );

  const MobileExpandedDetails = ({ row }) => (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-sm mb-2">Event Details</h4>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Email:</span> {row.email}</p>
          <p><span className="font-medium">Coordinator:</span> {row.coordinatorDetails}</p>
          <p><span className="font-medium">Score:</span> {row.score}</p>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold text-sm mb-2">Campus Ambassadors</h4>
        <div className="bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
          {formatAmbassadors(row.campusAmbassadors)}
        </div>
      </div>
      
      {row.reportLink && (
        <div>
          <a href={row.reportLink} target="_blank" rel="noopener noreferrer" 
             className="text-blue-600 text-sm block truncate">
            📄 View Report
          </a>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          
          {/* Header with mobile menu */}
          <div className="p-4 sm:p-6 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">DRSC Campaign</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Monitor Disaster Ready School Campaign submissions</p>
              </div>
              
              {/* Mobile menu button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden bg-gray-100 p-2 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filters Section - Collapsible on mobile */}
          <div className="border-b bg-gray-50">
            <div className="p-4 sm:p-6">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-between w-full sm:hidden mb-2"
              >
                <h2 className="text-lg font-semibold text-gray-700">Filters</h2>
                <span>{showFilters ? "▲" : "▼"}</span>
              </button>
              
              <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
                <h2 className="text-lg font-semibold text-gray-700 mb-4 hidden sm:block">Filters</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                  {/* Institute Name Search */}
                  <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Search Institute
                    </label>
                    <input
                      type="text"
                      placeholder="Institute name..."
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

                  {/* Date Range - Hidden on smallest screens */}
                  <div className="hidden sm:block">
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
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Status</label>
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
                  {/* <div className="hidden lg:block">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Valid Udise</label>
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
                  </div> */}

                  {/* UDISE Updated */}
                  <div className="hidden xl:block">
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
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-4 gap-3">
                  <button
                    onClick={fetchData}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
                  >
                    Refresh Data
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition flex items-center justify-center gap-2">
                    <span>📥</span> Download PDF ({filteredData.length})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading/Error States */}
          {loading && (
            <div className="p-8 text-center text-blue-600">Loading data...</div>
          )}

          {error && (
            <div className="p-8 text-center text-red-600">Error fetching API. Please try again.</div>
          )}

          {/* Summary Cards - Responsive grid */}
          {!loading && !error && data.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-4 sm:p-6">
              <div className="bg-blue-50 p-2 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Total Institutes</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{data.length}</p>
              </div>
              <div className="bg-green-50 p-2 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Total Participants</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {data.reduce((sum, item) => sum + (parseInt(item.totalParticipants) || 0), 0)}
                </p>
              </div>
              <div className="bg-pink-50 p-2 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Girls Trained</p>
                <p className="text-lg sm:text-2xl font-bold text-pink-600">
                  {data.reduce((sum, item) => sum + (parseInt(item.totalGirls) || 0), 0)}
                </p>
              </div>
              <div className="bg-purple-50 p-2 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Faculty Trained</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {data.reduce((sum, item) => sum + (parseInt(item.totalFaculty) || 0), 0)}
                </p>
              </div>
            </div>
          )}

          {/* Table/View - Desktop table, Mobile cards */}
          {currentData.length > 0 && (
            <div>
              {/* Desktop Table View (hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">S.No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Institute Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Participants</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Girls</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Faculty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">District</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Event Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentData.map((row, index) => (
                      <React.Fragment key={row.id}>
                        <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRowExpansion(row.id)}>
                          <td className="px-4 py-3 text-sm text-gray-900 align-top">{startIndex + index + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 align-top whitespace-normal break-words max-w-xs">
                            {row.instituteName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 align-top whitespace-normal break-words max-w-xs">
                            {row.address}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 align-top">{row.totalParticipants}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 align-top">{row.totalGirls}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 align-top">{row.totalFaculty}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 align-top whitespace-normal break-words">
                            {row.district}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 align-top">{row.eventDate}</td>
                          <td className="px-4 py-3 text-sm align-top">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpansion(row.id);
                              }}
                              className="text-blue-600 hover:text-blue-800 whitespace-nowrap"
                            >
                              {expandedRow === row.id ? "▼" : "▶"} Details
                            </button>
                          </td>
                        </tr>
                        {expandedRow === row.id && (
                          <tr className="bg-blue-50">
                            <td colSpan="9" className="px-4 py-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <h3 className="font-semibold text-gray-700 mb-2">Event Details</h3>
                                  <div className="space-y-2">
                                    <p className="whitespace-normal break-words"><span className="font-medium">Email:</span> {row.email}</p>
                                    <p className="whitespace-normal break-words"><span className="font-medium">Email Address:</span> {row.emailAddress}</p>
                                    <p><span className="font-medium">Score:</span> {row.score}</p>
                                    <p className="whitespace-normal break-words"><span className="font-medium">Coordinator:</span> {row.coordinatorDetails}</p>
                                    <p className="whitespace-normal break-words"><span className="font-medium">Feedback:</span> {row.feedback || "Not provided"}</p>
                                  </div>
                                  
                                  <h3 className="font-semibold text-gray-700 mt-4 mb-2">Links</h3>
                                  <div className="space-y-2">
                                    {row.reportLink && (
                                      <p className="whitespace-normal break-words">
                                        <span className="font-medium">Report:</span>{' '}
                                        <a href={row.reportLink} target="_blank" rel="noopener noreferrer" 
                                           className="text-blue-600 hover:underline break-all">
                                          View Report
                                        </a>
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <h3 className="font-semibold text-gray-700 mb-2">Campus Ambassadors</h3>
                                  <div className="bg-white p-3 rounded border max-h-48 overflow-y-auto">
                                    {formatAmbassadors(row.campusAmbassadors)}
                                  </div>
                                  
                                  <h3 className="font-semibold text-gray-700 mt-4 mb-2">Additional Info</h3>
                                  <p className="whitespace-normal break-words"><span className="font-medium">State & District:</span> {row.stateDistrict}</p>
                                  <p><span className="font-medium">Date And Time:</span> {row.timestamp}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4">
                {currentData.map((row, index) => (
                  <MobileCard key={row.id} row={row} index={index} />
                ))}
              </div>

              {/* Pagination Info - Responsive */}
              <div className="px-4 py-3 bg-white border-t text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span>
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} institutes
                </span>
                
                {/* Pagination Controls - Simplified for mobile */}
                <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm disabled:opacity-50 hover:bg-gray-100"
                  >
                    Prev
                  </button>
                  
                  {/* Show fewer page numbers on mobile */}
                  <span className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm">
                    {currentPage}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm disabled:opacity-50 hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!loading && !error && data.length === 0 && (
            <div className="p-8 sm:p-12 text-center text-gray-500">
              No data available. Click "Refresh Data" to fetch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;