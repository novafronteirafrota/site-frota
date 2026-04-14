import React, { useState, useMemo } from 'react';
import { useAggregatedFleet, FleetAggregation } from '@/hooks/useFleet';
import ShipCard from '@/components/ships/ShipCard';
import ShipListItem from '@/components/ships/ShipListItem';
import ShipOwnersModal from '@/components/ships/ShipOwnersModal';
import SearchInput from '@/components/common/SearchInput';
import ViewToggle from '@/components/common/ViewToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Rocket, TrendingUp, Loader2 } from 'lucide-react';
type SortOption = 'quantity' | 'name';
type ViewMode = 'card' | 'list';
const Dashboard: React.FC = () => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('quantity');
  const [view, setView] = useState<ViewMode>('card');
  const [selectedFleetItem, setSelectedFleetItem] = useState<FleetAggregation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const {
    data: aggregatedFleet = [],
    isLoading
  } = useAggregatedFleet();
  const filteredAndSortedFleet = useMemo(() => {
    let result = [...aggregatedFleet];
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(item => item.ship.name.toLowerCase().includes(searchLower) || item.owners.some(o => o.profile.display_name.toLowerCase().includes(searchLower)));
    }
    result.sort((a, b) => {
      if (sortBy === 'quantity') {
        return b.totalQuantity - a.totalQuantity;
      }
      return a.ship.name.localeCompare(b.ship.name);
    });
    return result;
  }, [aggregatedFleet, search, sortBy]);
  const totalShips = useMemo(() => aggregatedFleet.reduce((acc, item) => acc + item.totalQuantity, 0), [aggregatedFleet]);
  const handleShipClick = (item: FleetAggregation) => {
    setSelectedFleetItem(item);
    setModalOpen(true);
  };
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>;
  }
  return <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Rocket className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-display tracking-wider">FROTA GERAL</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-foreground tracking-wide">
          Nossa <span className="text-primary neon-text">Frota</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Confira abaixo a lista de naves de todos os membros da ORG.           
        </p>
      </div>

      <div className="flex justify-center gap-8">
        <div className="glass-card rounded-lg px-6 py-4 text-center">
          <div className="flex items-center gap-2 justify-center text-primary mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="font-display text-2xl">{totalShips}</span>
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Naves Totais</span>
        </div>
        <div className="glass-card rounded-lg px-6 py-4 text-center">
          <div className="flex items-center gap-2 justify-center text-primary mb-1">
            <Rocket className="w-4 h-4" />
            <span className="font-display text-2xl">{aggregatedFleet.length}</span>
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Modelos Únicos</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar nave ou membro..." className="w-full sm:w-80" />
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
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

      {filteredAndSortedFleet.length === 0 ? <div className="text-center py-16">
          <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{aggregatedFleet.length === 0 ? 'Nenhuma nave cadastrada' : 'Nenhuma nave encontrada'}</p>
        </div> : view === 'card' ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredAndSortedFleet.map((item, index) => <div key={item.ship.id} className="animate-fade-in" style={{
        animationDelay: `${index * 50}ms`
      }}>
              <ShipCard ship={item.ship} quantity={item.totalQuantity} onClick={() => handleShipClick(item)} />
            </div>)}
        </div> : <div className="space-y-2 max-w-2xl mx-auto">
          {filteredAndSortedFleet.map((item, index) => <div key={item.ship.id} className="animate-slide-in-right" style={{
        animationDelay: `${index * 30}ms`
      }}>
              <ShipListItem ship={item.ship} quantity={item.totalQuantity} onClick={() => handleShipClick(item)} />
            </div>)}
        </div>}

      <ShipOwnersModal open={modalOpen} onOpenChange={setModalOpen} fleetItem={selectedFleetItem} />
    </div>;
};
export default Dashboard;