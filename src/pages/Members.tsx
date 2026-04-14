import React, { useState, useMemo } from 'react';
import { useProfiles, ProfileWithRole } from '@/hooks/useProfiles';
import { AppRole } from '@/contexts/AuthContext';
import MemberCard from '@/components/members/MemberCard';
import SearchInput from '@/components/common/SearchInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Shield, Star, User, Loader2 } from 'lucide-react';

type SortOption = 'name' | 'role';
type RoleFilter = 'all' | AppRole;

const Members: React.FC = () => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('role');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const { data: profiles = [], isLoading } = useProfiles();

  const filteredAndSortedMembers = useMemo(() => {
    let result = [...profiles];

    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter((m) => m.role === roleFilter);
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter((m) =>
        m.display_name.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.display_name.localeCompare(b.display_name);
      }
      // Sort by role hierarchy: admin > moderator > member
      const roleOrder = { admin: 0, moderator: 1, member: 2 };
      return roleOrder[a.role] - roleOrder[b.role];
    });

    return result;
  }, [profiles, search, sortBy, roleFilter]);

  const roleStats = useMemo(() => ({
    admin: profiles.filter((m) => m.role === 'admin').length,
    moderator: profiles.filter((m) => m.role === 'moderator').length,
    member: profiles.filter((m) => m.role === 'member').length,
  }), [profiles]);

  const subRankStats = useMemo(() => {
    const stats: { name: string; icon_url: string | null; count: number }[] = [];
    const subRankMap = new Map<string, { name: string; icon_url: string | null; count: number }>();
    
    profiles.forEach((m) => {
      if (m.sub_rank) {
        const existing = subRankMap.get(m.sub_rank.id);
        if (existing) {
          existing.count++;
        } else {
          subRankMap.set(m.sub_rank.id, {
            name: m.sub_rank.name,
            icon_url: m.sub_rank.icon_url,
            count: 1,
          });
        }
      }
    });
    
    return Array.from(subRankMap.values()).sort((a, b) => b.count - a.count);
  }, [profiles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-display tracking-wider">TRIPULAÇÃO</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-foreground tracking-wide">
          Membros da <span className="text-primary neon-text">ORG</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Conheça todos os pilotos que fazem parte da nossa organização
        </p>
      </div>

      {/* Sub-Rank Stats */}
      {subRankStats.length > 0 && (
        <div className="flex justify-center gap-3 flex-wrap">
          {subRankStats.map((sr) => (
            <div key={sr.name} className="glass-card rounded-lg px-4 py-2 flex items-center gap-2">
              {sr.icon_url ? (
                <img src={sr.icon_url} alt={sr.name} className="w-4 h-4 object-contain" />
              ) : (
                <User className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="font-display text-lg text-primary">{sr.count}</span>
              <span className="text-xs text-muted-foreground">{sr.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex justify-center gap-4 flex-wrap">
        <div className="glass-card rounded-lg px-5 py-3 flex items-center gap-3">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-display text-lg text-primary">{roleStats.admin}</span>
          <span className="text-xs text-muted-foreground">Admins</span>
        </div>
        <div className="glass-card rounded-lg px-5 py-3 flex items-center gap-3">
          <Star className="w-4 h-4 text-primary" />
          <span className="font-display text-lg text-primary">{roleStats.moderator}</span>
          <span className="text-xs text-muted-foreground">Moderadores</span>
        </div>
        <div className="glass-card rounded-lg px-5 py-3 flex items-center gap-3">
          <User className="w-4 h-4 text-primary" />
          <span className="font-display text-lg text-primary">{roleStats.member}</span>
          <span className="text-xs text-muted-foreground">Membros</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar membro..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger className="w-36 bg-secondary border-border">
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="moderator">Moderadores</SelectItem>
              <SelectItem value="member">Membros</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-36 bg-secondary border-border">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="role">Por Rank</SelectItem>
              <SelectItem value="name">Nome A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members Grid */}
      {filteredAndSortedMembers.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {profiles.length === 0
              ? 'Nenhum membro cadastrado'
              : 'Nenhum membro encontrado'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredAndSortedMembers.map((member, index) => (
            <div
              key={member.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <MemberCard member={member} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Members;
