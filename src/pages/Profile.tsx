import React, { useState, useMemo, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useProfile, useUpdateProfile } from '@/hooks/useProfiles';
import { useUserFleet, useImportFleetFromJSON, useAddToFleet, useRemoveFromFleet, useUpdateFleetItem, AcquisitionType } from '@/hooks/useFleet';
import { useShips, Ship } from '@/hooks/useShips';
import { useSubRanks, useUpdateProfileSubRank } from '@/hooks/useSubRanks';
import { useAuth } from '@/contexts/AuthContext';
import ShipCard from '@/components/ships/ShipCard';
import ShipListItem from '@/components/ships/ShipListItem';
import SearchInput from '@/components/common/SearchInput';
import ViewToggle from '@/components/common/ViewToggle';
import ChangePasswordModal from '@/components/admin/ChangePasswordModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Shield, Star, User as UserIcon, Rocket, Upload, Plus, Loader2, Minus, Award, Camera, Key, Gamepad2, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type SortOption = 'quantity' | 'name';
type ViewMode = 'card' | 'list';

const roleIcons = {
  admin: Shield,
  moderator: Star,
  member: UserIcon,
};

const roleLabels = {
  admin: 'Administrador',
  moderator: 'Moderador',
  member: 'Membro',
};

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, role: currentRole } = useAuth();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('quantity');
  const [view, setView] = useState<ViewMode>('card');
  const [addShipOpen, setAddShipOpen] = useState(false);
  const [addShipSearch, setAddShipSearch] = useState('');
  const [addShipManufacturer, setAddShipManufacturer] = useState<string>('all');
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [acquisitionType, setAcquisitionType] = useState<AcquisitionType>('hangar');
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading: profileLoading } = useProfile(userId || '');
  const { data: userFleet = [], isLoading: fleetLoading } = useUserFleet(userId || '');
  const { data: allShips = [] } = useShips();
  const { data: subRanks = [] } = useSubRanks();
  const updateProfile = useUpdateProfile();
  const importFleet = useImportFleetFromJSON();
  const addToFleet = useAddToFleet();
  const removeFromFleet = useRemoveFromFleet();
  const updateFleetItem = useUpdateFleetItem();
  const updateProfileSubRank = useUpdateProfileSubRank();

  const isOwnProfile = currentUser?.id === userId;
  const canEditProfile = isOwnProfile || 
    currentRole === 'admin' || 
    (currentRole === 'moderator' && profile?.role === 'member');
  const canEditFleet = isOwnProfile || 
    currentRole === 'admin' || 
    (currentRole === 'moderator' && profile?.role === 'member');
  const canEditSubRank = isOwnProfile || 
    currentRole === 'admin' || 
    (currentRole === 'moderator' && profile?.role === 'member');

  const handleSubRankChange = async (subRankId: string) => {
    if (!userId) return;
    try {
      await updateProfileSubRank.mutateAsync({
        profileId: userId,
        subRankId: subRankId === 'none' ? null : subRankId,
      });
      toast({ title: 'Sub-rank atualizado!' });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar sub-rank',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoUrlSave = async () => {
    if (!userId) return;
    try {
      await updateProfile.mutateAsync({
        userId,
        updates: { photo_url: photoUrl.trim() || null },
      });
      toast({ title: 'Foto de perfil atualizada!' });
      setPhotoDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao atualizar foto',
        variant: 'destructive',
      });
    }
  };

  const openPhotoDialog = () => {
    if (canEditProfile) {
      setPhotoUrl(profile?.photo_url || '');
      setPhotoDialogOpen(true);
    }
  };

  const filteredAndSortedFleet = useMemo(() => {
    let result = [...userFleet];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter((item) =>
        item.ship.name.toLowerCase().includes(searchLower)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'quantity') {
        return b.quantity - a.quantity;
      }
      return a.ship.name.localeCompare(b.ship.name);
    });

    return result;
  }, [userFleet, search, sortBy]);

  const totalShips = useMemo(
    () => userFleet.reduce((acc, item) => acc + item.quantity, 0),
    [userFleet]
  );

  const availableShips = useMemo(() => {
    // Show all ships, not filtering by already owned since they can have different acquisition types
    return allShips;
  }, [allShips]);

  const manufacturers = useMemo(() => {
    const mfSet = new Set(availableShips.map((s) => s.manufacturer).filter(Boolean));
    return Array.from(mfSet).sort() as string[];
  }, [availableShips]);

  const filteredAvailableShips = useMemo(() => {
    let result = [...availableShips];
    
    if (addShipSearch.trim()) {
      const searchLower = addShipSearch.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.manufacturer?.toLowerCase().includes(searchLower)
      );
    }
    
    if (addShipManufacturer !== 'all') {
      result = result.filter((s) => s.manufacturer === addShipManufacturer);
    }
    
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [availableShips, addShipSearch, addShipManufacturer]);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = await importFleet.mutateAsync({ userId, jsonData: json });
      toast({
        title: 'Importação concluída',
        description: `${result.imported} nave(s) importada(s) para a frota.`,
      });
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: 'Arquivo JSON inválido ou erro ao processar.',
        variant: 'destructive',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectShip = (ship: Ship) => {
    setSelectedShip(ship);
    // Set default acquisition type based on ship availability
    if (ship.available_hangar && !ship.available_ingame) {
      setAcquisitionType('hangar');
    } else if (ship.available_ingame && !ship.available_hangar) {
      setAcquisitionType('ingame');
    }
    // If both are available, keep the current selection
  };

  const handleConfirmAddShip = async () => {
    if (!userId || !selectedShip) return;
    try {
      await addToFleet.mutateAsync({ userId, shipId: selectedShip.id, acquisitionType });
      toast({ title: 'Nave adicionada à frota' });
      setSelectedShip(null);
      setAddShipOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao adicionar nave',
        variant: 'destructive',
      });
    }
  };

  const getAcquisitionOptions = (ship: Ship) => {
    const options: { value: AcquisitionType; label: string; icon: React.ReactNode }[] = [];
    if (ship.available_ingame) {
      options.push({ value: 'ingame', label: 'Comprada no jogo', icon: <Gamepad2 className="w-4 h-4" /> });
    }
    if (ship.available_hangar) {
      options.push({ value: 'hangar', label: 'Hangar da conta', icon: <DollarSign className="w-4 h-4" /> });
    }
    return options;
  };

  const handleUpdateQuantity = async (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    try {
      await updateFleetItem.mutateAsync({ itemId, quantity: newQty });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar quantidade',
        variant: 'destructive',
      });
    }
  };

  if (profileLoading || fleetLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/members" replace />;
  }

  const RoleIcon = roleIcons[profile.role];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Profile Header */}
      <div className="glass-card rounded-xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <img
              src={profile.photo_url || '/placeholder.svg'}
              alt={profile.display_name}
              className={`w-28 h-28 rounded-full border-4 border-primary/50 object-cover shadow-neon ${canEditProfile ? 'cursor-pointer' : ''}`}
              onClick={openPhotoDialog}
            />
            {canEditProfile && (
              <div 
                className="absolute inset-0 rounded-full bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={openPhotoDialog}
              >
                <Camera className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <RoleIcon className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="font-display text-2xl md:text-3xl text-foreground">
              {profile.display_name}
            </h1>
            <p className="text-primary font-display text-sm tracking-wider mt-1">
              {roleLabels[profile.role].toUpperCase()}
            </p>
            {profile.sub_rank && (
              <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                {profile.sub_rank.icon_url && (
                  <img
                    src={profile.sub_rank.icon_url}
                    alt={profile.sub_rank.name}
                    className="w-5 h-5 object-contain"
                  />
                )}
                <span className="text-sm text-muted-foreground">{profile.sub_rank.name}</span>
              </div>
            )}
          </div>

          {canEditSubRank && subRanks.length > 0 && (
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-muted-foreground" />
              <Select
                value={profile.sub_rank?.id || 'none'}
                onValueChange={handleSubRankChange}
                disabled={updateProfileSubRank.isPending}
              >
                <SelectTrigger className="w-44 bg-secondary/50 border-border">
                  <SelectValue placeholder="Sub-rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem sub-rank</SelectItem>
                  {subRanks.map((sr) => (
                    <SelectItem key={sr.id} value={sr.id}>
                      <div className="flex items-center gap-2">
                        {sr.icon_url && (
                          <img src={sr.icon_url} alt="" className="w-4 h-4 object-contain" />
                        )}
                        {sr.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {canEditFleet && (
            <div className="flex gap-3">
              <Dialog open={addShipOpen} onOpenChange={(open) => {
                setAddShipOpen(open);
                if (!open) {
                  setAddShipSearch('');
                  setAddShipManufacturer('all');
                  setSelectedShip(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Nave
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedShip ? 'Como você adquiriu a nave?' : 'Adicionar Nave à Frota'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {!selectedShip ? (
                    <>
                      {/* Search and Filters */}
                      <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <SearchInput
                          value={addShipSearch}
                          onChange={setAddShipSearch}
                          placeholder="Buscar nave..."
                          className="flex-1"
                        />
                        <Select value={addShipManufacturer} onValueChange={setAddShipManufacturer}>
                          <SelectTrigger className="w-full sm:w-44 bg-secondary border-border">
                            <SelectValue placeholder="Fabricante" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos Fabricantes</SelectItem>
                            {manufacturers.map((mf) => (
                              <SelectItem key={mf} value={mf}>{mf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Ships List */}
                      <div className="grid gap-2 mt-4 overflow-y-auto flex-1">
                        {availableShips.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            Não há naves cadastradas no catálogo.
                          </p>
                        ) : filteredAvailableShips.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            Nenhuma nave encontrada com os filtros atuais.
                          </p>
                        ) : (
                          filteredAvailableShips.map((ship) => (
                            <button
                              key={ship.id}
                              onClick={() => handleSelectShip(ship)}
                              className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left"
                            >
                              <img
                                src={ship.photo_url || '/placeholder.svg'}
                                alt={ship.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-foreground">{ship.name}</p>
                                {ship.manufacturer && (
                                  <p className="text-xs text-muted-foreground">{ship.manufacturer}</p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {ship.available_ingame && (
                                  <span title="Disponível no jogo">
                                    <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                                  </span>
                                )}
                                {ship.available_hangar && (
                                  <span title="Disponível no hangar">
                                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                                  </span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6 mt-4">
                      {/* Selected Ship Preview */}
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                        <img
                          src={selectedShip.photo_url || '/placeholder.svg'}
                          alt={selectedShip.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-display text-lg text-foreground">{selectedShip.name}</p>
                          {selectedShip.manufacturer && (
                            <p className="text-sm text-muted-foreground">{selectedShip.manufacturer}</p>
                          )}
                        </div>
                      </div>

                      {/* Acquisition Type Selection */}
                      <div className="space-y-3">
                        <Label>Como você adquiriu a nave?</Label>
                        {getAcquisitionOptions(selectedShip).length === 1 ? (
                          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-3">
                            {getAcquisitionOptions(selectedShip)[0].icon}
                            <span className="text-foreground">{getAcquisitionOptions(selectedShip)[0].label}</span>
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            {getAcquisitionOptions(selectedShip).map((option) => (
                              <button
                                key={option.value}
                                onClick={() => setAcquisitionType(option.value)}
                                className={`p-3 rounded-lg border transition-colors flex items-center gap-3 ${
                                  acquisitionType === option.value
                                    ? 'bg-primary/20 border-primary text-foreground'
                                    : 'bg-secondary border-border hover:border-primary/50 text-muted-foreground'
                                }`}
                              >
                                {option.icon}
                                <span>{option.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setSelectedShip(null)}
                        >
                          Voltar
                        </Button>
                        <Button
                          variant="neon"
                          className="flex-1"
                          onClick={handleConfirmAddShip}
                          disabled={addToFleet.isPending}
                        >
                          {addToFleet.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Adicionar'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={importFleet.isPending}
              >
                <Upload className="w-4 h-4" />
                {importFleet.isPending ? 'Importando...' : 'Importar JSON'}
              </Button>
            </div>
          )}
        </div>

        {/* Fleet Stats */}
        <div className="relative mt-6 pt-6 border-t border-border/50 flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="flex gap-8">
            <div className="text-center">
              <span className="font-display text-2xl text-primary">{totalShips}</span>
              <p className="text-xs text-muted-foreground mt-1">Naves Totais</p>
            </div>
            <div className="text-center">
              <span className="font-display text-2xl text-primary">{userFleet.length}</span>
              <p className="text-xs text-muted-foreground mt-1">Modelos</p>
            </div>
          </div>
          
          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setChangePasswordOpen(true)}
            >
              <Key className="w-4 h-4" />
              Alterar Senha
            </Button>
          )}
        </div>
      </div>

      {/* Photo URL Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Foto de Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex justify-center">
              <img
                src={photoUrl || '/placeholder.svg'}
                alt="Preview"
                className="w-24 h-24 rounded-full border-2 border-primary/50 object-cover"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo-url">URL da Imagem</Label>
              <Input
                id="photo-url"
                placeholder="https://exemplo.com/foto.jpg"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Cole a URL de uma imagem da internet. Formatos recomendados: JPG, PNG.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPhotoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePhotoUrlSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      {isOwnProfile && userId && (
        <ChangePasswordModal
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
          targetUserId={userId}
          targetUsername={profile.username}
          isOwnPassword={true}
        />
      )}

      {/* Fleet Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Rocket className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl text-foreground tracking-wide">
            Frota Pessoal
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar nave..."
            className="w-full sm:w-80"
          />

          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-40 bg-secondary border-border">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quantity">Quantidade</SelectItem>
                <SelectItem value="name">Nome A-Z</SelectItem>
              </SelectContent>
            </Select>

            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {/* Fleet Grid/List */}
        {filteredAndSortedFleet.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-xl">
            <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {userFleet.length === 0
                ? 'Nenhuma nave cadastrada'
                : 'Nenhuma nave encontrada'}
            </p>
          </div>
        ) : view === 'card' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredAndSortedFleet.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in relative group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ShipCard ship={item.ship} quantity={item.quantity} acquisitionType={item.acquisition_type} />
                {canEditFleet && (
                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                      className="w-6 h-6 rounded bg-destructive/80 hover:bg-destructive flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                      className="w-6 h-6 rounded bg-primary/80 hover:bg-primary flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {filteredAndSortedFleet.map((item, index) => (
              <div
                key={item.id}
                className="animate-slide-in-right flex items-center gap-2"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex-1">
                  <ShipListItem ship={item.ship} quantity={item.quantity} acquisitionType={item.acquisition_type} />
                </div>
                {canEditFleet && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                      className="w-8 h-8 rounded bg-destructive/80 hover:bg-destructive flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                      className="w-8 h-8 rounded bg-primary/80 hover:bg-primary flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
