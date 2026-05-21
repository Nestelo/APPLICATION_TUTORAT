// Script de test pour vérifier l'affichage des réponses dans le forum
import { getQuestion } from './src/api/forumService';

async function testForumDisplay() {
  console.log('=== TEST D\'AFFICHAGE DU FORUM ===');
  
  try {
    // Test avec la question 9 (Bio pharmaceutique)
    const questionId = 9;
    console.log(`Test de la question ID: ${questionId}`);
    
    const questionData = await getQuestion(questionId);
    console.log('Données brutes reçues:', questionData);
    
    console.log('\n--- ANALYSE DES RÉPONSES ---');
    console.log(`Nombre total de réponses: ${questionData.reponses?.length || 0}`);
    
    questionData.reponses?.forEach((reponse, index) => {
      console.log(`\nRéponse ${index + 1}:`);
      console.log(`  ID: ${reponse.id}`);
      console.log(`  Contenu: "${reponse.contenu}"`);
      console.log(`  Auteur: ${reponse.auteur_details?.prenom} ${reponse.auteur_details?.nom}`);
      console.log(`  Rôle: ${reponse.auteur_details?.role}`);
      console.log(`  Email: ${reponse.auteur_details?.email}`);
      
      // Vérifier si c'est un tuteur
      if (reponse.auteur_details?.role === 'tuteur') {
        console.log(`  *** C'EST UN TUTEUR ***`);
      }
      
      // Vérifier les réponses de Lote Lot spécifiquement
      if (reponse.auteur_details?.prenom === 'Lote' && reponse.auteur_details?.nom === 'Lot') {
        console.log(`  *** RÉPONSE DE LOTE LOT DÉTECTÉE ***`);
        console.log(`  *** Contenu: "${reponse.contenu}" ***`);
      }
      
      // Vérifier les réponses de Needs Need
      if (reponse.auteur_details?.prenom === 'Needs' && reponse.auteur_details?.nom === 'Need') {
        console.log(`  *** RÉPONSE DE NEEDS NEED DÉTECTÉE ***`);
        console.log(`  *** Contenu: "${reponse.contenu}" ***`);
      }
    });
    
    console.log('\n--- VÉRIFICATION DE LA STRUCTURE ---');
    console.log('Question valide:', !!questionData);
    console.log('Réponses présentes:', !!(questionData.reponses && questionData.reponses.length > 0));
    console.log('Auteur détails présents:', questionData.reponses?.every(r => !!r.auteur_details));
    
  } catch (error) {
    console.error('ERREUR:', error);
  }
}

export default testForumDisplay;
