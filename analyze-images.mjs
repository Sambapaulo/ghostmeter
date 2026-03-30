import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function main() {
  const zai = await ZAI.create();
  
  const imagePaths = [
    'upload/Captur2.JPG',
    'upload/Captur3.JPG', 
    'upload/Capture4.JPG'
  ];
  
  const content = [
    {
      type: 'text',
      text: 'What are the error messages shown in these Git/PowerShell terminal screenshots? Read all the text carefully and tell me what errors are displayed. Be specific about the exact error messages.'
    }
  ];
  
  for (const path of imagePaths) {
    const imageBuffer = fs.readFileSync(path);
    const base64Image = imageBuffer.toString('base64');
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`
      }
    });
  }
  
  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: content
      }
    ],
    thinking: { type: 'disabled' }
  });
  
  console.log(response.choices[0]?.message?.content);
}

main().catch(console.error);
