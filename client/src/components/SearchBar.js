import React, { useState } from 'react';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleInputChange = (event) => {
    setQuery(event.target.value);
  };

  const handleSearchClick = () => {
    onSearch(query); // App.js က handleSearch function ကို ခေါ်မယ်
  };

  const handleKeyPress = (event) => {
    // Enter key နှိပ်ရင်လည်း search လုပ်မယ်
    if (event.key === 'Enter') {
      handleSearchClick();
    }
  };

  return (
    <div className="search-bar">
      <h2>Search Information</h2>
      <input
        type="text"
        placeholder="Enter search term (e.g., filename, keyword)"
        value={query}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress} // Enter key အတွက်
      />
      <button onClick={handleSearchClick}>Search</button>
    </div>
  );
}

export default SearchBar;