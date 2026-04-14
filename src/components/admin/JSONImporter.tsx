import React, { useState, useRef } from 'react';
import { useImportShipsFromJSON } from '@/hooks/useShips';
import { useImportFleetFromJSON } from '@/hooks/useFleet';
import { useProfiles, ProfileWithRole } from '@/hooks/useProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileJson, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type ImportMode = 'catalog' | 'fleet';

const JSONImporter: React.FC = () => {
  const { role, user } = useAuth();
  const { data: profiles } = useProfiles();
  const importShips = useImportShipsFromJSON();
  const importFleet = useImportFleetFromJSON();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImportMode>('catalog');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [jsonData, setJsonData] = useState<unknown>(null);
  const [result, setResult] = useState<{ imported: number; skipped?: number } | null>(null);

  const isAdmin = role === 'admin';

  const canImportFleet = (memberId: string) => {
    if (role === 'admin') return true;
    if (user?.id === memberId) return true;
    const member = profiles?.find(p => p.id === memberId);
    if (role === 'moderator' && member?.role === 'member') return true;
    return false;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setJsonData(data);
        toast({ title: 'Arquivo carregado', description: `${file.name} pronto para importação.` });
      } catch {
        toast({
          title: 'Erro ao ler arquivo',
          description: 'O arquivo não é um JSON válido',
          variant: 'destructive',
        });
        setFileName('');
        setJsonData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!jsonData) return;

    try {
      if (mode === 'catalog') {
        const res = await importShips.mutateAsync(jsonData);
        setResult(res);
        toast({
          title: 'Importação concluída',
          description: `${res.imported} naves importadas, ${res.skipped} ignoradas (já existentes).`,
        });
      } else {
        if (!selectedMemberId || !canImportFleet(selectedMemberId)) {
          toast({
            title: 'Erro',
            description: 'Selecione um membro válido',
            variant: 'destructive',
          });
          return;
        }
        const res = await importFleet.mutateAsync({ userId: selectedMemberId, jsonData });
        setResult({ imported: res.imported });
        toast({
          title: 'Importação concluída',
          description: `${res.imported} naves adicionadas à frota.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const reset = () => {
    setFileName('');
    setJsonData(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const editableProfiles = profiles?.filter(p => canImportFleet(p.id)) || [];

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="flex gap-3">
        <Button
          variant={mode === 'catalog' ? 'neon' : 'outline'}
          onClick={() => setMode('catalog')}
          className="flex-1"
          disabled={!isAdmin}
        >
          Catálogo Global
        </Button>
        <Button
          variant={mode === 'fleet' ? 'neon' : 'outline'}
          onClick={() => setMode('fleet')}
          className="flex-1"
        >
          Frota de Membro
        </Button>
      </div>

      {/* Member Selection (for fleet mode) */}
      {mode === 'fleet' && (
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Selecione o membro:</label>
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Selecione um membro" />
            </SelectTrigger>
            <SelectContent>
              {editableProfiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={profile.photo_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {profile.display_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {profile.display_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* File Upload */}
      <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
          id="json-upload"
        />
        
        {!fileName ? (
          <label
            htmlFor="json-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-display text-foreground">Arraste ou clique para selecionar</p>
              <p className="text-sm text-muted-foreground mt-1">
                Formato: Starjump Fleetviewer JSON
              </p>
            </div>
          </label>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <FileJson className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-display text-foreground">{fileName}</p>
              <Button
                variant="link"
                size="sm"
                onClick={reset}
                className="text-muted-foreground"
              >
                Remover
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Import Button */}
      {jsonData && (
        <Button
          variant="neon"
          onClick={handleImport}
          disabled={
            importShips.isPending || 
            importFleet.isPending ||
            (mode === 'fleet' && !selectedMemberId)
          }
          className="w-full"
        >
          {importShips.isPending || importFleet.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Importar {mode === 'catalog' ? 'para Catálogo' : 'para Frota'}
            </>
          )}
        </Button>
      )}

      {/* Result */}
      {result && (
        <div className="flex items-center gap-3 p-4 glass-card rounded-lg border-primary/30">
          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="font-display text-foreground">Importação concluída!</p>
            <p className="text-sm text-muted-foreground">
              {result.imported} naves importadas
              {result.skipped !== undefined && `, ${result.skipped} ignoradas`}
            </p>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="flex items-start gap-3 p-4 glass-card rounded-lg text-sm">
        <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Formato esperado:</p>
          <p>O JSON deve conter um array <code className="text-primary">canvasItems</code> com objetos contendo <code className="text-primary">itemType: "SHIP"</code>, <code className="text-primary">shipSlug</code> e <code className="text-primary">defaultText</code>.</p>
        </div>
      </div>
    </div>
  );
};

export default JSONImporter;
