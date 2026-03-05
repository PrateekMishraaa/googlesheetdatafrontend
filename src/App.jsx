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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  
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

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const formatAmbassadors = (ambassadors) => {
    if (!ambassadors) return "No data";
    return ambassadors.split('\n').map((line, i) => (
      <div key={i} className="text-xs sm:text-sm py-2 border-b last:border-0 whitespace-pre-wrap break-words hover:bg-indigo-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-sm rounded px-2">
        <span className="inline-block w-5 h-5 bg-indigo-100 rounded-full text-center text-indigo-600 mr-2 text-xs">
          {i + 1}
        </span>
        {line}
      </div>
    ));
  };

  // Animation classes with staggered delays
  const getAnimationClass = (index, baseClass) => {
    const animations = {
      fadeInUp: `animate-fadeInUp opacity-0 [animation-fill-mode:forwards] [animation-delay:${index * 100}ms]`,
      slideIn: `animate-slideIn opacity-0 [animation-fill-mode:forwards] [animation-delay:${index * 100}ms]`,
      scaleIn: `animate-scaleIn opacity-0 [animation-fill-mode:forwards] [animation-delay:${index * 100}ms]`,
      rotateIn: `animate-rotateIn opacity-0 [animation-fill-mode:forwards] [animation-delay:${index * 100}ms]`
    };
    return animations[baseClass] || animations.fadeInUp;
  };

  const StatCard = ({ title, value, color, icon, delay, index }) => {
    const colors = {
      blue: {
        bg: "from-blue-500 to-indigo-600",
        light: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-200",
        shadow: "shadow-blue-200"
      },
      green: {
        bg: "from-green-500 to-emerald-600",
        light: "bg-green-50",
        text: "text-green-600",
        border: "border-green-200",
        shadow: "shadow-green-200"
      },
      pink: {
        bg: "from-pink-500 to-rose-600",
        light: "bg-pink-50",
        text: "text-pink-600",
        border: "border-pink-200",
        shadow: "shadow-pink-200"
      },
      purple: {
        bg: "from-purple-500 to-violet-600",
        light: "bg-purple-50",
        text: "text-purple-600",
        border: "border-purple-200",
        shadow: "shadow-purple-200"
      },
      orange: {
        bg: "from-orange-500 to-amber-600",
        light: "bg-orange-50",
        text: "text-orange-600",
        border: "border-orange-200",
        shadow: "shadow-orange-200"
      }
    };

    return (
      <div 
        className={`relative group ${getAnimationClass(index, 'scaleIn')}`}
        onMouseEnter={() => setHoveredCard(title)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        {/* Animated background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r ${colors[color].bg} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl`}></div>
        
        {/* Main card */}
        <div className={`relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 transform transition-all duration-500 
                        group-hover:scale-105 group-hover:-translate-y-2 group-hover:shadow-2xl 
                        border border-gray-100 overflow-hidden`}>
          
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                          translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
              <p className={`text-3xl font-bold ${colors[color].text} transition-all duration-300 
                            group-hover:scale-110 group-hover:translate-x-1`}>
                {value.toLocaleString()}
              </p>
              
              {/* Animated progress bar */}
              <div className="mt-3 w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${colors[color].bg} rounded-full transition-all duration-1000 
                                ${hoveredCard === title ? 'w-full' : 'w-2/3'}`}></div>
              </div>
            </div>
            
            {/* Animated icon container */}
            <div className={`relative ${colors[color].light} p-4 rounded-2xl group-hover:rotate-12 transition-transform duration-300`}>
              <div className={`absolute inset-0 bg-gradient-to-r ${colors[color].bg} rounded-2xl opacity-0 group-hover:opacity-20 blur-md transition-opacity`}></div>
              <span className={`text-3xl relative z-10 animate-float`}>{icon}</span>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${colors[color].bg} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
        </div>
      </div>
    );
  };

  const MobileCard = ({ row, index }) => (
    <div 
      className={`relative group ${getAnimationClass(index, 'fadeInUp')}`}
      onMouseEnter={() => setHoveredCard(row.id)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
      
      <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 mb-4 transform transition-all duration-500 
                      hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl border border-gray-100">
        
        {/* Animated border gradient */}
        <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-white rounded-2xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-xs font-medium shadow-lg">
              #{startIndex + index + 1}
            </span>
            <button 
              onClick={() => toggleRowExpansion(row.id)}
              className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-all flex items-center gap-1 group/btn"
            >
              <span>{expandedRow === row.id ? "Show Less" : "View Details"}</span>
              <span className={`transform transition-transform duration-300 ${expandedRow === row.id ? 'rotate-180' : 'group-hover/btn:translate-x-1'}`}>
                {expandedRow === row.id ? "↑" : "→"}
              </span>
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <h3 className="font-bold text-gray-900 text-lg group-hover:text-transparent group-hover:bg-clip-text 
                           group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                {row.instituteName}
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2 flex items-start gap-1">
                <span className="text-gray-400">📍</span>
                {row.address}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Participants", value: row.totalParticipants, color: "blue", icon: "👥" },
                { label: "Girls", value: row.totalGirls, color: "pink", icon: "👧" },
                { label: "Faculty", value: row.totalFaculty, color: "purple", icon: "👨‍🏫" }
              ].map((item, i) => (
                <div key={i} className={`relative group/stat overflow-hidden rounded-xl bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 p-2 text-center`}>
                  <div className={`absolute inset-0 bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 opacity-0 group-hover/stat:opacity-10 transition-opacity duration-300`}></div>
                  <span className="text-xs text-gray-600 block">{item.label}</span>
                  <span className={`text-sm font-bold text-${item.color}-600 group-hover/stat:scale-110 inline-block transition-transform`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-xs border-t pt-2">
              <span className="flex items-center gap-1 text-gray-600">
                <span className="animate-pulse-slow">📍</span> {row.district}
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <span className="animate-pulse-slow">📅</span> {row.eventDate}
              </span>
            </div>
          </div>
          
          {expandedRow === row.id && (
            <div className="mt-4 pt-4 border-t border-gray-200 animate-slideDown">
              <MobileExpandedDetails row={row} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const MobileExpandedDetails = ({ row }) => (
    <div className="space-y-4">
      <div className="relative group/details">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl opacity-0 group-hover/details:opacity-10 transition-opacity"></div>
        <div className="relative bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></span>
            Event Details
          </h4>
          <div className="space-y-2 text-sm">
            <p className="flex items-start gap-2 group/item">
              <span className="font-medium min-w-[70px] text-gray-600">Email:</span>
              <span className="text-gray-800 break-all group-hover/item:text-blue-600 transition-colors">{row.email}</span>
            </p>
            <p className="flex items-start gap-2 group/item">
              <span className="font-medium min-w-[70px] text-gray-600">Coordinator:</span>
              <span className="text-gray-800 group-hover/item:text-purple-600 transition-colors">{row.coordinatorDetails}</span>
            </p>
            <p className="flex items-start gap-2 group/item">
              <span className="font-medium min-w-[70px] text-gray-600">Score:</span>
              <span className="text-gray-800 group-hover/item:text-green-600 transition-colors">{row.score}</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="relative group/details">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl opacity-0 group-hover/details:opacity-10 transition-opacity"></div>
        <div className="relative bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse"></span>
            Campus Ambassadors
          </h4>
          <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100 rounded-lg">
            {formatAmbassadors(row.campusAmbassadors)}
          </div>
        </div>
      </div>
      
      {row.reportLink && (
        <a 
          href={row.reportLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="relative group/link block"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl opacity-0 group-hover/link:opacity-20 transition-opacity blur"></div>
          <div className="relative flex items-center gap-3 text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all border border-green-200 group-hover/link:scale-[1.02]">
            <span className="text-2xl group-hover/link:rotate-12 transition-transform">📄</span>
            <span className="text-sm font-medium">View Full Report</span>
            <span className="ml-auto group-hover/link:translate-x-1 transition-transform">→</span>
          </div>
        </a>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-float-particle"
            style={{
              width: `${Math.random() * 300 + 50}px`,
              height: `${Math.random() * 300 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-110 hover:rotate-12 z-50 group animate-bounce-slow"
        >
          <span className="block transform group-hover:-translate-y-1 transition-transform">↑</span>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
        </button>
      )}

      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 relative z-10">
        <div className="bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/50 relative group/main">
          
          {/* Animated header gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover/main:opacity-5 transition-opacity duration-1000"></div>
          
          {/* Header with animated gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
              <div className="text-white">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 animate-gradient-x bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent bg-300%">
                  Disaster Ready School Dashboard
                </h1>
                <p className="text-blue-100 text-sm sm:text-base flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                  Real-time monitoring of campaign submissions
                </p>
              </div>
              
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden bg-white/20 p-3 rounded-xl hover:bg-white/30 transition-all backdrop-blur-sm border border-white/30"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filters Section with enhanced design */}
          <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
            <div className="p-4 sm:p-6">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-between w-full sm:hidden mb-2 text-gray-700 group"
              >
                <span className="font-semibold text-lg">Filters & Search</span>
                <span className={`transform transition-all duration-500 ${showFilters ? 'rotate-180' : ''} group-hover:scale-110`}>
                  ▼
                </span>
              </button>
              
              <div className={`${showFilters ? 'block' : 'hidden'} sm:block animate-slideDown`}>
                <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4 hidden sm:block">
                  Advanced Filters
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Search Institute
                    </label>
                    <div className="relative group/input">
                      <input
                        type="text"
                        placeholder="Type institute name..."
                        value={instituteSearch}
                        onChange={(e) => {
                          setInstituteSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all pl-11
                                  ${searchFocused 
                                    ? 'border-blue-500 ring-4 ring-blue-100 shadow-lg' 
                                    : 'border-gray-200 hover:border-blue-300'}`}
                      />
                      <span className={`absolute left-4 top-3.5 text-gray-400 transition-all duration-300 
                                      ${searchFocused ? 'scale-110 text-blue-500' : ''}`}>
                        🔍
                      </span>
                      
                      {/* Animated search suggestions */}
                      {searchFocused && instituteSearch && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-slideDown">
                          <div className="p-3 text-sm text-gray-600">
                            Press Enter to search...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      District
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all appearance-none bg-white hover:border-blue-300"
                    >
                      {districts.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>

                  <div className="hidden sm:block">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Date Range
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Select date"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 cursor-not-allowed"
                        disabled
                      />
                      <span className="absolute right-3 top-3 text-gray-400">📅</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    >
                      <option>All statuses</option>
                      <option>Approved</option>
                      <option>Not Approved</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-6 gap-3">
                  <button
                    onClick={fetchData}
                    className="relative group/btn overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-medium hover:shadow-2xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 blur"></div>
                    <span className="relative flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Data
                    </span>
                  </button>
                  
                  <button className="relative group/btn overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl text-sm font-medium hover:shadow-2xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 blur"></div>
                    <span className="relative flex items-center justify-center gap-2">
                      <span>📥</span> Download Report ({filteredData.length})
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State with enhanced animation */}
          {loading && (
            <div className="p-16 text-center">
              <div className="relative inline-block">
                <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="mt-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-medium animate-pulse">
                Loading dashboard data...
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {/* Error State with enhanced animation */}
          {error && (
            <div className="p-16 text-center animate-shake">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-red-200 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-gradient-to-br from-red-100 to-red-200 rounded-full p-8">
                  <span className="text-5xl animate-wiggle">⚠️</span>
                </div>
              </div>
              <p className="mt-6 text-red-600 font-medium text-lg">Error fetching API. Please try again.</p>
              <button
                onClick={fetchData}
                className="mt-6 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-xl hover:shadow-2xl transition-all transform hover:scale-105 hover:rotate-1"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Summary Cards with enhanced design */}
          {!loading && !error && data.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 sm:p-6">
              <StatCard title="Total Institutes" value={summaryStats.totalInstitutes} color="blue" icon="🏫" delay={0} index={0} />
              <StatCard title="Total Participants" value={summaryStats.totalParticipants} color="green" icon="👥" delay={100} index={1} />
              <StatCard title="Girls Trained" value={summaryStats.totalGirls} color="pink" icon="👧" delay={200} index={2} />
              <StatCard title="Faculty Trained" value={summaryStats.totalFaculty} color="purple" icon="👨‍🏫" delay={300} index={3} />
              <StatCard title="Total Events" value={summaryStats.totalEvents} color="orange" icon="📊" delay={400} index={4} />
            </div>
          )}

          {/* Table/View with enhanced design */}
          {currentData.length > 0 && (
            <div>
              {/* Desktop Table with glass morphism */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                    <tr>
                      {["S.No", "Institute Name", "Address", "Participants", "Girls", "Faculty", "District", "Event Date", "Actions"].map((header, idx) => (
                        <th key={idx} className="px-4 py-4 text-left text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-gray-900 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-gray-200">
                    {currentData.map((row, index) => (
                      <React.Fragment key={row.id}>
                        <tr 
                          className="group/row hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 cursor-pointer transition-all duration-500 transform hover:scale-[1.01] hover:shadow-xl relative"
                          onClick={() => toggleRowExpansion(row.id)}
                        >
                          {/* Animated row highlight */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover/row:opacity-5 transition-opacity duration-500"></div>
                          
                          <td className="px-4 py-4 text-sm text-gray-900 align-top relative">
                            <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {startIndex + index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-gray-900 align-top whitespace-normal break-words max-w-xs relative group/cell">
                            {row.instituteName}
                            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover/cell:w-full transition-all duration-300"></div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 align-top whitespace-normal break-words max-w-xs relative">
                            {row.address}
                          </td>
                          <td className="px-4 py-4 text-sm align-top">
                            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg shadow-blue-200 group-hover/row:scale-110 transition-transform inline-block">
                              {row.totalParticipants}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm align-top">
                            <span className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg shadow-pink-200 group-hover/row:scale-110 transition-transform inline-block">
                              {row.totalGirls}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm align-top">
                            <span className="bg-gradient-to-r from-purple-500 to-violet-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg shadow-purple-200 group-hover/row:scale-110 transition-transform inline-block">
                              {row.totalFaculty}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 align-top whitespace-normal break-words relative">
                            <span className="flex items-center gap-1">
                              <span className="text-gray-400">📍</span>
                              {row.district}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 align-top">
                            <span className="flex items-center gap-1">
                              <span className="text-gray-400">📅</span>
                              {row.eventDate}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm align-top">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpansion(row.id);
                              }}
                              className="relative group/btn text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-medium flex items-center gap-1 transition-all hover:gap-2"
                            >
                              <span>{expandedRow === row.id ? "▼" : "▶"}</span>
                              Details
                              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover/btn:w-full transition-all duration-300"></span>
                            </button>
                          </td>
                        </tr>
                        {expandedRow === row.id && (
                          <tr className="bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-pink-50/90 backdrop-blur-sm animate-slideDown">
                            <td colSpan="9" className="px-4 py-6">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="relative group/details bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50 transform hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl opacity-0 group-hover/details:opacity-5 transition-opacity"></div>
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                      <span className="w-1.5 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></span>
                                      Event Details
                                    </h3>
                                    <div className="space-y-3">
                                      <p className="whitespace-normal break-words group/item"><span className="font-medium text-gray-600">Email:</span> <span className="text-gray-800 group-hover/item:text-blue-600 transition-colors">{row.email}</span></p>
                                      <p className="whitespace-normal break-words group/item"><span className="font-medium text-gray-600">Email Address:</span> <span className="text-gray-800 group-hover/item:text-purple-600 transition-colors">{row.emailAddress}</span></p>
                                      <p className="group/item"><span className="font-medium text-gray-600">Score:</span> <span className="text-gray-800 group-hover/item:text-green-600 transition-colors">{row.score}</span></p>
                                      <p className="whitespace-normal break-words group/item"><span className="font-medium text-gray-600">Coordinator:</span> <span className="text-gray-800 group-hover/item:text-indigo-600 transition-colors">{row.coordinatorDetails}</span></p>
                                      <p className="whitespace-normal break-words group/item"><span className="font-medium text-gray-600">Feedback:</span> <span className="text-gray-800 group-hover/item:text-pink-600 transition-colors">{row.feedback || "Not provided"}</span></p>
                                    </div>
                                  </div>
                                  
                                  <div className="relative group/details bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50 transform hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl opacity-0 group-hover/details:opacity-5 transition-opacity"></div>
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                      <span className="w-1.5 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-pulse"></span>
                                      Links & Resources
                                    </h3>
                                    <div className="space-y-2">
                                      {row.reportLink && (
                                        <a href={row.reportLink} target="_blank" rel="noopener noreferrer" 
                                           className="group/link flex items-center gap-3 text-blue-600 bg-blue-50/80 p-3 rounded-xl hover:bg-blue-100 transition-all hover:scale-[1.02] hover:shadow-lg">
                                          <span className="text-xl group-hover/link:rotate-12 transition-transform">📄</span>
                                          <span className="font-medium">View Report</span>
                                          <span className="ml-auto group-hover/link:translate-x-1 transition-transform">→</span>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <div className="relative group/details bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50 transform hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl opacity-0 group-hover/details:opacity-5 transition-opacity"></div>
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                      <span className="w-1.5 h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse"></span>
                                      Campus Ambassadors
                                    </h3>
                                    <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100 rounded-xl border border-purple-100">
                                      {formatAmbassadors(row.campusAmbassadors)}
                                    </div>
                                  </div>
                                  
                                  <div className="relative group/details bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50 transform hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl opacity-0 group-hover/details:opacity-5 transition-opacity"></div>
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                      <span className="w-1.5 h-6 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full animate-pulse"></span>
                                      Additional Information
                                    </h3>
                                    <p className="whitespace-normal break-words group/item"><span className="font-medium text-gray-600">State & District:</span> <span className="text-gray-800 group-hover/item:text-orange-600 transition-colors">{row.stateDistrict}</span></p>
                                    <p className="group/item"><span className="font-medium text-gray-600">Date And Time:</span> <span className="text-gray-800 group-hover/item:text-amber-600 transition-colors">{row.timestamp}</span></p>
                                  </div>
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

              {/* Enhanced Pagination */}
              <div className="px-4 py-6 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-t border-gray-200 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{startIndex + 1}</span> to{' '}
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      {Math.min(startIndex + itemsPerPage, filteredData.length)}
                    </span> of{' '}
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      {filteredData.length}
                    </span> institutes
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="group/btn relative px-4 py-2 bg-white rounded-xl text-sm disabled:opacity-50 hover:shadow-xl transition-all transform hover:scale-105 disabled:hover:scale-100 border border-gray-200 hover:border-blue-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                      <span className="relative flex items-center gap-1">
                        ← Prev
                      </span>
                    </button>
                    
                    <div className="flex gap-2">
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
                            className={`relative w-10 h-10 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-110 group/btn overflow-hidden
                              ${currentPage === pageNum
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-200'
                                : 'bg-white text-gray-700 hover:shadow-lg border border-gray-200 hover:border-blue-300'
                              }`}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 ${currentPage !== pageNum && 'group-hover/btn:opacity-10'} transition-opacity`}></div>
                            <span className="relative">{pageNum}</span>
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="group/btn relative px-4 py-2 bg-white rounded-xl text-sm disabled:opacity-50 hover:shadow-xl transition-all transform hover:scale-105 disabled:hover:scale-100 border border-gray-200 hover:border-blue-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                      <span className="relative flex items-center gap-1">
                        Next →
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Data State with enhanced design */}
          {!loading && !error && data.length === 0 && (
            <div className="p-16 text-center animate-fadeIn">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-8">
                  <span className="text-6xl animate-float">📊</span>
                </div>
              </div>
              <h3 className="mt-6 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                No Data Available
              </h3>
              <p className="mt-2 text-gray-500">Click "Refresh Data" to fetch the latest information.</p>
              <button
                onClick={fetchData}
                className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-2xl transition-all transform hover:scale-105 hover:rotate-1"
              >
                Refresh Now
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes rotateIn {
          from {
            opacity: 0;
            transform: rotate(-15deg) scale(0.8);
          }
          to {
            opacity: 1;
            transform: rotate(0) scale(1);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes float-particle {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -20px) rotate(90deg); }
          50% { transform: translate(40px, 0) rotate(180deg); }
          75% { transform: translate(20px, 20px) rotate(270deg); }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }

        .animate-slideIn {
          animation: slideIn 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }

        .animate-rotateIn {
          animation: rotateIn 0.7s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }

        .animate-slideDown {
          animation: slideDown 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }

        .animate-shake {
          animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-particle {
          animation: float-particle linear infinite;
        }

        .animate-wiggle {
          animation: wiggle 1s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s infinite;
        }

        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
          background-size: 300% 100%;
        }

        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce 2s ease-in-out infinite;
        }

        .bg-grid-white {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 30px 30px;
        }

        .bg-300\% {
          background-size: 300% 100%;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #c084fc;
          border-radius: 10px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #a855f7;
        }

        .scrollbar-thumb-purple-300::-webkit-scrollbar-thumb {
          background: #d8b4fe;
        }

        .scrollbar-track-purple-100::-webkit-scrollbar-track {
          background: #f3e8ff;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        [animation-delay] {
          animation-delay: attr(animation-delay ms);
        }
      `}</style>
    </div>
  );
};

export default App;