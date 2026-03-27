import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/z/my-project/download/ghostmeter_videos';

const video1Prompts = [
  {
    filename: '01_ghost_detector_intro.png',
    prompt: 'Mysterious ghost detector app on smartphone screen, dark moody atmosphere, ghost detection interface with radar scanning, purple and cyan neon glow, supernatural energy waves, paranormal activity indicator, professional app mockup, dark background with fog, vertical mobile format, 9:16 aspect ratio'
  },
  {
    filename: '02_sad_person_phone.png',
    prompt: 'Young sad person looking at phone with disappointment, no response to messages, ghosted situation, dark moody lighting, alone in room, phone screen showing no new messages, emotional scene, cinematic, vertical format 9:16'
  },
  {
    filename: '03_ghost_meter_analysis.png',
    prompt: 'Smartphone screen showing ghost meter analysis results, paranormal detection app interface, ghost probability percentage, energy level indicator, purple and cyan UI design, professional app mockup, dark mysterious background, vertical format'
  },
  {
    filename: '04_ghost_revealed.png',
    prompt: 'Dramatic reveal of ghost figure emerging from phone screen, supernatural entity, transparent ethereal form, purple and cyan glow, spooky atmosphere, cinematic lighting, horror movie style, vertical format 9:16'
  },
  {
    filename: '05_person_shocked_discovery.png',
    prompt: 'Shocked person discovering truth on phone, revelation moment, dramatic lighting, cinematic portrait, expression of surprise and understanding, phone illuminating face in dark room, vertical format 9:16'
  }
];

const video2Prompts = [
  {
    filename: '01_sad_rejection.png',
    prompt: 'Sad person crying looking at phone with rejection message on screen, heartbroken, dark room, emotional scene, phone showing sad message, dramatic moody lighting, cinematic, vertical format 9:16'
  },
  {
    filename: '02_message_no_response.png',
    prompt: 'Phone screen showing text message conversation with no response, blue bubbles only one side, waiting for reply, sad dating app chat, dark background, vertical format close up'
  },
  {
    filename: '03_magic_wand_transformation.png',
    prompt: 'Magical transformation scene, sparkles and golden light particles, phone screen glowing with magic, cupid arrow effect, romantic magical energy, transformation moment, fairy tale style, vertical format 9:16'
  },
  {
    filename: '04_perfect_response.png',
    prompt: 'Phone screen showing perfect charming response message, dating app chat with heart reactions, romantic conversation success, pink and red tones, happy outcome, love message, vertical format'
  },
  {
    filename: '05_happy_person_phone.png',
    prompt: 'Happy excited person looking at phone with joy, successful dating conversation, smiling at phone screen, bright warm lighting, romantic success, joyful expression, cinematic portrait, vertical format 9:16'
  }
];

const video3Prompts = [
  {
    filename: '01_confused_person.png',
    prompt: 'Confused person with question marks around head, unsure about relationship, puzzled expression, thinking hard, dating dilemma, colorful abstract question marks floating, modern illustration style, vertical format 9:16'
  },
  {
    filename: '02_relationship_problems.png',
    prompt: 'Split screen showing couple having problems, broken heart between them, relationship issues, arguing couple silhouette, red and blue lighting, dramatic scene, relationship trouble visualization, vertical format'
  },
  {
    filename: '03_ai_coach_appears.png',
    prompt: 'Futuristic AI love coach avatar appearing on phone screen, holographic effect, wise friendly robot assistant, heart icons, pink and purple glow, digital cupid, helpful AI interface, vertical format'
  },
  {
    filename: '04_advice_chat.png',
    prompt: 'Phone screen showing AI chat conversation giving relationship advice, helpful tips, heartwarming messages, coach interface, modern app design, pink and warm colors, vertical format'
  },
  {
    filename: '05_happy_couple_reunited.png',
    prompt: 'Happy couple hugging reunited, love restored, romantic moment, warm golden lighting, joyful reunion, relationship saved, cinematic romantic scene, vertical format 9:16'
  }
];

async function generateImage(zai: any, prompt: string, outputPath: string): Promise<boolean> {
  try {
    console.log(`  🎨 Generating: ${path.basename(outputPath)}...`);
    
    const response = await zai.images.generations.create({
      prompt: prompt,
      size: '768x1344'
    });

    const imageBase64 = response.data[0].base64;
    const buffer = Buffer.from(imageBase64, 'base64');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`  ✅ Saved: ${outputPath}`);
    return true;
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting GhostMeter Video Assets Generation...\n');
  
  const zai = await ZAI.create();
  
  // Video 1
  console.log('📹 VIDEO 1: Ghost Detector');
  console.log('━'.repeat(40));
  for (const item of video1Prompts) {
    const outputPath = path.join(OUTPUT_DIR, 'video1_ghost_detector', item.filename);
    await generateImage(zai, item.prompt, outputPath);
  }
  
  // Video 2
  console.log('\n📹 VIDEO 2: Reply Magic');
  console.log('━'.repeat(40));
  for (const item of video2Prompts) {
    const outputPath = path.join(OUTPUT_DIR, 'video2_reply_magic', item.filename);
    await generateImage(zai, item.prompt, outputPath);
  }
  
  // Video 3
  console.log('\n📹 VIDEO 3: Love Coach');
  console.log('━'.repeat(40));
  for (const item of video3Prompts) {
    const outputPath = path.join(OUTPUT_DIR, 'video3_love_coach', item.filename);
    await generateImage(zai, item.prompt, outputPath);
  }
  
  console.log('\n✨ All assets generated successfully!');
}

main().catch(console.error);
