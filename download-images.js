const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*'
      },
      timeout: 15000
    }, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    });
    req.on('error', (e) => { file.close(); try { fs.unlinkSync(dest); } catch(x){} reject(e); });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  const images = [
    // Styles - using Pexels free images (direct CDN links)
    { url: 'https://images.pexels.com/photos/3985338/pexels-photo-3985338.jpeg?auto=compress&cs=tinysrgb&w=600', dest: 'images/styles/ombre.jpg' },
    { url: 'https://images.pexels.com/photos/3985329/pexels-photo-3985329.jpeg?auto=compress&cs=tinysrgb&w=600', dest: 'images/styles/hairstroke.jpg' },
    { url: 'https://images.pexels.com/photos/3985340/pexels-photo-3985340.jpeg?auto=compress&cs=tinysrgb&w=600', dest: 'images/styles/korean.jpg' },
    { url: 'https://images.pexels.com/photos/3985337/pexels-photo-3985337.jpeg?auto=compress&cs=tinysrgb&w=600', dest: 'images/styles/soft-arch.jpg' },
    { url: 'https://images.pexels.com/photos/3985332/pexels-photo-3985332.jpeg?auto=compress&cs=tinysrgb&w=600', dest: 'images/styles/combo.jpg' },
    
    // Shops - logos/storefront from their sites or OG images
    { url: 'https://thammymisstram.vn/wp-content/uploads/2023/06/banner-miss-tram.jpg', dest: 'images/shops/misstram.jpg' },
    { url: 'https://bfrend.com/wp-content/uploads/2020/09/benh-vien-tham-my-kangnam-2.jpg', dest: 'images/shops/kangnam.jpg' },
    { url: 'https://npbrows.vn/wp-content/uploads/2023/01/np-brows-studio.jpg', dest: 'images/shops/npbrows.jpg' },
    { url: 'https://thammythucuc.vn/wp-content/uploads/2022/03/thu-cuc-sai-gon.jpg', dest: 'images/shops/thucuc.jpg' },
    { url: 'https://taylarnguyen.vn/wp-content/uploads/2023/01/taylar-nguyen-banner.jpg', dest: 'images/shops/taylar.jpg' },
  ];

  for (const img of images) {
    const dest = path.join(__dirname, img.dest);
    try {
      await download(img.url, dest);
      const size = fs.statSync(dest).size;
      console.log(`OK ${img.dest} (${(size/1024).toFixed(0)}KB)`);
    } catch (e) {
      console.log(`FAIL ${img.dest}: ${e.message}`);
    }
  }
}

main();
