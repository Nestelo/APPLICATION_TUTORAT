import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const VoicePlayer = ({ audioUri, style }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadSound = async () => {
    if (!audioUri) return;

    try {
      console.log('Chargement du fichier audio:', audioUri);
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false },
        (status) => {
          if (status.isLoaded) {
            setDuration(status.durationMillis || 0);
            setPosition(status.positionMillis || 0);
            setIsPlaying(status.isPlaying || false);
          }
        }
      );
      
      setSound(sound);
    } catch (error) {
      console.error('Erreur lors du chargement du fichier audio:', error);
    }
  };

  const playSound = async () => {
    if (!sound) {
      await loadSound();
      return;
    }

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Erreur lors de la lecture:', error);
    }
  };

  const stopSound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        setIsPlaying(false);
        setPosition(0);
      } catch (error) {
        console.error('Erreur lors de l\'arrêt:', error);
      }
    }
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return '0:00';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!audioUri) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.text}>Aucun fichier audio</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={playSound}
        >
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.stopButton} 
          onPress={stopSound}
        >
          <Ionicons 
            name="stop" 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        <View style={styles.progress}>
          <Text style={styles.timeText}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  progress: {
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'System',
  },
  text: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default VoicePlayer;
