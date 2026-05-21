import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Header = ({
  title,
  showBack = false,
  onBackPress,
  rightIcon,
  onRightPress,
  rightButton,
  style,
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <View style={styles.header}>
        {showBack && (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
        {rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
            <Ionicons name={rightIcon} size={24} color="#000" />
          </TouchableOpacity>
        ) : rightButton ? (
          <TouchableOpacity onPress={rightButton.onPress} style={[styles.rightButton, { backgroundColor: rightButton.color }]}>
            <Text style={styles.rightButtonText}>{rightButton.text}</Text>
            <Ionicons name={rightButton.icon} size={16} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.rightPlaceholder} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  rightButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  rightButtonText: {
    fontSize: 14,
    color: '#fff',
    marginRight: 4,
  },
  rightPlaceholder: {
    width: 40,
  },
});

export default Header;