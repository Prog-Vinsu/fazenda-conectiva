import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Leaf,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['admin', 'owner', 'manager', 'consultant', 'producer', 'operator']
    },
    {
      title: 'Produtores',
      href: '/producers',
      icon: Users,
      roles: ['admin', 'owner', 'manager', 'consultant']
    },
    {
      title: 'Propriedades',
      href: '/properties',
      icon: Building2,
      roles: ['admin', 'owner', 'manager', 'consultant', 'producer']
    },
    {
      title: 'Talhões',
      href: '/parcels',
      icon: MapPin,
      roles: ['admin', 'owner', 'manager', 'consultant', 'producer']
    },
    {
      title: 'Visitas',
      href: '/visits',
      icon: Calendar,
      roles: ['admin', 'owner', 'manager', 'consultant', 'producer', 'operator']
    },
    {
      title: 'Relatórios',
      href: '/reports',
      icon: FileText,
      roles: ['admin', 'owner', 'manager', 'consultant', 'producer']
    },
    {
      title: 'Configurações',
      href: '/settings',
      icon: Settings,
      roles: ['admin', 'owner', 'manager']
    }
  ];

  const visibleMenuItems = menuItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col shadow-natural">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-soft">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">SGSA</h1>
            <p className="text-xs text-sidebar-foreground/70">Gestão Agrícola</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {profile && (
        <div className="p-4 border-b border-sidebar-border bg-sidebar-accent/50">
          <div className="text-sm">
            <p className="font-medium text-sidebar-foreground truncate">
              {profile.full_name}
            </p>
            <p className="text-xs text-sidebar-foreground/70 capitalize">
              {profile.role}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-smooth hover:bg-sidebar-accent",
                    isActive(item.href) 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft" 
                      : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;