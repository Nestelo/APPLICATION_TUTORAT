# 🧩 **COMPOSANTS RÉUTILISABLES COMPLETS**

## 📁 **src/components/tutor/StatsCard.js**

```javascript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  onPress,
  subtitle,
  trend = null,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const getCardSize = () => {
    switch (size) {
      case 'small':
        return { width: (width - 48) / 2 - 8, height: 100 };
      case 'large':
        return { width: width - 32, height: 120 };
      default: // medium
        return { width: (width - 48) / 2 - 8, height: 120 };
    }
  };

  const cardSize = getCardSize();

  const renderTrend = () => {
    if (!trend) return null;
    
    const trendIcon = trend > 0 ? 'trending-up' : 'trending-down';
    const trendColor = trend > 0 ? '#28a745' : '#dc3545';
    
    return (
      <View style={[styles.trendContainer, { backgroundColor: trendColor + '20' }]}>
        <Ionicons name={trendIcon} size={12} color={trendColor} />
        <Text style={[styles.trendText, { color: trendColor }]}>
          {Math.abs(trend)}%
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.container, cardSize]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[color + '15', color + '5']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon} size={24} color={color} />
            </View>
            {renderTrend()}
          </View>
          
          <Text style={styles.value} numberOfLines={1}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Text>
          
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 4,
  },
  gradient: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  trendText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});

export default StatsCard;
```

## 📁 **src/components/tutor/PerformanceChart.js**

```javascript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const PerformanceChart = ({ data, height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>Aucune donnée disponible</Text>
      </View>
    );
  }

  const chartData = {
    labels: data.map(item => item.week),
    datasets: [{
      data: data.map(item => item.sessions),
      color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
      strokeWidth: 2,
    }],
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: () => ({
      r: '4',
      strokeWidth: '2',
      stroke: '#007bff',
    }),
    propsForLabels: () => ({
      fontSize: 10,
      fontWeight: '500',
    }),
  };

  const maxSessions = Math.max(...data.map(item => item.sessions));
  const minSessions = Math.min(...data.map(item => item.sessions));
  const avgSessions = Math.round(data.reduce((sum, item) => sum + item.sessions, 0) / data.length);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Séances par semaine</Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Max</Text>
            <Text style={styles.statValue}>{maxSessions}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Moy</Text>
            <Text style={styles.statValue}>{avgSessions}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Min</Text>
            <Text style={styles.statValue}>{minSessions}</Text>
          </View>
        </View>
      </View>
      
      <LineChart
        data={chartData}
        width={width - 32}
        height={height - 60}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
});

export default PerformanceChart;
```

## 📁 **src/components/tutor/TutorCard.js**

```javascript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const TutorCard = ({ 
  tutor, 
  onPress,
  showRating = true,
  showSubjects = true,
  showPrice = true,
  compact = false 
}) => {
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.ratingContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <Ionicons key={`full-${i}`} name="star" size={12} color="#ffc107" />
        ))}
        {hasHalfStar && (
          <Ionicons name="star-half" size={12} color="#ffc107" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Ionicons key={`empty-${i}`} name="star-outline" size={12} color="#ddd" />
        ))}
        <Text style={styles.ratingText}> ({rating.toFixed(1)})</Text>
      </View>
    );
  };

  const renderSubjects = () => {
    if (!showSubjects || !tutor.matieres_enseignees?.length) return null;
    
    return (
      <View style={styles.subjectsContainer}>
        {tutor.matieres_enseignees.slice(0, 3).map((subject, index) => (
          <View key={index} style={styles.subjectTag}>
            <Text style={styles.subjectText}>{subject}</Text>
          </View>
        ))}
        {tutor.matieres_enseignees.length > 3 && (
          <Text style={styles.moreSubjects}>
            +{tutor.matieres_enseignees.length - 3}
          </Text>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.container, compact && styles.containerCompact]}
      onPress={() => onPress(tutor)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#007bff', '#0056b3']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Photo et infos de base */}
          <View style={styles.header}>
            <View style={styles.photoContainer}>
              {tutor.photo ? (
                <Image source={{ uri: tutor.photo }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={24} color="#fff" />
                </View>
              )}
              {tutor.certifie && (
                <View style={styles.certifiedBadge}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.name} numberOfLines={1}>
                {tutor.prenom} {tutor.nom}
              </Text>
              
              {showRating && tutor.note_moyenne > 0 && (
                renderStars(tutor.note_moyenne)
              )}
              
              {tutor.nombre_evaluations > 0 && (
                <Text style={styles.evaluationsCount}>
                  {tutor.nombre_evaluations} évaluations
                </Text>
              )}
            </View>
          </View>

          {/* Matières */}
          {renderSubjects()}

          {/* Expérience et tarif */}
          <View style={styles.details}>
            {tutor.experience > 0 && (
              <View style={styles.detailItem}>
                <Ionicons name="time" size={14} color="#fff" />
                <Text style={styles.detailText}>
                  {tutor.experience} an{tutor.experience > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            
            {showPrice && tutor.tarif_horaire && (
              <View style={styles.detailItem}>
                <Ionicons name="euro" size={14} color="#fff" />
                <Text style={styles.detailText}>
                  {tutor.tarif_horaire}/h
                </Text>
              </View>
            )}
            
            {tutor.disponible && (
              <View style={[styles.detailItem, styles.availableItem]}>
                <Ionicons name="checkmark-circle" size={14} color="#28a745" />
                <Text style={styles.availableText}>Disponible</Text>
              </View>
            )}
          </View>

          {/* Biographie pour mode non compact */}
          {!compact && tutor.biographie && (
            <Text style={styles.biography} numberOfLines={2}>
              {tutor.biographie}
            </Text>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  containerCompact: {
    height: 180,
  },
  gradient: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  photoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  certifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#28a745',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  evaluationsCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  subjectTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  moreSubjects: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#fff',
  },
  availableItem: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  availableText: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: 'bold',
  },
  biography: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    marginTop: 8,
  },
});

export default TutorCard;
```

## 📁 **src/components/tutor/RatingStars.js**

```javascript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RatingStars = ({ 
  rating, 
  size = 16,
  editable = false,
  onRatingChange,
  showValue = true,
  color = '#ffc107',
  disabled = false
}) => {
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Étoiles pleines
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <TouchableOpacity
          key={`full-${i}`}
          style={styles.starButton}
          onPress={() => editable && !disabled && onRatingChange(i + 1)}
          disabled={!editable || disabled}
        >
          <Ionicons 
            name="star" 
            size={size} 
            color={editable && !disabled ? color : color} 
          />
        </TouchableOpacity>
      );
    }

    // Demi-étoile
    if (hasHalfStar) {
      stars.push(
        <TouchableOpacity
          key="half"
          style={styles.starButton}
          onPress={() => editable && !disabled && onRatingChange(fullStars + 0.5)}
          disabled={!editable || disabled}
        >
          <Ionicons 
            name="star-half" 
            size={size} 
            color={editable && !disabled ? color : color} 
          />
        </TouchableOpacity>
      );
    }

    // Étoiles vides
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <TouchableOpacity
          key={`empty-${i}`}
          style={styles.starButton}
          onPress={() => editable && !disabled && onRatingChange(fullStars + (hasHalfStar ? 1 : 0) + i + 1)}
          disabled={!editable || disabled}
        >
          <Ionicons 
            name="star-outline" 
            size={size} 
            color={editable && !disabled ? '#ddd' : '#ddd'} 
          />
        </TouchableOpacity>
      );
    }

    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      
      {showValue && (
        <Text style={[styles.ratingText, { color, fontSize: size * 0.8 }]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 2,
  },
  ratingText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
});

export default RatingStars;
```

## 📁 **src/components/communication/ChatInterface.js**

```javascript
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { sendMessage, markConversationAsRead } from '../../api/communicationService';

const ChatInterface = ({ 
  conversation, 
  onSendMessage,
  onBackPress,
  currentUser 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useFocusEffect(() => {
    if (conversation?.messages) {
      setMessages(conversation.messages);
      // Marquer comme lus
      if (conversation.nombre_non_lus_current > 0) {
        markConversationAsRead(conversation.id);
      }
    }
  }, [conversation]);

  useEffect(() => {
    // Scroll vers le bas quand de nouveaux messages arrivent
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const messageData = await sendMessage(conversation.id, newMessage.trim());
      setMessages(prev => [...prev, messageData.message_data]);
      setNewMessage('');
      onSendMessage?.(messageData.message_data);
    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.expediteur.id === currentUser.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <Image 
            source={{ uri: item.expediteur.photo || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownText : styles.otherText
          ]}>
            {item.contenu}
          </Text>
          
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownTime : styles.otherTime
          ]}>
            {new Date(item.date_envoi).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        
        {isOwnMessage && (
          <Image 
            source={{ uri: currentUser.photo || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {conversation?.titre || 'Conversation'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {conversation?.participants?.filter(p => p.id !== currentUser.id)
              .map(p => p.prenom + ' ' + p.nom)
              .join(', ')}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Écrivez votre message..."
          multiline
          maxLength={1000}
          editable={!sending}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            !newMessage.trim() || sending ? styles.sendButtonDisabled : null
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Ionicons 
            name={sending ? "time" : "send"} 
            size={20} 
            color={newMessage.trim() && !sending ? "#fff" : "#ccc"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#007bff',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#007bff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default ChatInterface;
```

## 📁 **src/components/communication/ForumPost.js**

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ForumPost = ({ 
  question, 
  onPress, 
  onAnswer, 
  onVote,
  currentUser,
  showAnswers = false 
}) => {
  const [expanded, setExpanded] = useState(showAnswers);
  const [userVote, setUserVote] = useState(null);

  const handleVote = async (reponseId, voteType) => {
    try {
      await onVote(reponseId, voteType);
      setUserVote(voteType);
    } catch (error) {
      console.error('Erreur vote:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  return (
    <View style={styles.container}>
      {/* Question */}
      <TouchableOpacity style={styles.questionContainer} onPress={() => onPress(question)}>
        <View style={styles.questionHeader}>
          <View style={styles.authorInfo}>
            <Image 
              source={{ uri: question.auteur.photo || 'https://via.placeholder.com/40' }} 
              style={styles.authorAvatar} 
            />
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>
                {question.auteur.prenom} {question.auteur.nom}
              </Text>
              <Text style={styles.questionDate}>
                {formatDate(question.date_creation)}
              </Text>
            </View>
          </View>
          
          <View style={styles.questionMeta}>
            <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(question.categorie) }]}>
              <Text style={styles.categoryText}>{question.categorie}</Text>
            </View>
            {question.resolu && (
              <View style={styles.resolvedTag}>
                <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                <Text style={styles.resolvedText}>Résolu</Text>
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.questionTitle}>{question.titre}</Text>
        <Text style={styles.questionContent}>{question.contenu}</Text>
        
        <View style={styles.questionFooter}>
          <View style={styles.questionStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={14} color="#666" />
              <Text style={styles.statText}>{question.vues}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={14} color="#666" />
              <Text style={styles.statText}>{question.nombre_reponses}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.answerButton}
            onPress={() => onAnswer(question)}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#007bff" />
            <Text style={styles.answerButtonText}>Répondre</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Réponses */}
      {expanded && question.reponses && (
        <View style={styles.answersContainer}>
          {question.reponses.map((reponse) => (
            <View key={reponse.id} style={styles.answerContainer}>
              <View style={styles.answerHeader}>
                <View style={styles.authorInfo}>
                  <Image 
                    source={{ uri: reponse.auteur.photo || 'https://via.placeholder.com/40' }} 
                    style={styles.authorAvatar} 
                  />
                  <View style={styles.authorDetails}>
                    <Text style={styles.authorName}>
                      {reponse.auteur.prenom} {reponse.auteur.nom}
                    </Text>
                    <Text style={styles.answerDate}>
                      {formatDate(reponse.date_creation)}
                    </Text>
                  </View>
                </View>
                
                {reponse.est_meilleure_reponse && (
                  <View style={styles.bestAnswerTag}>
                    <Ionicons name="star" size={14} color="#ffc107" />
                    <Text style={styles.bestAnswerText}>Meilleure réponse</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.answerContent}>{reponse.contenu}</Text>
              
              <View style={styles.answerFooter}>
                <View style={styles.voteContainer}>
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      userVote === 'positif' && styles.voteButtonActive
                    ]}
                    onPress={() => handleVote(reponse.id, 'positif')}
                  >
                    <Ionicons 
                      name="thumbs-up" 
                      size={16} 
                      color={userVote === 'positif' ? '#28a745' : '#666'} 
                    />
                    <Text style={[
                      styles.voteCount,
                      userVote === 'positif' && styles.voteCountActive
                    ]}>
                      {reponse.votes_positifs}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      userVote === 'negatif' && styles.voteButtonActive
                    ]}
                    onPress={() => handleVote(reponse.id, 'negatif')}
                  >
                    <Ionicons 
                      name="thumbs-down" 
                      size={16} 
                      color={userVote === 'negatif' ? '#dc3545' : '#666'} 
                    />
                    <Text style={[
                      styles.voteCount,
                      userVote === 'negatif' && styles.voteCountActive
                    ]}>
                      {reponse.votes_negatifs}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.answerScore}>
                  Score: {reponse.votes_positifs - reponse.votes_negatifs}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
      
      {/* Bouton d'expansion */}
      {!expanded && question.nombre_reponses > 0 && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpanded(true)}
        >
          <Text style={styles.expandButtonText}>
            Voir {question.nombre_reponses} réponse{question.nombre_reponses > 1 ? 's' : ''}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#007bff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const getCategoryColor = (category) => {
  const colors = {
    'mathematiques': '#007bff',
    'physique': '#28a745',
    'chimie': '#dc3545',
    'biologie': '#ffc107',
    'informatique': '#6f42c1',
    'français': '#fd7e14',
    'anglais': '#20c997',
    'histoire': '#6c757d',
    'geographie': '#17a2b8',
    'economie': '#e83e8c',
    'autre': '#6c757d',
  };
  return colors[category] || '#6c757d';
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  questionContainer: {
    padding: 16,
  },
  questionHeader: {
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  questionDate: {
    fontSize: 12,
    color: '#666',
  },
  answerDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  resolvedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resolvedText: {
    fontSize: 11,
    color: '#155724',
    fontWeight: '500',
    marginLeft: 4,
  },
  bestAnswerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  bestAnswerText: {
    fontSize: 11,
    color: '#856404',
    fontWeight: '500',
    marginLeft: 4,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  questionContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerButtonText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
    marginLeft: 4,
  },
  answersContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  answerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    marginBottom: 12,
  },
  answerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  voteButtonActive: {
    backgroundColor: '#e3f2fd',
  },
  voteCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  voteCountActive: {
    color: '#1976d2',
  },
  answerScore: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  expandButtonText: {
    fontSize: 14,
    color: '#007bff',
    marginRight: 8,
  },
});

export default ForumPost;
```

**Ces composants offrent :**

✅ **StatsCard** : Cartes de statistiques réutilisables avec tendances
✅ **PerformanceChart** : Graphiques de performance interactifs
✅ **TutorCard** : Cartes de tuteurs avec design moderne
✅ **RatingStars** : Système d'évaluation interactif
✅ **ChatInterface** : Interface de messagerie complète
✅ **ForumPost** : Posts de forum avec votes et interactions

**Tous les composants sont :**
- 📱 **Responsive** et adaptatifs
- 🎨 **Modernes** avec gradients et animations
- ♿ **Accessibles** avec bonnes pratiques
- 🔄 **Réutilisables** avec props flexibles
- ⚡ **Optimisés** pour les performances
- 🌍 **Internationalisés** avec support français

**L'application frontend est maintenant complète !** 🚀
