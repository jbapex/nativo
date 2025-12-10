import React, { useState, useEffect, useRef } from 'react';
import { X, Palette, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings } from '@/api/entities-local';

/**
 * Editor Visual de Cores
 * Permite clicar em elementos do site e alterar suas cores em tempo real
 */
export default function VisualColorEditor({ appearanceSettings, onSettingsChange, isActive: externalIsActive, onToggle }) {
  const [internalIsActive, setInternalIsActive] = useState(() => {
    return localStorage.getItem('visualEditorActive') === 'true';
  });
  
  // Usar prop externa se fornecida, senão usar estado interno
  const isActive = externalIsActive !== undefined ? externalIsActive : internalIsActive;
  
  // Função para desativar o editor
  const deactivateEditor = () => {
    setInternalIsActive(false);
    localStorage.setItem('visualEditorActive', 'false');
    window.dispatchEvent(new CustomEvent('visualEditorToggle', { detail: { active: false } }));
    // Se houver callback, chamar também
    if (onToggle) {
      onToggle(false);
    }
  };
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedColorKey, setSelectedColorKey] = useState(null);
  const [tempColor, setTempColor] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const overlayRef = useRef(null);

  // Mapeamento de seletores CSS para chaves de cor
  const elementColorMap = {
    // Botões primários
    'button[class*="bg-blue"], .bg-blue-600, [style*="background"][class*="primary"]': 'buttonPrimaryColor',
    // Botões secundários
    'button[class*="bg-cyan"], .bg-cyan-500': 'buttonSecondaryColor',
    // Links
    'a, [role="link"]': 'linkColor',
    // Cards
    '[class*="card"], [class*="Card"]': 'cardBackgroundColor',
    // Inputs
    'input, textarea, select': 'inputBackgroundColor',
    // Hero/Gradientes
    '[class*="hero"], [class*="Hero"], [class*="gradient"]': 'primaryColor',
    // Badges
    '[class*="badge"], [class*="Badge"]': 'badgePrimaryColor',
  };

  useEffect(() => {
    if (!isActive) {
      // Limpar seleção quando desativar
      setSelectedElement(null);
      setSelectedColorKey(null);
      setShowColorPicker(false);
      return;
    }

    // Adicionar event listeners quando modo editor está ativo
    const handleElementClick = (e) => {
      // Não processar se clicar no próprio overlay
      if (overlayRef.current?.contains(e.target)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const target = e.target;
      
      // Encontrar qual cor corresponde a este elemento
      let colorKey = null;
      
      // Verificar classes e estilos inline
      const classList = Array.from(target.classList || []);
      const inlineStyle = target.getAttribute('style') || '';
      
      // Mapear elemento para cor
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        if (classList.some(c => c.includes('primary'))) {
          colorKey = 'buttonPrimaryColor';
        } else if (classList.some(c => c.includes('secondary'))) {
          colorKey = 'buttonSecondaryColor';
        }
      } else if (target.tagName === 'A' || target.closest('a')) {
        colorKey = 'linkColor';
      } else if (target.closest('[class*="card"], [class*="Card"]')) {
        colorKey = 'cardBackgroundColor';
      } else if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        colorKey = 'inputBackgroundColor';
      } else if (target.closest('[class*="hero"], [class*="Hero"]')) {
        colorKey = 'primaryColor';
      } else if (target.closest('[class*="badge"], [class*="Badge"]')) {
        colorKey = 'badgePrimaryColor';
      }

      if (colorKey) {
        setSelectedElement(target);
        setSelectedColorKey(colorKey);
        setTempColor(appearanceSettings[colorKey] || '#2563eb');
        setShowColorPicker(true);
        
        // Destacar elemento
        target.style.outline = '2px dashed #2563eb';
        target.style.outlineOffset = '2px';
      }
    };

    // Adicionar indicadores visuais nos elementos editáveis
    const addEditIndicators = () => {
      const editables = document.querySelectorAll('button, a, [class*="card"], input, [class*="hero"]');
      editables.forEach(el => {
        if (!el.dataset.editorMarked) {
          el.dataset.editorMarked = 'true';
          el.style.cursor = 'pointer';
          el.title = 'Clique para editar cor';
        }
      });
    };

    // Remover indicadores
    const removeEditIndicators = () => {
      const editables = document.querySelectorAll('[data-editor-marked]');
      editables.forEach(el => {
        delete el.dataset.editorMarked;
        el.style.cursor = '';
        el.style.outline = '';
        el.style.outlineOffset = '';
        el.title = '';
      });
    };

    if (isActive) {
      document.addEventListener('click', handleElementClick, true);
      addEditIndicators();
    }

    return () => {
      document.removeEventListener('click', handleElementClick, true);
      removeEditIndicators();
      if (selectedElement) {
        selectedElement.style.outline = '';
        selectedElement.style.outlineOffset = '';
      }
    };
  }, [isActive, appearanceSettings, selectedElement]);

  const handleColorChange = (newColor) => {
    setTempColor(newColor);
    
    // Aplicar cor temporariamente no elemento
    if (selectedElement && selectedColorKey) {
      // Aplicar cor baseado no tipo de elemento
      if (selectedColorKey.includes('button')) {
        selectedElement.style.backgroundColor = newColor;
      } else if (selectedColorKey === 'linkColor') {
        selectedElement.style.color = newColor;
      } else if (selectedColorKey.includes('card')) {
        selectedElement.style.backgroundColor = newColor;
      } else if (selectedColorKey.includes('input')) {
        selectedElement.style.backgroundColor = newColor;
      } else if (selectedColorKey === 'primaryColor') {
        selectedElement.style.background = `linear-gradient(to right, ${newColor}, ${appearanceSettings.secondaryColor || '#06b6d4'})`;
      }
    }
  };

  const handleSaveColor = async () => {
    if (!selectedColorKey || !tempColor) return;

    try {
      // Atualizar configurações localmente
      const updatedSettings = {
        ...appearanceSettings,
        [selectedColorKey]: tempColor
      };

      // Chamar callback para atualizar no componente pai
      if (onSettingsChange) {
        onSettingsChange(updatedSettings);
      }

      // Salvar no backend
      const settingsKey = selectedColorKey.replace(/([A-Z])/g, '_$1').toLowerCase();
      const settingsToSave = {
        [settingsKey]: {
          value: tempColor,
          category: 'appearance',
          description: `Cor ${selectedColorKey.replace(/([A-Z])/g, ' $1').trim()}`
        }
      };

      await Settings.updateBulk({ settings: settingsToSave });

      // Limpar seleção
      if (selectedElement) {
        selectedElement.style.outline = '';
        selectedElement.style.outlineOffset = '';
      }
      setSelectedElement(null);
      setSelectedColorKey(null);
      setShowColorPicker(false);
      setTempColor(null);

      // Disparar evento para recarregar configurações
      window.dispatchEvent(new Event('appearanceChanged'));
    } catch (error) {
      console.error('Erro ao salvar cor:', error);
      alert('Erro ao salvar cor. Tente novamente.');
    }
  };

  const handleCancel = () => {
    // Reverter mudanças temporárias
    if (selectedElement && selectedColorKey) {
      const originalColor = appearanceSettings[selectedColorKey];
      if (selectedColorKey.includes('button')) {
        selectedElement.style.backgroundColor = originalColor || '';
      } else if (selectedColorKey === 'linkColor') {
        selectedElement.style.color = originalColor || '';
      } else if (selectedColorKey.includes('card')) {
        selectedElement.style.backgroundColor = originalColor || '';
      } else if (selectedColorKey.includes('input')) {
        selectedElement.style.backgroundColor = originalColor || '';
      }
      selectedElement.style.outline = '';
      selectedElement.style.outlineOffset = '';
    }

    setSelectedElement(null);
    setSelectedColorKey(null);
    setShowColorPicker(false);
    setTempColor(null);
  };

  // Não renderizar nada se não estiver ativo
  if (!isActive) {
    return null;
  }

  return (
    <>
      {/* Overlay de instruções */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-2xl">
        <Palette className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium flex-1">Modo Editor Ativo - Clique em qualquer elemento para editar sua cor</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={deactivateEditor}
          className="text-white hover:bg-blue-700 flex-shrink-0"
          title="Fechar Editor"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && selectedColorKey && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === overlayRef.current) {
              handleCancel();
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Editar Cor</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {selectedColorKey.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={tempColor || '#2563eb'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-20 h-12"
                  />
                  <Input
                    type="text"
                    value={tempColor || '#2563eb'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveColor}
                  className="flex-1"
                  style={{
                    backgroundColor: tempColor || '#2563eb',
                    color: '#ffffff'
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Hook para ativar/desativar o modo editor
export function useVisualEditor() {
  const [isEditorActive, setIsEditorActive] = useState(() => {
    return localStorage.getItem('visualEditorActive') === 'true';
  });

  const toggleEditor = (active) => {
    const newState = active !== undefined ? active : !isEditorActive;
    console.log('Toggle editor:', { active, newState, currentState: isEditorActive });
    setIsEditorActive(newState);
    localStorage.setItem('visualEditorActive', newState.toString());
    window.dispatchEvent(new CustomEvent('visualEditorToggle', { detail: { active: newState } }));
  };

  useEffect(() => {
    const handleToggle = (e) => {
      setIsEditorActive(e.detail.active);
    };

    window.addEventListener('visualEditorToggle', handleToggle);
    return () => window.removeEventListener('visualEditorToggle', handleToggle);
  }, []);

  return [isEditorActive, toggleEditor];
}

