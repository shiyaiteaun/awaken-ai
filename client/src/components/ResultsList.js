import React, { useState } from 'react'; // useState ကို import လုပ်ပါ
// API_BASE_URL ကို App.js ကနေ props အနေနဲ့ လက်ခံရပါမယ်။
// ဒါမှမဟုတ် ဒီ component ထဲမှာ တိုက်ရိုက် သတ်မှတ်လည်း ရပါတယ်။
const API_BASE_URL = 'http://localhost:5000'; // Backend URL ကို ဒီမှာ သတ်မှတ်ပါ

function ResultsList({ results }) {
  // Copy လုပ်ပြီးကြောင်း ခဏပြဖို့ state
  const [copiedItemId, setCopiedItemId] = useState(null);
  const [shareErrorItemId, setShareErrorItemId] = useState(null); // Share error အတွက် state

  if (!results || results.length === 0) {
    // App.js မှာ error message ပြပြီးသားမို့ ဒီမှာ ဘာမှမပြလည်း ရပါတယ်
    // ဒါမှမဟုတ် "No results to display." လိုမျိုး ပြချင်ရင် ပြနိုင်ပါတယ်
    return null;
  }

  // Share button နှိပ်ရင် ခေါ်မယ့် function
  const handleShare = async (item) => {
    const fileUrl = `${API_BASE_URL}/api/files/${item.filename}`;
    const shareData = {
      title: item.originalName, // Share dialog မှာ ပြမယ့် ခေါင်းစဉ်
      text: `Check out this file: ${item.originalName}`, // Share dialog မှာ ပြမယ့် စာသား
      url: fileUrl, // Share လုပ်မယ့် link
    };

    // Web Share API ရှိမရှိ စစ်ဆေးပါ
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        // အောင်မြင်ရင် ဘာမှ ထပ်ပြစရာမလို (native UI ပေါ်ပြီးသား)
        console.log('Shared successfully');
        setCopiedItemId(null); // အရင် copy message ရှိရင် ဖျောက်
        setShareErrorItemId(null); // Error message ရှိရင် ဖျောက်
      } catch (err) {
        // User က cancel လုပ်တာ ဒါမှမဟုတ် တခြား error
        console.error('Share failed:', err);
        // User cancel လုပ်တာမဟုတ်ရင် error ပြနိုင်
        if (err.name !== 'AbortError') {
            setShareErrorItemId(item._id);
            setTimeout(() => setShareErrorItemId(null), 3000); // 3 စက္ကန့်ကြာရင် error ပျောက်
        }
        setCopiedItemId(null); // အရင် copy message ရှိရင် ဖျောက်
      }
    } else {
      // Web Share API မရှိရင် Clipboard ကိုပဲ copy ကူးပါ (Fallback)
      navigator.clipboard.writeText(fileUrl)
        .then(() => {
          setCopiedItemId(item._id);
          setShareErrorItemId(null); // Error message ရှိရင် ဖျောက်
          setTimeout(() => setCopiedItemId(null), 2000);
        })
        .catch(err => {
          console.error('Failed to copy URL: ', err);
          alert('Web Share is not supported, and failed to copy URL. Please copy it manually.');
          setCopiedItemId(null);
          setShareErrorItemId(null);
        });
    }
  };

  // Open button နှိပ်ရင် ခေါ်မယ့် function
  const handleOpen = (item) => {
    const fileUrl = `${API_BASE_URL}/api/files/${item.filename}`;
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };


  return (
    <div className="results-list">
      <h2>Search Results</h2>
      <ul>
        {results.map((item) => (
          <li key={item._id}> {/* MongoDB က default _id ကို key အဖြစ်သုံး */}
            <strong>{item.originalName}</strong> ({item.mimeType})

            {/* --- Buttons --- */}
            <div style={{ marginTop: '5px' }}>
              <button
                onClick={() => handleOpen(item)}
                style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}
              >
                Open
              </button>
              <button
                onClick={() => handleShare(item)}
                style={{ padding: '5px 10px', cursor: 'pointer' }}
              >
                {/* State အလိုက် စာသားပြောင်းပါ */}
                {copiedItemId === item._id ? 'Copied!' : (shareErrorItemId === item._id ? 'Share Failed' : 'Share')}
              </button>
            </div>
            {/* --- End Buttons --- */}

            {item.description && <p><em>Description:</em> {item.description}</p>}
            {/* <p><small>Path: {item.path}</small></p> */} {/* Path ကို မပြတော့ပါ */}
            <p><small>Size: {(item.size / 1024).toFixed(2)} KB</small></p>
            {item.keywords && item.keywords.length > 0 && (
              <p><small>Keywords: {item.keywords.join(', ')}</small></p>
            )}
             {item.category && <p><small>Category: {item.category}</small></p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ResultsList;