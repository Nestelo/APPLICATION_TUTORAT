import React from 'react';
import RessourcesScreen from '../ressources/RessourcesScreen';

// Alias : même UI que la liste des ressources,
// avec restriction "ajouter" gérée dans RessourcesScreen via le rôle.
export default function StudentResourcesScreen(props) {
  return <RessourcesScreen {...props} />;
}
