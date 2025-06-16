import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, CreditCard, PiggyBank, LogOut, UserCircle } from 'lucide-react';
import { useAgencyAuthStore } from '@/stores/useAgencyAuthStore';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon, label, active, onClick }: SidebarItemProps) => (
  <Button
    variant="ghost"
    className={cn(
      'w-full justify-start gap-2 px-4 py-2 text-left',
      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
    )}
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
  </Button>
);

export function ProprietaireSidebar() {
  const navigate = useNavigate();
  const { agencySlug } = useParams();
  const { logout } = useAgencyAuthStore();
  const pathname = window.location.pathname;
  
  const handleLogout = async () => {
    await logout();
    if (agencySlug) {
      navigate(`/${agencySlug}/agency/auth`);
    }
  };

  const menuItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: 'Tableau de bord',
      path: `/${agencySlug}/proprietaire/dashboard`,
    },
    {
      icon: <UserCircle className="h-5 w-5" />,
      label: 'Profil',
      path: `/${agencySlug}/proprietaire/profil`,
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'Demandes',
      path: `/${agencySlug}/proprietaire/demandes`,
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Paiements',
      path: `/${agencySlug}/proprietaire/paiements`,
    },
    {
      icon: <PiggyBank className="h-5 w-5" />,
      label: 'Appels de fond',
      path: `/${agencySlug}/proprietaire/appels-de-fond`,
    },
  ];

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="p-4">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Espace Propriétaire
        </h2>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 px-4 py-2 text-left text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </Button>
      </div>
    </div>
  );
}
