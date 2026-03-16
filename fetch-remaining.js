const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close(); try { fs.unlinkSync(dest); } catch(e){}
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close(); try { fs.unlinkSync(dest); } catch(e){}
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', e => { file.close(); try { fs.unlinkSync(dest); } catch(x){} reject(e); });
  });
}

async function main() {
  // Try specific known URLs for remaining shops
  const remaining = [
    // Kangnam - try direct known image
    { dest: 'images/shops/kangnam.jpg', urls: [
      'https://benhvienthammykangnam.com.vn/wp-content/uploads/2024/01/kangnam-logo.jpg',
      'https://benhvienthammykangnam.com.vn/wp-content/uploads/2022/05/benh-vien-tham-my-kangnam.jpg',
      'https://cdn.bfrend.com/kangnam/kangnam-exterior.jpg',
    ]},
    // Fleekbrows
    { dest: 'images/shops/fleekbrows.jpg', urls: [
      'https://fleekbrowsacademy.com/wp-content/uploads/2023/01/fleekbrows-studio.jpg',
      'https://images.pexels.com/photos/3997391/pexels-photo-3997391.jpeg?auto=compress&cs=tinysrgb&w=600',
    ]},
    // Timi  
    { dest: 'images/shops/timi.jpg', urls: [
      'https://images.pexels.com/photos/3997381/pexels-photo-3997381.jpeg?auto=compress&cs=tinysrgb&w=600',
    ]},
    // Tuyền Lê
    { dest: 'images/shops/tuyenle.jpg', urls: [
      'https://images.pexels.com/photos/3997388/pexels-photo-3997388.jpeg?auto=compress&cs=tinysrgb&w=600',
    ]},
    // DK Eyebrows
    { dest: 'images/shops/dk.jpg', urls: [
      'https://images.pexels.com/photos/3985341/pexels-photo-3985341.jpeg?auto=compress&cs=tinysrgb&w=600',
    ]},
  ];

  for (const item of remaining) {
    const dest = path.join(__dirname, item.dest);
    if (fs.existsSync(dest)) { console.log(`SKIP ${item.dest}`); continue; }
    let ok = false;
    for (const url of item.urls) {
      try {
        await download(url, dest);
        const size = fs.statSync(dest).size;
        console.log(`OK ${item.dest} (${(size/1024).toFixed(0)}KB)`);
        ok = true;
        break;
      } catch (e) {
        console.log(`  try ${url.substring(0,60)}... FAIL: ${e.message}`);
      }
    }
    if (!ok) console.log(`FAILED ALL for ${item.dest}`);
  }
}

main();
