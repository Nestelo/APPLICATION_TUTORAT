import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  icon,
  onIconPress,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  loading = false,
  style,
  inputStyle,
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const toggleSecure = () => setIsSecure(!isSecure);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError, !editable && styles.disabled]}>
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={toggleSecure} style={styles.eyeIcon}>
            <Ionicons name={isSecure ? 'eye-off' : 'eye'} size={20} color="#666" />
          </TouchableOpacity>
        )}
        {icon && !loading && (
          <TouchableOpacity onPress={onIconPress} style={styles.icon}>
            <Ionicons name={icon} size={20} color="#666" />
          </TouchableOpacity>
        )}
        {loading && (
          <ActivityIndicator size="small" color="#666" style={styles.loading} />
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  disabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  eyeIcon: {
    paddingHorizontal: 10,
  },
  icon: {
    paddingHorizontal: 10,
  },
  loading: {
    paddingHorizontal: 10,
  },
});

export default CustomInput;