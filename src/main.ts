// main.ts - Capacitor/Ionic version
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Fonction pour lire une capture en base64
async function readPhotoBase64(photo: Photo): Promise<string> {
  if (photo.base64String) {
    return photo.base64String;
  }
  if (photo.path) {
    // Pour Android API >= 30, utiliser Filesystem pour lire le fichier
    const file = await Filesystem.readFile({
      path: photo.path,
      directory: Directory.External,
    });
    return file.data;
  }
  throw new Error('Impossible de lire la capture');
}

// Exemple d'analyse (à adapter selon ton traitement)
async function analyzePhoto(photo: Photo): Promise<{ name: string; result: string }> {
  try {
    const base64 = await readPhotoBase64(photo);
    const result = `Taille base64: ${base64.length} caractères`; // Analyse exemple
    return { name: photo.path ?? 'unknown', result };
  } catch (err) {
    return { name: photo.path ?? 'unknown', result: `❌ Erreur: ${err}` };
  }
}

// Sélection et analyse multiple
export async function selectAndAnalyzePhotos(): Promise<void> {
  try {
    // Sélection multiple (Capacitor 6+)
    const photos: Photo[] = await Camera.pickImages({
      limit: 10, // Nombre max de captures à sélectionner
    });

    const results = [];
    for (const photo of photos) {
      const res = await analyzePhoto(photo);
      results.push(res);
    }

    console.log('Résultats analyse:', results);
    alert(results.map(r => `${r.name}: ${r.result}`).join('\n\n'));
  } catch (err) {
    console.error('Erreur sélection/analyse:', err);
    alert(`Erreur: ${err}`);
  }
}

// Appel de la fonction depuis l'app
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('analyzeBtn');
  btn?.addEventListener('click', () => selectAndAnalyzePhotos());
});