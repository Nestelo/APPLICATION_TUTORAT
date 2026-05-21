import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const VoiceRecorder = ({ onRecordingComplete, maxDuration = 300 }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recording, setRecording] = useState(null);
  const [duration, setDuration] = useState(0);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUri, setAudioUri] = useState(null);
  const [fileSize, setFileSize] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      console.log('Demande de permission pour l\'enregistrement...');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La permission d\'enregistrer est requise pour utiliser les messages vocaux');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Début de l\'enregistrement...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setDuration(0);
      
      // Démarrer le chronomètre
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);

      console.log('Enregistrement démarré');
    } catch (err) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', err);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement audio');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    console.log('Arrêt de l\'enregistrement...');
    setIsRecording(false);
    setIsPaused(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    try {
      // Vérifier si l'enregistrement est déjà chargé
      const status = await recording.getStatusAsync();
      
      let uri;
      if (status.isLoaded && !status.isDone) {
        await recording.stopAndUnloadAsync();
        uri = recording.getURI();
      } else if (status.isDone) {
        // Si déjà terminé, récupérer simplement l'URI
        uri = recording.getURI();
      } else {
        // Dernier recours, essayer d'arrêter
        try {
          await recording.stopAndUnloadAsync();
          uri = recording.getURI();
        } catch (e) {
          console.warn('Enregistrement déjà arrêté, récupération de l\'URI...');
          uri = recording.getURI();
        }
      }
      
      console.log('Enregistrement arrêté et stocké à:', uri);
      
      // Obtenir la taille du fichier
      const size = await getFileSize(uri);
      setFileSize(size);
      
      setAudioUri(uri);
      setRecording(null);
      
      // Notifier le composant parent
      if (onRecordingComplete && uri) {
        onRecordingComplete({
          uri,
          duration,
          size
        });
      }
    } catch (err) {
      console.error('Erreur lors de l\'arrêt de l\'enregistrement:', err);
      Alert.alert('Erreur', 'Impossible d\'arrêter l\'enregistrement');
    }
  };

  const pauseRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.pauseAsync();
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } catch (err) {
      console.error('Erreur lors de la pause de l\'enregistrement:', err);
    }
  };

  const resumeRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.startAsync();
      setIsPaused(false);
      
      // Reprendre le chronomètre
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Erreur lors de la reprise de l\'enregistrement:', err);
    }
  };

  const playRecording = async () => {
    if (!audioUri) return;

    try {
      console.log('Lecture de l\'enregistrement...');
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      
      setSound(sound);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.error('Erreur lors de la lecture:', err);
      Alert.alert('Erreur', 'Impossible de lire l\'enregistrement');
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setAudioUri(null);
    setDuration(0);
    setFileSize(0);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
  };

  const getFileSize = async (uri) => {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info.size || 0;
    } catch (err) {
      console.error('Erreur lors de l\'obtention de la taille du fichier:', err);
      return 0;
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Message Vocal</Text>
      
      {!isRecording && !audioUri && (
        <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
          <Ionicons name="mic" size={32} color="#fff" />
          <Text style={styles.recordButtonText}>Appuyer pour enregistrer</Text>
        </TouchableOpacity>
      )}

      {isRecording && (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingHeader}>
            <View style={styles.recordingIndicator}>
              <Ionicons name="mic" size={24} color="#e74c3c" />
              <Text style={styles.recordingText}>
                {isPaused ? 'En pause' : 'Enregistrement...'}
              </Text>
            </View>
            <Text style={styles.duration}>{formatDuration(duration)}</Text>
          </View>
          
          <View style={styles.recordingControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.pauseButton]} 
              onPress={isPaused ? resumeRecording : pauseRecording}
            >
              <Ionicons 
                name={isPaused ? "play" : "pause"} 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.stopButton]} 
              onPress={stopRecording}
            >
              <Ionicons name="stop" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(duration / maxDuration) * 100}%` }
              ]} 
            />
          </View>
        </View>
      )}

      {audioUri && (
        <View style={styles.playbackContainer}>
          <View style={styles.playbackHeader}>
            <Text style={styles.playbackTitle}>Enregistrement terminé</Text>
            <Text style={styles.playbackInfo}>
              {formatDuration(duration)} - {formatFileSize(fileSize)}
            </Text>
          </View>
          
          <View style={styles.playbackControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.playButton]} 
              onPress={isPlaying ? stopPlayback : playRecording}
            >
              <Ionicons 
                name={isPlaying ? "stop" : "play"} 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.deleteButton]} 
              onPress={deleteRecording}
            >
              <Ionicons name="trash" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <Text style={styles.maxDuration}>Durée maximale: {formatDuration(maxDuration)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recordButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  recordingContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c',
    marginLeft: 8,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  recordingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButton: {
    backgroundColor: '#f39c12',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  playButton: {
    backgroundColor: '#27ae60',
  },
  deleteButton: {
    backgroundColor: '#95a5a6',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#ecf0f1',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e74c3c',
  },
  playbackContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  playbackHeader: {
    marginBottom: 16,
  },
  playbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
  },
  playbackInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  maxDuration: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default VoiceRecorder;
