import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fetch each URL to check if it returns HTTP 200
async function checkUrl(url) {
  if (!url || typeof url !== 'string') return { status: 'invalid', code: 0 };
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      redirect: 'follow'
    });
    
    return { status: res.ok ? 'OK' : 'FAIL', code: res.status };
  } catch (err) {
    return { status: 'ERROR', message: err.message };
  }
}

async function audit() {
  // Resolve relative JSON file location
  const jsonPath = path.resolve(__dirname, '../data/roadmapResources.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('File not found:', jsonPath);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const results = [];
  
  console.log('Auditing URLs in roadmapResources.json...\n');
  
  for (const [topicKey, topicGroup] of Object.entries(data)) {
    if (topicKey === 'playlists' || topicKey === 'dsaPlaylists') {
      for (const [lang, url] of Object.entries(topicGroup)) {
        if (typeof url === 'string') {
          results.push({ topic: topicKey, lang, type: 'playlist', url });
        } else if (typeof url === 'object') {
          for (const [subLang, subUrl] of Object.entries(url)) {
            if (typeof subUrl === 'string') {
              results.push({ topic: topicKey + '.' + lang, lang: subLang, type: 'playlist', url: subUrl });
            }
          }
        }
      }
      continue;
    }
    
    if (topicGroup && topicGroup.practiceUrl) {
      results.push({
        topic: topicKey,
        lang: 'all',
        type: 'practice',
        url: topicGroup.practiceUrl
      });
      if (topicGroup.videoUrl) {
        if (Array.isArray(topicGroup.videoUrl)) {
          topicGroup.videoUrl.forEach((vUrl, index) => {
            results.push({
              topic: topicKey,
              lang: 'all',
              type: `video_${index + 1}`,
              url: vUrl
            });
          });
        } else {
          results.push({
            topic: topicKey,
            lang: 'all',
            type: 'video',
            url: topicGroup.videoUrl
          });
        }
      }
    } else {
      for (const [lang, config] of Object.entries(topicGroup)) {
        if (config && config.practiceUrl) {
          results.push({
            topic: topicKey,
            lang,
            type: 'practice',
            url: config.practiceUrl
          });
        }
      }
    }
  }
  
  console.log(`Total URLs to check: ${results.length}\n`);
  
  const brokenList = [];
  const okList = [];
  
  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    process.stdout.write(`Checking [${i+1}/${results.length}]: ${item.url} ... `);
    
    const check = await checkUrl(item.url);
    if (check.status === 'OK') {
      console.log(`\x1b[32mOK (${check.code})\x1b[0m`);
      okList.push(item);
    } else {
      const reason = check.code ? `HTTP ${check.code}` : check.message;
      console.log(`\x1b[31mFAILED: ${reason}\x1b[0m`);
      brokenList.push({ ...item, reason });
    }
  }
  
  console.log('\n======================================');
  console.log(`Audit Finished.`);
  console.log(`Total checked: ${results.length}`);
  console.log(`OK: ${okList.length}`);
  console.log(`Broken: ${brokenList.length}`);
  console.log('======================================\n');
  
  if (brokenList.length > 0) {
    console.error(`Error: Found ${brokenList.length} broken links!`);
    brokenList.forEach((item, idx) => {
      console.error(`${idx + 1}. [${item.topic}] (${item.lang}) -> ${item.url} (Reason: ${item.reason})`);
    });
    process.exit(1);
  } else {
    console.log('All links verified successfully! No broken links found.');
    process.exit(0);
  }
}

audit();
