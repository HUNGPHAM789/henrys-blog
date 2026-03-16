const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error('no url'));
    // Make absolute if needed
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    client.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
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

function extractOgImage(html, baseUrl) {
  // Try og:image first, then any large image
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogMatch) {
    let url = ogMatch[1];
    if (url.startsWith('//')) url = 'https:' + url;
    if (url.startsWith('/')) url = baseUrl + url;
    return url;
  }
  // Try twitter:image
  const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
  if (twMatch) {
    let url = twMatch[1];
    if (url.startsWith('//')) url = 'https:' + url;
    if (url.startsWith('/')) url = baseUrl + url;
    return url;
  }
  return null;
}

async function main() {
  const shops = [
    { name: 'misstram', url: 'https://thammymisstram.vn/' },
    { name: 'kangnam', url: 'https://benhvienthammykangnam.com.vn/' },
    { name: 'npbrows', url: 'https://npbrows.vn/' },
    { name: 'taylar', url: 'https://taylarnguyen.vn/' },
    { name: 'tuyenle', url: 'https://www.facebook.com/tuyenlebeautyacademy/' },
    { name: 'fleekbrows', url: 'https://fleekbrowsacademy.com/' },
    { name: 'timi', url: 'https://www.timipretty.com/' },
    { name: 'hoaianh', url: 'https://thammyhoaianh.com.vn/' },
  ];

  for (const shop of shops) {
    const dest = path.join(__dirname, `images/shops/${shop.name}.jpg`);
    if (fs.existsSync(dest)) { console.log(`SKIP ${shop.name} (exists)`); continue; }
    try {
      const html = await fetchPage(shop.url);
      const ogUrl = extractOgImage(html, shop.url.replace(/\/$/, ''));
      if (ogUrl) {
        await download(ogUrl, dest);
        const size = fs.statSync(dest).size;
        console.log(`OK ${shop.name} (${(size/1024).toFixed(0)}KB) from ${ogUrl.substring(0, 80)}...`);
      } else {
        console.log(`NO OG IMAGE for ${shop.name}`);
      }
    } catch (e) {
      console.log(`FAIL ${shop.name}: ${e.message}`);
    }
  }
}

main();
