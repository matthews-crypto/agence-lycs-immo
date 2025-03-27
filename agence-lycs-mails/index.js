require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

// Initialisation de l'API
const app = express();
const port = process.env.PORT || 3000;
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API d\'envoi d\'emails pour Agence LYCS Immo' });
});

// Route pour envoyer un email à un seul destinataire
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, from = 'Agence LYCS Immo <noreply@lycsimmo.com>' } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Les champs to, subject et html sont requis' });
    }

    const data = await resend.emails.send({
      from,
      to,
      subject,
      html
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour envoyer un email à plusieurs destinataires
app.post('/api/send-bulk-email', async (req, res) => {
  try {
    const { recipients, subject, html, from = 'Agence LYCS Immo <noreply@lycsimmo.com>' } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !subject || !html) {
      return res.status(400).json({ error: 'Les champs recipients (array), subject et html sont requis' });
    }

    const results = [];
    const errors = [];

    // Envoi des emails en série pour éviter les limitations d'API
    for (const recipient of recipients) {
      try {
        const data = await resend.emails.send({
          from,
          to: recipient.email,
          subject,
          html: html.replace('{{NOM}}', `${recipient.first_name} ${recipient.last_name}`)
                    .replace('{{PRENOM}}', recipient.first_name)
                    .replace('{{MONTANT}}', recipient.montant || '')
        });
        results.push({ email: recipient.email, success: true, id: data.id });
      } catch (error) {
        console.error(`Erreur lors de l'envoi à ${recipient.email}:`, error);
        errors.push({ email: recipient.email, error: error.message });
      }
    }

    res.json({ 
      success: errors.length === 0, 
      results, 
      errors,
      summary: `${results.length} email(s) envoyé(s) avec succès, ${errors.length} échec(s)` 
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi des emails:', error);
    res.status(500).json({ error: error.message });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`API d'envoi d'emails démarrée sur le port ${port}`);
});