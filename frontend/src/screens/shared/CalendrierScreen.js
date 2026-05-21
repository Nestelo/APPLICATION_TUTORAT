import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Header from '../../components/ui/Header';

const CalendrierScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState('');

  return (
    <>
      <Header title="Calendrier" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, marked: true, selectedColor: '#007bff' },
          }}
          theme={{
            todayTextColor: '#007bff',
            arrowColor: '#007bff',
          }}
        />
        {selectedDate ? (
          <Text style={styles.selected}>Date sélectionnée : {selectedDate}</Text>
        ) : null}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  selected: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default CalendrierScreen;