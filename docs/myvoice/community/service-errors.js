export function serviceError(status, body = {}) {
 const code = body.error_code || body.code;
 const messages = {
  email_not_confirmed: 'Confirmez votre adresse e-mail avec le lien reçu avant de vous connecter.',
  invalid_credentials: 'Adresse e-mail ou mot de passe incorrect. Un compte créé avec Discord utilise le bouton Discord.',
  email_address_not_authorized: 'Le serveur ne peut pas encore envoyer de confirmation à cette adresse. Utilisez Discord en attendant la configuration des e-mails.',
  over_email_send_rate_limit: 'Trop de demandes d’e-mail. Patientez quelques minutes avant de réessayer.',
  user_already_exists: 'Un compte existe déjà. Connectez-vous ou utilisez la récupération du mot de passe.'
 };
 return messages[code] || (status >= 500 ? 'Le serveur MyVoice est momentanément indisponible. Réessayez plus tard.' : status === 429 ? 'Trop de tentatives. Patientez quelques minutes.' : status === 401 ? 'Votre session a expiré. Connectez-vous à nouveau.' : status === 403 ? 'Cette action nécessite une autorisation sur ce contenu.' : 'Le serveur a refusé cette action. Vérifiez les informations saisies.');
}
