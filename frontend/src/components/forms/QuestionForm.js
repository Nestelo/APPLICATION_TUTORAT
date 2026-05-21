import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../ui/Input';
import Button from '../ui/Button';

const QuestionForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    titre: '',
    contenu: '',
    matiere: '',
    tags: '',
    priorite: 'moyenne', // Ajout de la priorité par défaut
  });
  const [errors, setErrors] = useState({});

  const priorites = [
    { value: 'haute', label: '🔴 Haute', color: '#e74c3c' },
    { value: 'moyenne', label: '🟡 Moyenne', color: '#f39c12' },
    { value: 'basse', label: '🟢 Basse', color: '#27ae60' },
  ];

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.titre) newErrors.titre = 'Titre requis';
    if (!formData.contenu) newErrors.contenu = 'Contenu requis';
    return newErrors;
  };

  const handleSubmit = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <View style={styles.container}>
      <CustomInput
        label="Titre"
        value={formData.titre}
        onChangeText={(text) => handleChange('titre', text)}
        error={errors.titre}
      />
      <CustomInput
        label="Contenu"
        value={formData.contenu}
        onChangeText={(text) => handleChange('contenu', text)}
        multiline
        numberOfLines={5}
        error={errors.contenu}
      />
      <CustomInput
        label="Matière (optionnel)"
        value={formData.matiere}
        onChangeText={(text) => handleChange('matiere', text)}
      />
      <CustomInput
        label="Tags (séparés par des virgules)"
        value={formData.tags}
        onChangeText={(text) => handleChange('tags', text)}
      />
      
      {/* Sélecteur de priorité */}
      <Text style={styles.label}>Priorité</Text>
      <View style={styles.prioriteContainer}>
        {priorites.map((priorite) => (
          <TouchableOpacity
            key={priorite.value}
            style={[
              styles.prioriteButton,
              formData.priorite === priorite.value && { 
                backgroundColor: priorite.color,
                borderColor: priorite.color 
              }
            ]}
            onPress={() => handleChange('priorite', priorite.value)}
          >
            <Text style={[
              styles.prioriteText,
              formData.priorite === priorite.value && { color: 'white' }
            ]}>
              {priorite.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Button
        title="Publier la question"
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  prioriteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  prioriteButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  prioriteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    marginTop: 20,
  },
});

export default QuestionForm;