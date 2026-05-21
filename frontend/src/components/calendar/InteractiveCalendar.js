import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const InteractiveCalendar = ({ 
  disponibilites, 
  selectedDates, 
  onDateSelect, 
  onDateDeselect, 
  mode = 'selection',
  minDate,
  maxDate,
  showWeekNumbers = false 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const MOIS_ANNEE = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // 0=Lundi
    
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Jours du mois précédent
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isPast: date < new Date().setHours(0, 0, 0, 0),
        isToday: false,
        isSelected: false,
        hasDisponibilite: false
      });
    }
    
    // Jours du mois actuel
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < new Date().setHours(0, 0, 0, 0);
      const isSelected = selectedDates.some(selectedDate => 
        selectedDate.toDateString() === date.toDateString()
      );
      
      // Vérifier les disponibilités pour ce jour
      const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1; // 0=Lundi
      const hasDisponibilite = disponibilites.some(dispo => 
        dispo.jour_semaine === dayOfWeek && dispo.est_recurrent
      );
      
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isPast,
        isToday,
        isSelected,
        hasDisponibilite
      });
    }
    
    // Jours du mois suivant
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isPast: date < new Date().setHours(0, 0, 0, 0),
        isToday: false,
        isSelected: false,
        hasDisponibilite: false
      });
    }
    
    setCalendarDays(days);
  };

  const handleDayPress = (day) => {
    if (day.isPast && mode !== 'view') {
      Alert.alert('Information', 'Vous ne pouvez pas sélectionner une date passée');
      return;
    }

    if (!day.isCurrentMonth && mode !== 'view') {
      // Naviguer vers le mois du jour cliqué
      setCurrentMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
      return;
    }

    if (mode === 'selection') {
      if (day.isSelected) {
        onDateDeselect(day.date);
      } else {
        onDateSelect(day.date);
      }
    } else if (mode === 'view') {
      setSelectedDay(day);
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime && selectedDay) {
      setTempTime(selectedTime);
      
      // Ajouter l'heure à la date sélectionnée
      const newDate = new Date(selectedDay.date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      
      onDateSelect(newDate);
      setSelectedDay(null);
    }
  };

  const renderDay = (day, index) => {
    const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          !day.isCurrentMonth && styles.dayCellOtherMonth,
          day.isPast && styles.dayCellPast,
          day.isToday && styles.dayCellToday,
          day.isSelected && styles.dayCellSelected,
          isWeekend && styles.dayCellWeekend
        ]}
        onPress={() => handleDayPress(day)}
        disabled={mode === 'view'}
      >
        <Text style={[
          styles.dayText,
          !day.isCurrentMonth && styles.dayTextOtherMonth,
          day.isPast && styles.dayTextPast,
          day.isToday && styles.dayTextToday,
          day.isSelected && styles.dayTextSelected
        ]}>
          {day.day}
        </Text>
        
        {/* Indicateur de disponibilité */}
        {day.hasDisponibilite && (
          <View style={[
            styles.disponibiliteIndicator,
            day.isSelected && styles.disponibiliteIndicatorSelected
          ]} />
        )}
        
        {/* Indicateur aujourd'hui */}
        {day.isToday && (
          <View style={styles.todayIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  const renderWeek = (weekIndex) => {
    const startIndex = weekIndex * 7;
    const weekDays = calendarDays.slice(startIndex, startIndex + 7);
    
    return (
      <View key={weekIndex} style={styles.weekRow}>
        {weekDays.map((day, index) => renderDay(day, startIndex + index))}
      </View>
    );
  };

  const renderDayDetails = () => {
    if (!selectedDay) return null;

    const dayOfWeek = selectedDay.date.getDay() === 0 ? 6 : selectedDay.date.getDay() - 1;
    const dayDispos = disponibilites.filter(dispo => 
      dispo.jour_semaine === dayOfWeek && dispo.est_recurrent
    );

    return (
      <Modal
        visible={!!selectedDay}
        animationType="slide"
        onRequestClose={() => setSelectedDay(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedDay(null)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedDay.date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.disponibilitesSection}>
              <Text style={styles.sectionTitle}>Disponibilités ce jour</Text>
              
              {dayDispos.length > 0 ? (
                dayDispos.map((dispo, index) => (
                  <View key={index} style={styles.disponibiliteCard}>
                    <View style={styles.disponibiliteHeader}>
                      <Ionicons name="time" size={16} color="#007AFF" />
                      <Text style={styles.disponibiliteTime}>
                        {dispo.heure_debut} - {dispo.heure_fin}
                      </Text>
                    </View>
                    <Text style={styles.disponibiliteType}>
                      {dispo.est_recurrent ? 'Récurrent' : 'Exceptionnel'}
                    </Text>
                    
                    {mode === 'selection' && (
                      <TouchableOpacity
                        style={styles.selectTimeButton}
                        onPress={() => {
                          setTempTime(new Date());
                          setShowTimePicker(true);
                        }}
                      >
                        <Text style={styles.selectTimeButtonText}>
                          Sélectionner une heure
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noDisponibiliteText}>
                  Aucune disponibilité ce jour
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* En-tête du calendrier */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <View style={styles.monthYearContainer}>
          <Text style={styles.monthYearText}>
            {MOIS_ANNEE[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
        </View>
        
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Bouton aujourd'hui */}
      <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
        <Text style={styles.todayButtonText}>Aujourd'hui</Text>
      </TouchableOpacity>

      {/* Jours de la semaine */}
      <View style={styles.weekHeader}>
        {JOURS_SEMAINE.map((jour, index) => (
          <Text key={index} style={[
            styles.weekDayText,
            (index === 5 || index === 6) && styles.weekDayTextWeekend
          ]}>
            {jour}
          </Text>
        ))}
      </View>

      {/* Grille du calendrier */}
      <ScrollView style={styles.calendarContainer}>
        {[0, 1, 2, 3, 4, 5].map(weekIndex => renderWeek(weekIndex))}
      </ScrollView>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendIndicator} />
          <Text style={styles.legendText}>Disponible</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, styles.legendIndicatorSelected]} />
          <Text style={styles.legendText}>Sélectionné</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendIndicatorToday} />
          <Text style={styles.legendText}>Aujourd'hui</Text>
        </View>
      </View>

      {/* Modal détails du jour */}
      {renderDayDetails()}

      {/* Time picker */}
      {showTimePicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  todayButton: {
    alignSelf: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  todayButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  weekDayTextWeekend: {
    color: '#999',
  },
  calendarContainer: {
    flex: 1,
    padding: 8,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dayCellOtherMonth: {
    backgroundColor: '#f5f5f5',
    opacity: 0.5,
  },
  dayCellPast: {
    opacity: 0.6,
  },
  dayCellToday: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  dayCellSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayCellWeekend: {
    backgroundColor: '#f0f0f0',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  dayTextOtherMonth: {
    color: '#999',
  },
  dayTextPast: {
    color: '#999',
  },
  dayTextToday: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disponibiliteIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#28a745',
  },
  disponibiliteIndicatorSelected: {
    backgroundColor: '#fff',
  },
  todayIndicator: {
    position: 'absolute',
    top: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#28a745',
    marginRight: 8,
  },
  legendIndicatorSelected: {
    backgroundColor: '#007AFF',
  },
  legendIndicatorToday: {
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  disponibilitesSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  disponibiliteCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  disponibiliteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  disponibiliteTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  disponibiliteType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  selectTimeButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectTimeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noDisponibiliteText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default InteractiveCalendar;
