import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import CustomInput from '../ui/Input';
import Button from '../ui/Button';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2', 'Tous'];
const MATIERES_PREDEF = [
  'Mathématiques',
  'Physique',
  'Chimie',
  'Informatique',
  'SVT',
  'Histoire-Géographie',
  'Français',
  'Anglais',
  'Économie',
  'Autre',
];

const TYPE_OPTIONS = [
  { label: 'Cours', value: 'cours' },
  { label: 'PDF', value: 'pdf' },
  { label: 'Exercice', value: 'exercice' },
  { label: 'Corrigé', value: 'corrige' },
  { label: 'Vidéo (lien)', value: 'video' },
  { label: 'Lien', value: 'lien' },
  { label: 'Image', value: 'image' },
];

const RessourceUploadForm = ({ onSubmit, loading, initialValues }) => {
  const isEdit = Boolean(initialValues?.id);
  const [existingFichierUrl, setExistingFichierUrl] = useState(initialValues?.fichier || null);

  const [formData, setFormData] = useState({
    titre: initialValues?.titre || '',
    description: initialValues?.description || '',
    matiere: initialValues?.matiere || '',
    niveau: initialValues?.niveau || '',
    type_fichier: initialValues?.type_fichier || 'pdf',
    fichier: null, // uniquement si nouvel upload
    lien_externe: initialValues?.lien_externe || '',
    tags: initialValues?.tags || '',
  });

  const [customMatiere, setCustomMatiere] = useState('');
  const [showCustomMatiere, setShowCustomMatiere] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setExistingFichierUrl(initialValues?.fichier || null);
    setFormData({
      titre: initialValues?.titre || '',
      description: initialValues?.description || '',
      matiere: initialValues?.matiere || '',
      niveau: initialValues?.niveau || '',
      type_fichier: initialValues?.type_fichier || 'pdf',
      fichier: null,
      lien_externe: initialValues?.lien_externe || '',
      tags: initialValues?.tags || '',
    });
    // Si la matière n'est pas dans la liste prédéfinie, on bascule en "autre"
    const mat = initialValues?.matiere || '';
    if (mat && !MATIERES_PREDEF.includes(mat)) {
      setShowCustomMatiere(true);
      setCustomMatiere(mat);
    } else {
      setShowCustomMatiere(false);
      setCustomMatiere('');
    }
  }, [initialValues]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      if (result.type === 'success') {
        setFormData((prev) => ({
          ...prev,
          fichier: {
            uri: result.uri,
            name: result.name || 'document',
            mimeType: result.mimeType || 'application/octet-stream',
          },
        }));
        setExistingFichierUrl(null);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.titre.trim()) newErrors.titre = 'Titre requis';

    const matiereFinal = showCustomMatiere && customMatiere.trim() ? customMatiere.trim() : formData.matiere;
    if (!matiereFinal.trim()) newErrors.matiere = 'Matière requise';
    if (!formData.niveau.trim()) newErrors.niveau = 'Niveau requis';

    if (!formData.type_fichier) newErrors.type_fichier = 'Type requis';

    const isLienOrVideo = formData.type_fichier === 'lien' || formData.type_fichier === 'video';
    if (isLienOrVideo) {
      if (!formData.lien_externe.trim()) newErrors.lien_externe = 'Lien requis';
    } else {
      // création: fichier requis; édition: fichier requis seulement si on n'a pas de fichier existant
      if (!formData.fichier && !existingFichierUrl) {
        newErrors.fichier = 'Fichier requis';
      }
    }
    return newErrors;
  };

  const handleSubmit = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length === 0) {
      const matiereFinal = showCustomMatiere && customMatiere.trim() ? customMatiere.trim() : formData.matiere;
      onSubmit({
        ...formData,
        matiere: matiereFinal,
      });
    } else {
      setErrors(newErrors);
      Alert.alert('Erreur', 'Veuillez corriger les champs obligatoires.');
    }
  };

  const type = formData.type_fichier;
  const isLienOrVideo = type === 'lien' || type === 'video';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <CustomInput
        label="Titre"
        value={formData.titre}
        onChangeText={(text) => handleChange('titre', text)}
        error={errors.titre}
      />

      <CustomInput
        label="Description"
        value={formData.description}
        onChangeText={(text) => handleChange('description', text)}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.sectionLabel}>Matière</Text>
      <View style={styles.chipsRow}>
        {MATIERES_PREDEF.map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => {
              if (m === 'Autre') {
                setShowCustomMatiere(true);
                setCustomMatiere('');
              } else {
                setShowCustomMatiere(false);
                setCustomMatiere('');
                handleChange('matiere', m);
              }
            }}
            style={[
              styles.chip,
              !showCustomMatiere && formData.matiere === m && styles.chipActive,
              showCustomMatiere && m === 'Autre' && styles.chipActive,
            ]}
          >
            <Text style={styles.chipText}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {showCustomMatiere && (
        <CustomInput
          label="Autre matière"
          value={customMatiere}
          onChangeText={setCustomMatiere}
          error={errors.matiere}
        />
      )}

      <Text style={styles.sectionLabel}>Niveau</Text>
      <View style={styles.chipsRow}>
        {NIVEAUX.map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => handleChange('niveau', n)}
            style={[styles.chip, formData.niveau === n && styles.chipActive]}
          >
            <Text style={styles.chipText}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.niveau ? <Text style={styles.errorText}>{errors.niveau}</Text> : null}

      <View style={styles.pickerContainer}>
        <Text style={styles.sectionLabel}>Type de ressource</Text>
        <Picker
          selectedValue={formData.type_fichier}
          onValueChange={(value) => {
            handleChange('type_fichier', value);
            // Pour la création: ouvrir le sélecteur immédiatement pour les ressources "fichier"
            if (!isEdit && value !== 'lien' && value !== 'video') {
              setTimeout(() => pickDocument(), 0);
            }
          }}
          style={styles.picker}
        >
          {TYPE_OPTIONS.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>
      {isLienOrVideo ? (
        <CustomInput
          label={type === 'video' ? 'Lien vidéo (YouTube, etc.)' : 'Lien externe'}
          value={formData.lien_externe}
          onChangeText={(text) => handleChange('lien_externe', text)}
          error={errors.lien_externe}
        />
      ) : (
        <View style={styles.fileBlock}>
          <Button title="Choisir un fichier" onPress={pickDocument} style={styles.fileButton} loading={loading} />
          <Text style={styles.fileHint}>
            {formData.fichier?.name
              ? `Fichier sélectionné: ${formData.fichier.name}`
              : existingFichierUrl
                ? 'Fichier existant (aucune nouvelle sélection)'
                : errors.fichier
                  ? errors.fichier
                  : 'Aucun fichier sélectionné'}
          </Text>
        </View>
      )}

      <CustomInput
        label="Tags (séparés par des virgules)"
        value={formData.tags}
        onChangeText={(text) => handleChange('tags', text)}
      />

      <Button
        title={isEdit ? 'Mettre à jour la ressource' : 'Publier la ressource'}
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  pickerContainer: { marginBottom: 12 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
    marginRight: 6,
    marginBottom: 6,
  },
  chipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  fileBlock: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  fileButton: { marginBottom: 8 },
  fileHint: {
    color: '#666',
    fontSize: 13,
  },
  errorText: { color: '#dc3545', fontSize: 13, marginBottom: 8 },
  button: { marginTop: 20 },
});

export default RessourceUploadForm;