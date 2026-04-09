// generate_videos.js
const fs = require('fs');
const puppeteer = require('puppeteer');
const { execSync } = require('child_process');

const outputDir = './videos';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const htmlPath = 'ghostmeter.html'; // ton HTML complet ici
const totalVideos = 30;

// Fonction pour créer une vidéo à partir d'une URL HTML
async function renderVideo(videoIndex) {
  const browser = await puppeteer.launch({
    defaultViewport: { width: 1080, height: 1920 }
  });
  const page = await browser.newPage();
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const screenshotDir = `./temp_${videoIndex}`;
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

  console.log(`📸 Capture frames pour vidéo ${videoIndex+1}...`);
  
  // Capturer des frames toutes les 100ms pour ~25 fps sur 25s
  const frames = 250; // 25 fps * 10 sec ou plus
  for (let i = 0; i < frames; i++) {
    // Exécute la fonction run() si ce n'est pas déjà fait
    await page.evaluate(() => {
      if (window.run) window.run();
    });

    const filePath = `${screenshotDir}/frame_${String(i).padStart(4, '0')}.png`;
    await page.screenshot({ path: filePath });
    await new Promise(r => setTimeout(r, 40)); // ~25fps
  }

  console.log(`🎬 Génération MP4 avec FFmpeg...`);
  const outputFile = `${outputDir}/ghostmeter_${String(videoIndex+1).padStart(2,'0')}.mp4`;

  // FFmpeg pour créer la vidéo à partir des frames
  execSync(
    `ffmpeg -y -framerate 25 -i ${screenshotDir}/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -vf "scale=1080:1920" ${outputFile}`,
    { stdio: 'inherit' }
  );

  // Supprime les frames
  fs.rmSync(screenshotDir, { recursive: true, force: true });
  await browser.close();
  console.log(`✅ Vidéo ${videoIndex+1} créée : ${outputFile}`);
}

(async () => {
  for (let i = 0; i < totalVideos; i++) {
    await renderVideo(i);
  }
  console.log('🎉 Toutes les vidéos ont été générées !');
})();