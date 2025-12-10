import React, { useState, useEffect } from 'react';
import { Store } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, Check, Copy, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function StoreCustomLinkPage({ store, onUpdate }) {
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (store) {
      setSlug(store.slug || '');
    }
  }, [store]);

  const handleSave = async () => {
    if (!store) return;

    setSaving(true);
    setError(null);

    try {
      const normalizedSlug = slug.trim() === '' ? null : slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

      // Validações
      if (normalizedSlug && normalizedSlug.length < 3) {
        setError('O link personalizado deve ter pelo menos 3 caracteres');
        setSaving(false);
        return;
      }

      if (normalizedSlug && normalizedSlug.length > 50) {
        setError('O link personalizado deve ter no máximo 50 caracteres');
        setSaving(false);
        return;
      }

      await Store.update(store.id, { slug: normalizedSlug });

      toast({
        title: "Sucesso!",
        description: "Link personalizado atualizado com sucesso",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      const errorMessage = err.message || 'Erro ao salvar link personalizado';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    const url = slug 
      ? `${window.location.origin}/${slug}`
      : `${window.location.origin}/loja-online/${store?.id}`;
    
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência",
    });
  };

  const getFullUrl = () => {
    if (!store) return '';
    return slug 
      ? `${window.location.origin}/${slug}`
      : `${window.location.origin}/loja-online/${store.id}`;
  };

  const normalizeSlug = (value) => {
    // Remover espaços e converter para minúsculas
    let normalized = value.toLowerCase().trim();
    // Substituir espaços e caracteres especiais por hífens
    normalized = normalized.replace(/[^a-z0-9-]/g, '-');
    // Remover múltiplos hífens consecutivos
    normalized = normalized.replace(/-+/g, '-');
    // Remover hífens no início e fim
    normalized = normalized.replace(/^-|-$/g, '');
    return normalized;
  };

  const handleSlugChange = (e) => {
    const value = e.target.value;
    const normalized = normalizeSlug(value);
    setSlug(normalized);
    setError(null);
  };

  if (!store) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LinkIcon className="w-6 h-6" />
          Personalizar Link da Loja
        </h1>
        <p className="text-gray-600 mt-2">
          Crie um link personalizado e fácil de compartilhar para sua loja online
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Link Personalizado</CardTitle>
          <CardDescription>
            Escolha um nome único para o link da sua loja. Use apenas letras minúsculas, números e hífens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="slug">Nome do Link</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">{window.location.origin}/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="minha-loja"
                    maxLength={50}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {slug ? (
                <span>Seu link será: <strong>{getFullUrl()}</strong></span>
              ) : (
                <span>Deixe em branco para usar o link padrão: <strong>{getFullUrl()}</strong></span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label className="text-sm text-gray-600">Link Completo</Label>
              <p className="text-sm font-mono text-gray-900 break-all">{getFullUrl()}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Salvar Link
                </>
              )}
            </Button>
            {slug && (
              <Button
                variant="outline"
                onClick={() => {
                  setSlug('');
                  setError(null);
                }}
              >
                Limpar
              </Button>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Dicas:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Use apenas letras minúsculas, números e hífens</li>
                <li>O link deve ter entre 3 e 50 caracteres</li>
                <li>Cada loja pode ter apenas um link personalizado único</li>
                <li>Deixe em branco para usar o link padrão com o ID da loja</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

