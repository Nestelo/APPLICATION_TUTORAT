import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const TextInputField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  multiline = false, 
  numberOfLines = 1, 
  keyboardType = 'default',
  autoCorrect = false,
  autoCapitalize = 'sentences',
  blurOnSubmit = false,
  returnKeyType = 'next',
  onSubmitEditing = null
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCorrect={autoCorrect}
        autoCapitalize={autoCapitalize}
        blurOnSubmit={blurOnSubmit}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        enablesReturnKeyAutomatically={true}
        keyboardAppearance="default"
        selectTextOnFocus={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    minHeight: 44,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default TextInputField;
