import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgencyContext } from '@/contexts/AgencyContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Home, Users, Sparkles } from 'lucide-react';

const ServicesPage: React.FC = () => {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();

  // Fonction pour naviguer vers le dashboard d'une application
  const navigateToApp = (appType: string) => {
    if (!agency?.slug) return;
    navigate(`/${agency.slug}/${appType}/dashboard`);
  };

  // Définition des applications disponibles
  const availableServices = [
    {
      id: 'immo',
      title: 'Gestion Immobilière',
      description: 'Gérez vos biens immobiliers, propriétaires et transactions.',
      icon: <Building2 className="h-12 w-12 mb-4 text-primary" />,
      isAvailable: agency?.isImmo === true, // Vérification si l'agence a accès à la gestion immobilière
    },
    {
      id: 'locative',
      title: 'Gestion Locative',
      description: 'Suivez vos locations, loyers et relations avec les locataires.',
      icon: <Home className="h-12 w-12 mb-4 text-primary" />,
      isAvailable: agency?.isLocative === true, // Vérification si l'agence a accès à la gestion locative
    },
    {
      id: 'copro',
      title: 'Gestion Copropriété',
      description: 'Administrez vos copropriétés, charges et assemblées générales.',
      icon: <Users className="h-12 w-12 mb-4 text-primary" />,
      isAvailable: agency?.isCopro === true, // Vérification si l'agence a accès à la gestion de copropriété
    },
  ];

  // Couleurs dynamiques d'agence
  const primary = agency?.primary_color || '#2563eb';
  const secondary = agency?.secondary_color || '#818cf8';

  return (
    <div className="relative min-h-screen py-8 px-2 md:px-4 flex flex-col items-center justify-center overflow-x-hidden">
      {/* Fond animé SVG ou dégradé */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[var(--sidebar-background,_#f3f4f6)] via-white to-[var(--sidebar-primary,_#f0fdfa)] opacity-80" />
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Décor SVG immobilier animé */}
        <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-bg-move">
          <circle cx="700" cy="80" r="120" fill={secondary} fillOpacity="0.08" />
          <circle cx="100" cy="500" r="140" fill={primary} fillOpacity="0.07" />
          <circle cx="400" cy="300" r="80" fill={primary} fillOpacity="0.04" />
          {/* Silhouettes immobilières stylisées */}
          <g className="opacity-40">
            <rect x="40" y="420" width="120" height="60" rx="10" fill={primary} fillOpacity="0.10" />
            <rect x="180" y="450" width="60" height="30" rx="7" fill={secondary} fillOpacity="0.12" />
            <rect x="600" y="440" width="100" height="50" rx="12" fill={secondary} fillOpacity="0.10" />
            <rect x="300" y="500" width="80" height="30" rx="8" fill={primary} fillOpacity="0.08" />
            {/* Toits */}
            <polygon points="100,420 160,420 130,390" fill={primary} fillOpacity="0.13" />
            <polygon points="630,440 670,440 650,410" fill={secondary} fillOpacity="0.13" />
          </g>
          {/* Clé animée */}
          <g className="animate-key-bounce">
            <circle cx="720" cy="160" r="12" fill={primary} fillOpacity="0.18" />
            <rect x="715" y="160" width="10" height="28" rx="3" fill={primary} fillOpacity="0.13" />
          </g>
        </svg>
      </div>
      {/* Header animé */}
      <div className="text-center mb-12 animate-fade-in-up">
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center justify-center rounded-full bg-[var(--sidebar-primary,_#e0e7ff)] shadow-lg w-24 h-24 animate-float">
            <Sparkles className="h-12 w-12 text-[var(--sidebar-background,_#6366f1)]" />
          </span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 drop-shadow-md animate-fade-in-up">Bienvenue, {agency?.agency_name}</h1>
        <p className="text-lg text-gray-500 mt-2 animate-fade-in-up delay-100">Découvrez tous vos services immobiliers en un clic</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl animate-fade-in-up delay-200">
        {availableServices.filter(service => service.isAvailable).map((service, idx) => (
          <Card 
            key={service.id} 
            style={{
              borderColor: primary,
              boxShadow: `0 8px 32px 0 ${primary}22`,
              animation: `fade-in-card .6s cubic-bezier(.4,0,.2,1) both`,
              animationDelay: `${0.15 + idx * 0.1}s`
            }}
            className={`flex flex-col h-full bg-white/90 backdrop-blur-md border-2 transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl hover:border-[${secondary}] cursor-pointer group relative overflow-hidden card-tilt`}
            onClick={e => {
              if (service.isAvailable) {
                // Animation pulse/onde au clic
                const card = e.currentTarget;
                card.classList.remove('animate-pulse-card');
                void card.offsetWidth; // force reflow
                card.classList.add('animate-pulse-card');
                setTimeout(() => card.classList.remove('animate-pulse-card'), 400);
                setTimeout(() => navigateToApp(service.id), 220);
              }
            }}
          >
            {/* Badge animé sur Immo */}
            {service.id === 'immo' && (
              <span className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-3 py-1 rounded-full shadow-lg animate-bounce-badge z-10 font-bold tracking-wider">Populaire</span>
            )}
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center">
                <span className="inline-flex items-center justify-center rounded-full bg-[var(--sidebar-background,_#f3f4f6)] shadow-md w-16 h-16 mb-2 group-hover:scale-110 group-hover:bg-[var(--sidebar-primary,_#818cf8)] transition-all duration-300">
                  {service.icon}
                </span>
              </div>
              <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-[var(--sidebar-primary,_#6366f1)] transition-colors duration-300">{service.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription className="text-center text-gray-500 group-hover:text-gray-700 transition-colors duration-300">{service.description}</CardDescription>
              {/* Traces immobilières animées */}
              {service.id === 'immo' && (
                <svg width="56" height="32" viewBox="0 0 56 32" fill="none" className="absolute bottom-6 right-6 opacity-40 animate-trace-fade">
                  <rect x="0" y="12" width="32" height="8" rx="4" fill={primary} fillOpacity="0.22" />
                  <rect x="36" y="6" width="14" height="6" rx="3" fill={secondary} fillOpacity="0.18" />
                  <rect x="36" y="20" width="14" height="6" rx="3" fill={secondary} fillOpacity="0.13" />
                  <polygon points="8,12 24,12 16,4" fill={primary} fillOpacity="0.18" />
                </svg>
              )}
            </CardContent>
            <CardFooter className="pt-2 flex justify-center">
              <Button 
                variant={service.isAvailable ? "default" : "outline"} 
                disabled={!service.isAvailable}
                onClick={e => {
                  e.stopPropagation();
                  if (service.isAvailable) {
                    // Animation pulse/onde sur bouton
                    const btn = e.currentTarget;
                    btn.classList.remove('animate-pulse-btn');
                    void btn.offsetWidth;
                    btn.classList.add('animate-pulse-btn');
                    setTimeout(() => btn.classList.remove('animate-pulse-btn'), 350);
                    setTimeout(() => navigateToApp(service.id), 220);
                  }
                }}
                className="w-full font-semibold text-base transition-all duration-300 group-hover:scale-105"
                style={{background: service.isAvailable ? primary : undefined, borderColor: secondary, color: service.isAvailable ? '#fff' : undefined}}
              >
                {service.isAvailable ? 'Accéder' : 'Bientôt disponible'}
              </Button>
            </CardFooter>
            {/* Animation de halo */}
            <span className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-[var(--sidebar-primary,_#818cf8)] opacity-10 blur-2xl group-hover:opacity-20 transition-all duration-500"></span>
          </Card>
        ))}
      </div>
      {/* Animations CSS */}
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(32px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.7s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes fade-in-card {
          0% { opacity: 0; transform: translateY(32px) scale(.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bg-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(-10px); }
        }
        .animate-bg-move { animation: bg-move 10s ease-in-out infinite alternate; }
        @keyframes key-bounce {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-10px) rotate(-6deg); }
        }
        .animate-key-bounce { animation: key-bounce 3.5s infinite; }
        @keyframes bounce-badge {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px) scale(1.08); }
        }
        .animate-bounce-badge { animation: bounce-badge 1.8s infinite; }
        @keyframes pulse-card {
          0% { box-shadow: 0 0 0 0 rgba(251,191,36,0.22); }
          60% { box-shadow: 0 0 0 12px rgba(251,191,36,0.12); }
          100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.0); }
        }
        .animate-pulse-card { animation: pulse-card 0.4s; }
        @keyframes pulse-btn {
          0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.18); }
          60% { box-shadow: 0 0 0 10px rgba(37,99,235,0.09); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.0); }
        }
        .animate-pulse-btn { animation: pulse-btn 0.35s; }
        @keyframes trace-fade {
          0%,100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .animate-trace-fade { animation: trace-fade 3.5s infinite; }
        /* Tilt 3D au hover */
        .card-tilt {
          transition: transform 0.25s cubic-bezier(.25,.46,.45,.94);
          will-change: transform;
        }
        .card-tilt:hover {
          transform: perspective(900px) rotateY(7deg) scale(1.04);
        }
      `}</style>
    </div>
  );
};

export default ServicesPage;
