import * as FileSystem from 'expo-file-system/legacy';
import * as Permissions from 'expo-permissions';

export class VoiceRecordingHelper {
  static async createMockAudioFile() {
    // Créer un fichier audio temporaire pour les tests
    const timestamp = Date.now();
    const fileName = `temp_audio_${timestamp}.3gp`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    try {
      // Créer un fichier audio simulé avec des données binaires
      const mockAudioData = this.generateMockAudioData();
      await FileSystem.writeAsStringAsync(fileUri, mockAudioData, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Vérifier que le fichier existe
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('Fichier audio non créé');
      }
      
      console.log('Fichier audio créé avec succès:', fileUri);
      
      return {
        uri: fileUri,
        duration: 5, // 5 secondes de durée simulée
        size: fileInfo.size || 1024,
        fileName: fileName
      };
    } catch (error) {
      console.error('Erreur création fichier audio simulé:', error);
      return null;
    }
  }
  
  static generateMockAudioData() {
    // Générer des données audio simulées en base64
    // C'est un petit fichier audio 3GP simulé
    return 'AAAAFZpZW4AAAAAbm90LXZhbGlkAQIAAABAAAAAAAgAAAAECAAAABAAAAQAAAAICAAABAAABAAAAAgAAAAECAAAABAAAAQAAAAICAAAA';
  }
  
  static async validateAudioFile(audioData) {
    if (!audioData || !audioData.uri) {
      return { valid: false, error: 'Fichier audio manquant' };
    }
    
    // Vérifier si c'est un fichier valide
    const fileExists = await FileSystem.getInfoAsync(audioData.uri);
    if (!fileExists.exists) {
      return { valid: false, error: 'Fichier audio introuvable' };
    }
    
    return { valid: true };
  }
  
  static formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `00:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  static async cleanupTempFiles() {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const tempFiles = files.filter(file => file.startsWith('temp_audio_'));
      
      for (const file of tempFiles) {
        await FileSystem.deleteAsync(`${FileSystem.documentDirectory}${file}`);
      }
    } catch (error) {
      console.error('Erreur nettoyage fichiers temporaires:', error);
    }
  }
}
