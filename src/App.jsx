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
  
  // Photo gallery state
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [currentPhotoUrls, setCurrentPhotoUrls] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Summary statistics
  const [summaryStats, setSummaryStats] = useState({
    totalInstitutes: 0,
    totalParticipants: 0,
    totalGirls: 0,
    totalFaculty: 0,
    totalEvents: 0
  });

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

  // Helper function to clean and parse numeric values
  const parseNumericValue = (value) => {
    if (!value) return 0;
    const cleaned = value.toString().replace(/[^\d]/g, '');
    return parseInt(cleaned) || 0;
  };

  // Helper function to check if a row is a valid institute entry
  const isValidInstitute = (row) => {
    const instituteName = row[columnMapping.instituteName];
    if (!instituteName || instituteName.toString().trim() === "" || instituteName.toString().trim() === " ") {
      return false;
    }
    
    const participants = parseNumericValue(row[columnMapping.totalParticipants]);
    const girls = parseNumericValue(row[columnMapping.totalGirls]);
    const faculty = parseNumericValue(row[columnMapping.totalFaculty]);
    
    return (instituteName && instituteName.toString().trim().length > 0 && 
            instituteName.toString().trim() !== " " && 
            (participants > 0 || girls > 0 || faculty > 0 || 
             instituteName.toString().includes("College") || 
             instituteName.toString().includes("University") ||
             instituteName.toString().includes("Institute")));
  };

  // Extract Google Drive image IDs from links
  const extractDriveImageIds = (link) => {
    if (!link) return [];
    
    const driveIds = [];
    
    // Handle multiple links separated by commas, spaces, or newlines
    const links = link.split(/[,\s\n]+/).filter(l => l.trim());
    
    links.forEach(url => {
      // Match Google Drive image links
      const patterns = [
        /(?:drive\.google\.com\/file\/d\/)([^\/?#]+)/,
        /(?:drive\.google\.com\/open\?id=)([^&#]+)/,
        /(?:docs\.google\.com\/uc\?id=)([^&#]+)/,
        /(?:drive\.google\.com\/uc\?export=view&id=)([^&#]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          driveIds.push({
            id: match[1],
            thumbnail: `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`,
            view: `https://drive.google.com/file/d/${match[1]}/preview`
          });
          break;
        }
      }
    });
    
    return driveIds;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);

      const res = await axios.get(
        "https://googlesheetdatabakend.onrender.com/get-data"
      );

      let apiData = [];
      let validInstitutes = [];
      
      if (Array.isArray(res.data)) {
        if (res.data.length > 0 && Array.isArray(res.data[0])) {
          const allRows = res.data.slice(1);
          validInstitutes = allRows.filter(row => isValidInstitute(row));
          
          apiData = validInstitutes.map((row, index) => ({
            id: index + 1,
            timestamp: row[columnMapping.timestamp] || "",
            instituteName: row[columnMapping.instituteName]?.toString().trim() || "",
            address: row[columnMapping.address]?.toString().trim() || "",
            totalParticipants: parseNumericValue(row[columnMapping.totalParticipants]),
            totalGirls: parseNumericValue(row[columnMapping.totalGirls]),
            totalFaculty: parseNumericValue(row[columnMapping.totalFaculty]),
            stateDistrict: row[columnMapping.stateDistrict]?.toString().trim() || "",
            campusAmbassadors: row[columnMapping.campusAmbassadors]?.toString().trim() || "",
            eventDate: row[columnMapping.eventDate]?.toString().trim() || "",
            email: row[columnMapping.email]?.toString().trim() || "",
            score: row[columnMapping.score] || "0",
            emailAddress: row[columnMapping.emailAddress]?.toString().trim() || "",
            reportLink: row[columnMapping.reportLink]?.toString().trim() || "",
            coordinatorDetails: row[columnMapping.coordinatorDetails]?.toString().trim() || "",
            feedback: row[columnMapping.feedback]?.toString().trim() || "",
            mediaLink: row[columnMapping.mediaLink]?.toString().trim() || "",
            newspaperPhotos: row[columnMapping.newspaperPhotos]?.toString().trim() || "",
            photosVideos: row[columnMapping.photosVideos]?.toString().trim() || "",
            udiseCode: "N/A",
            district: extractDistrict(row[columnMapping.stateDistrict]?.toString().trim() || ""),
            validUdiseCode: "Yes",
            approved: Math.random() > 0.3 ? "✓" : "X",
            duplicatedFrom: "-",
            // Extract photo IDs from media links
            photoIds: extractDriveImageIds(row[columnMapping.photosVideos]?.toString().trim() || ""),
            newspaperPhotoIds: extractDriveImageIds(row[columnMapping.newspaperPhotos]?.toString().trim() || "")
          }));
        }
      }

      setData(apiData);
      
      const stats = {
        totalInstitutes: apiData.length,
        totalParticipants: apiData.reduce((sum, item) => sum + (item.totalParticipants || 0), 0),
        totalGirls: apiData.reduce((sum, item) => sum + (item.totalGirls || 0), 0),
        totalFaculty: apiData.reduce((sum, item) => sum + (item.totalFaculty || 0), 0),
        totalEvents: apiData.length
      };
      
      setSummaryStats(stats);
      setCurrentPage(1);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(true);
      setLoading(false);
    }
  };

  const extractDistrict = (stateDistrict) => {
    if (!stateDistrict) return "Not Specified";
    const parts = stateDistrict.split(/[,|-|and]/);
    if (parts.length > 1) {
      return parts[1].trim();
    }
    return stateDistrict.trim();
  };

  const districts = useMemo(() => {
    const uniqueDistricts = ["All districts", ...new Set(
      data.map(item => item.district).filter(Boolean)
    )];
    return uniqueDistricts;
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesInstitute = instituteSearch === "" || 
        row.instituteName?.toLowerCase().includes(instituteSearch.toLowerCase());
      const matchesDistrict = selectedDistrict === "All districts" || 
        row.district === selectedDistrict;
      return matchesInstitute && matchesDistrict;
    });
  }, [data, instituteSearch, selectedDistrict]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    fetchData();
  }, []);

  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const openPhotoGallery = (photos, startIndex = 0) => {
    setCurrentPhotoUrls(photos);
    setCurrentPhotoIndex(startIndex);
    setShowPhotoGallery(true);
  };

  const formatAmbassadors = (ambassadors) => {
    if (!ambassadors) return "No data";
    return ambassadors.split('\n').map((line, i) => (
      <div key={i} className="text-xs sm:text-sm py-1 border-b last:border-0 whitespace-pre-wrap break-words">{line}</div>
    ));
  };

  // Photo Gallery Modal Component
  const PhotoGalleryModal = () => {
    if (!showPhotoGallery || currentPhotoUrls.length === 0) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
        <button 
          onClick={() => setShowPhotoGallery(false)}
          className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-50"
        >
          &times;
        </button>
        
        <div className="relative w-full max-w-6xl max-h-screen">
          {/* Main Image/Preview */}
          <div className="relative h-[80vh] flex items-center justify-center">
            {currentPhotoUrls[currentPhotoIndex]?.view ? (
              <iframe
                src={currentPhotoUrls[currentPhotoIndex].view}
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
            ) : (
              <img
                src={currentPhotoUrls[currentPhotoIndex]?.thumbnail}
                alt={`Photo ${currentPhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>
          
          {/* Navigation Arrows */}
          {currentPhotoUrls.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : currentPhotoUrls.length - 1))}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-3xl w-12 h-12 rounded-full flex items-center justify-center"
              >
                ‹
              </button>
              <button
                onClick={() => setCurrentPhotoIndex(prev => (prev < currentPhotoUrls.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-3xl w-12 h-12 rounded-full flex items-center justify-center"
              >
                ›
              </button>
            </>
          )}
          
          {/* Thumbnail Strip */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 overflow-x-auto px-4 py-2">
            {currentPhotoUrls.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPhotoIndex(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentPhotoIndex ? 'border-blue-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={photo.thumbnail} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const MobileCard = ({ row, index }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs text-gray-400">#{startIndex + index + 1}</span>
        <button 
          onClick={() => toggleRowExpansion(row.id)}
          className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors"
        >
          {expandedRow === row.id ? "▼ Show Less" : "▶ View Details"}
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="border-l-4 border-blue-500 pl-3">
          <h3 className="font-semibold text-gray-900">{row.instituteName}</h3>
          <p className="text-xs text-gray-500 mt-1">{row.address}</p>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg text-center">
            <span className="text-xs text-gray-600 block">Participants</span>
            <span className="text-base font-bold text-blue-600">{row.totalParticipants}</span>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-2 rounded-lg text-center">
            <span className="text-xs text-gray-600 block">Girls</span>
            <span className="text-base font-bold text-pink-600">{row.totalGirls}</span>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-2 rounded-lg text-center">
            <span className="text-xs text-gray-600 block">Faculty</span>
            <span className="text-base font-bold text-purple-600">{row.totalFaculty}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span>📍</span> {row.district}
          </span>
          <span className="flex items-center gap-1">
            <span>📅</span> {row.eventDate}
          </span>
        </div>

        {/* Photo preview on mobile */}
        {(row.photoIds?.length > 0 || row.newspaperPhotoIds?.length > 0) && (
          <div className="mt-2">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {row.photoIds?.slice(0, 3).map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => openPhotoGallery(row.photoIds, idx)}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition"
                >
                  <img src={photo.thumbnail} alt={`Event ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
              {row.newspaperPhotoIds?.length > 0 && (
                <button
                  onClick={() => openPhotoGallery(row.newspaperPhotoIds)}
                  className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-200 transition"
                >
                  📰 {row.newspaperPhotoIds.length}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {expandedRow === row.id && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <MobileExpandedDetails row={row} />
        </div>
      )}
    </div>
  );

  const MobileExpandedDetails = ({ row }) => (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-sm mb-2 text-gray-700">Event Details</h4>
        <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
          <p><span className="font-medium text-gray-600">Email:</span> {row.email || 'N/A'}</p>
          <p><span className="font-medium text-gray-600">Coordinator:</span> {row.coordinatorDetails || 'N/A'}</p>
          <p><span className="font-medium text-gray-600">Score:</span> {row.score}</p>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold text-sm mb-2 text-gray-700">Campus Ambassadors</h4>
        <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
          {formatAmbassadors(row.campusAmbassadors)}
        </div>
      </div>
      
      {/* All Photos section in expanded view */}
      {(row.photoIds?.length > 0 || row.newspaperPhotoIds?.length > 0) && (
        <div>
          <h4 className="font-semibold text-sm mb-2 text-gray-700">Photos & Media</h4>
          <div className="space-y-3">
            {row.photoIds?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Event Photos ({row.photoIds.length})</p>
                <div className="grid grid-cols-4 gap-1">
                  {row.photoIds.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => openPhotoGallery(row.photoIds, idx)}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition"
                    >
                      <img src={photo.thumbnail} alt={`Event ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {row.newspaperPhotoIds?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Newspaper Clippings ({row.newspaperPhotoIds.length})</p>
                <div className="grid grid-cols-4 gap-1">
                  {row.newspaperPhotoIds.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => openPhotoGallery(row.newspaperPhotoIds, idx)}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition"
                    >
                      <img src={photo.thumbnail} alt={`Newspaper ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {row.reportLink && (
        <a href={row.reportLink} target="_blank" rel="noopener noreferrer" 
           className="inline-flex items-center gap-2 text-blue-600 text-sm bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition">
          <span>📄</span> View Report
        </a>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <PhotoGalleryModal />
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-gray-200">
          
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Disaster Ready School Dashboard</h1>
                <p className="text-xs sm:text-sm text-blue-100 mt-1">Real-time monitoring of school preparedness campaigns</p>
              </div>
              
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden bg-white/20 p-2 rounded-lg text-white hover:bg-white/30 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filters Section with modern design */}
          <div className="border-b border-gray-200 bg-white">
            <div className="p-4 sm:p-6">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-between w-full sm:hidden mb-2 text-gray-700"
              >
                <h2 className="text-lg font-semibold">Filters & Controls</h2>
                <span className="text-2xl">{showFilters ? "−" : "+"}</span>
              </button>
              
              <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
                <h2 className="text-lg font-semibold text-gray-700 mb-4 hidden sm:block">Filters & Controls</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Search Institute
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type institute name..."
                        value={instituteSearch}
                        onChange={(e) => {
                          setInstituteSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                      />
                      <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">District</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {districts.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>

                  <div className="hidden sm:block">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date Range</label>
                    <input
                      type="text"
                      placeholder="Coming soon"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-gray-50 cursor-not-allowed"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>All statuses</option>
                      <option>Approved</option>
                      <option>Not Approved</option>
                    </select>
                  </div>

                  <div className="hidden xl:block">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">UDISE Updated</label>
                    <select
                      value={udiseUpdated}
                      onChange={(e) => {
                        setUdiseUpdated(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>All schools</option>
                      <option>Updated</option>
                      <option>Not updated</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-4 gap-3">
                  <button
                    onClick={fetchData}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </button>
                  <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                    <span>📥</span> Download Report ({filteredData.length})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading/Error States with animations */}
          {loading && (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-blue-600">Loading data...</p>
            </div>
          )}

          {error && (
            <div className="p-12 text-center">
              <div className="text-red-500 text-5xl mb-3">⚠️</div>
              <p className="text-red-600 font-medium">Error fetching API. Please try again.</p>
              <button
                onClick={fetchData}
                className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-red-700 transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* Summary Cards with gradients */}
          {!loading && !error && data.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 sm:p-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border border-blue-200">
                <p className="text-xs sm:text-sm text-blue-700 font-medium">Institutes</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-800">{summaryStats.totalInstitutes}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-xl border border-green-200">
                <p className="text-xs sm:text-sm text-green-700 font-medium">Participants</p>
                <p className="text-lg sm:text-2xl font-bold text-green-800">{summaryStats.totalParticipants}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-3 sm:p-4 rounded-xl border border-pink-200">
                <p className="text-xs sm:text-sm text-pink-700 font-medium">Girls</p>
                <p className="text-lg sm:text-2xl font-bold text-pink-800">{summaryStats.totalGirls}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-xl border border-purple-200">
                <p className="text-xs sm:text-sm text-purple-700 font-medium">Faculty</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-800">{summaryStats.totalFaculty}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-4 rounded-xl border border-orange-200">
                <p className="text-xs sm:text-sm text-orange-700 font-medium">Events</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-800">{summaryStats.totalEvents}</p>
              </div>
            </div>
          )}

          {/* Desktop Table View with modern styling */}
          {currentData.length > 0 && (
            <div>
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institute</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Girls</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentData.map((row, index) => (
                      <React.Fragment key={row.id}>
                        <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedRow === row.id ? 'bg-blue-50' : ''}`} 
                            onClick={() => toggleRowExpansion(row.id)}>
                          <td className="px-6 py-4 text-sm text-gray-500 align-top">{startIndex + index + 1}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 align-top max-w-xs">
                            {row.instituteName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 align-top max-w-xs break-words">
                            {row.address}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 align-top font-semibold">{row.totalParticipants}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 align-top font-semibold">{row.totalGirls}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 align-top font-semibold">{row.totalFaculty}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 align-top">
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                              {row.district}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 align-top">{row.eventDate}</td>
                          <td className="px-6 py-4 text-sm align-top">
                            {(row.photoIds?.length > 0 || row.newspaperPhotoIds?.length > 0) && (
                              <div className="flex gap-1">
                                {row.photoIds?.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openPhotoGallery(row.photoIds);
                                    }}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded text-xs"
                                  >
                                    📸 {row.photoIds.length}
                                  </button>
                                )}
                                {row.newspaperPhotoIds?.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openPhotoGallery(row.newspaperPhotoIds);
                                    }}
                                    className="flex items-center gap-1 text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded text-xs"
                                  >
                                    📰 {row.newspaperPhotoIds.length}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm align-top">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpansion(row.id);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                            >
                              {expandedRow === row.id ? "▼" : "▶"} Details
                            </button>
                          </td>
                        </tr>
                        {expandedRow === row.id && (
                          <tr className="bg-blue-50">
                            <td colSpan="10" className="px-6 py-6">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="bg-white p-4 rounded-xl shadow-sm">
                                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                                      Event Details
                                    </h3>
                                    <div className="space-y-2">
                                      <p><span className="font-medium text-gray-600">Email:</span> {row.email || 'N/A'}</p>
                                      <p><span className="font-medium text-gray-600">Email Address:</span> {row.emailAddress || 'N/A'}</p>
                                      <p><span className="font-medium text-gray-600">Score:</span> {row.score}</p>
                                      <p><span className="font-medium text-gray-600">Coordinator:</span> {row.coordinatorDetails || 'N/A'}</p>
                                      <p><span className="font-medium text-gray-600">Feedback:</span> {row.feedback || 'Not provided'}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-white p-4 rounded-xl shadow-sm">
                                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                                      Links & Reports
                                    </h3>
                                    <div className="space-y-2">
                                      {row.reportLink && (
                                        <a href={row.reportLink} target="_blank" rel="noopener noreferrer" 
                                           className="flex items-center gap-2 text-blue-600 hover:underline break-all">
                                          <span className="text-xl">📄</span> View Report
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <div className="bg-white p-4 rounded-xl shadow-sm">
                                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                                      Campus Ambassadors
                                    </h3>
                                    <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                                      {formatAmbassadors(row.campusAmbassadors)}
                                    </div>
                                  </div>
                                  
                                  <div className="bg-white p-4 rounded-xl shadow-sm">
                                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                                      Additional Info
                                    </h3>
                                    <p><span className="font-medium text-gray-600">State & District:</span> {row.stateDistrict}</p>
                                    <p><span className="font-medium text-gray-600">Timestamp:</span> {row.timestamp}</p>
                                  </div>

                                  {/* Photos in expanded desktop view */}
                                  {(row.photoIds?.length > 0 || row.newspaperPhotoIds?.length > 0) && (
                                    <div className="bg-white p-4 rounded-xl shadow-sm">
                                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-pink-500 rounded-full"></span>
                                        Media Gallery
                                      </h3>
                                      <div className="space-y-4">
                                        {row.photoIds?.length > 0 && (
                                          <div>
                                            <p className="text-sm font-medium text-gray-600 mb-2">Event Photos</p>
                                            <div className="grid grid-cols-4 gap-2">
                                              {row.photoIds.slice(0, 4).map((photo, idx) => (
                                                <button
                                                  key={idx}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openPhotoGallery(row.photoIds, idx);
                                                  }}
                                                  className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all hover:scale-105"
                                                >
                                                  <img src={photo.thumbnail} alt={`Event ${idx + 1}`} className="w-full h-full object-cover" />
                                                </button>
                                              ))}
                                              {row.photoIds.length > 4 && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openPhotoGallery(row.photoIds, 4);
                                                  }}
                                                  className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-600 hover:bg-gray-200 transition"
                                                >
                                                  +{row.photoIds.length - 4}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {row.newspaperPhotoIds?.length > 0 && (
                                          <div>
                                            <p className="text-sm font-medium text-gray-600 mb-2">Newspaper Clippings</p>
                                            <div className="grid grid-cols-4 gap-2">
                                              {row.newspaperPhotoIds.slice(0, 4).map((photo, idx) => (
                                                <button
                                                  key={idx}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openPhotoGallery(row.newspaperPhotoIds, idx);
                                                  }}
                                                  className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-green-500 transition-all hover:scale-105"
                                                >
                                                  <img src={photo.thumbnail} alt={`Newspaper ${idx + 1}`} className="w-full h-full object-cover" />
                                                </button>
                                              ))}
                                              {row.newspaperPhotoIds.length > 4 && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openPhotoGallery(row.newspaperPhotoIds, 4);
                                                  }}
                                                  className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-600 hover:bg-gray-200 transition"
                                                >
                                                  +{row.newspaperPhotoIds.length - 4}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
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

              {/* Pagination with modern design */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> of{' '}
                  <span className="font-semibold">{filteredData.length}</span> institutes
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-white transition-all flex items-center gap-1"
                  >
                    <span>←</span> Prev
                  </button>
                  
                  <div className="flex gap-1">
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
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'hover:bg-gray-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-white transition-all flex items-center gap-1"
                  >
                    Next <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!loading && !error && data.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Data Available</h3>
              <p className="text-gray-500 mb-4">Click the refresh button to fetch data from the server.</p>
              <button
                onClick={fetchData}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;