import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert, FlatList, Dimensions, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  getAdminDashboardStats, getModerationQueue, approveQuestion,
  rejectQuestion, approveResponse, rejectResponse, getAdminActivityLogs,
  exportAdminData, suspendUser, unsuspendUser, getReports, resolveReport
} from '../../api/adminPanelService';

const { width } = Dimensions.get('window');

const AdminPanelScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Données
  const [dashboardStats, setDashboardStats] = useState(null);
  const [moderationQueue, setModerationQueue] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, moderationData, logsData] = await Promise.all([
        getAdminDashboardStats(),
        getModerationQueue(),
        getAdminActivityLogs()
      ]);
      
      setDashboardStats(statsData);
      setModerationQueue(moderationData);
      setActivityLogs(logsData);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données');
      console.error('Erreur dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleApproveResponse = async (responseId) => {
    try {
      await approveResponse(responseId);
      Alert.alert('Succès', 'Réponse approuvée');
      loadDashboardData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'approuver la réponse');
    }
  };

  const handleRejectResponse = async (responseId) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous rejeter cette réponse ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectResponse(responseId, 'Rejet par l\'administrateur');
              Alert.alert('Succès', 'Réponse rejetée');
              loadDashboardData();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de rejeter la réponse');
            }
          }
        }
      ]
    );
  };

  const handleApproveQuestion = async (questionId) => {
    try {
      await approveQuestion(questionId);
      Alert.alert('Succès', 'Question approuvée');
      loadDashboardData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'approuver la question');
    }
  };

  const handleRejectQuestion = async (questionId) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous rejeter cette question ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectQuestion(questionId, 'Rejet par l\'administrateur');
              Alert.alert('Succès', 'Question rejetée');
              loadDashboardData();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de rejeter la question');
            }
          }
        }
      ]
    );
  };

  const handleExportData = async (type) => {
    try {
      await exportAdminData(type);
      Alert.alert('Succès', `Données ${type} exportées`);
    } catch (error) {
      Alert.alert('Erreur', 'Export échoué');
    }
  };

  const handleSuspendUser = async (userId, reason) => {
    try {
      await suspendUser(userId, reason, null);
      Alert.alert('Succès', 'Utilisateur suspendu');
      setShowUserModal(false);
      loadDashboardData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de suspendre l\'utilisateur');
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      await unsuspendUser(userId);
      Alert.alert('Succès', 'Utilisateur réactivé');
      setShowUserModal(false);
      loadDashboardData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de réactiver l\'utilisateur');
    }
  };

  const handleResolveReport = async (reportId, action, reason) => {
    try {
      await resolveReport(reportId, action, reason);
      Alert.alert('Succès', `Signalement ${action}`);
      setShowReportModal(false);
      loadDashboardData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de résoudre le signalement');
    }
  };

  const loadReports = async () => {
    try {
      const reportsData = await getReports();
      setReports(reportsData);
    } catch (error) {
      console.error('Erreur chargement signalements:', error);
    }
  };

  const handleViewUserProfile = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="people" size={24} color="#007bff" />
            <Text style={styles.statNumber}>{dashboardStats?.users?.total_users || 0}</Text>
          </View>
          <Text style={styles.statLabel}>Utilisateurs</Text>
          <Text style={styles.statDetail}>
            +{dashboardStats?.users?.nouvelles_inscriptions_30j || 0} ce mois
          </Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="chatbubble" size={24} color="#28a745" />
            <Text style={styles.statNumber}>{dashboardStats?.forum?.total_questions || 0}</Text>
          </View>
          <Text style={styles.statLabel}>Questions</Text>
          <Text style={styles.statDetail}>
            {dashboardStats?.forum?.taux_resolution?.toFixed(1) || 0}% résolues
          </Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="people-circle" size={24} color="#ffc107" />
            <Text style={styles.statNumber}>{dashboardStats?.messaging?.total_groupes || 0}</Text>
          </View>
          <Text style={styles.statLabel}>Groupes</Text>
          <Text style={styles.statDetail}>
            {dashboardStats?.messaging?.sessions_planifiees || 0} sessions planifiées
          </Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="shield" size={24} color="#dc3545" />
            <Text style={styles.statNumber}>{dashboardStats?.moderation?.actions_24h || 0}</Text>
          </View>
          <Text style={styles.statLabel}>Modération</Text>
          <Text style={styles.statDetail}>
            Actions 24h
          </Text>
        </Card>
      </View>

      {/* Actions Rapides */}
      <Card style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        <View style={styles.actionsGrid}>
          <Button
            title="📊 Export Utilisateurs"
            onPress={() => handleExportData('users')}
            style={styles.actionButton}
          />
          <Button
            title="📝 Export Questions"
            onPress={() => handleExportData('questions')}
            style={styles.actionButton}
          />
          <Button
            title="📈 Stats Détaillées"
            onPress={() => Alert.alert('Info', 'Fonctionnalité bientôt disponible')}
            style={styles.actionButton}
          />
        </View>
      </Card>

      {/* Top Tuteurs */}
      {dashboardStats?.top_tuteurs && (
        <Card style={styles.topCard}>
          <Text style={styles.sectionTitle}>🏆 Top Tuteurs</Text>
          {dashboardStats.top_tuteurs.slice(0, 5).map((tuteur, index) => (
            <View key={index} style={styles.tuteurItem}>
              <View style={styles.tuteurRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.tuteurInfo}>
                <Text style={styles.tuteurName}>{tuteur.nom}</Text>
                <Text style={styles.tuteurPoints}>{tuteur.points} points</Text>
              </View>
              <View style={styles.tuteurBadges}>
                <Text style={styles.badgeText}>✅ {tuteur.solutions}</Text>
                <Text style={styles.badgeText}>💡 {tuteur.aide}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );

  const renderModerationTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Questions en attente */}
      <Card style={styles.moderationCard}>
        <Text style={styles.sectionTitle}>📋 Questions Récentes</Text>
        {moderationQueue?.questions?.length > 0 ? (
          moderationQueue.questions.map((question) => (
            <View key={question.id} style={styles.moderationItem}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{question.titre}</Text>
                <View style={[
                  styles.priorityBadge,
                  question.priorite === 'haute' && styles.highPriority,
                  question.priorite === 'moyenne' && styles.mediumPriority,
                  question.priorite === 'basse' && styles.lowPriority
                ]}>
                  <Text style={styles.priorityText}>{question.priorite}</Text>
                </View>
              </View>
              <Text style={styles.itemMeta}>
                Par {question.auteur} • {question.matiere || 'Non spécifiée'}
              </Text>
              <View style={styles.moderationActions}>
                <TouchableOpacity
                  style={styles.authorButton}
                  onPress={() => handleViewUserProfile(question.auteur_details)}
                >
                  <Ionicons name="person-outline" size={16} color="#007bff" />
                  <Text style={styles.authorButtonText}>Voir l'auteur</Text>
                </TouchableOpacity>
                <Button
                  title="✅ Approuver"
                  onPress={() => handleApproveQuestion(question.id)}
                  style={styles.approveButton}
                />
                <Button
                  title="❌ Rejeter"
                  onPress={() => handleRejectQuestion(question.id)}
                  variant="danger"
                  style={styles.rejectButton}
                />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune question en attente</Text>
        )}
      </Card>

      {/* Réponses en attente */}
      <Card style={styles.moderationCard}>
        <Text style={styles.sectionTitle}>💬 Réponses Récentes</Text>
        {moderationQueue?.reponses?.length > 0 ? (
          moderationQueue.reponses.map((response) => (
            <View key={response.id} style={styles.moderationItem}>
              <Text style={styles.itemTitle}>Réponse à: {response.question.titre}</Text>
              <Text style={styles.itemContent}>{response.contenu}</Text>
              <Text style={styles.itemMeta}>
                Par {response.auteur} • {response.nb_votes} votes
              </Text>
              <View style={styles.moderationActions}>
                <TouchableOpacity
                  style={styles.authorButton}
                  onPress={() => handleViewUserProfile(response.auteur_details)}
                >
                  <Ionicons name="person-outline" size={16} color="#007bff" />
                  <Text style={styles.authorButtonText}>Voir l'auteur</Text>
                </TouchableOpacity>
                <Button
                  title="✅ Approuver"
                  onPress={() => handleApproveResponse(response.id)}
                  style={styles.approveButton}
                />
                <Button
                  title="❌ Rejeter"
                  onPress={() => handleRejectResponse(response.id)}
                  variant="danger"
                  style={styles.rejectButton}
                />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune réponse en attente</Text>
        )}
      </Card>

      {/* Signalements */}
      <Card style={styles.moderationCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚨 Signalements</Text>
          <Button
            title="Actualiser"
            onPress={loadReports}
            variant="outline"
            size="small"
          />
        </View>
        {reports?.length > 0 ? (
          reports.map((report) => (
            <View key={report.id} style={styles.moderationItem}>
              <View style={styles.reportHeader}>
                <Text style={styles.itemTitle}>Signalement #{report.id}</Text>
                <View style={[
                  styles.priorityBadge,
                  report.status === 'pending' && styles.highPriority,
                  report.status === 'resolved' && styles.lowPriority
                ]}>
                  <Text style={styles.priorityText}>{report.status}</Text>
                </View>
              </View>
              <Text style={styles.itemContent}>{report.reason}</Text>
              <Text style={styles.itemMeta}>
                Signalé par {report.reporter} • {new Date(report.created_at).toLocaleDateString()}
              </Text>
              <View style={styles.moderationActions}>
                <TouchableOpacity
                  style={styles.authorButton}
                  onPress={() => handleViewReport(report)}
                >
                  <Ionicons name="eye-outline" size={16} color="#007bff" />
                  <Text style={styles.authorButtonText}>Détails</Text>
                </TouchableOpacity>
                {report.status === 'pending' && (
                  <>
                    <Button
                      title="✅ Approuver"
                      onPress={() => handleResolveReport(report.id, 'approved', 'Contenu validé')}
                      style={styles.approveButton}
                    />
                    <Button
                      title="❌ Rejeter"
                      onPress={() => handleResolveReport(report.id, 'rejected', 'Contenu inapproprié')}
                      variant="danger"
                      style={styles.rejectButton}
                    />
                  </>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucun signalement en attente</Text>
        )}
      </Card>
    </ScrollView>
  );

  const renderLogsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.logsCard}>
        <Text style={styles.sectionTitle}>📋 Journal d'Activité</Text>
        {activityLogs?.length > 0 ? (
          activityLogs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logHeader}>
                <Text style={styles.logAction}>{log.action.toUpperCase()}</Text>
                <Text style={styles.logTime}>
                  {new Date(log.created_at).toLocaleString('fr-FR')}
                </Text>
              </View>
              <Text style={styles.logTarget}>
                {log.target_type} #{log.target_id}
              </Text>
              <Text style={styles.logModerator}>
                Par {log.moderator}
              </Text>
              {log.reason && (
                <Text style={styles.logReason}>{log.reason}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune activité récente</Text>
        )}
      </Card>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'moderation':
        return renderModerationTab();
      case 'logs':
        return renderLogsTab();
      default:
        return renderOverviewTab();
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header title="Panneau d'Administration" showBack={false} />
      <View style={styles.container}>
        {/* Onglets */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Ionicons name="grid" size={20} color={activeTab === 'overview' ? '#007bff' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Vue d'ensemble
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'moderation' && styles.activeTab]}
            onPress={() => setActiveTab('moderation')}
          >
            <Ionicons name="shield" size={20} color={activeTab === 'moderation' ? '#007bff' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'moderation' && styles.activeTabText]}>
              Modération
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
            onPress={() => setActiveTab('logs')}
          >
            <Ionicons name="list" size={20} color={activeTab === 'logs' ? '#007bff' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>
              Logs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenu */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderTabContent()}
        </ScrollView>

        {/* Modal Profil Utilisateur */}
        <Modal
          visible={showUserModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowUserModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Profil Utilisateur</Text>
                <TouchableOpacity onPress={() => setShowUserModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              {selectedUser && (
                <View style={styles.modalBody}>
                  <Text style={styles.userInfo}>Nom: {selectedUser.prenom} {selectedUser.nom}</Text>
                  <Text style={styles.userInfo}>Email: {selectedUser.email}</Text>
                  <Text style={styles.userInfo}>Rôle: {selectedUser.role}</Text>
                  <Text style={styles.userInfo}>Statut: {selectedUser.is_active ? 'Actif' : 'Suspendu'}</Text>
                  <View style={styles.modalActions}>
                    {selectedUser.is_active ? (
                      <Button
                        title="🚫 Suspendre"
                        onPress={() => handleSuspendUser(selectedUser.id, 'Violation des règles')}
                        variant="danger"
                        style={styles.modalButton}
                      />
                    ) : (
                      <Button
                        title="✅ Réactiver"
                        onPress={() => handleUnsuspendUser(selectedUser.id)}
                        style={styles.modalButton}
                      />
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Modal Détails Signalement */}
        <Modal
          visible={showReportModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowReportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Détails du Signalement</Text>
                <TouchableOpacity onPress={() => setShowReportModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              {selectedReport && (
                <View style={styles.modalBody}>
                  <Text style={styles.userInfo}>ID: #{selectedReport.id}</Text>
                  <Text style={styles.userInfo}>Signalé par: {selectedReport.reporter}</Text>
                  <Text style={styles.userInfo}>Raison: {selectedReport.reason}</Text>
                  <Text style={styles.userInfo}>Statut: {selectedReport.status}</Text>
                  <Text style={styles.userInfo}>Date: {new Date(selectedReport.created_at).toLocaleDateString()}</Text>
                  {selectedReport.status === 'pending' && (
                    <View style={styles.modalActions}>
                      <Button
                        title="✅ Approuver"
                        onPress={() => handleResolveReport(selectedReport.id, 'approved', 'Contenu validé')}
                        style={styles.modalButton}
                      />
                      <Button
                        title="❌ Rejeter"
                        onPress={() => handleResolveReport(selectedReport.id, 'rejected', 'Contenu inapproprié')}
                        variant="danger"
                        style={styles.modalButton}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: (width - 48) / 2,
    padding: 16,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  statDetail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionsCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 64) / 2,
    marginBottom: 8,
  },
  topCard: {
    padding: 16,
  },
  tuteurItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tuteurRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tuteurInfo: {
    flex: 1,
  },
  tuteurName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tuteurPoints: {
    fontSize: 12,
    color: '#666',
  },
  tuteurBadges: {
    flexDirection: 'row',
  },
  badgeText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 8,
  },
  moderationCard: {
    padding: 16,
    marginBottom: 16,
  },
  moderationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  highPriority: {
    backgroundColor: '#e74c3c',
  },
  mediumPriority: {
    backgroundColor: '#f39c12',
  },
  lowPriority: {
    backgroundColor: '#27ae60',
  },
  priorityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  itemMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  itemContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  moderationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approveButton: {
    flex: 1,
    marginRight: 8,
  },
  rejectButton: {
    flex: 1,
    marginLeft: 8,
  },
  authorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  authorButtonText: {
    fontSize: 12,
    color: '#007bff',
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    marginBottom: 16,
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  logsCard: {
    padding: 16,
  },
  logItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logAction: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007bff',
  },
  logTime: {
    fontSize: 11,
    color: '#999',
  },
  logTarget: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  logModerator: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  logReason: {
    fontSize: 12,
    color: '#333',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
});

export default AdminPanelScreen;
