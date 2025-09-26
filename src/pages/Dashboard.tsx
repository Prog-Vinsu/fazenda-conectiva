import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalProducers: number;
  totalProperties: number;
  totalParcels: number;
  upcomingVisits: number;
  completedVisits: number;
  pendingVisits: number;
}

interface RecentVisit {
  id: string;
  scheduled_at: string;
  status: string;
  parcel: {
    name: string;
    property: {
      name: string;
      producer: {
        name: string;
      };
    };
  };
}

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducers: 0,
    totalProperties: 0,
    totalParcels: 0,
    upcomingVisits: 0,
    completedVisits: 0,
    pendingVisits: 0,
  });
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.tenant_id) {
      loadDashboardData();
    }
  }, [profile]);

  const loadDashboardData = async () => {
    if (!profile?.tenant_id) return;

    try {
      // Load stats
      const [
        producersResult,
        propertiesResult,
        parcelsResult,
        visitsResult
      ] = await Promise.all([
        supabase
          .from('producers')
          .select('id')
          .eq('tenant_id', profile.tenant_id),
        supabase
          .from('properties')
          .select('id')
          .eq('tenant_id', profile.tenant_id),
        supabase
          .from('parcels')
          .select('id')
          .eq('tenant_id', profile.tenant_id),
        supabase
          .from('visits')
          .select('id, status, scheduled_at')
          .eq('tenant_id', profile.tenant_id)
      ]);

      const visits = visitsResult.data || [];
      const now = new Date();
      const upcomingVisits = visits.filter(v => 
        new Date(v.scheduled_at) > now && v.status === 'scheduled'
      ).length;
      const completedVisits = visits.filter(v => v.status === 'completed').length;
      const pendingVisits = visits.filter(v => v.status === 'scheduled').length;

      setStats({
        totalProducers: producersResult.data?.length || 0,
        totalProperties: propertiesResult.data?.length || 0,
        totalParcels: parcelsResult.data?.length || 0,
        upcomingVisits,
        completedVisits,
        pendingVisits,
      });

      // Load recent visits
      const { data: recentVisitsData } = await supabase
        .from('visits')
        .select(`
          id,
          scheduled_at,
          status,
          parcel:parcels (
            name,
            property:properties (
              name,
              producer:producers (
                name
              )
            )
          )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('scheduled_at', { ascending: false })
        .limit(5);

      setRecentVisits(recentVisitsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'scheduled':
        return 'Agendada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-earth min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {profile?.full_name}! Aqui está o resumo da sua atividade.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/visits/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Visita
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-soft hover:shadow-natural transition-smooth">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produtores</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalProducers}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-natural transition-smooth">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Propriedades</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalProperties}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-natural transition-smooth">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Talhões</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalParcels}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-natural transition-smooth">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visitas Agendadas</p>
                <p className="text-2xl font-bold text-foreground">{stats.upcomingVisits}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Visitas Recentes
            </CardTitle>
            <CardDescription>
              Últimas visitas técnicas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentVisits.length > 0 ? (
                recentVisits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(visit.status)}
                      <div>
                        <p className="font-medium text-sm">
                          {visit.parcel?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {visit.parcel?.property?.name} - {visit.parcel?.property?.producer?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {getStatusLabel(visit.status)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(visit.scheduled_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma visita registrada ainda.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estatísticas de Visitas
            </CardTitle>
            <CardDescription>
              Performance das visitas técnicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Concluídas</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-success"
                      style={{ 
                        width: `${stats.completedVisits > 0 ? (stats.completedVisits / (stats.completedVisits + stats.pendingVisits)) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stats.completedVisits}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Agendadas</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-warning"
                      style={{ 
                        width: `${stats.pendingVisits > 0 ? (stats.pendingVisits / (stats.completedVisits + stats.pendingVisits)) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stats.pendingVisits}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
              <Link to="/producers/new">
                <Users className="h-6 w-6" />
                <span className="text-sm">Novo Produtor</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
              <Link to="/properties/new">
                <Building2 className="h-6 w-6" />
                <span className="text-sm">Nova Propriedade</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
              <Link to="/visits/new">
                <Calendar className="h-6 w-6" />
                <span className="text-sm">Agendar Visita</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
              <Link to="/reports">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Ver Relatórios</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;