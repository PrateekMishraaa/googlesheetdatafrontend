import React, { useState, useMemo } from "react";
import axios from "axios";

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);

      const res = await axios.get("http://localhost:5000/get-data");
      const apiData = Array.isArray(res.data) ? res.data : res.data.data;

      setData(apiData);
      setCurrentPage(1);
      setLoading(false);
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  };

  // 🔎 Search Filter
  const filteredData = useMemo(() => {
    return data.filter((row) =>
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  // 📄 Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-200 p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-2xl rounded-3xl p-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-gray-800">
            📊 Google Sheet Dashboard
          </h1>

          <button
            onClick={fetchData}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition"
          >
            Load Data
          </button>
        </div>

        {/* Search + Info */}
        {data.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <input
              type="text"
              placeholder="Search anything..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border px-4 py-2 rounded-xl w-full md:w-1/3 shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
            />

            <div className="flex items-center gap-4">
              <span className="text-gray-600 font-medium">
                Total Records:{" "}
                <span className="text-blue-600">
                  {filteredData.length}
                </span>
              </span>

              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border px-3 py-2 rounded-lg"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
              </select>
            </div>
          </div>
        )}

        {/* Loading & Error */}
        {loading && (
          <p className="text-center text-blue-600 font-semibold animate-pulse">
            Loading data...
          </p>
        )}

        {error && (
          <p className="text-center text-red-600 font-semibold">
            Error fetching API
          </p>
        )}

        {/* Table */}
        {currentData.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-2xl shadow-lg">
              <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <tr>
                    {Object.keys(currentData[0]).map((key) => (
                      <th
                        key={key}
                        className="p-4 text-left font-semibold"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {currentData.map((row, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-blue-50 transition"
                    >
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="p-4 text-gray-700">
                          {Array.isArray(value)
                            ? value.join(", ")
                            : value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center mt-8 gap-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                ◀ Prev
              </button>

              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === index + 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Next ▶
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;