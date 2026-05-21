import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import CreneauItem from './CreneauItem';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const PlanningHebdo = ({ disponibilites, seances, onCreneauPress }) => {
  // disponibilites: tableau de créneaux récurrents (avec jour_semaine, heure_debut, heure_fin)
  // seances: tableau de séances planifiées (avec date_heure_debut, date_heure_fin)

  console.log('📅 PlanningHebdo - disponibilites:', disponibilites);
  console.log('📅 PlanningHebdo - seances:', seances);

  // Fonction pour générer les créneaux d'une journée (simplifié)
  const renderCreneaux = (jourIndex) => {
    const dispoJour = Array.isArray(disponibilites) ? disponibilites.filter(d => {
      console.log(`📅 Filtrage - Dispo ${d.id}: jour_semaine=${d.jour_semaine}, attendu=${jourIndex}, match=${d.jour_semaine === jourIndex}`);
      return d.jour_semaine === jourIndex;
    }) : [];
    
    const seancesJour = Array.isArray(seances) ? seances.filter(s => {
      const date = new Date(s.date_heure_debut);
      const match = date.getDay() === jourIndex + 1; // getDay: 0=dimanche, 1=lundi...
      console.log(`📅 Filtrage - Séance ${s.id}: date=${date.toDateString()}, getDay=${date.getDay()}, attendu=${jourIndex + 1}, match=${match}`);
      return match;
    }) : [];

    console.log(`📅 Jours ${jourIndex} (${JOURS[jourIndex]}):`, { 
      dispoJour: dispoJour.length, 
      seancesJour: seancesJour.length,
      dispoDetails: dispoJour,
      seancesDetails: seancesJour.slice(0, 2) // Limiter l'affichage pour éviter les logs trop longs
    });

    return (
      <View key={jourIndex} style={styles.jourContainer}>
        <Text style={styles.jourTitre}>{JOURS[jourIndex]}</Text>
        {dispoJour.length === 0 && seancesJour.length === 0 ? (
          <Text style={styles.aucun}>Aucun créneau</Text>
        ) : (
          <>
            {dispoJour.map((dispo, idx) => (
              <CreneauItem
                key={`dispo-${idx}`}
                type="disponibilite"
                heureDebut={dispo.heure_debut}
                heureFin={dispo.heure_fin}
                onPress={() => onCreneauPress && onCreneauPress(dispo)}
              />
            ))}
            {seancesJour.map((seance, idx) => (
              <CreneauItem
                key={`seance-${idx}`}
                type="seance"
                titre={seance.titre || 'Séance'}
                heureDebut={new Date(seance.date_heure_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                heureFin={new Date(seance.date_heure_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                statut={seance.statut}
                onPress={() => onCreneauPress && onCreneauPress(seance)}
              />
            ))}
          </>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {[0,1,2,3,4,5,6].map(jourIndex => renderCreneaux(jourIndex))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  jourContainer: {
    marginBottom: 16,
  },
  jourTitre: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aucun: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    paddingLeft: 8,
  },
});

export default PlanningHebdo;