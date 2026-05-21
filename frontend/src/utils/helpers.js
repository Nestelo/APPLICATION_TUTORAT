export const formatDate = (dateString, format = 'dd/MM/yyyy') => {
  if (!dateString) return 'Date invalide';
  
  const date = new Date(dateString);
  
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    return 'Date invalide';
  }
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return format.replace('dd', day).replace('MM', month).replace('yyyy', year);
};

export const formatTime = (dateString) => {
  if (!dateString) return 'Heure invalide';
  
  const date = new Date(dateString);
  
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    return 'Heure invalide';
  }
  
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export const truncate = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

export const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};