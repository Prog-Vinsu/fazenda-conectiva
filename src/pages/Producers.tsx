import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Phone,
  Mail,
  MapPin,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Producer {
  id: string;
  tenant_id: string;
  name: string;
  cpf_cnpj: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const Producers = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProducer, setEditingProducer] = useState<Producer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cpf_cnpj: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    if (profile?.tenant_id) {
      loadProducers();
    }
  }, [profile]);

  const loadProducers = async () => {
    if (!profile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('producers')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('name');

      if (error) {
        toast({
          title: "Erro ao carregar produtores",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setProducers(data || []);
    } catch (error) {
      console.error('Error loading producers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenant_id) return;

    try {
      if (editingProducer) {
        // Update existing producer
        const { error } = await supabase
          .from('producers')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProducer.id);

        if (error) throw error;

        toast({
          title: "Produtor atualizado",
          description: "As informações foram salvas com sucesso.",
        });
      } else {
        // Create new producer
        const { error } = await supabase
          .from('producers')
          .insert([{
            ...formData,
            tenant_id: profile.tenant_id
          }]);

        if (error) throw error;

        toast({
          title: "Produtor criado",
          description: "Novo produtor adicionado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingProducer(null);
      setFormData({
        name: '',
        cpf_cnpj: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
      loadProducers();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar produtor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (producer: Producer) => {
    setEditingProducer(producer);
    setFormData({
      name: producer.name,
      cpf_cnpj: producer.cpf_cnpj,
      phone: producer.phone || '',
      email: producer.email || '',
      address: producer.address || '',
      notes: producer.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (producer: Producer) => {
    if (!confirm('Tem certeza que deseja excluir este produtor?')) return;

    try {
      const { error } = await supabase
        .from('producers')
        .delete()
        .eq('id', producer.id);

      if (error) throw error;

      toast({
        title: "Produtor excluído",
        description: "O produtor foi removido com sucesso.",
      });

      loadProducers();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir produtor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredProducers = producers.filter(producer =>
    producer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producer.cpf_cnpj.includes(searchTerm) ||
    producer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Produtores</h1>
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
          <h1 className="text-3xl font-bold text-foreground">Produtores</h1>
          <p className="text-muted-foreground">
            Gerencie os produtores rurais da sua consultoria
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingProducer(null);
              setFormData({
                name: '',
                cpf_cnpj: '',
                phone: '',
                email: '',
                address: '',
                notes: ''
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produtor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProducer ? 'Editar Produtor' : 'Novo Produtor'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do produtor rural
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nome do produtor"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
                  <Input
                    id="cpf_cnpj"
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="produtor@email.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Endereço completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Informações adicionais sobre o produtor"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProducer ? 'Atualizar' : 'Criar'} Produtor
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
          placeholder="Buscar produtores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredProducers.length}</p>
              <p className="text-sm text-muted-foreground">
                {filteredProducers.length === 1 ? 'Produtor encontrado' : 'Produtores encontrados'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Producers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducers.map((producer) => (
          <Card key={producer.id} className="shadow-soft hover:shadow-natural transition-smooth">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{producer.name}</CardTitle>
                  <CardDescription>{producer.cpf_cnpj}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(producer)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(producer)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {producer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{producer.phone}</span>
                  </div>
                )}
                {producer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{producer.email}</span>
                  </div>
                )}
                {producer.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{producer.address}</span>
                  </div>
                )}
                {producer.notes && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {producer.notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducers.length === 0 && !loading && (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nenhum produtor encontrado' : 'Nenhum produtor cadastrado'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos da sua busca.' 
                : 'Comece adicionando o primeiro produtor da sua consultoria.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Produtor
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Producers;