import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const WeeklyActivityChart = ({ seances }) => {
  // Calculer les 7 derniers jours
  const today = new Date();
  const last7Days = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    last7Days.push(date);
  }

  // Grouper les séances par jour
  const seancesByDay = last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const daySeances = seances.filter(seance => {
      const seanceDate = new Date(seance.date_heure_debut).toISOString().split('T')[0];
      return seanceDate === dateStr;
    });

    return {
      date,
      dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      dayNumber: date.getDate(),
      monthName: date.toLocaleDateString('fr-FR', { month: 'short' }),
      count: daySeances.length,
      seances: daySeances
    };
  });

  // Calculer les statistiques
  const totalSeances = seancesByDay.reduce((sum, day) => sum + day.count, 0);
  const maxSeances = Math.max(...seancesByDay.map(day => day.count), 1);
  const barWidth = (screenWidth - 60) / 7; // 60px pour marges

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activité des 7 derniers jours</Text>
      
      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalSeances}</Text>
          <Text style={styles.statLabel}>Total séances</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{Math.round(totalSeances / 7)}</Text>
          <Text style={styles.statLabel}>Moyenne/jour</Text>
        </View>
      </View>

      {/* Diagramme en barres */}
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {seancesByDay.map((day, index) => {
            const barHeight = maxSeances > 0 ? (day.count / maxSeances) * 120 : 0;
            
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: barHeight,
                        backgroundColor: day.count > 0 ? '#007AFF' : '#e0e0e0'
                      }
                    ]}
                  />
                  {day.count > 0 && (
                    <Text style={styles.barLabel}>{day.count}</Text>
                  )}
                </View>
                
                <View style={styles.dayLabels}>
                  <Text style={styles.dayNumber}>{day.dayNumber}</Text>
                  <Text style={styles.dayName}>{day.dayName}</Text>
                  <Text style={styles.monthName}>{day.monthName}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#007AFF' }]} />
          <Text style={styles.legendText}>Jours avec séances</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#e0e0e0' }]} />
          <Text style={styles.legendText}>Jours sans séance</Text>
        </View>
      </View>

      {/* Détail des séances du jour */}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Séances récentes</Text>
        {seancesByDay.map((day, index) => (
          day.seances.length > 0 && (
            <View key={index} style={styles.dayDetails}>
              <Text style={styles.dayDetailsTitle}>
                {day.dayName} {day.dayNumber} {day.monthName} - {day.count} séance{day.count > 1 ? 's' : ''}
              </Text>
              {day.seances.map((seance, seanceIndex) => (
                <View key={seanceIndex} style={styles.seanceItem}>
                  <View style={styles.seanceTime}>
                    <Text style={styles.seanceTimeText}>
                      {new Date(seance.date_heure_debut).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  <View style={styles.seanceInfo}>
                    <Text style={styles.seanceTitle}>{seance.sujet || seance.titre || 'Séance'}</Text>
                    <Text style={styles.seanceGroup}>
                      {seance.groupe_details?.nom || 'Pas de groupe'}
                    </Text>
                  </View>
                  <View style={styles.seanceStatus}>
                    <Text style={[
                      styles.seanceStatusText,
                      { color: getStatusColor(seance.statut) }
                    ]}>
                      {seance.statut_display || seance.statut}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )
        ))}
      </View>
    </View>
  );
};

// Fonction pour obtenir la couleur du statut
const getStatusColor = (statut) => {
  switch (statut) {
    case 'planifiee': return '#ffc107';
    case 'en_cours': return '#28a745';
    case 'terminee': return '#666';
    case 'annulee': return '#dc3545';
    default: return '#007AFF';
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 120,
    position: 'relative',
  },
  bar: {
    width: 30,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    position: 'absolute',
    top: -20,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  dayLabels: {
    alignItems: 'center',
    marginTop: 8,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  monthName: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  detailsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  dayDetails: {
    marginBottom: 16,
  },
  dayDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007AFF',
  },
  seanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  seanceTime: {
    width: 60,
    alignItems: 'center',
  },
  seanceTimeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  seanceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  seanceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  seanceGroup: {
    fontSize: 12,
    color: '#666',
  },
  seanceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  seanceStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default WeeklyActivityChart;
