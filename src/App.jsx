import React, { useState, useMemo, useEffect, createContext, useContext } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// Theme Context with more sophisticated styling
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

// Enhanced Theme Toggle Button Component
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.1, rotate: 10 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 backdrop-blur-lg ${
        isDark 
          ? 'bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-gray-900' 
          : 'bg-gradient-to-br from-indigo-900 to-purple-900 hover:from-indigo-800 hover:to-purple-800 text-yellow-400'
      }`}
    >
      <motion.div
        animate={{ rotate: isDark ? 180 : 0, scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-6 h-6 text-xl"
      >
        {isDark ? '☀️' : '🌙'}
      </motion.div>
    </motion.button>
  );
};

// Enhanced Floating Particles Background Component
const FloatingParticles = () => {
  const { isDark } = useTheme();
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${
            isDark ? 'bg-white/5' : 'bg-blue-500/5'
          }`}
          style={{
            width: Math.random() * 100 + 50,
            height: Math.random() * 100 + 50,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
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
  
  // Page search state
  const [pageSearchInput, setPageSearchInput] = useState("");
  const [pageSearchError, setPageSearchError] = useState("");
  
  // Filter states
  const [instituteSearch, setInstituteSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All districts");
  const [selectedStatus, setSelectedStatus] = useState("All statuses");
  const [validUdiseFilter, setValidUdiseFilter] = useState("Duplicated");
  const [udiseUpdated, setUdiseUpdated] = useState("All schools");
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
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

  // Enhanced theme-based styles with gradients and modern effects
  const themeStyles = {
    background: isDark 
      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
      : 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
    cardBg: isDark 
      ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700/50' 
      : 'bg-white/90 backdrop-blur-xl border-gray-200/50',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      muted: isDark ? 'text-gray-400' : 'text-gray-500',
      accent: isDark ? 'text-blue-400' : 'text-blue-600',
    },
    header: isDark 
      ? 'bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 backdrop-blur-xl' 
      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600',
    table: {
      header: isDark ? 'bg-gray-700/50' : 'bg-gray-50/80 backdrop-blur-sm',
      row: isDark ? 'bg-gray-800/30' : 'bg-white/50 backdrop-blur-sm',
      rowHover: isDark ? 'bg-gray-700/50' : 'bg-blue-50/50',
      border: isDark ? 'border-gray-700' : 'border-gray-200',
    },
    filter: {
      bg: isDark ? 'bg-gray-800/50 backdrop-blur-xl' : 'bg-white/50 backdrop-blur-xl',
      input: isDark 
        ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-sm' 
        : 'bg-white/80 border-gray-300/50 text-gray-900 backdrop-blur-sm',
      label: isDark ? 'text-gray-300' : 'text-gray-600',
    },
    summary: {
      blue: isDark ? 'from-blue-600/20 to-blue-500/10 border-blue-500/30' : 'from-blue-500/20 to-blue-400/10 border-blue-500/30',
      green: isDark ? 'from-green-600/20 to-green-500/10 border-green-500/30' : 'from-green-500/20 to-green-400/10 border-green-500/30',
      pink: isDark ? 'from-pink-600/20 to-pink-500/10 border-pink-500/30' : 'from-pink-500/20 to-pink-400/10 border-pink-500/30',
      purple: isDark ? 'from-purple-600/20 to-purple-500/10 border-purple-500/30' : 'from-purple-500/20 to-purple-400/10 border-purple-500/30',
      orange: isDark ? 'from-orange-600/20 to-orange-500/10 border-orange-500/30' : 'from-orange-500/20 to-orange-400/10 border-orange-500/30',
    },
    gradientText: isDark 
      ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'
      : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
    glow: isDark 
      ? 'shadow-lg shadow-blue-900/20'
      : 'shadow-lg shadow-blue-200/50',
  };

  // Enhanced animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 }
  };

  const fadeInScale = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const slideInFromLeft = {
    initial: { x: -50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 50, opacity: 0 }
  };

  const slideInFromRight = {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  const pulseAnimation = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const floatAnimation = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
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

  // Extract Google Drive image IDs from links with enhanced pattern matching
  const extractDriveImageIds = (link) => {
    if (!link) return [];
    
    const driveIds = [];
    
    // Handle multiple links separated by commas, spaces, or newlines
    const links = link.split(/[,\s\n]+/).filter(l => l.trim());
    
    links.forEach(url => {
      // Match Google Drive image links with more patterns
      const patterns = [
        /(?:drive\.google\.com\/file\/d\/)([^\/?#]+)/,
        /(?:drive\.google\.com\/open\?id=)([^&#]+)/,
        /(?:docs\.google\.com\/uc\?id=)([^&#]+)/,
        /(?:drive\.google\.com\/uc\?export=view&id=)([^&#]+)/,
        /(?:drive\.google\.com\/thumbnail\?id=)([^&#]+)/,
        /(?:drive\.google\.com\/view\?id=)([^&#]+)/,
        /(?:drive\.google\.com\/preview\?id=)([^&#]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          driveIds.push({
            id: match[1],
            thumbnail: `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`,
            view: `https://drive.google.com/file/d/${match[1]}/preview`,
            download: `https://drive.google.com/uc?export=download&id=${match[1]}`
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
            validUdiseCode: Math.random() > 0.2 ? "✓" : "✗",
            approved: Math.random() > 0.3 ? "✓" : "✗",
            duplicatedFrom: "-",
            // Extract photo IDs from media links
            photoIds: extractDriveImageIds(row[columnMapping.photosVideos]?.toString().trim() || ""),
            newspaperPhotoIds: extractDriveImageIds(row[columnMapping.newspaperPhotos]?.toString().trim() || ""),
            // Add gradient color based on score
            scoreColor: getScoreColor(row[columnMapping.score] || "0")
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

  const getScoreColor = (score) => {
    const numScore = parseFloat(score) || 0;
    if (numScore >= 80) return 'from-green-500 to-emerald-500';
    if (numScore >= 60) return 'from-blue-500 to-cyan-500';
    if (numScore >= 40) return 'from-yellow-500 to-amber-500';
    return 'from-red-500 to-pink-500';
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

  // Sorting function
  const sortData = (data, config) => {
    if (!config.key) return data;
    
    return [...data].sort((a, b) => {
      if (a[config.key] < b[config.key]) {
        return config.direction === 'asc' ? -1 : 1;
      }
      if (a[config.key] > b[config.key]) {
        return config.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    let filtered = data.filter((row) => {
      const matchesInstitute = instituteSearch === "" || 
        row.instituteName?.toLowerCase().includes(instituteSearch.toLowerCase());
      const matchesDistrict = selectedDistrict === "All districts" || 
        row.district === selectedDistrict;
      const matchesStatus = selectedStatus === "All statuses" || 
        (selectedStatus === "Approved" ? row.approved === "✓" : row.approved === "✗");
      return matchesInstitute && matchesDistrict && matchesStatus;
    });
    
    return sortData(filtered, sortConfig);
  }, [data, instituteSearch, selectedDistrict, selectedStatus, sortConfig]);

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

  // Page search function
  const handlePageSearch = (e) => {
    e.preventDefault();
    setPageSearchError("");
    
    const pageNum = parseInt(pageSearchInput);
    
    if (isNaN(pageNum)) {
      setPageSearchError("कृपया एक वैध पृष्ठ संख्या दर्ज करें");
      return;
    }
    
    if (pageNum < 1 || pageNum > totalPages) {
      setPageSearchError(`कृपया 1 से ${totalPages} के बीच की संख्या दर्ज करें`);
      return;
    }
    
    setCurrentPage(pageNum);
    setPageSearchInput("");
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatAmbassadors = (ambassadors) => {
    if (!ambassadors) return <span className="text-gray-400 italic">No ambassadors assigned</span>;
    return ambassadors.split('\n').map((line, i) => (
      <motion.div 
        key={i} 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1 }}
        className={`flex items-center gap-2 py-2 border-b last:border-0 ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
        }`}>
          {i + 1}
        </span>
        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
          {line}
        </span>
      </motion.div>
    ));
  };

  // Enhanced Photo Gallery Modal Component
  const PhotoGalleryModal = () => {
    if (!showPhotoGallery || currentPhotoUrls.length === 0) return null;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-black/95 via-black/90 to-black/95 z-50 flex items-center justify-center p-4"
        onClick={() => setShowPhotoGallery(false)}
      >
        <motion.button 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setShowPhotoGallery(false);
          }}
          className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-50 w-14 h-14 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-lg hover:bg-white/20 transition-all border border-white/20"
        >
          ×
        </motion.button>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative w-full max-w-6xl max-h-screen"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image counter */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-12 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full text-white text-sm border border-white/20"
          >
            {currentPhotoIndex + 1} / {currentPhotoUrls.length}
          </motion.div>
          
          {/* Main Image/Preview */}
          <div className="relative h-[80vh] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhotoIndex}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 25 }}
                className="w-full h-full flex items-center justify-center"
              >
                {currentPhotoUrls[currentPhotoIndex]?.view ? (
                  <iframe
                    src={currentPhotoUrls[currentPhotoIndex].view}
                    className="w-full h-full rounded-2xl shadow-2xl"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={currentPhotoUrls[currentPhotoIndex]?.thumbnail}
                    alt={`Photo ${currentPhotoIndex + 1}`}
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Navigation Arrows */}
          {currentPhotoUrls.length > 1 && (
            <>
              <motion.button
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : currentPhotoUrls.length - 1));
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-lg text-white text-3xl w-14 h-14 rounded-full flex items-center justify-center hover:bg-white/20 transition-all border border-white/20"
              >
                ‹
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPhotoIndex(prev => (prev < currentPhotoUrls.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-lg text-white text-3xl w-14 h-14 rounded-full flex items-center justify-center hover:bg-white/20 transition-all border border-white/20"
              >
                ›
              </motion.button>
            </>
          )}
          
          {/* Download button */}
          <motion.a
            href={currentPhotoUrls[currentPhotoIndex]?.download}
            download
            target="_blank"
            rel="noopener noreferrer"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-24 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2 border border-white/20"
          >
            <span>📥</span> Download
          </motion.a>
          
          {/* Thumbnail Strip */}
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute -bottom-20 left-0 right-0 flex justify-center gap-2 overflow-x-auto px-4 py-2"
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
                className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  idx === currentPhotoIndex 
                    ? 'border-blue-500 scale-110 shadow-lg' 
                    : 'border-white/20 opacity-60 hover:opacity-100'
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

  // Enhanced Mobile Card Component
  const MobileCard = ({ row, index }) => (
    <motion.div 
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ 
        y: -8, 
        boxShadow: isDark 
          ? "0 20px 40px -12px rgba(0,0,0,0.8)" 
          : "0 20px 40px -12px rgba(0,0,0,0.2)",
        transition: { type: "spring", stiffness: 300 }
      }}
      className={`${themeStyles.cardBg} rounded-2xl border p-5 mb-4 shadow-xl transition-all`}
    >
      <div className="flex justify-between items-start mb-4">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            isDark ? 'bg-gray-700/50' : 'bg-gray-100'
          }`}
        >
          <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            #{startIndex + index + 1}
          </span>
        </motion.div>
        
        <motion.div 
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            row.approved === "✓" 
              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-400 border border-green-500/30' 
              : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
          }`}
        >
          {row.approved === "✓" ? '✓ Approved' : '✗ Pending'}
        </motion.div>
      </div>
      
      <div className="space-y-4">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.07 }}
          className="border-l-4 border-gradient-to-b from-blue-500 to-purple-500 pl-4"
        >
          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {row.instituteName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm opacity-75">📍</span>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {row.address}
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          variants={staggerChildren}
          initial="initial"
          animate="animate"
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: "Participants", value: row.totalParticipants, icon: "👥", color: "blue" },
            { label: "Girls", value: row.totalGirls, icon: "👧", color: "pink" },
            { label: "Faculty", value: row.totalFaculty, icon: "👨‍🏫", color: "purple" }
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeInScale}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`bg-gradient-to-br from-${item.color}-500/10 to-${item.color}-500/5 rounded-xl p-3 text-center border border-${item.color}-500/20`}
            >
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                className="text-xl block mb-1"
              >
                {item.icon}
              </motion.span>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} block`}>
                {item.label}
              </span>
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: index * 0.1 + i * 0.1 }}
                className={`text-lg font-bold text-${item.color}-600 dark:text-${item.color}-400`}
              >
                {item.value}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.15 }}
          className={`flex items-center justify-between text-sm p-3 rounded-xl ${
            isDark ? 'bg-gray-700/30' : 'bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-lg"
            >📍</motion.span>
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              {row.district}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-lg"
            >📅</motion.span>
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              {row.eventDate}
            </span>
          </div>
        </motion.div>

        {/* Photo preview on mobile */}
        {(row.photoIds?.length > 0 || row.newspaperPhotoIds?.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
          >
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {row.photoIds?.slice(0, 4).map((photo, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.1, rotate: idx % 2 === 0 ? 2 : -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openPhotoGallery(row.photoIds, idx)}
                  className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all shadow-lg"
                >
                  <img src={photo.thumbnail} alt={`Event ${idx + 1}`} className="w-full h-full object-cover" />
                </motion.button>
              ))}
              {row.newspaperPhotoIds?.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openPhotoGallery(row.newspaperPhotoIds)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${
                    isDark 
                      ? 'border-gray-600 bg-gray-700/30 text-gray-400 hover:border-green-500' 
                      : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-green-500'
                  }`}
                >
                  <span className="text-xl">📰</span>
                  <span className="text-xs">{row.newspaperPhotoIds.length}</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => toggleRowExpansion(row.id)}
        className={`w-full mt-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          isDark 
            ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 hover:from-blue-600/30 hover:to-purple-600/30' 
            : 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 hover:from-blue-100 hover:to-purple-100'
        }`}
      >
        <motion.span
          animate={{ rotate: expandedRow === row.id ? 180 : 0 }}
        >
          {expandedRow === row.id ? "▼" : "▶"}
        </motion.span>
        {expandedRow === row.id ? "Show Less" : "View Details"}
      </motion.button>
      
      <AnimatePresence>
        {expandedRow === row.id && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="mt-4 pt-4 border-t overflow-hidden"
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
      <motion.div variants={fadeInUp} className={`p-4 rounded-xl ${
        isDark ? 'bg-gray-700/30' : 'bg-white/50'
      }`}>
        <h4 className={`font-semibold text-sm mb-3 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
          Event Details
        </h4>
        <div className="space-y-2">
          <motion.div variants={fadeInUp} className="flex items-center gap-2">
            <span className="text-xl">📧</span>
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{row.email || 'N/A'}</span>
          </motion.div>
          <motion.div variants={fadeInUp} className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{row.coordinatorDetails || 'N/A'}</span>
          </motion.div>
          <motion.div variants={fadeInUp} className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <span className={`font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{row.score}</span>
          </motion.div>
        </div>
      </motion.div>
      
      <motion.div variants={fadeInUp} className={`p-4 rounded-xl ${
        isDark ? 'bg-gray-700/30' : 'bg-white/50'
      }`}>
        <h4 className={`font-semibold text-sm mb-3 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          <span className="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></span>
          Campus Ambassadors
        </h4>
        <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
          {formatAmbassadors(row.campusAmbassadors)}
        </div>
      </motion.div>
      
      {/* All Photos section in expanded view */}
      {(row.photoIds?.length > 0 || row.newspaperPhotoIds?.length > 0) && (
        <motion.div variants={fadeInUp} className={`p-4 rounded-xl ${
          isDark ? 'bg-gray-700/30' : 'bg-white/50'
        }`}>
          <h4 className={`font-semibold text-sm mb-3 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            <span className="w-1 h-4 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></span>
            Media Gallery
          </h4>
          <div className="space-y-3">
            {row.photoIds?.length > 0 && (
              <div>
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Event Photos ({row.photoIds.length})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {row.photoIds.slice(0, 8).map((photo, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.1, rotate: idx % 2 === 0 ? 2 : -2, zIndex: 10 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => openPhotoGallery(row.photoIds, idx)}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all shadow-md"
                    >
                      <img src={photo.thumbnail} alt={`Event ${idx + 1}`} className="w-full h-full object-cover" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            
            {row.newspaperPhotoIds?.length > 0 && (
              <div>
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Newspaper Clippings ({row.newspaperPhotoIds.length})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {row.newspaperPhotoIds.slice(0, 8).map((photo, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.1, rotate: idx % 2 === 0 ? -2 : 2, zIndex: 10 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => openPhotoGallery(row.newspaperPhotoIds, idx)}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-green-500 transition-all shadow-md"
                    >
                      <img src={photo.thumbnail} alt={`Newspaper ${idx + 1}`} className="w-full h-full object-cover" />
                    </motion.button>
                  ))}
                </div>
              </div>
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
          className={`inline-flex items-center gap-2 text-sm px-4 py-3 rounded-xl transition-all w-full justify-center ${
            isDark 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
          }`}
        >
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >📄</motion.span> 
          View Full Report
        </motion.a>
      )}
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen transition-colors duration-500 relative ${themeStyles.background}`}
    >
      <FloatingParticles />
      
      <AnimatePresence>
        {showPhotoGallery && <PhotoGalleryModal />}
      </AnimatePresence>
      
      <ThemeToggle />
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-8 relative z-10">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className={`${themeStyles.cardBg} backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border transition-all duration-500 ${themeStyles.glow}`}
        >
          
          {/* Enhanced Header with gradient and animation */}
          <motion.div 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className={`${themeStyles.header} p-6 sm:p-8 transition-all duration-500 relative overflow-hidden`}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.h1 
                  animate={{ 
                    textShadow: [
                      "0 0 20px rgba(255,255,255,0.3)",
                      "0 0 40px rgba(255,255,255,0.5)",
                      "0 0 20px rgba(255,255,255,0.3)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-2xl sm:text-4xl font-bold text-white"
                >
                  Disaster Ready School Dashboard
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm sm:text-base text-white/80 mt-2 flex items-center gap-2"
                >
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >📊</motion.span>
                  Real-time monitoring of school preparedness campaigns
                </motion.p>
              </motion.div>
              
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.5 }}
                className="flex items-center gap-3"
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/20 backdrop-blur-lg rounded-2xl px-4 py-2 text-white border border-white/30"
                >
                  <span className="text-sm font-medium">Last updated: {new Date().toLocaleDateString()}</span>
                </motion.div>
                
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden bg-white/20 backdrop-blur-lg p-3 rounded-xl text-white hover:bg-white/30 transition border border-white/30"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          {/* Enhanced Filters Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`border-b transition-all duration-500 ${
              isDark ? 'border-gray-700/50 bg-gray-800/30' : 'border-gray-200/50 bg-white/30'
            } backdrop-blur-xl`}
          >
            <div className="p-4 sm:p-6">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-between w-full sm:hidden mb-3 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >🔍</motion.span>
                  Filters & Controls
                </h2>
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
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <h2 className={`text-lg font-semibold mb-4 hidden sm:block flex items-center gap-2 ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      <motion.span
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >🔍</motion.span>
                      Filters & Controls
                    </h2>
                    
                    <motion.div 
                      variants={staggerChildren}
                      initial="initial"
                      animate="animate"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
                    >
                      <motion.div variants={fadeInUp} className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                        <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Search Institute
                        </label>
                        <div className="relative group">
                          <input
                            type="text"
                            placeholder="Type institute name..."
                            value={instituteSearch}
                            onChange={(e) => {
                              setInstituteSearch(e.target.value);
                              setCurrentPage(1);
                            }}
                            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-12 transition-all ${
                              isDark 
                                ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                                : 'bg-white/80 border-gray-300/50 text-gray-900'
                            }`}
                          />
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`absolute left-4 top-3 ${
                              isDark ? 'text-gray-500' : 'text-gray-400'
                            }`}
                          >
                            🔍
                          </motion.div>
                        </div>
                      </motion.div>

                      <motion.div variants={fadeInUp}>
                        <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${
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
                          className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer ${
                            isDark 
                              ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                              : 'bg-white/80 border-gray-300/50 text-gray-900'
                          }`}
                        >
                          {districts.map(district => (
                            <option key={district} value={district}>{district}</option>
                          ))}
                        </motion.select>
                      </motion.div>

                      <motion.div variants={fadeInUp}>
                        <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${
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
                          className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer ${
                            isDark 
                              ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                              : 'bg-white/80 border-gray-300/50 text-gray-900'
                          }`}
                        >
                          <option>All statuses</option>
                          <option>Approved</option>
                          <option>Not Approved</option>
                        </motion.select>
                      </motion.div>

                      <motion.div variants={fadeInUp}>
                        <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Sort By
                        </label>
                        <motion.select
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onChange={(e) => {
                            const [key, direction] = e.target.value.split('-');
                            setSortConfig({ key, direction });
                          }}
                          className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer ${
                            isDark 
                              ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                              : 'bg-white/80 border-gray-300/50 text-gray-900'
                          }`}
                        >
                          <option value="instituteName-asc">Name (A-Z)</option>
                          <option value="instituteName-desc">Name (Z-A)</option>
                          <option value="totalParticipants-desc">Participants (High-Low)</option>
                          <option value="totalParticipants-asc">Participants (Low-High)</option>
                          <option value="score-desc">Score (High-Low)</option>
                          <option value="score-asc">Score (Low-High)</option>
                        </motion.select>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="hidden xl:block">
                        <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Institute Status
                        </label>
                        <motion.select
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          value={udiseUpdated}
                          onChange={(e) => {
                            setUdiseUpdated(e.target.value);
                            setCurrentPage(1);
                          }}
                          className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            isDark 
                              ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                              : 'bg-white/80 border-gray-300/50 text-gray-900'
                          }`}
                        >
                          <option>All Institute</option>
                          <option>Updated</option>
                          <option>Not updated</option>
                        </motion.select>
                      </motion.div>
                    </motion.div>

                    <motion.div 
                      variants={fadeInUp}
                      className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-6 gap-3"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -12px rgba(59, 130, 246, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={fetchData}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center justify-center gap-2 group"
                      >
                        <motion.svg 
                          animate={{ rotate: loading ? 360 : 0 }}
                          transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
                          className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </motion.svg>
                        Refresh Data
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -12px rgba(34, 197, 94, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl text-sm hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 group"
                      >
                        <motion.span
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="group-hover:scale-110 transition-transform"
                        >📥</motion.span> 
                        Download Report ({filteredData.length})
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Enhanced Loading State */}
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-20 text-center"
              >
                <motion.div 
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1, repeat: Infinity }
                  }}
                  className="inline-block w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full"
                />
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                  Loading data...
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Fetching latest information from the server
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Error State */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="p-20 text-center"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 0.5 }}
                  className="text-7xl mb-6"
                >
                  ⚠️
                </motion.div>
                <h3 className="text-2xl font-bold text-red-600 mb-3">Error Fetching Data</h3>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Please check your connection and try again.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -12px rgba(220, 38, 38, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchData}
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-xl text-sm hover:from-red-700 hover:to-pink-700 transition-all shadow-lg inline-flex items-center gap-3"
                >
                  <motion.svg 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5" 
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

          {/* Enhanced Summary Cards */}
          <AnimatePresence>
            {!loading && !error && data.length > 0 && (
              <motion.div 
                variants={staggerChildren}
                initial="initial"
                animate="animate"
                className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 sm:p-6"
              >
                {[
                  { label: "Institutes", value: summaryStats.totalInstitutes, icon: "🏫", style: themeStyles.summary.blue },
                  { label: "Participants", value: summaryStats.totalParticipants, icon: "👥", style: themeStyles.summary.green },
                  { label: "Girls", value: summaryStats.totalGirls, icon: "👧", style: themeStyles.summary.pink },
                  { label: "Faculty", value: summaryStats.totalFaculty, icon: "👨‍🏫", style: themeStyles.summary.purple },
                  { label: "Events", value: summaryStats.totalEvents, icon: "📅", style: themeStyles.summary.orange }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInScale}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -8,
                      boxShadow: isDark 
                        ? "0 30px 50px -20px rgba(0,0,0,0.8)" 
                        : "0 30px 50px -20px rgba(0,0,0,0.2)",
                    }}
                    className={`bg-gradient-to-br ${stat.style} p-4 sm:p-6 rounded-2xl border backdrop-blur-sm transition-all cursor-pointer group`}
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: index * 0.1 }}
                      className="text-3xl mb-2 group-hover:scale-110 transition-transform"
                    >
                      {stat.icon}
                    </motion.div>
                    <p className={`text-xs sm:text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {stat.label}
                    </p>
                    <motion.p 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", delay: index * 0.1 + 0.1 }}
                      className={`text-xl sm:text-3xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {stat.value.toLocaleString()}
                    </motion.p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Desktop Table View */}
          <AnimatePresence>
            {currentData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.3 }}
              >
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y">
                    <thead className={themeStyles.table.header}>
                      <tr>
                        {["#", "Institute", "Address", "Participants", "Girls", "Faculty", "District", "Date", "Media", "Score", "Actions"].map((header, i) => (
                          <motion.th
                            key={i}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${
                              isDark ? 'text-gray-300' : 'text-gray-500'
                            }`}
                            onClick={() => {
                              const keyMap = {
                                "Institute": "instituteName",
                                "Participants": "totalParticipants",
                                "Girls": "totalGirls",
                                "Faculty": "totalFaculty",
                                "Score": "score"
                              };
                              if (keyMap[header]) {
                                requestSort(keyMap[header]);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {header}
                              {sortConfig.key === header.toLowerCase() && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                >
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </motion.span>
                              )}
                            </div>
                          </motion.th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${themeStyles.table.border}`}>
                      {currentData.map((row, index) => (
                        <React.Fragment key={row.id}>
                          <motion.tr 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            whileHover={{ 
                              backgroundColor: isDark ? '#374151' : '#f9fafb',
                              scale: 1.01,
                              boxShadow: isDark 
                                ? "0 10px 20px -5px rgba(0,0,0,0.5)" 
                                : "0 10px 20px -5px rgba(0,0,0,0.1)",
                              transition: { type: "spring", stiffness: 300 }
                            }}
                            className={`cursor-pointer transition-all ${
                              expandedRow === row.id 
                                ? isDark ? 'bg-gray-700' : 'bg-blue-50'
                                : themeStyles.table.row
                            }`}
                            onClick={() => toggleRowExpansion(row.id)}
                          >
                            <td className={`px-6 py-4 text-sm align-top ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                isDark ? 'bg-gray-700' : 'bg-gray-100'
                              }`}>
                                {startIndex + index + 1}
                              </span>
                            </td>
                            <td className={`px-6 py-4 text-sm font-medium align-top max-w-xs ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🏫</span>
                                <span>{row.instituteName}</span>
                              </div>
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
                                className={`px-3 py-1.5 rounded-full text-xs inline-flex items-center gap-1 ${
                                  isDark 
                                    ? 'bg-gray-700 text-gray-300' 
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <span>📍</span>
                                {row.district}
                              </motion.span>
                            </td>
                            <td className={`px-6 py-4 text-sm align-top ${
                              isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              <div className="flex items-center gap-1">
                                <span>📅</span>
                                {row.eventDate}
                              </div>
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
                                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${
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
                                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${
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
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 bg-gradient-to-r ${row.scoreColor}`}
                              >
                                <span>⭐</span>
                                {row.score}
                              </motion.div>
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
                                </motion.span> 
                                Details
                              </motion.button>
                            </td>
                          </motion.tr>
                          
                          <AnimatePresence>
                            {expandedRow === row.id && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                              >
                                <td colSpan="11" className="px-6 py-8">
                                  <motion.div 
                                    variants={staggerChildren}
                                    initial="initial"
                                    animate="animate"
                                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                                  >
                                    <motion.div 
                                      variants={slideInFromLeft} 
                                      className={`p-6 rounded-2xl shadow-xl ${
                                        isDark ? 'bg-gray-800' : 'bg-white'
                                      }`}
                                    >
                                      <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
                                        isDark ? 'text-gray-200' : 'text-gray-700'
                                      }`}>
                                        <motion.span 
                                          animate={{ scale: [1, 1.2, 1] }}
                                          transition={{ duration: 2, repeat: Infinity }}
                                          className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"
                                        />
                                        Event Details
                                      </h3>
                                      <div className="space-y-3">
                                        <motion.div variants={fadeInUp} className="flex items-start gap-3">
                                          <span className="text-xl">📧</span>
                                          <div>
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                                            <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>{row.email || 'N/A'}</p>
                                          </div>
                                        </motion.div>
                                        <motion.div variants={fadeInUp} className="flex items-start gap-3">
                                          <span className="text-xl">📧</span>
                                          <div>
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email Address</p>
                                            <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>{row.emailAddress || 'N/A'}</p>
                                          </div>
                                        </motion.div>
                                        <motion.div variants={fadeInUp} className="flex items-start gap-3">
                                          <span className="text-xl">⭐</span>
                                          <div>
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Score</p>
                                            <p className={`font-semibold bg-gradient-to-r ${row.scoreColor} bg-clip-text text-transparent`}>
                                              {row.score}
                                            </p>
                                          </div>
                                        </motion.div>
                                        <motion.div variants={fadeInUp} className="flex items-start gap-3">
                                          <span className="text-xl">👤</span>
                                          <div>
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Coordinator</p>
                                            <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>{row.coordinatorDetails || 'N/A'}</p>
                                          </div>
                                        </motion.div>
                                        <motion.div variants={fadeInUp} className="flex items-start gap-3">
                                          <span className="text-xl">💬</span>
                                          <div>
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Feedback</p>
                                            <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>{row.feedback || 'Not provided'}</p>
                                          </div>
                                        </motion.div>
                                      </div>
                                    </motion.div>
                                    
                                    <motion.div 
                                      variants={slideInFromLeft} 
                                      className={`p-6 rounded-2xl shadow-xl ${
                                        isDark ? 'bg-gray-800' : 'bg-white'
                                      }`}
                                    >
                                      <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
                                        isDark ? 'text-gray-200' : 'text-gray-700'
                                      }`}>
                                        <motion.span 
                                          animate={{ scale: [1, 1.2, 1] }}
                                          transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                                          className="w-1.5 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"
                                        />
                                        Campus Ambassadors
                                      </h3>
                                      <div className={`p-4 rounded-xl max-h-48 overflow-y-auto custom-scrollbar ${
                                        isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                                      }`}>
                                        {formatAmbassadors(row.campusAmbassadors)}
                                      </div>
                                      
                                      <h3 className={`font-semibold mb-3 mt-6 flex items-center gap-2 ${
                                        isDark ? 'text-gray-200' : 'text-gray-700'
                                      }`}>
                                        <motion.span 
                                          animate={{ scale: [1, 1.2, 1] }}
                                          transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                                          className="w-1.5 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"
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
                                            className={`flex items-center gap-2 hover:underline break-all p-3 rounded-xl ${
                                              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                            }`}
                                          >
                                            <span className="text-xl">📄</span>
                                            <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>View Report</span>
                                          </motion.a>
                                        )}
                                      </div>
                                    </motion.div>
                                    
                                    <motion.div 
                                      variants={slideInFromRight} 
                                      className={`p-6 rounded-2xl shadow-xl ${
                                        isDark ? 'bg-gray-800' : 'bg-white'
                                      }`}
                                    >
                                      <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
                                        isDark ? 'text-gray-200' : 'text-gray-700'
                                      }`}>
                                        <motion.span 
                                          animate={{ scale: [1, 1.2, 1] }}
                                          transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                                          className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"
                                        />
                                        Additional Info
                                      </h3>
                                      <div className="space-y-3">
                                        <motion.div variants={fadeInUp} className="flex items-start gap-3">
                                          <span className="text-xl">📍</span>
                                          <div>
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>State & District</p>
                                            <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>{row.stateDistrict}</p>
                                          </div>
                                        </motion.div>
                                        <motion.div variants={fadeInUp} className="flex items-start gap-3">
                                          <span className="text-xl">⏰</span>
                                          <div>
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Timestamp</p>
                                            <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>{row.timestamp}</p>
                                          </div>
                                        </motion.div>
                                        <motion.div variants={fadeInUp} className="flex items-start gap-3">
                                          <span className="text-xl">✅</span>
                                          <div>
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                                              row.approved === "✓" 
                                                ? 'bg-green-500/20 text-green-600' 
                                                : 'bg-red-500/20 text-red-600'
                                            }`}>
                                              {row.approved === "✓" ? '✓ Approved' : '✗ Pending'}
                                            </span>
                                          </div>
                                        </motion.div>
                                      </div>

                                      {(row.photoIds?.length > 0 || row.newspaperPhotoIds?.length > 0) && (
                                        <>
                                          <h3 className={`font-semibold mb-3 mt-6 flex items-center gap-2 ${
                                            isDark ? 'text-gray-200' : 'text-gray-700'
                                          }`}>
                                            <motion.span 
                                              animate={{ scale: [1, 1.2, 1] }}
                                              transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                                              className="w-1.5 h-6 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"
                                            />
                                            Media Gallery
                                          </h3>
                                          
                                          {row.photoIds?.length > 0 && (
                                            <motion.div variants={fadeInUp} className="mb-4">
                                              <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Event Photos ({row.photoIds.length})
                                              </p>
                                              <div className="grid grid-cols-4 gap-2">
                                                {row.photoIds.slice(0, 4).map((photo, idx) => (
                                                  <motion.button
                                                    key={idx}
                                                    whileHover={{ scale: 1.1, rotate: idx % 2 === 0 ? 2 : -2, zIndex: 10 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      openPhotoGallery(row.photoIds, idx);
                                                    }}
                                                    className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all shadow-lg"
                                                  >
                                                    <img src={photo.thumbnail} alt={`Event ${idx + 1}`} className="w-full h-full object-cover" />
                                                  </motion.button>
                                                ))}
                                                {row.photoIds.length > 4 && (
                                                  <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      openPhotoGallery(row.photoIds, 4);
                                                    }}
                                                    className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
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
                                              <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Newspaper Clippings ({row.newspaperPhotoIds.length})
                                              </p>
                                              <div className="grid grid-cols-4 gap-2">
                                                {row.newspaperPhotoIds.slice(0, 4).map((photo, idx) => (
                                                  <motion.button
                                                    key={idx}
                                                    whileHover={{ scale: 1.1, rotate: idx % 2 === 0 ? -2 : 2, zIndex: 10 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      openPhotoGallery(row.newspaperPhotoIds, idx);
                                                    }}
                                                    className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-green-500 transition-all shadow-lg"
                                                  >
                                                    <img src={photo.thumbnail} alt={`Newspaper ${idx + 1}`} className="w-full h-full object-cover" />
                                                  </motion.button>
                                                ))}
                                                {row.newspaperPhotoIds.length > 4 && (
                                                  <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      openPhotoGallery(row.newspaperPhotoIds, 4);
                                                    }}
                                                    className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
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
                                        </>
                                      )}
                                    </motion.div>
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

                {/* Enhanced Mobile Card View */}
                <div className="md:hidden p-4">
                  <AnimatePresence>
                    {currentData.map((row, index) => (
                      <MobileCard key={row.id} row={row} index={index} />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Enhanced Pagination */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`px-6 py-4 border-t flex flex-col lg:flex-row justify-between items-center gap-4 ${
                    isDark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50/80 border-gray-200/50'
                  } backdrop-blur-xl`}
                >
                  {/* Left side - Showing info */}
                  <motion.span 
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    Showing <span className="font-bold">{startIndex + 1}</span> to{' '}
                    <span className="font-bold">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> of{' '}
                    <span className="font-bold">{filteredData.length}</span> institutes
                  </motion.span>
                  
                  {/* Center - Page Search */}
                  <form onSubmit={handlePageSearch} className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={pageSearchInput}
                        onChange={(e) => setPageSearchInput(e.target.value)}
                        placeholder={`Page (1-${totalPages})`}
                        className={`w-28 sm:w-32 px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          isDark 
                            ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
                            : 'bg-white/80 border-gray-300/50 text-gray-900'
                        }`}
                      />
                      {pageSearchError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute -top-8 left-0 text-xs text-red-500 whitespace-nowrap"
                        >
                          {pageSearchError}
                        </motion.div>
                      )}
                    </div>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 text-sm rounded-xl transition-all flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                    >
                      <span>🔍</span> Go
                    </motion.button>
                  </form>
                  
                  {/* Right side - Pagination buttons */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05, x: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 border rounded-xl text-sm disabled:opacity-50 transition-all flex items-center gap-1 ${
                        isDark 
                          ? 'border-gray-600/50 text-gray-300 hover:bg-gray-700/50' 
                          : 'border-gray-300/50 text-gray-600 hover:bg-white/80'
                      }`}
                    >
                      <motion.span
                        animate={{ x: currentPage > 1 ? [-2, 0, -2] : 0 }}
                        transition={{ duration: 1, repeat: currentPage > 1 ? Infinity : 0 }}
                      >←</motion.span> Prev
                    </motion.button>
                    
                    <div className="flex gap-1">
                      {[...Array(Math.min(3, totalPages))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage <= 2) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 1) {
                          pageNum = totalPages - 2 + i;
                        } else {
                          pageNum = currentPage - 1 + i;
                        }
                        
                        return (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : isDark 
                                  ? 'hover:bg-gray-700/50 text-gray-300' 
                                  : 'hover:bg-white/80'
                            }`}
                          >
                            {pageNum}
                          </motion.button>
                        );
                      })}
                      {totalPages > 3 && currentPage < totalPages - 1 && (
                        <span className={`px-2 flex items-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>...</span>
                      )}
                      {totalPages > 3 && currentPage < totalPages - 1 && (
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentPage(totalPages)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                            isDark 
                              ? 'hover:bg-gray-700/50 text-gray-300' 
                              : 'hover:bg-white/80'
                          }`}
                        >
                          {totalPages}
                        </motion.button>
                      )}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05, x: 2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 border rounded-xl text-sm disabled:opacity-50 transition-all flex items-center gap-1 ${
                        isDark 
                          ? 'border-gray-600/50 text-gray-300 hover:bg-gray-700/50' 
                          : 'border-gray-300/50 text-gray-600 hover:bg-white/80'
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

          {/* Enhanced No Data State */}
          <AnimatePresence>
            {!loading && !error && data.length === 0 && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="p-20 text-center"
              >
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-8xl mb-6"
                >
                  📊
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-2xl font-bold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                >
                  No Data Available
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Click the refresh button to fetch data from the server.
                </motion.p>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 30px 50px -20px rgba(59, 130, 246, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchData}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-2xl inline-flex items-center gap-3"
                >
                  <motion.svg 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5" 
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

      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
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