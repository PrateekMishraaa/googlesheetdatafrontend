import React, { useState, useMemo, useEffect, createContext, useContext } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// Theme Context
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Toggle Button Component
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 ${
        isDark 
          ? 'bg-yellow-400 hover:bg-yellow-300 text-gray-900' 
          : 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
      }`}
    >
      <motion.div
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-6 h-6"
      >
        {isDark ? '☀️' : '🌙'}
      </motion.div>
    </motion.button>
  );
};

const App = () => {
  const { isDark } = useTheme();
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

  // Theme-based styles
  const themeStyles = {
    background: isDark 
      ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
      : 'bg-gradient-to-br from-gray-50 to-gray-100',
    cardBg: isDark 
      ? 'bg-gray-800/90 border-gray-700' 
      : 'bg-white/80 border-gray-200',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      muted: isDark ? 'text-gray-400' : 'text-gray-500',
    },
    header: isDark 
      ? 'bg-gradient-to-r from-blue-800 to-indigo-900' 
      : 'bg-gradient-to-r from-blue-600 to-indigo-600',
    table: {
      header: isDark ? 'bg-gray-700' : 'bg-gray-50',
      row: isDark ? 'bg-gray-800' : 'bg-white',
      rowHover: isDark ? 'bg-gray-700' : 'bg-gray-50',
      border: isDark ? 'border-gray-700' : 'border-gray-200',
    },
    filter: {
      bg: isDark ? 'bg-gray-800' : 'bg-white',
      input: isDark 
        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
        : 'bg-white border-gray-300 text-gray-900',
      label: isDark ? 'text-gray-300' : 'text-gray-500',
    },
    summary: {
      blue: isDark ? 'from-blue-900/30 to-blue-800/30 border-blue-700' : 'from-blue-50 to-blue-100 border-blue-200',
      green: isDark ? 'from-green-900/30 to-green-800/30 border-green-700' : 'from-green-50 to-green-100 border-green-200',
      pink: isDark ? 'from-pink-900/30 to-pink-800/30 border-pink-700' : 'from-pink-50 to-pink-100 border-pink-200',
      purple: isDark ? 'from-purple-900/30 to-purple-800/30 border-purple-700' : 'from-purple-50 to-purple-100 border-purple-200',
      orange: isDark ? 'from-orange-900/30 to-orange-800/30 border-orange-700' : 'from-orange-50 to-orange-100 border-orange-200',
    },
    pagination: {
      bg: isDark ? 'bg-gray-700' : 'bg-gray-50',
      button: isDark 
        ? 'border-gray-600 text-gray-300 hover:bg-gray-600' 
        : 'border-gray-300 text-gray-600 hover:bg-white',
    }
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const slideInFromLeft = {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 }
  };

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

      // Simulate loading for smoother animation
      setTimeout(() => {
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
      }, 800);
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
      <motion.div 
        key={i} 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05 }}
        className={`text-xs sm:text-sm py-1 border-b last:border-0 whitespace-pre-wrap break-words ${
          isDark ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'
        }`}
      >
        {line}
      </motion.div>
    ));
  };

  // Photo Gallery Modal Component with animations
  const PhotoGalleryModal = () => {
    if (!showPhotoGallery || currentPhotoUrls.length === 0) return null;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
        onClick={() => setShowPhotoGallery(false)}
      >
        <motion.button 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setShowPhotoGallery(false);
          }}
          className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all"
        >
          &times;
        </motion.button>
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative w-full max-w-6xl max-h-screen"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Image/Preview */}
          <div className="relative h-[80vh] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhotoIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: "spring", damping: 25 }}
                className="w-full h-full flex items-center justify-center"
              >
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
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Navigation Arrows with animations */}
          {currentPhotoUrls.length > 1 && (
            <>
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : currentPhotoUrls.length - 1));
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 text-white text-3xl w-12 h-12 rounded-full flex items-center justify-center"
              >
                ‹
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPhotoIndex(prev => (prev < currentPhotoUrls.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 text-white text-3xl w-12 h-12 rounded-full flex items-center justify-center"
              >
                ›
              </motion.button>
            </>
          )}
          
          {/* Thumbnail Strip with animations */}
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 overflow-x-auto px-4 py-2"
          >
            {currentPhotoUrls.map((photo, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPhotoIndex(idx);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentPhotoIndex 
                    ? 'border-blue-500 scale-110' 
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={photo.thumbnail} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    );
  };

  const MobileCard = ({ row, index }) => (
    <motion.div 
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ y: -4, boxShadow: isDark 
        ? "0 10px 25px -5px rgba(0,0,0,0.5)" 
        : "0 10px 25px -5px rgba(0,0,0,0.1)" 
      }}
      className={`${themeStyles.cardBg} rounded-xl border p-4 mb-3 shadow-sm transition-all`}
    >
      <div className="flex justify-between items-start mb-3">
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.02 }}
          className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
        >
          #{startIndex + index + 1}
        </motion.span>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toggleRowExpansion(row.id)}
          className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
        >
          {expandedRow === row.id ? "▼ Show Less" : "▶ View Details"}
        </motion.button>
      </div>
      
      <div className="space-y-3">
        <motion.div 
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.03 }}
          className="border-l-4 border-blue-500 pl-3"
        >
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {row.instituteName}
          </h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {row.address}
          </p>
        </motion.div>
        
        <motion.div 
          variants={staggerChildren}
          initial="initial"
          animate="animate"
          className="grid grid-cols-3 gap-2"
        >
          {[
            { label: "Participants", value: row.totalParticipants, color: "blue" },
            { label: "Girls", value: row.totalGirls, color: "pink" },
            { label: "Faculty", value: row.totalFaculty, color: "purple" }
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`bg-gradient-to-br ${
                isDark 
                  ? `from-${item.color}-900/30 to-${item.color}-800/30` 
                  : `from-${item.color}-50 to-${item.color}-100`
              } p-2 rounded-lg text-center transition-all`}
            >
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} block`}>
                {item.label}
              </span>
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: index * 0.02 + i * 0.05 }}
                className={`text-base font-bold text-${item.color}-600 dark:text-${item.color}-400`}
              >
                {item.value}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.04 }}
          className={`flex items-center justify-between text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          <span className="flex items-center gap-1">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >📍</motion.span> {row.district}
          </span>
          <span className="flex items-center gap-1">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >📅</motion.span> {row.eventDate}
          </span>
        </motion.div>

        {/* Photo preview on mobile with animations */}
        {(row.photoIds?.length > 0 || row.newspaperPhotoIds?.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="mt-2"
          >
            <div className="flex gap-1 overflow-x-auto pb-1">
              {row.photoIds?.slice(0, 3).map((photo, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.1, rotate: 2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openPhotoGallery(row.photoIds, idx)}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90 transition"
                >
                  <img src={photo.thumbnail} alt={`Event ${idx + 1}`} className="w-full h-full object-cover" />
                </motion.button>
              ))}
              {row.newspaperPhotoIds?.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: isDark ? "#374151" : "#f3f4f6" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openPhotoGallery(row.newspaperPhotoIds)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs transition ${
                    isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  📰 {row.newspaperPhotoIds.length}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      <AnimatePresence>
        {expandedRow === row.id && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`mt-4 pt-4 border-t overflow-hidden ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <MobileExpandedDetails row={row} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const MobileExpandedDetails = ({ row }) => (
    <motion.div 
      variants={staggerChildren}
      initial="initial"
      animate="animate"
      className="space-y-4"
    >
      <motion.div variants={slideInFromLeft}>
        <h4 className={`font-semibold text-sm mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          Event Details
        </h4>
        <div className={`space-y-2 text-sm p-3 rounded-lg ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <motion.p variants={fadeInUp}>
            <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Email:</span> 
            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}> {row.email || 'N/A'}</span>
          </motion.p>
          <motion.p variants={fadeInUp}>
            <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Coordinator:</span> 
            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}> {row.coordinatorDetails || 'N/A'}</span>
          </motion.p>
          <motion.p variants={fadeInUp}>
            <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Score:</span> 
            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}> {row.score}</span>
          </motion.p>
        </div>
      </motion.div>
      
      <motion.div variants={slideInFromLeft}>
        <h4 className={`font-semibold text-sm mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          Campus Ambassadors
        </h4>
        <div className={`p-3 rounded-lg max-h-40 overflow-y-auto ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          {formatAmbassadors(row.campusAmbassadors)}
        </div>
      </motion.div>
      
      {/* All Photos section in expanded view */}
      {(row.photoIds?.length > 0 || row.newspaperPhotoIds?.length > 0) && (
        <motion.div variants={slideInFromLeft}>
          <h4 className={`font-semibold text-sm mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Photos & Media
          </h4>
          <div className="space-y-3">
            {row.photoIds?.length > 0 && (
              <motion.div variants={fadeInUp}>
                <p className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Event Photos ({row.photoIds.length})
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {row.photoIds.map((photo, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.1, rotate: 2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => openPhotoGallery(row.photoIds, idx)}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90 transition"
                    >
                      <img src={photo.thumbnail} alt={`Event ${idx + 1}`} className="w-full h-full object-cover" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
            
            {row.newspaperPhotoIds?.length > 0 && (
              <motion.div variants={fadeInUp}>
                <p className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Newspaper Clippings ({row.newspaperPhotoIds.length})
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {row.newspaperPhotoIds.map((photo, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.1, rotate: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => openPhotoGallery(row.newspaperPhotoIds, idx)}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90 transition"
                    >
                      <img src={photo.thumbnail} alt={`Newspaper ${idx + 1}`} className="w-full h-full object-cover" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
      
      {row.reportLink && (
        <motion.a 
          href={row.reportLink} 
          target="_blank" 
          rel="noopener noreferrer"
          variants={fadeInUp}
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
          className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition ${
            isDark 
              ? 'text-blue-400 bg-blue-900/30 hover:bg-blue-900/50' 
              : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
          }`}
        >
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >📄</motion.span> View Report
        </motion.a>
      )}
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen transition-colors duration-300 ${themeStyles.background}`}
    >
      <AnimatePresence>
        {showPhotoGallery && <PhotoGalleryModal />}
      </AnimatePresence>
      
      <ThemeToggle />
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className={`${themeStyles.cardBg} backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border transition-colors duration-300`}
        >
          
          {/* Header with gradient and animation */}
          <motion.div 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className={`${themeStyles.header} p-4 sm:p-6 transition-colors duration-300`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.h1 
                  animate={{ 
                    textShadow: ["0 0 0 rgba(255,255,255,0)", "0 0 10px rgba(255,255,255,0.5)", "0 0 0 rgba(255,255,255,0)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-xl sm:text-2xl font-bold text-white"
                >
                  Disaster Ready School Dashboard
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs sm:text-sm text-blue-100 mt-1"
                >
                  Real-time monitoring of school preparedness campaigns
                </motion.p>
              </motion.div>
              
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden bg-white/20 p-2 rounded-lg text-white hover:bg-white/30 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.button>
            </div>
          </motion.div>

          {/* Filters Section with animations */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`border-b transition-colors duration-300 ${
              isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-4 sm:p-6">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-between w-full sm:hidden mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                <h2 className="text-lg font-semibold">Filters & Controls</h2>
                <motion.span 
                  animate={{ rotate: showFilters ? 180 : 0 }}
                  className="text-2xl"
                >
                  {showFilters ? "−" : "+"}
                </motion.span>
              </motion.button>
              
              <AnimatePresence>
                {(showFilters || window.innerWidth >= 640) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className={`text-lg font-semibold mb-4 hidden sm:block ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Filters & Controls
                    </h2>
                    
                    <motion.div 
                      variants={staggerChildren}
                      initial="initial"
                      animate="animate"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
                    >
                      <motion.div variants={fadeInUp} className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                        <label className={`block text-xs font-medium uppercase tracking-wider mb-1 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
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
                            className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10 transition-all ${
                              isDark 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <motion.svg 
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`w-4 h-4 absolute left-3 top-3 ${
                              isDark ? 'text-gray-500' : 'text-gray-400'
                            }`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </motion.svg>
                        </div>
                      </motion.div>

                      <motion.div variants={fadeInUp}>
                        <label className={`block text-xs font-medium uppercase tracking-wider mb-1 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          District
                        </label>
                        <motion.select
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          value={selectedDistrict}
                          onChange={(e) => {
                            setSelectedDistrict(e.target.value);
                            setCurrentPage(1);
                          }}
                          className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          {districts.map(district => (
                            <option key={district} value={district}>{district}</option>
                          ))}
                        </motion.select>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="hidden sm:block">
                        <label className={`block text-xs font-medium uppercase tracking-wider mb-1 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Date Range
                        </label>
                        <input
                          type="text"
                          placeholder="Coming soon"
                          className={`w-full border rounded-lg px-4 py-2.5 text-sm cursor-not-allowed ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-gray-400' 
                              : 'bg-gray-50 border-gray-300 text-gray-500'
                          }`}
                          disabled
                        />
                      </motion.div>

                      <motion.div variants={fadeInUp}>
                        <label className={`block text-xs font-medium uppercase tracking-wider mb-1 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Status
                        </label>
                        <motion.select
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          value={selectedStatus}
                          onChange={(e) => {
                            setSelectedStatus(e.target.value);
                            setCurrentPage(1);
                          }}
                          className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option>All statuses</option>
                          <option>Approved</option>
                          <option>Not Approved</option>
                        </motion.select>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="hidden xl:block">
                        <label className={`block text-xs font-medium uppercase tracking-wider mb-1 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          UDISE Updated
                        </label>
                        <motion.select
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          value={udiseUpdated}
                          onChange={(e) => {
                            setUdiseUpdated(e.target.value);
                            setCurrentPage(1);
                          }}
                          className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option>All schools</option>
                          <option>Updated</option>
                          <option>Not updated</option>
                        </motion.select>
                      </motion.div>
                    </motion.div>

                    <motion.div 
                      variants={fadeInUp}
                      className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-4 gap-3"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={fetchData}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <motion.svg 
                          animate={{ rotate: loading ? 360 : 0 }}
                          transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
                          className="w-4 h-4" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </motion.svg>
                        Refresh Data
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(34, 197, 94, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <motion.span
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >📥</motion.span> Download Report ({filteredData.length})
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Loading State with animations */}
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 text-center"
              >
                <motion.div 
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1, repeat: Infinity }
                  }}
                  className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
                />
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 text-blue-600 font-medium"
                >
                  Loading data...
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Fetching latest information from the server
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State with animations */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="p-12 text-center"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 0.5 }}
                  className="text-red-500 text-6xl mb-4"
                >
                  ⚠️
                </motion.div>
                <h3 className="text-lg font-medium text-red-600 mb-2">Error Fetching Data</h3>
                <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Please check your connection and try again.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(220, 38, 38, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchData}
                  className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-red-700 transition inline-flex items-center gap-2"
                >
                  <motion.svg 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </motion.svg>
                  Retry
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary Cards with animations */}
          <AnimatePresence>
            {!loading && !error && data.length > 0 && (
              <motion.div 
                variants={staggerChildren}
                initial="initial"
                animate="animate"
                className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 sm:p-6"
              >
                {[
                  { label: "Institutes", value: summaryStats.totalInstitutes, color: "blue", icon: "🏫", style: themeStyles.summary.blue },
                  { label: "Participants", value: summaryStats.totalParticipants, color: "green", icon: "👥", style: themeStyles.summary.green },
                  { label: "Girls", value: summaryStats.totalGirls, color: "pink", icon: "👧", style: themeStyles.summary.pink },
                  { label: "Faculty", value: summaryStats.totalFaculty, color: "purple", icon: "👨‍🏫", style: themeStyles.summary.purple },
                  { label: "Events", value: summaryStats.totalEvents, color: "orange", icon: "📅", style: themeStyles.summary.orange }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -5,
                      boxShadow: isDark 
                        ? "0 10px 25px -5px rgba(0,0,0,0.5)" 
                        : "0 10px 25px -5px rgba(0,0,0,0.1)"
                    }}
                    className={`bg-gradient-to-br ${stat.style} p-3 sm:p-4 rounded-xl border transition-all`}
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: index * 0.1 }}
                      className="text-2xl mb-1"
                    >
                      {stat.icon}
                    </motion.div>
                    <p className={`text-xs sm:text-sm font-medium ${
                      isDark ? `text-${stat.color}-300` : `text-${stat.color}-700`
                    }`}>
                      {stat.label}
                    </p>
                    <motion.p 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", delay: index * 0.1 + 0.1 }}
                      className={`text-lg sm:text-2xl font-bold ${
                        isDark ? `text-${stat.color}-200` : `text-${stat.color}-800`
                      }`}
                    >
                      {stat.value}
                    </motion.p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Table View with animations */}
          <AnimatePresence>
            {currentData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.2 }}
              >
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y">
                    <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                      <tr>
                        {["#", "Institute", "Address", "Participants", "Girls", "Faculty", "District", "Date", "Media", "Actions"].map((header, i) => (
                          <motion.th
                            key={i}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                              isDark ? 'text-gray-300' : 'text-gray-500'
                            }`}
                          >
                            {header}
                          </motion.th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                      {currentData.map((row, index) => (
                        <React.Fragment key={row.id}>
                          <motion.tr 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ 
                              backgroundColor: isDark ? '#374151' : '#f9fafb',
                              scale: 1.01,
                              boxShadow: isDark 
                                ? "0 4px 6px -1px rgba(0,0,0,0.5)" 
                                : "0 4px 6px -1px rgba(0,0,0,0.1)"
                            }}
                            className={`cursor-pointer transition-all ${
                              expandedRow === row.id 
                                ? isDark ? 'bg-gray-700' : 'bg-blue-50'
                                : ''
                            }`}
                            onClick={() => toggleRowExpansion(row.id)}
                          >
                            <td className={`px-6 py-4 text-sm align-top ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {startIndex + index + 1}
                            </td>
                            <td className={`px-6 py-4 text-sm font-medium align-top max-w-xs ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {row.instituteName}
                            </td>
                            <td className={`px-6 py-4 text-sm align-top max-w-xs break-words ${
                              isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {row.address}
                            </td>
                            <td className={`px-6 py-4 text-sm align-top font-semibold ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {row.totalParticipants}
                            </td>
                            <td className={`px-6 py-4 text-sm align-top font-semibold ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {row.totalGirls}
                            </td>
                            <td className={`px-6 py-4 text-sm align-top font-semibold ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {row.totalFaculty}
                            </td>
                            <td className="px-6 py-4 text-sm align-top">
                              <motion.span 
                                whileHover={{ scale: 1.05 }}
                                className={`px-2 py-1 rounded-full text-xs inline-block ${
                                  isDark 
                                    ? 'bg-gray-700 text-gray-300' 
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                {row.district}
                              </motion.span>
                            </td>
                            <td className={`px-6 py-4 text-sm align-top ${
                              isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {row.eventDate}
                            </td>
                            <td className="px-6 py-4 text-sm align-top">
                              {(row.photoIds?.length > 0 || row.newspaperPhotoIds?.length > 0) && (
                                <div className="flex gap-1">
                                  {row.photoIds?.length > 0 && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openPhotoGallery(row.photoIds);
                                      }}
                                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                        isDark 
                                          ? 'text-blue-400 bg-blue-900/30 hover:bg-blue-900/50' 
                                          : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                      }`}
                                    >
                                      <motion.span
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                      >📸</motion.span> {row.photoIds.length}
                                    </motion.button>
                                  )}
                                  {row.newspaperPhotoIds?.length > 0 && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openPhotoGallery(row.newspaperPhotoIds);
                                      }}
                                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                        isDark 
                                          ? 'text-green-400 bg-green-900/30 hover:bg-green-900/50' 
                                          : 'text-green-600 bg-green-50 hover:bg-green-100'
                                      }`}
                                    >
                                      <motion.span
                                        animate={{ rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                      >📰</motion.span> {row.newspaperPhotoIds.length}
                                    </motion.button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm align-top">
                              <motion.button 
                                whileHover={{ x: 5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRowExpansion(row.id);
                                }}
                                className={`font-medium flex items-center gap-1 ${
                                  isDark 
                                    ? 'text-blue-400 hover:text-blue-300' 
                                    : 'text-blue-600 hover:text-blue-800'
                                }`}
                              >
                                <motion.span
                                  animate={{ rotate: expandedRow === row.id ? 90 : 0 }}
                                >
                                  {expandedRow === row.id ? "▼" : "▶"}
                                </motion.span> Details
                              </motion.button>
                            </td>
                          </motion.tr>
                          
                          <AnimatePresence>
                            {expandedRow === row.id && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className={isDark ? 'bg-gray-700' : 'bg-blue-50'}
                              >
                                <td colSpan="10" className="px-6 py-6">
                                  <motion.div 
                                    variants={staggerChildren}
                                    initial="initial"
                                    animate="animate"
                                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                                  >
                                    <div className="space-y-4">
                                      <motion.div 
                                        variants={slideInFromLeft} 
                                        className={`p-4 rounded-xl shadow-sm ${
                                          isDark ? 'bg-gray-800' : 'bg-white'
                                        }`}
                                      >
                                        <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                                          isDark ? 'text-gray-200' : 'text-gray-700'
                                        }`}>
                                          <motion.span 
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="w-1 h-4 bg-blue-500 rounded-full"
                                          />
                                          Event Details
                                        </h3>
                                        <motion.div variants={staggerChildren} className="space-y-2">
                                          <motion.p variants={fadeInUp}>
                                            <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email:</span> 
                                            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}> {row.email || 'N/A'}</span>
                                          </motion.p>
                                          <motion.p variants={fadeInUp}>
                                            <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email Address:</span> 
                                            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}> {row.emailAddress || 'N/A'}</span>
                                          </motion.p>
                                          <motion.p variants={fadeInUp}>
                                            <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Score:</span> 
                                            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}> {row.score}</span>
                                          </motion.p>
                                          <motion.p variants={fadeInUp}>
                                            <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Coordinator:</span> 
                                            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}> {row.coordinatorDetails || 'N/A'}</span>
                                          </motion.p>
                                          <motion.p variants={fadeInUp}>
                                            <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Feedback:</span> 
                                            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}> {row.feedback || 'Not provided'}</span>
                                          </motion.p>
                                        </motion.div>
                                      </motion.div>
                                      
                                      <motion.div 
                                        variants={slideInFromLeft} 
                                        className={`p-4 rounded-xl shadow-sm ${
                                          isDark ? 'bg-gray-800' : 'bg-white'
                                        }`}
                                      >
                                        <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                                          isDark ? 'text-gray-200' : 'text-gray-700'
                                        }`}>
                                          <motion.span 
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                                            className="w-1 h-4 bg-green-500 rounded-full"
                                          />
                                          Links & Reports
                                        </h3>
                                        <div className="space-y-2">
                                          {row.reportLink && (
                                            <motion.a 
                                              href={row.reportLink} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              variants={fadeInUp}
                                              whileHover={{ x: 5 }}
                                              className={`flex items-center gap-2 hover:underline break-all ${
                                                isDark ? 'text-blue-400' : 'text-blue-600'
                                              }`}
                                            >
                                              <motion.span
                                                animate={{ rotate: [0, 10, -10, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="text-xl"
                                              >📄</motion.span> View Report
                                            </motion.a>
                                          )}
                                        </div>
                                      </motion.div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                      <motion.div 
                                        variants={slideInFromLeft} 
                                        className={`p-4 rounded-xl shadow-sm ${
                                          isDark ? 'bg-gray-800' : 'bg-white'
                                        }`}
                                      >
                                        <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                                          isDark ? 'text-gray-200' : 'text-gray-700'
                                        }`}>
                                          <motion.span 
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                                            className="w-1 h-4 bg-purple-500 rounded-full"
                                          />
                                          Campus Ambassadors
                                        </h3>
                                        <div className={`p-3 rounded-lg max-h-40 overflow-y-auto ${
                                          isDark ? 'bg-gray-700' : 'bg-gray-50'
                                        }`}>
                                          {formatAmbassadors(row.campusAmbassadors)}
                                        </div>
                                      </motion.div>
                                      
                                      <motion.div 
                                        variants={slideInFromLeft} 
                                        className={`p-4 rounded-xl shadow-sm ${
                                          isDark ? 'bg-gray-800' : 'bg-white'
                                        }`}
                                      >
                                        <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                                          isDark ? 'text-gray-200' : 'text-gray-700'
                                        }`}>
                                          <motion.span 
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                                            className="w-1 h-4 bg-orange-500 rounded-full"
                                          />
                                          Additional Info
                                        </h3>
                                        <motion.p variants={fadeInUp}>
                                          <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>State & District:</span> 
                                          <span className={isDark ? 'text-gray-200' : 'text-gray-800'}> {row.stateDistrict}</span>
                                        </motion.p>
                                        <motion.p variants={fadeInUp}>
                                          <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Timestamp:</span> 
                                          <span className={isDark ? 'text-gray-200' : 'text-gray-800'}> {row.timestamp}</span>
                                        </motion.p>
                                      </motion.div>

                                      {/* Photos in expanded desktop view with animations */}
                                      {(row.photoIds?.length > 0 || row.newspaperPhotoIds?.length > 0) && (
                                        <motion.div 
                                          variants={slideInFromLeft} 
                                          className={`p-4 rounded-xl shadow-sm ${
                                            isDark ? 'bg-gray-800' : 'bg-white'
                                          }`}
                                        >
                                          <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                                            isDark ? 'text-gray-200' : 'text-gray-700'
                                          }`}>
                                            <motion.span 
                                              animate={{ scale: [1, 1.2, 1] }}
                                              transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                                              className="w-1 h-4 bg-pink-500 rounded-full"
                                            />
                                            Media Gallery
                                          </h3>
                                          <div className="space-y-4">
                                            {row.photoIds?.length > 0 && (
                                              <motion.div variants={fadeInUp}>
                                                <p className={`text-sm font-medium mb-2 ${
                                                  isDark ? 'text-gray-300' : 'text-gray-600'
                                                }`}>
                                                  Event Photos
                                                </p>
                                                <div className="grid grid-cols-4 gap-2">
                                                  {row.photoIds.slice(0, 4).map((photo, idx) => (
                                                    <motion.button
                                                      key={idx}
                                                      whileHover={{ scale: 1.1, rotate: 2, zIndex: 10 }}
                                                      whileTap={{ scale: 0.95 }}
                                                      initial={{ opacity: 0, scale: 0.8 }}
                                                      animate={{ opacity: 1, scale: 1 }}
                                                      transition={{ delay: idx * 0.05 }}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        openPhotoGallery(row.photoIds, idx);
                                                      }}
                                                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                                                    >
                                                      <img src={photo.thumbnail} alt={`Event ${idx + 1}`} className="w-full h-full object-cover" />
                                                    </motion.button>
                                                  ))}
                                                  {row.photoIds.length > 4 && (
                                                    <motion.button
                                                      whileHover={{ scale: 1.1, backgroundColor: isDark ? "#4B5563" : "#e5e7eb" }}
                                                      whileTap={{ scale: 0.95 }}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        openPhotoGallery(row.photoIds, 4);
                                                      }}
                                                      className={`aspect-square rounded-lg flex items-center justify-center text-sm transition ${
                                                        isDark 
                                                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                      }`}
                                                    >
                                                      +{row.photoIds.length - 4}
                                                    </motion.button>
                                                  )}
                                                </div>
                                              </motion.div>
                                            )}
                                            
                                            {row.newspaperPhotoIds?.length > 0 && (
                                              <motion.div variants={fadeInUp}>
                                                <p className={`text-sm font-medium mb-2 ${
                                                  isDark ? 'text-gray-300' : 'text-gray-600'
                                                }`}>
                                                  Newspaper Clippings
                                                </p>
                                                <div className="grid grid-cols-4 gap-2">
                                                  {row.newspaperPhotoIds.slice(0, 4).map((photo, idx) => (
                                                    <motion.button
                                                      key={idx}
                                                      whileHover={{ scale: 1.1, rotate: -2, zIndex: 10 }}
                                                      whileTap={{ scale: 0.95 }}
                                                      initial={{ opacity: 0, scale: 0.8 }}
                                                      animate={{ opacity: 1, scale: 1 }}
                                                      transition={{ delay: idx * 0.05 }}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        openPhotoGallery(row.newspaperPhotoIds, idx);
                                                      }}
                                                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-green-500 transition-all"
                                                    >
                                                      <img src={photo.thumbnail} alt={`Newspaper ${idx + 1}`} className="w-full h-full object-cover" />
                                                    </motion.button>
                                                  ))}
                                                  {row.newspaperPhotoIds.length > 4 && (
                                                    <motion.button
                                                      whileHover={{ scale: 1.1, backgroundColor: isDark ? "#4B5563" : "#e5e7eb" }}
                                                      whileTap={{ scale: 0.95 }}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        openPhotoGallery(row.newspaperPhotoIds, 4);
                                                      }}
                                                      className={`aspect-square rounded-lg flex items-center justify-center text-sm transition ${
                                                        isDark 
                                                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                      }`}
                                                    >
                                                      +{row.newspaperPhotoIds.length - 4}
                                                    </motion.button>
                                                  )}
                                                </div>
                                              </motion.div>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </div>
                                  </motion.div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View with animations */}
                <div className="md:hidden p-4">
                  <AnimatePresence>
                    {currentData.map((row, index) => (
                      <MobileCard key={row.id} row={row} index={index} />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination with animations */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <motion.span 
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> of{' '}
                    <span className="font-semibold">{filteredData.length}</span> institutes
                  </motion.span>
                  
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05, x: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 border rounded-lg text-sm disabled:opacity-50 transition-all flex items-center gap-1 ${
                        isDark 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-600' 
                          : 'border-gray-300 text-gray-600 hover:bg-white'
                      }`}
                    >
                      <motion.span
                        animate={{ x: currentPage > 1 ? [-2, 0, -2] : 0 }}
                        transition={{ duration: 1, repeat: currentPage > 1 ? Infinity : 0 }}
                      >←</motion.span> Prev
                    </motion.button>
                    
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
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white shadow-md'
                                : isDark 
                                  ? 'hover:bg-gray-600 text-gray-300' 
                                  : 'hover:bg-gray-200'
                            }`}
                          >
                            {pageNum}
                          </motion.button>
                        );
                      })}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05, x: 2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 border rounded-lg text-sm disabled:opacity-50 transition-all flex items-center gap-1 ${
                        isDark 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-600' 
                          : 'border-gray-300 text-gray-600 hover:bg-white'
                      }`}
                    >
                      Next <motion.span
                        animate={{ x: currentPage < totalPages ? [2, 0, 2] : 0 }}
                        transition={{ duration: 1, repeat: currentPage < totalPages ? Infinity : 0 }}
                      >→</motion.span>
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No Data State with animations */}
          <AnimatePresence>
            {!loading && !error && data.length === 0 && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="p-12 text-center"
              >
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`text-6xl mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
                >
                  📊
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                >
                  No Data Available
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Click the refresh button to fetch data from the server.
                </motion.p>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchData}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition inline-flex items-center gap-2"
                >
                  <motion.svg 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </motion.svg>
                  Refresh Data
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Wrapper component with ThemeProvider
const AppWithTheme = () => {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
};

export default AppWithTheme;