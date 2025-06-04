import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ServiceDetailsPage() {
  const location = useLocation();

  useEffect(() => {
    // Scroll automatique à la section correspondante si hash présent
    if (location.hash) {
      const sectionId = location.hash.replace('#', '');
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 text-center text-[#aa1ca0]">Nos solutions immobilières & digitales</h1>
        <p className="text-center mb-12 text-lg text-gray-700">Découvrez l'ensemble de nos services pour valoriser, sécuriser et digitaliser votre patrimoine immobilier. Une offre complète, flexible et innovante pour répondre à tous vos besoins !</p>

        {/* --- PRICING --- */}
        <section id="tarifs" className="mb-16">
          <Card className="shadow-xl border-[#aa1ca0] border-2">
            <CardHeader>
              <CardTitle className="text-2xl text-[#aa1ca0] text-center">Nos Packs & Tarification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
                {/* Pack Immo (par défaut) */}
                <div className="flex-1 bg-[#faf5ff] rounded-lg p-6 border border-[#aa1ca0]/30 shadow">
                  <h3 className="text-xl font-bold text-[#aa1ca0] mb-2">Pack Gestion Immobilière</h3>
                  <p className="mb-2 text-gray-700">Gestion locative complète, valorisation, reporting, accompagnement juridique et fiscal.</p>
                  <div className="text-3xl font-bold mb-1">5% du loyer/mois</div>
                  <div className="text-sm text-gray-500 mb-2">Service de base, obligatoire</div>
                </div>
                {/* Option Locative */}
                <div className="flex-1 bg-[#f6fffa] rounded-lg p-6 border border-[#1ca06c]/20 shadow">
                  <h3 className="text-xl font-bold text-[#1ca06c] mb-2">Option Gestion Locative</h3>
                  <p className="mb-2 text-gray-700">Suivi planning, paiements, ventes, gestion clients et propriétaires.</p>
                  <div className="text-3xl font-bold mb-1">2% du loyer/mois</div>
                  <div className="text-sm text-gray-500 mb-2">En complément du pack Immo</div>
                </div>
                {/* Option Copro */}
                <div className="flex-1 bg-[#f6faff] rounded-lg p-6 border border-[#1c7aaa]/20 shadow">
                  <h3 className="text-xl font-bold text-[#1c7aaa] mb-2">Option Gestion Copropriété</h3>
                  <p className="mb-2 text-gray-700">Gestion administrative, AG, budgets, appels de fonds, travaux.</p>
                  <div className="text-3xl font-bold mb-1">1% du budget annuel</div>
                  <div className="text-sm text-gray-500 mb-2">Nécessite l'option Locative</div>
                </div>
                {/* Bot WhatsApp */}
                <div className="flex-1 bg-[#e8fff3] rounded-lg p-6 border border-[#25D366]/30 shadow">
                  <h3 className="text-xl font-bold text-[#25D366] mb-2">Agent WhatsApp (Bot)</h3>
                  <p className="mb-2 text-gray-700">Agent virtuel disponible 24/7 pour répondre à vos critères et vous proposer des biens en temps réel.</p>
                  <div className="text-3xl font-bold mb-1">10 000 FCFA/mois</div>
                  <div className="text-sm text-gray-500 mb-2">Indépendant ou en complément</div>
                </div>
              </div>
              <div className="text-xs text-center text-gray-500 mt-4">Tous les tarifs sont exprimés en FCFA. <span className="font-semibold">Pack Immo</span> requis pour toute gestion. Copropriété disponible uniquement avec l'option Locative.</div>
            </CardContent>
          </Card>
        </section>

        {/* --- Détail des services --- */}
        <div className="space-y-16">
          {/* Gestion immobilière */}
          <section id="gestion-immobiliere">
            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-[#aa1ca0]">Gestion immobilière</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Dashboard personnalisé pour piloter votre patrimoine en temps réel</li>
                  <li>Gestion complète des offres et opportunités locatives</li>
                  <li>Suivi des rendez-vous, demandes de contact et reporting avancé</li>
                  <li>Valorisation, travaux, entretien, conseils investissement</li>
                  <li>Accompagnement juridique, fiscal, et arbitrage sur-mesure</li>
                  <li>Une équipe dédiée pour maximiser la rentabilité de vos biens</li>
                </ul>
                <div className="mt-4 text-[#aa1ca0] font-semibold">Optez pour la sérénité : notre équipe s’occupe de tout !</div>
              </CardContent>
            </Card>
          </section>

          {/* Gestion locative */}
          <section id="gestion-locative">
            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-[#1ca06c]">Gestion locative</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Planning location intelligent : visualisez et gérez toutes vos réservations</li>
                  <li>Paiements automatisés, relances et suivi des encaissements</li>
                  <li>Gestion des ventes, clients et propriétaires</li>
                  <li>Tableau de bord dédié à la performance locative</li>
                  <li>Optimisation de la rentabilité et accompagnement personnalisé</li>
                </ul>
                <div className="mt-4 text-[#1ca06c] font-semibold">Maximisez la rentabilité de chaque bien, sans effort !</div>
              </CardContent>
            </Card>
          </section>

          {/* Gestion copropriété */}
          <section id="gestion-copropriete">
            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-[#1c7aaa]">Gestion copropriété</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Dashboard copropriété pour une vision globale et transparente</li>
                  <li>Gestion des lots, appels de fonds, budgets et dépenses</li>
                  <li>Organisation et tenue des assemblées générales</li>
                  <li>Suivi des travaux, maintenance et sinistres</li>
                  <li>Communication fluide avec les copropriétaires</li>
                  <li>Expertise réglementaire et accompagnement sur-mesure</li>
                </ul>
                <div className="mt-4 text-[#1c7aaa] font-semibold">Sécurisez et valorisez votre copropriété avec nos experts !</div>
              </CardContent>
            </Card>
          </section>

          {/* Bot WhatsApp */}
          <section id="bot-whatsapp">
            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-[#25D366]">Agent immobilier (Bot WhatsApp)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Agent virtuel disponible 24/7 sur WhatsApp</li>
                  <li>Réponse instantanée à vos critères : localisation, budget, type de bien…</li>
                  <li>Proposition automatique des biens qui correspondent à vos besoins</li>
                  <li>Accompagnement digital jusqu’à la visite ou la prise de contact avec un conseiller</li>
                  <li>Gain de temps, disponibilité totale et expérience ultra-fluide</li>
                </ul>
                
                <div className="mt-4 text-[#25D366] font-semibold">Un agent digital pour une expérience immobilière nouvelle génération !</div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
