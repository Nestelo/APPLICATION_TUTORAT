// Fichier de diagnostic pour vérifier l'état des interactions
import AsyncStorage from '@react-native-async-storage/async-storage';

export const diagnosticInteractions = async () => {
  console.log('🔍 === DIAGNOSTIC DES INTERACTIONS ===');
  
  try {
    // Vérifier consultations_ressources
    const consultations = await AsyncStorage.getItem('consultations_ressources') || '[]';
    const consultationsParsed = JSON.parse(consultations);
    console.log('📚 consultations_ressources:', {
      nb_total: consultationsParsed.length,
      ids_uniques: [...new Set(consultationsParsed.map(c => c.ressource_id))],
      dernieres: consultationsParsed.slice(0, 3)
    });
    
    // Vérifier ressources_interactions
    const interactions = await AsyncStorage.getItem('ressources_interactions') || '[]';
    const interactionsParsed = JSON.parse(interactions);
    console.log('🔄 ressources_interactions:', {
      nb_total: interactionsParsed.length,
      ids_uniques: [...new Set(interactionsParsed.map(i => i.ressource_id))],
      categories: [...new Set(interactionsParsed.map(i => i.categorie))],
      types: [...new Set(interactionsParsed.map(i => i.type))],
      dernieres: interactionsParsed.slice(0, 3)
    });
    
    // Vérifier le trigger
    const trigger = await AsyncStorage.getItem('dashboard_refresh_trigger');
    const lastProcessed = await AsyncStorage.getItem('last_processed_trigger');
    console.log('🎯 Trigger:', { trigger, lastProcessed });
    
    // Calculer ce que le compteur devrait être
    const tousLesIds = new Set([
      ...consultationsParsed.map(c => c.ressource_id),
      ...interactionsParsed.map(i => i.ressource_id)
    ]);
    
    console.log('🔢 RÉSULTAT ATTENDU:', {
      nb_ressources_uniques_totales: tousLesIds.size,
      compteur_actuel: consultationsParsed.length > 0 ? [...new Set(consultationsParsed.map(c => c.ressource_id))].size : 0
    });
    
    console.log('🔍 === FIN DIAGNOSTIC ===');
    
    return {
      consultations: consultationsParsed,
      interactions: interactionsParsed,
      compteurAttendu: tousLesIds.size
    };
    
  } catch (error) {
    console.error('🔍 Erreur diagnostic:', error);
    return null;
  }
};
