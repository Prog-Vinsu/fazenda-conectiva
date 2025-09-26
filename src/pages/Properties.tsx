import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  MapPin,
  User,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Producer {
  id: string;
  name: string;
}

interface Property {
  id: string;
  tenant_id: string;
  producer_id: string;
  name: string;
  location: any; // GeoJSON
  area_hectares?: number;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  producer?: Producer;
}

const Properties = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    producer_id: '',
    area_hectares: '',
    address: '',
    latitude: '',
    longitude: '',
    notes: ''
  });

  useEffect(() => {
    if (profile?.tenant_id) {
      loadProperties();
      loadProducers();
    }
  }, [profile]);

  const loadProperties = async () => {
    if (!profile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          producer:producers (
            id,
            name
          )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('name');

      if (error) {
        toast({
          title: "Erro ao carregar propriedades",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducers = async () => {
    if (!profile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('producers')
        .select('id, name')
        .eq('tenant_id', profile.tenant_id)
        .order('name');

      if (error) {
        console.error('Error loading producers:', error);
        return;
      }

      setProducers(data || []);
    } catch (error) {
      console.error('Error loading producers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenant_id) return;

    try {
      // Create GeoJSON point from coordinates
      let location = null;
      if (formData.latitude && formData.longitude) {
        location = {
          type: 'Point',
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
        };
      }

      const propertyData = {
        name: formData.name,
        producer_id: formData.producer_id,
        area_hectares: formData.area_hectares ? parseFloat(formData.area_hectares) : null,
        address: formData.address || null,
        location,
        notes: formData.notes || null,
        tenant_id: profile.tenant_id
      };

      if (editingProperty) {
        // Update existing property
        const { error } = await supabase
          .from('properties')
          .update({
            ...propertyData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProperty.id);

        if (error) throw error;

        toast({
          title: "Propriedade atualizada",
          description: "As informações foram salvas com sucesso.",
        });
      } else {
        // Create new property
        const { error } = await supabase
          .from('properties')
          .insert([propertyData]);

        if (error) throw error;

        toast({
          title: "Propriedade criada",
          description: "Nova propriedade adicionada com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingProperty(null);
      resetForm();
      loadProperties();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar propriedade",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      producer_id: '',
      area_hectares: '',
      address: '',
      latitude: '',
      longitude: '',
      notes: ''
    });
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    
    // Extract coordinates from GeoJSON
    let latitude = '';
    let longitude = '';
    if (property.location && property.location.coordinates) {
      longitude = property.location.coordinates[0].toString();
      latitude = property.location.coordinates[1].toString();
    }

    setFormData({
      name: property.name,
      producer_id: property.producer_id,
      area_hectares: property.area_hectares?.toString() || '',
      address: property.address || '',
      latitude,
      longitude,
      notes: property.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (property: Property) => {
    if (!confirm('Tem certeza que deseja excluir esta propriedade?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (error) throw error;

      toast({
        title: "Propriedade excluída",
        description: "A propriedade foi removida com sucesso.",
      });

      loadProperties();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir propriedade",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.producer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalArea = filteredProperties.reduce((sum, prop) => sum + (prop.area_hectares || 0), 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Propriedades</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Propriedades</h1>
          <p className="text-muted-foreground">
            Gerencie as propriedades rurais dos seus produtores
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingProperty(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Propriedade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProperty ? 'Editar Propriedade' : 'Nova Propriedade'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações da propriedade rural
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Propriedade *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nome da fazenda ou sítio"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="producer_id">Produtor *</Label>
                  <Select 
                    value={formData.producer_id} 
                    onValueChange={(value) => setFormData({...formData, producer_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produtor" />
                    </SelectTrigger>
                    <SelectContent>
                      {producers.map((producer) => (
                        <SelectItem key={producer.id} value={producer.id}>
                          {producer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area_hectares">Área (hectares)</Label>
                  <Input
                    id="area_hectares"
                    type="number"
                    step="0.01"
                    value={formData.area_hectares}
                    onChange={(e) => setFormData({...formData, area_hectares: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Endereço da propriedade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    placeholder="-23.5505"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    placeholder="-46.6333"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Informações adicionais sobre a propriedade"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProperty ? 'Atualizar' : 'Criar'} Propriedade
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar propriedades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredProperties.length}</p>
                <p className="text-sm text-muted-foreground">
                  {filteredProperties.length === 1 ? 'Propriedade' : 'Propriedades'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalArea.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Hectares totais</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-info/10 rounded-lg">
                <User className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{producers.length}</p>
                <p className="text-sm text-muted-foreground">Produtores únicos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="shadow-soft hover:shadow-natural transition-smooth">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{property.name}</CardTitle>
                  <CardDescription>{property.producer?.name}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(property)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(property)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {property.area_hectares && (
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span>{property.area_hectares} hectares</span>
                  </div>
                )}
                {property.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{property.address}</span>
                  </div>
                )}
                {property.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="text-xs">
                      Coordenadas: {property.location.coordinates[1].toFixed(4)}, {property.location.coordinates[0].toFixed(4)}
                    </Badge>
                  </div>
                )}
                {property.notes && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {property.notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && !loading && (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nenhuma propriedade encontrada' : 'Nenhuma propriedade cadastrada'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos da sua busca.' 
                : 'Comece adicionando a primeira propriedade.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Propriedade
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Properties;