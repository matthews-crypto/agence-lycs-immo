# 3. Conception Détaillée

Dans cette partie, nous présentons la conception détaillée du système, qui précise la manière dont chaque composant sera techniquement implémenté, en s'appuyant sur la conception générale réalisée en amont. Étant donné la complexité du système et le grand nombre de composants impliqués, il n'est pas possible de présenter ici l'intégralité des détails d'implémentation. Nous nous concentrerons donc sur un cas d'utilisation spécifique : **la gestion des paiements de location**.

La figure 7 présente l'architecture détaillée du système de gestion des paiements, en se concentrant sur un scénario spécifique : l'enregistrement et la consultation des paiements. Ce choix est délibéré : bien que le système implémente plusieurs mécanismes de gestion (ex. filtrage, exportation, etc.), tous suivent une structure d'interaction similaire.

## Figure 7 : Description des interactions séquentielles entre les composants pour la gestion des paiements

```
+---------------+     +----------------+     +----------------+     +----------------+
| Agent         |     | Interface      |     | Supabase       |     | Base de        |
| Immobilier    |     | Paiements      |     | Client         |     | Données        |
+-------+-------+     +--------+-------+     +-------+--------+     +-------+--------+
        |                      |                     |                      |
        | Accède à la page     |                     |                      |
        | des paiements        |                     |                      |
        +--------------------->|                     |                      |
        |                      | Initialise          |                      |
        |                      | le composant        |                      |
        |                      +-------------------->|                      |
        |                      |                     | Requête les          |
        |                      |                     | paiements            |
        |                      |                     +--------------------->|
        |                      |                     |                      |
        |                      |                     |                      |
        |                      |                     | Récupère les données |
        |                      |                     | de paiement avec     |
        |                      |                     | jointures            |
        |                      |                     |<---------------------+
        |                      |                     |                      |
        |                      | Retourne les        |                      |
        |                      | données formatées   |                      |
        |                      |<--------------------+                      |
        |                      |                     |                      |
        | Affiche les          |                     |                      |
        | paiements            |                     |                      |
        |<---------------------+                     |                      |
        |                      |                     |                      |
        | Filtre par méthode   |                     |                      |
        | de paiement          |                     |                      |
        +--------------------->|                     |                      |
        |                      | Filtre les données  |                      |
        |                      | côté client         |                      |
        |                      +-------------------->|                      |
        |                      |                     |                      |
        |                      | Retourne les        |                      |
        |                      | données filtrées    |                      |
        |                      |<--------------------+                      |
        |                      |                     |                      |
        | Affiche les résultats|                     |                      |
        | filtrés              |                     |                      |
        |<---------------------+                     |                      |
        |                      |                     |                      |
        | Clique pour exporter |                     |                      |
        | en CSV               |                     |                      |
        +--------------------->|                     |                      |
        |                      | Génère le fichier   |                      |
        |                      | CSV                 |                      |
        |                      +-------------------->|                      |
        |                      |                     |                      |
        |                      | Télécharge le       |                      |
        |                      | fichier CSV         |                      |
        |                      |<--------------------+                      |
        |                      |                     |                      |
        | Fichier CSV          |                     |                      |
        | téléchargé           |                     |                      |
        |<---------------------+                     |                      |
        |                      |                     |                      |
```

Afin de compléter la compréhension du fonctionnement du système, la figure suivante présente la conception détaillée de la fonctionnalité de gestion des paiements sous forme de diagramme de classes de conception qui fait ressortir l'ensemble des artéfacts impliqués dans la réalisation de la fonctionnalité. Ce diagramme met en évidence les principaux composants métier, leurs responsabilités, ainsi que les relations entre eux.

## Figure 8 : Description statique des éléments impliqués dans la gestion des paiements

```
+-------------------+       +-------------------+       +-------------------+
|   PaymentsPage    |       |  PaymentDetails   |       |   FilterOptions   |
+-------------------+       +-------------------+       +-------------------+
| - payments        |       | - id              |       | - month           |
| - isLoading       |       | - location_id     |       | - paymentMethod   |
| - searchTerm      |       | - payment_date    |       | - startDate       |
| - filters         |       | - amount          |       | - endDate         |
| - exportStartDate |       | - payment_method   |       +-------------------+
| - exportEndDate   |       | - months_covered   |
+-------------------+       | - created_at      |       +-------------------+
| + fetchPayments() |       +-------------------+       | PaymentWithDetails|
| + filterPayments()|                                   +-------------------+
| + exportToCSV()   |       +-------------------+       | - client          |
| + formatMethod()  |       |   SupabaseClient  |       | - property        |
+-------------------+       +-------------------+       | - months_paid     |
         |                  | - supabase        |       +-------------------+
         |                  +-------------------+
         |                  | + select()        |       +-------------------+
         |                  | + from()          |       |    UIComponents   |
         |                  | + order()         |       +-------------------+
         v                  +-------------------+       | - Table           |
+-------------------+                |                  | - Dialog          |
|  React Components |                |                  | - Select          |
+-------------------+                |                  | - Button          |
| - Table           |                |                  | - Calendar        |
| - Dialog          |                v                  +-------------------+
| - Select          |       +-------------------+
| - Button          |       |   Database Tables |
+-------------------+       +-------------------+
                            | - payment_details |
                            | - locations       |
                            | - clients         |
                            | - properties      |
                            +-------------------+
```

## 3.1 Besoins Non Fonctionnels

L'architecture du système de gestion des paiements a été conçue pour répondre aux principales exigences non fonctionnelles, sans entrer dans l'exhaustivité.

### Scalabilité & Performance

- **Filtrage côté client** : Les données sont filtrées en mémoire après récupération initiale, permettant une réactivité immédiate de l'interface utilisateur sans requêtes supplémentaires au serveur.
- **Pagination optimisée** : L'implémentation utilise une pagination efficace pour gérer de grands volumes de données de paiement.
- **Mise en cache** : React Query est utilisé pour mettre en cache les résultats des requêtes et éviter des appels réseau redondants.

```typescript
// Exemple d'implémentation du filtrage côté client pour optimiser les performances
const filteredPayments = useMemo(() => {
  if (!payments.length) return [];
  return payments.filter(payment => {
    // Filtrage par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const clientName = `${payment.client?.first_name || ''} ${payment.client?.last_name || ''}`.toLowerCase();
      if (!clientName.includes(searchLower)) return false;
    }
    
    // Filtrage par méthode de paiement
    if (filters.paymentMethod !== 'all' && payment.payment_method !== filters.paymentMethod) {
      return false;
    }
    
    // Filtrage par mois spécifique
    if (filters.month && filters.month !== 'all' && payment.months_paid) {
      if (!payment.months_paid.includes(filters.month)) {
        return false;
      }
    }
    
    return true;
  });
}, [payments, searchTerm, filters]);
```

### Fiabilité & Disponibilité

- **Gestion des erreurs** : Implémentation robuste de la gestion des erreurs pour les requêtes à la base de données.
- **Feedback utilisateur** : Affichage de messages d'état clairs (chargement, erreur, succès) pour informer l'utilisateur.
- **Validation des données** : Contrôles de validation pour garantir l'intégrité des données de paiement.

```typescript
// Exemple de gestion des erreurs dans la récupération des paiements
const fetchPayments = async () => {
  if (!agency?.id) return;
  
  setIsLoading(true);
  try {
    const { data, error } = await supabase
      .from('payment_details')
      .select(`
        id, location_id, payment_date, amount, payment_method, months_covered,
        created_at, locations!inner (
          client:client_id (id, first_name, last_name, email, phone_number),
          property:property_id (id, title, reference_number, price, type_location)
        )
      `)
      .order('payment_date', { ascending: false });

    if (error) {
      throw error;
    }

    // Transformation des données
    const paymentsData = data.map((payment) => {
      // Logique de transformation...
      return transformedPayment;
    });

    setPayments(paymentsData);
  } catch (error) {
    console.error("Erreur lors de la récupération des paiements:", error);
    toast.error("Impossible de charger les paiements");
  } finally {
    setIsLoading(false);
  }
};
```

### Maintenabilité

- **Architecture modulaire** : Séparation claire des responsabilités entre les composants UI, la logique métier et l'accès aux données.
- **Composants réutilisables** : Utilisation de composants UI standardisés de Shadcn/UI pour une cohérence visuelle.
- **Code documenté** : Documentation des fonctions et des structures de données pour faciliter la maintenance.

### Extensibilité & Compatibilité

- **Design responsive** : Interface adaptative fonctionnant sur différentes tailles d'écran.
- **Architecture évolutive** : Possibilité d'ajouter facilement de nouvelles fonctionnalités comme des méthodes de paiement supplémentaires.
- **Internationalisation** : Support du format de date français et de la devise FCFA.

```typescript
// Exemple d'exportation CSV avec formatage adapté au contexte local
const exportToCSV = () => {
  // Création de l'en-tête CSV
  const headers = ["Client", "Bien", "Référence", "Montant", "Méthode", "Date", "Mois couverts", "Nombre de mois"];
  
  // Formatage des données avec adaptation au contexte local (format de date, devise)
  const csvContent = [
    headers.join(","),
    ...paymentsToExport.map(payment => [
      `"${payment.client?.first_name || ''} ${payment.client?.last_name || ''}"`,
      `"${payment.property?.title || ''}"`,
      `"${payment.property?.reference_number || ''}"`,
      payment.amount.toLocaleString(), // Format avec séparateurs de milliers
      `"${formatPaymentMethod(payment.payment_method)}"`,
      format(new Date(payment.payment_date), "dd/MM/yyyy"), // Format de date français
      `"${payment.months_paid?.join(', ') || ''}"`,
      payment.months_covered || 1,
    ].join(","))
  ].join("\n");
  
  // Téléchargement du fichier
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `paiements_${format(new Date(), "dd-MM-yyyy")}.csv`;
  link.click();
};
```

Cette conception garantit un socle technique robuste, évolutif et adapté aux enjeux de la gestion immobilière au Sénégal, en particulier pour le suivi des paiements de location qui constitue une fonctionnalité critique pour les agences immobilières.
