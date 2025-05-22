import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { LoadingLayout } from "@/components/LoadingLayout";
import { Trash2, Save, Eye, Move, Type, Image, FileText, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import { ChromePicker } from 'react-color';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { useDraggable, useDroppable } from '@dnd-kit/core';

// Types pour les modèles de contrat
interface ContractTemplate {
  id: string;
  agency_id: string;
  name: string;
  template_json: TemplateJson;
  created_at: string;
  updated_at: string;
}

interface TemplateJson {
  settings: TemplateSettings;
  blocks: Block[];
}

interface SignatureConfig {
  enabled: boolean;
  text: string;
  position: 'left' | 'center' | 'right';
}

interface TemplateSettings {
  headerColor?: string;
  bodyColor?: string;
  footerColor?: string;
  showLogo?: boolean;
  logoPosition?: 'left' | 'center' | 'right';
  showAgencyName?: boolean;
  agencyNamePosition?: 'left' | 'center' | 'right';
  agencyNameColor?: string;
  signatures?: SignatureConfig[];
}

interface Block {
  id: string;
  type: 'text';
  position: { x: number; y: number };
  size?: { width: number; height: number };
  content: string;
  style?: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
  };
}

// Composant pour un bloc draggable avec éditeur de texte riche
function DraggableBlock({ block, isSelected, onClick, onContentChange }: { 
  block: Block; 
  isSelected: boolean; 
  onClick: () => void;
  onContentChange: (content: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: block.id,
  });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    position: 'absolute',
    left: `${block.position.x}px`,
    top: `${block.position.y}px`,
    width: block.size?.width ? `${block.size.width}px` : 'auto',
    minWidth: '200px',
    minHeight: '30px',
    padding: '8px',
    border: isSelected ? '2px solid blue' : '1px dashed #ccc',
    backgroundColor: 'white',
    cursor: 'move',
    zIndex: isSelected ? 10 : 1,
    textAlign: block.style?.textAlign || 'left',
    fontWeight: block.style?.fontWeight || 'normal',
    ...block.style
  };

  // Fonction pour formater le contenu avec mise en évidence des champs dynamiques
  const formatContent = (text: string) => {
    if (!text) return 'Texte éditable';
    
    // Regex pour trouver les champs dynamiques au format {{table.champ}}
    const regex = /\{\{([\w]+\.[\w]+)\}\}/g;
    
    // Diviser le texte en segments (texte normal et champs dynamiques)
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // Ajouter le texte avant le champ dynamique
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      // Ajouter le champ dynamique
      parts.push({
        type: 'field',
        content: match[0],
        field: match[1]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Ajouter le reste du texte après le dernier champ dynamique
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    // Rendu des segments avec mise en forme
    return (
      <div>
        {parts.map((part, index) => (
          part.type === 'field' ? (
            <span key={index} className="inline-block bg-blue-100 text-blue-700 px-1 rounded">
              {part.content}
            </span>
          ) : (
            <span key={index}>{part.content}</span>
          )
        ))}
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style as React.CSSProperties}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {isSelected ? (
        <textarea
          value={block.content}
          onChange={(e) => onContentChange(e.target.value)}
          style={{ width: '100%', minHeight: '100px', border: 'none', outline: 'none', resize: 'none' }}
          onClick={(e) => e.stopPropagation()}
          placeholder="Saisissez votre texte ici. Utilisez le panneau latéral pour insérer des champs dynamiques."
        />
      ) : (
        formatContent(block.content)
      )}
    </div>
  );
}

// Composant pour la zone de drop
function DroppableCanvas({ children, onDrop }: { 
  children: React.ReactNode; 
  onDrop: (id: string, position: { x: number; y: number }) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: 'canvas',
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '842px', // A4 height in pixels at 96 DPI
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

export default function ContractEditorPage() {
  const { agency, isLoading: isAgencyLoading } = useAgencyContext();
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<ContractTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [availableFields, setAvailableFields] = useState<{table: string, fields: string[]}[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Charger les modèles de contrat existants
  // Définition des fonctions avant leur utilisation dans useEffect
  const loadAvailableFields = useCallback(() => {
    // Dans une application réelle, ces informations pourraient être chargées depuis la base de données
    // Ici, nous définissons manuellement les champs disponibles pour la démonstration
    setAvailableFields([
      {
        table: 'client',
        fields: ['nom', 'prenom', 'email', 'telephone', 'adresse']
      },
      {
        table: 'properties',
        fields: ['title', 'address', 'price', 'surface_area', 'bedrooms', 'reference_number']
      },
      {
        table: 'locations',
        fields: ['date_debut', 'date_fin', 'prix_location', 'caution']
      },
      {
        table: 'proprietaire',
        fields: ['nom', 'prenom', 'email', 'telephone', 'adresse']
      },
      {
        table: 'agencies',
        fields: ['agency_name', 'contact_email', 'contact_phone', 'address', 'city', 'postal_code']
      }
    ]);
  }, []);

  const createDefaultTemplate = useCallback(async () => {
    if (!agency?.id) return;
    
    const defaultTemplate: Omit<ContractTemplate, 'id' | 'created_at' | 'updated_at'> = {
      agency_id: agency.id,
      name: 'Modèle par défaut',
      template_json: {
        settings: {
          headerColor: '#f8f9fa',
          bodyColor: '#ffffff',
          footerColor: '#f8f9fa',
          logoUrl: agency?.logo_url || '',
          logoPosition: 'center',
          fontFamily: 'Arial',
          fontSize: '12px',
          showLogo: true,
          showAgencyName: true,
          agencyNamePosition: 'center',
          agencyNameColor: '#000000'
        },
        blocks: [
          {
            id: '1',
            type: 'text',
            position: { x: 50, y: 50 },
            content: 'CONTRAT DE LOCATION',
            style: {
              fontWeight: 'bold',
              fontSize: '18px'
            }
          },
          {
            id: '2',
            type: 'text',
            position: { x: 50, y: 100 },
            content: `Entre les soussignés :

{{agencies.agency_name}}, représentée par son directeur, ci-après dénommé "LE BAILLEUR"

Et

{{client.nom}} {{client.prenom}}, ci-après dénommé "LE LOCATAIRE"

Il a été convenu ce qui suit pour le bien situé au {{properties.address}}`
          },
          {
            id: '3',
            type: 'text',
            position: { x: 50, y: 250 },
            content: `ARTICLE 1 - OBJET DU CONTRAT

Le présent contrat a pour objet la location d'un bien immobilier situé à l'adresse suivante : {{properties.address}}.

Description du bien : {{properties.title}} d'une surface de {{properties.surface_area}} m² comportant {{properties.bedrooms}} chambres.`
          }
        ]
      }
    };

    try {
      // @ts-expect-error - La table contract_templates sera créée via SQL
      const { data, error } = await supabase
        .from('contract_templates')
        .insert(defaultTemplate)
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCurrentTemplate(data[0]);
        setTemplateName(data[0].name);
        setTemplates(prevTemplates => [...prevTemplates, data[0]]);
      }
    } catch (error) {
      console.error('Error creating default template:', error);
      toast.error('Erreur lors de la création du modèle par défaut');
    }
  }, [agency]);

  const loadTemplates = useCallback(async () => {
    if (!agency?.id) return;
    
    setIsLoading(true);
    try {
      // @ts-expect-error - La table contract_templates sera créée via SQL
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('agency_id', agency.id);

      if (error) throw error;
      
      setTemplates(data || []);
      
      if (data && data.length > 0) {
        setCurrentTemplate(data[0]);
        setTemplateName(data[0].name);
      } else {
        // Créer un template par défaut si aucun n'existe
        createDefaultTemplate();
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Erreur lors du chargement des modèles de contrat');
    } finally {
      setIsLoading(false);
    }
  }, [agency, createDefaultTemplate]);

  useEffect(() => {
    if (agency?.id) {
      loadTemplates();
      loadAvailableFields();
    }
  }, [agency?.id, loadTemplates, loadAvailableFields]);







  const handleDragEnd = (event: { active: { id: string }; over: { id: string } | null; delta: { x: number; y: number } }) => {
    const { active, over, delta } = event;
    
    if (over && over.id === 'canvas' && currentTemplate) {
      const blockId = active.id;
      const blockIndex = currentTemplate.template_json.blocks.findIndex(b => b.id === blockId);
      
      if (blockIndex !== -1) {
        const updatedBlocks = [...currentTemplate.template_json.blocks];
        updatedBlocks[blockIndex] = {
          ...updatedBlocks[blockIndex],
          position: {
            x: updatedBlocks[blockIndex].position.x + delta.x,
            y: updatedBlocks[blockIndex].position.y + delta.y
          }
        };
        
        setCurrentTemplate({
          ...currentTemplate,
          template_json: {
            ...currentTemplate.template_json,
            blocks: updatedBlocks
          }
        });
      }
    }
  };

  const handleBlockClick = (blockId: string) => {
    setSelectedBlockId(blockId);
  };

  const handleCanvasClick = () => {
    setSelectedBlockId(null);
  };

  const handleAddTextBlock = () => {
    if (!currentTemplate) return;
    
    const newBlock: Block = {
      id: Date.now().toString(),
      type: 'text',
      position: { x: 100, y: 100 },
      content: 'Nouveau texte. Cliquez pour éditer et insérer des champs dynamiques.'
    };
    
    setCurrentTemplate({
      ...currentTemplate,
      template_json: {
        ...currentTemplate.template_json,
        blocks: [...currentTemplate.template_json.blocks, newBlock]
      }
    });
    
    setSelectedBlockId(newBlock.id);
  };

  const handleInsertFieldIntoText = (field: string) => {
    if (!currentTemplate || !selectedBlockId) {
      toast.error('Veuillez d\'abord sélectionner un bloc de texte');
      return;
    }
    
    const blockIndex = currentTemplate.template_json.blocks.findIndex(
      block => block.id === selectedBlockId
    );
    
    if (blockIndex === -1) return;
    
    // Récupérer le bloc sélectionné
    const selectedBlock = currentTemplate.template_json.blocks[blockIndex];
    
    // Créer une copie du contenu actuel
    const textarea = document.querySelector('textarea:focus') as HTMLTextAreaElement;
    
    if (textarea) {
      // Récupérer la position du curseur
      const cursorPos = textarea.selectionStart;
      const textBefore = selectedBlock.content.substring(0, cursorPos);
      const textAfter = selectedBlock.content.substring(cursorPos);
      
      // Insérer le champ dynamique à la position du curseur
      const newContent = `${textBefore}{{${field}}}${textAfter}`;
      
      // Mettre à jour le bloc
      const updatedBlocks = [...currentTemplate.template_json.blocks];
      updatedBlocks[blockIndex] = {
        ...selectedBlock,
        content: newContent
      };
      
      setCurrentTemplate({
        ...currentTemplate,
        template_json: {
          ...currentTemplate.template_json,
          blocks: updatedBlocks
        }
      });
    } else {
      // Si aucun textarea n'est en focus, ajouter le champ à la fin du contenu
      const newContent = `${selectedBlock.content || ''}{{${field}}}`;
      
      // Mettre à jour le bloc
      const updatedBlocks = [...currentTemplate.template_json.blocks];
      updatedBlocks[blockIndex] = {
        ...selectedBlock,
        content: newContent
      };
      
      setCurrentTemplate({
        ...currentTemplate,
        template_json: {
          ...currentTemplate.template_json,
          blocks: updatedBlocks
        }
      });
    }
  };

  const handleDeleteBlock = () => {
    if (!currentTemplate || !selectedBlockId) return;
    
    const updatedBlocks = currentTemplate.template_json.blocks.filter(
      block => block.id !== selectedBlockId
    );
    
    setCurrentTemplate({
      ...currentTemplate,
      template_json: {
        ...currentTemplate.template_json,
        blocks: updatedBlocks
      }
    });
    
    setSelectedBlockId(null);
  };

  const handleBlockContentChange = (content: string) => {
    if (!currentTemplate || !selectedBlockId) return;
    
    const blockIndex = currentTemplate.template_json.blocks.findIndex(
      block => block.id === selectedBlockId
    );
    
    if (blockIndex === -1) return;
    
    const updatedBlocks = [...currentTemplate.template_json.blocks];
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      content
    };
    
    setCurrentTemplate({
      ...currentTemplate,
      template_json: {
        ...currentTemplate.template_json,
        blocks: updatedBlocks
      }
    });
  };

  const handleSaveTemplate = async () => {
    if (!currentTemplate || !agency?.id) return;
    
    try {
      const templateToSave = {
        ...currentTemplate,
        name: templateName,
        agency_id: agency.id
      };
      
      // @ts-expect-error - La table contract_templates sera créée via SQL
      const { error } = await supabase
        .from('contract_templates')
        .upsert(templateToSave);
      
      if (error) throw error;
      
      toast.success('Modèle de contrat enregistré avec succès');
      
      // Recharger les modèles pour mettre à jour la liste
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erreur lors de l\'enregistrement du modèle');
    }
  };

  const handleColorChange = (color: { hex: string }, type: 'header' | 'body' | 'footer') => {
    if (!currentTemplate) return;
    
    const colorHex = color.hex;
    
    setCurrentTemplate({
      ...currentTemplate,
      template_json: {
        ...currentTemplate.template_json,
        settings: {
          ...currentTemplate.template_json.settings,
          [type === 'header' ? 'headerColor' : type === 'body' ? 'bodyColor' : 'footerColor']: colorHex
        }
      }
    });
  };

  const handleLogoPositionChange = (position: 'left' | 'center' | 'right') => {
    if (!currentTemplate) return;
    
    setCurrentTemplate({
      ...currentTemplate,
      template_json: {
        ...currentTemplate.template_json,
        settings: {
          ...currentTemplate.template_json.settings,
          logoPosition: position
        }
      }
    });
  };
  
  // Fonction pour générer un aperçu PDF
  const generatePdfPreview = () => {
    if (!currentTemplate || !agency) return;
    
    try {
      // Créer un nouveau document PDF
      const doc = new jsPDF();
      
      // Dessiner un rectangle pour l'en-tête avec la couleur spécifiée
      const headerColor = currentTemplate.template_json.settings.headerColor || '#f8f9fa';
      // Convertir la couleur hex en valeurs RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 248, g: 249, b: 250 }; // Valeur par défaut #f8f9fa
      };
      
      const headerRgb = hexToRgb(headerColor);
      doc.setFillColor(headerRgb.r, headerRgb.g, headerRgb.b);
      
      // Ajouter le logo de l'agence si disponible et si l'option est activée
      const showLogo = currentTemplate.template_json.settings.showLogo !== false; // Par défaut true si non défini
      
      // Dessiner le rectangle de l'en-tête avec une hauteur dépendant du contenu
      doc.rect(0, 0, 210, showLogo ? 50 : 30, 'F'); // Dessiner un rectangle pour l'en-tête
      
      if (showLogo && agency.logo_url) {
        try {
          // Position du logo selon les paramètres du modèle
          const logoPosition = currentTemplate.template_json.settings.logoPosition || 'center';
          let xPos = 20; // Position par défaut (gauche)
          
          if (logoPosition === 'center') {
            xPos = 85; // Centre
          } else if (logoPosition === 'right') {
            xPos = 150; // Droite
          }
          
          doc.addImage(agency.logo_url, 'JPEG', xPos, 10, 40, 25);
        } catch (error) {
          console.error('Error adding logo to PDF:', error);
        }
      }
      
      // Interface pour les options de texte de jsPDF
      interface TextOptions {
        align?: 'left' | 'center' | 'right';
        baseline?: string;
        angle?: number;
        charSpace?: number;
        lineHeightFactor?: number;
        maxWidth?: number;
        flags?: { noBOM?: boolean; autoencode?: boolean };
      }
      
      // Ajouter le nom de l'agence si l'option est activée
      const showAgencyName = currentTemplate.template_json.settings.showAgencyName !== false; // Par défaut true si non défini
      
      if (showAgencyName && agency.agency_name) {
        const agencyNamePosition = currentTemplate.template_json.settings.agencyNamePosition || 'center';
        let xPos = 20; // Position par défaut (gauche)
        const textOptions: TextOptions = { align: 'left' };
        
        if (agencyNamePosition === 'center') {
          xPos = 105; // Centre de la page (210/2)
          textOptions.align = 'center';
        } else if (agencyNamePosition === 'right') {
          xPos = 190; // Droite (marge de 20 depuis la droite)
          textOptions.align = 'right';
        }
        
        // Définir la couleur du texte pour le nom de l'agence
        const agencyNameColor = currentTemplate.template_json.settings.agencyNameColor || '#000000';
        doc.setTextColor(agencyNameColor);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(agency.agency_name, xPos, showLogo ? 40 : 20, textOptions);
        
        // Réinitialiser la couleur du texte pour le reste du document
        doc.setTextColor(0, 0, 0); // Noir par défaut
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
      }
      
      // Interface pour les options de texte de jsPDF
      interface TextOptions {
        align?: 'left' | 'center' | 'right';
        baseline?: string;
        angle?: number;
        charSpace?: number;
        lineHeightFactor?: number;
        maxWidth?: number;
        flags?: { noBOM?: boolean; autoencode?: boolean };
      }
      
      // Fonction pour remplacer les variables dans un texte
      const replaceVariables = (text: string): string => {
        return text.replace(/\{\{([\w]+)\.([\w]+)\}\}/g, (match) => {
          // Dans l'aperçu, on garde les variables telles quelles
          return match;
        });
      };
      
      // Parcourir les blocs du modèle et les ajouter au PDF
      let yPosition = 60; // Position verticale initiale
      
      // Traiter chaque bloc de texte du modèle
      currentTemplate.template_json.blocks.forEach((block) => {
        if (block.type === 'text' && block.content) {
          // Remplacer les variables dans le contenu du bloc
          const processedContent = replaceVariables(block.content);
          
          // Définir le style du texte
          const fontSize = block.style?.fontSize ? parseInt(block.style.fontSize) : 12;
          doc.setFontSize(fontSize);
          
          if (block.style?.fontWeight === 'bold') {
            doc.setFont('helvetica', 'bold');
          } else {
            doc.setFont('helvetica', 'normal');
          }
          
          // Déterminer l'alignement horizontal
          const textAlign = block.style?.textAlign || 'left';
          let xPosition = 20; // Position par défaut (gauche)
          const textOptions: TextOptions = {};
          
          if (textAlign === 'center') {
            xPosition = 105; // Centre de la page (210/2)
            textOptions.align = 'center';
          } else if (textAlign === 'right') {
            xPosition = 190; // Droite (marge de 20 depuis la droite)
            textOptions.align = 'right';
          }
          
          // Ajouter le texte au PDF
          const lines = doc.splitTextToSize(processedContent, 170); // Largeur maximale
          doc.text(lines, xPosition, yPosition, textOptions);
          
          // Mettre à jour la position verticale pour le prochain bloc
          yPosition += lines.length * (fontSize / 2) + 10;
        }
      });
      
      // Ajouter les signatures au bas de la page
      if (currentTemplate.template_json.settings.signatures) {
        // Positionner les signatures au bas de la page
        const pageHeight = doc.internal.pageSize.height;
        const signatureY = pageHeight - 20; // 20 units from the bottom
        
        // Ajouter chaque signature activée
        currentTemplate.template_json.settings.signatures
          .filter(signature => signature.enabled)
          .forEach(signature => {
            // Déterminer la position horizontale de la signature
            let xPos = 40; // Position par défaut (gauche)
            const textOptions: TextOptions = { align: 'left' };
            
            if (signature.position === 'center') {
              xPos = 105; // Centre de la page (210/2)
              textOptions.align = 'center';
            } else if (signature.position === 'right') {
              xPos = 170; // Droite
              textOptions.align = 'right';
            }
            
            // Ajouter le texte de la signature
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(signature.text, xPos, signatureY, textOptions);
            
            // Ajouter un trait sous la signature
            const lineWidth = 60; // Largeur du trait
            let lineStartX = xPos - lineWidth / 2;
            
            if (signature.position === 'left') {
              lineStartX = 20;
            } else if (signature.position === 'right') {
              lineStartX = 130;
            }
            
            doc.line(lineStartX, signatureY + 5, lineStartX + lineWidth, signatureY + 5);
          });
      }
      
      // Convertir le PDF en Data URL pour l'afficher dans l'iframe
      const pdfDataUrl = doc.output('dataurlstring');
      setPdfDataUrl(pdfDataUrl);
      
      // Ouvrir la fenêtre modale d'aperçu
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      toast.error('Erreur lors de la génération de l\'aperçu PDF');
    }
  };

  if (isAgencyLoading || isLoading) {
    return <LoadingLayout />;
  }

  const selectedBlock = selectedBlockId 
    ? currentTemplate?.template_json.blocks.find(block => block.id === selectedBlockId)
    : null;

  return (
    <SidebarProvider>
      {/* Fenêtre modale d'aperçu PDF */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Aperçu du contrat</DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {pdfDataUrl && (
              <iframe 
                src={pdfDataUrl} 
                className="w-full h-full" 
                style={{ minHeight: '80vh' }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-4 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Éditeur de contrat</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={generatePdfPreview}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Aperçu PDF
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  style={{ backgroundColor: agency?.primary_color }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Panneau latéral gauche */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Modèle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="template-name">Nom du modèle</Label>
                        <Input
                          id="template-name"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Éléments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleAddTextBlock}
                      >
                        <Type className="h-4 w-4 mr-2" />
                        Ajouter du texte
                      </Button>
                      
                      <Separator className="my-2" />
                      
                      <div className="space-y-2">
                        <Label>Champs dynamiques</Label>
                        <p className="text-xs text-gray-500 mb-2">Sélectionnez un bloc de texte puis cliquez sur un champ pour l'insérer à la position du curseur.</p>
                        {availableFields.map((tableFields) => (
                          <div key={tableFields.table} className="space-y-1">
                            <h4 className="text-sm font-medium">{tableFields.table}</h4>
                            <div className="grid grid-cols-1 gap-1">
                              {tableFields.fields.map((field) => (
                                <Button
                                  key={`${tableFields.table}.${field}`}
                                  variant="outline"
                                  size="sm"
                                  className="justify-start text-xs"
                                  onClick={() => handleInsertFieldIntoText(`${tableFields.table}.${field}`)}
                                >
                                  {field}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Zone d'édition centrale */}
              <div className="lg:col-span-2 overflow-x-auto">
                <Card className="h-full" style={{ minWidth: '650px' }}>
                  <CardHeader>
                    <CardTitle>Mise en page</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[842px] overflow-auto">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToParentElement]}
                      >
                        <DroppableCanvas onDrop={() => {}}>
                          <div className="flex-1 bg-white border rounded-md p-4 overflow-auto relative" style={{ minHeight: '842px', width: '595px', margin: '0 auto' }}>
                          {/* En-tête avec couleur de fond */}
                          <div 
                            className="absolute top-0 left-0 right-0 w-full" 
                            style={{
                              backgroundColor: currentTemplate?.template_json.settings.headerColor || '#f8f9fa',
                              height: currentTemplate?.template_json.settings.showLogo !== false ? '50px' : '30px',
                              overflow: 'hidden'
                            }}
                          >
                            {/* Container pour le logo */}
                            {currentTemplate?.template_json.settings.showLogo !== false && agency?.logo_url && (
                              <div className="absolute h-full flex items-center justify-center"
                                style={{
                                  left: currentTemplate?.template_json.settings.logoPosition === 'left' ? '20px' : 
                                        currentTemplate?.template_json.settings.logoPosition === 'center' ? '50%' : 'auto',
                                  right: currentTemplate?.template_json.settings.logoPosition === 'right' ? '20px' : 'auto',
                                  transform: currentTemplate?.template_json.settings.logoPosition === 'center' ? 'translateX(-50%)' : 'none',
                                  zIndex: 10
                                }}
                              >
                                <img 
                                  src={agency.logo_url} 
                                  alt="Logo de l'agence" 
                                  className="h-10 object-contain max-w-[120px]" 
                                />
                              </div>
                            )}
                            
                            {/* Container pour le nom de l'agence */}
                            {currentTemplate?.template_json.settings.showAgencyName !== false && agency?.agency_name && (
                              <div className="absolute h-full flex items-center"
                                style={{
                                  left: currentTemplate?.template_json.settings.agencyNamePosition === 'left' ? '20px' : 
                                        currentTemplate?.template_json.settings.agencyNamePosition === 'center' ? '50%' : 'auto',
                                  right: currentTemplate?.template_json.settings.agencyNamePosition === 'right' ? '20px' : 'auto',
                                  transform: currentTemplate?.template_json.settings.agencyNamePosition === 'center' ? 'translateX(-50%)' : 'none',
                                  zIndex: 10,
                                  width: 'auto',
                                  maxWidth: '60%'
                                }}
                              >
                                <h2 className="m-0 truncate"
                                  style={{
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: currentTemplate?.template_json.settings.agencyNameColor || '#000000',
                                    textAlign: currentTemplate?.template_json.settings.agencyNamePosition || 'center'
                                  }}
                                >
                                  {agency.agency_name}
                                </h2>
                              </div>
                            )}
                          </div>
                          
                          {/* Corps du document avec les blocs de texte */}
                          <div className="mt-16 px-4">
                            {currentTemplate?.template_json.blocks.map((block, index) => (
                              <div 
                                key={block.id} 
                                className={`mb-4 p-2 ${selectedBlockId === block.id ? 'border-2 border-blue-500' : ''}`}
                                onClick={() => setSelectedBlockId(block.id)}
                              >
                                <div 
                                  dangerouslySetInnerHTML={{ __html: block.content.replace(/\{\{([\w]+)\.([\w]+)\}\}/g, '<span class="bg-yellow-100">$&</span>') }}
                                  style={{
                                    textAlign: block.style?.textAlign || 'left',
                                    fontWeight: block.style?.fontWeight || 'normal',
                                    fontSize: block.style?.fontSize || '12px'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          
                          {/* Zone de signatures au bas de la page */}
                          {currentTemplate?.template_json.settings.signatures && 
                           currentTemplate.template_json.settings.signatures.some(sig => sig.enabled) && (
                            <div className="absolute bottom-4 left-4 right-4">
                              <div className="flex justify-between">
                                {['left', 'center', 'right'].map(position => {
                                  const signature = currentTemplate.template_json.settings.signatures.find(
                                    sig => sig.enabled && sig.position === position
                                  );
                                  
                                  if (!signature) return <div key={position} className="w-1/3" />;
                                  
                                  return (
                                    <div 
                                      key={position} 
                                      className="w-1/3 flex flex-col items-center"
                                      style={{
                                        alignItems: 
                                          position === 'left' ? 'flex-start' : 
                                          position === 'right' ? 'flex-end' : 'center'
                                      }}
                                    >
                                      <span className="text-xs mb-1">{signature.text}</span>
                                      <div 
                                        className="border-t border-gray-400" 
                                        style={{ width: '60px' }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Le pied de page a été supprimé à la demande du client */}
                        </div>
                      </DroppableCanvas>
                    </DndContext>
                  </CardContent>
                </Card>
              </div>

              {/* Panneau latéral droit - Propriétés */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Propriétés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedBlock ? (
                      <div className="space-y-4">
                        <h3 className="font-medium">Bloc sélectionné</h3>
                        
                        {selectedBlock.type === 'text' && (
                          <div className="space-y-4">
                            <Label htmlFor="block-content">Contenu</Label>
                            <textarea
                              id="block-content"
                              className="w-full min-h-[100px] p-2 border rounded"
                              value={selectedBlock.content || ''}
                              onChange={(e) => handleBlockContentChange(e.target.value)}
                            />
                            
                            <div>
                              <Label htmlFor="text-weight">Style de texte</Label>
                              <div className="flex mt-2">
                                <Button
                                  type="button"
                                  variant={selectedBlock.style?.fontWeight === 'bold' ? "default" : "outline"}
                                  className="mr-2"
                                  onClick={() => {
                                    if (!currentTemplate || !selectedBlockId) return;
                                    
                                    const selectedBlock = currentTemplate.template_json.blocks.find(block => block.id === selectedBlockId);
                                    if (!selectedBlock) return;
                                    
                                    const newWeight = selectedBlock.style?.fontWeight === 'bold' ? 'normal' : 'bold';
                                    const updatedBlock: Block = {
                                      ...selectedBlock,
                                      style: { ...selectedBlock.style, fontWeight: newWeight }
                                    };
                                    
                                    const updatedBlocks = currentTemplate.template_json.blocks.map(block =>
                                      block.id === selectedBlockId ? updatedBlock : block
                                    );
                                    
                                    setCurrentTemplate({
                                      ...currentTemplate,
                                      template_json: {
                                        ...currentTemplate.template_json,
                                        blocks: updatedBlocks
                                      }
                                    });
                                  }}
                                >
                                  <span className="font-bold">G</span>
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="text-align">Alignement horizontal</Label>
                              <div className="flex mt-2">
                                <Button
                                  type="button"
                                  variant={selectedBlock.style?.textAlign === 'left' || !selectedBlock.style?.textAlign ? "default" : "outline"}
                                  className="mr-2"
                                  onClick={() => {
                                    if (!currentTemplate || !selectedBlockId) return;
                                    
                                    const selectedBlock = currentTemplate.template_json.blocks.find(block => block.id === selectedBlockId);
                                    if (!selectedBlock) return;
                                    
                                    const updatedBlock: Block = {
                                      ...selectedBlock,
                                      style: { ...selectedBlock.style, textAlign: 'left' }
                                    };
                                    
                                    const updatedBlocks = currentTemplate.template_json.blocks.map(block =>
                                      block.id === selectedBlockId ? updatedBlock : block
                                    );
                                    
                                    setCurrentTemplate({
                                      ...currentTemplate,
                                      template_json: {
                                        ...currentTemplate.template_json,
                                        blocks: updatedBlocks
                                      }
                                    });
                                  }}
                                >
                                  Gauche
                                </Button>
                                <Button
                                  type="button"
                                  variant={selectedBlock.style?.textAlign === 'center' ? "default" : "outline"}
                                  className="mr-2"
                                  onClick={() => {
                                    if (!currentTemplate || !selectedBlockId) return;
                                    
                                    const selectedBlock = currentTemplate.template_json.blocks.find(block => block.id === selectedBlockId);
                                    if (!selectedBlock) return;
                                    
                                    const updatedBlock: Block = {
                                      ...selectedBlock,
                                      style: { ...selectedBlock.style, textAlign: 'center' }
                                    };
                                    
                                    const updatedBlocks = currentTemplate.template_json.blocks.map(block =>
                                      block.id === selectedBlockId ? updatedBlock : block
                                    );
                                    
                                    setCurrentTemplate({
                                      ...currentTemplate,
                                      template_json: {
                                        ...currentTemplate.template_json,
                                        blocks: updatedBlocks
                                      }
                                    });
                                  }}
                                >
                                  Centre
                                </Button>
                                <Button
                                  type="button"
                                  variant={selectedBlock.style?.textAlign === 'right' ? "default" : "outline"}
                                  onClick={() => {
                                    if (!currentTemplate || !selectedBlockId) return;
                                    
                                    const selectedBlock = currentTemplate.template_json.blocks.find(block => block.id === selectedBlockId);
                                    if (!selectedBlock) return;
                                    
                                    const updatedBlock: Block = {
                                      ...selectedBlock,
                                      style: { ...selectedBlock.style, textAlign: 'right' }
                                    };
                                    
                                    const updatedBlocks = currentTemplate.template_json.blocks.map(block =>
                                      block.id === selectedBlockId ? updatedBlock : block
                                    );
                                    
                                    setCurrentTemplate({
                                      ...currentTemplate,
                                      template_json: {
                                        ...currentTemplate.template_json,
                                        blocks: updatedBlocks
                                      }
                                    });
                                  }}
                                >
                                  Droite
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteBlock}
                          className="w-full mt-4"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer le bloc
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="font-medium">Apparence du document</h3>
                        
                        <div>
                          <Label>Couleur de l'en-tête</Label>
                          <div className="mt-2">
                            <ChromePicker
                              color={currentTemplate?.template_json.settings.headerColor || '#f8f9fa'}
                              onChange={(color) => handleColorChange(color, 'header')}
                              disableAlpha
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="font-medium">Options de l'en-tête</h3>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="show-logo" 
                              checked={currentTemplate?.template_json.settings.showLogo} 
                              onCheckedChange={(checked) => {
                                if (!currentTemplate) return;
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  template_json: {
                                    ...currentTemplate.template_json,
                                    settings: {
                                      ...currentTemplate.template_json.settings,
                                      showLogo: checked === true
                                    }
                                  }
                                });
                              }}
                            />
                            <Label htmlFor="show-logo">Afficher le logo</Label>
                          </div>
                          
                          {currentTemplate?.template_json.settings.showLogo && (
                            <div>
                              <Label>Position du logo</Label>
                              <Select
                                value={currentTemplate?.template_json.settings.logoPosition || 'center'}
                                onValueChange={(value: 'left' | 'center' | 'right') => handleLogoPositionChange(value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Position du logo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">Gauche</SelectItem>
                                  <SelectItem value="center">Centre</SelectItem>
                                  <SelectItem value="right">Droite</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2 mt-4">
                            <Checkbox 
                              id="show-agency-name" 
                              checked={currentTemplate?.template_json.settings.showAgencyName !== false}
                              onCheckedChange={(checked) => {
                                if (!currentTemplate) return;
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  template_json: {
                                    ...currentTemplate.template_json,
                                    settings: {
                                      ...currentTemplate.template_json.settings,
                                      showAgencyName: checked
                                    }
                                  }
                                });
                              }}
                            />
                            <Label htmlFor="show-agency-name">Afficher le nom de l'agence</Label>
                          </div>
                          
                          {currentTemplate?.template_json.settings.showAgencyName && (
                            <>
                              <div>
                                <Label>Position du nom de l'agence</Label>
                                <Select
                                  value={currentTemplate?.template_json.settings.agencyNamePosition || 'center'}
                                  onValueChange={(value: 'left' | 'center' | 'right') => {
                                    if (!currentTemplate) return;
                                    setCurrentTemplate({
                                      ...currentTemplate,
                                      template_json: {
                                        ...currentTemplate.template_json,
                                        settings: {
                                          ...currentTemplate.template_json.settings,
                                          agencyNamePosition: value
                                        }
                                      }
                                    });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Position du nom" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="left">Gauche</SelectItem>
                                    <SelectItem value="center">Centre</SelectItem>
                                    <SelectItem value="right">Droite</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="mt-4">
                                <Label>Couleur du texte</Label>
                                <div className="mt-2">
                                  <ChromePicker
                                    color={currentTemplate?.template_json.settings.agencyNameColor || '#000000'}
                                    onChange={(color) => {
                                      if (!currentTemplate) return;
                                      setCurrentTemplate({
                                        ...currentTemplate,
                                        template_json: {
                                          ...currentTemplate.template_json,
                                          settings: {
                                            ...currentTemplate.template_json.settings,
                                            agencyNameColor: color.hex
                                          }
                                        }
                                      });
                                    }}
                                    disableAlpha
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          
                          <div className="mt-6 border-t pt-4">
                            <h3 className="text-lg font-medium mb-2">Signatures</h3>
                            <p className="text-sm text-gray-500 mb-4">Vous pouvez ajouter jusqu'à 3 signatures qui apparaîtront au bas du document.</p>
                            
                            {/* Initialiser les signatures si elles n'existent pas */}
                            {!currentTemplate?.template_json.settings.signatures && currentTemplate && (
                              <Button
                                variant="outline"
                                className="mb-4"
                                onClick={() => {
                                  setCurrentTemplate({
                                    ...currentTemplate,
                                    template_json: {
                                      ...currentTemplate.template_json,
                                      settings: {
                                        ...currentTemplate.template_json.settings,
                                        signatures: [
                                          { enabled: false, text: 'Signature Client', position: 'left' },
                                          { enabled: false, text: 'Signature Agent', position: 'center' },
                                          { enabled: false, text: 'Signature Direction', position: 'right' }
                                        ]
                                      }
                                    }
                                  });
                                }}
                              >
                                Configurer les signatures
                              </Button>
                            )}
                            
                            {currentTemplate?.template_json.settings.signatures && (
                              <div className="space-y-6">
                                {currentTemplate.template_json.settings.signatures.map((signature, index) => {
                                  // Déterminer les positions disponibles
                                  const usedPositions = currentTemplate.template_json.settings.signatures
                                    ?.filter((s, i) => i !== index && s.enabled)
                                    .map(s => s.position) || [];
                                  
                                  return (
                                    <div key={index} className="p-4 border rounded-md">
                                      <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-medium">Signature {index + 1}</h4>
                                        <div className="flex items-center space-x-2">
                                          <Checkbox 
                                            id={`signature-${index}`} 
                                            checked={signature.enabled}
                                            onCheckedChange={(checked) => {
                                              if (!currentTemplate) return;
                                              const newSignatures = [...currentTemplate.template_json.settings.signatures];
                                              newSignatures[index] = {
                                                ...newSignatures[index],
                                                enabled: checked === true
                                              };
                                              setCurrentTemplate({
                                                ...currentTemplate,
                                                template_json: {
                                                  ...currentTemplate.template_json,
                                                  settings: {
                                                    ...currentTemplate.template_json.settings,
                                                    signatures: newSignatures
                                                  }
                                                }
                                              });
                                            }}
                                          />
                                          <Label htmlFor={`signature-${index}`}>Activer</Label>
                                        </div>
                                      </div>
                                      
                                      {signature.enabled && (
                                        <>
                                          <div className="mb-4">
                                            <Label>Texte de la signature</Label>
                                            <Input
                                              value={signature.text}
                                              onChange={(e) => {
                                                if (!currentTemplate) return;
                                                const newSignatures = [...currentTemplate.template_json.settings.signatures];
                                                newSignatures[index] = {
                                                  ...newSignatures[index],
                                                  text: e.target.value
                                                };
                                                setCurrentTemplate({
                                                  ...currentTemplate,
                                                  template_json: {
                                                    ...currentTemplate.template_json,
                                                    settings: {
                                                      ...currentTemplate.template_json.settings,
                                                      signatures: newSignatures
                                                    }
                                                  }
                                                });
                                              }}
                                              placeholder="Texte de la signature"
                                            />
                                          </div>
                                          
                                          <div>
                                            <Label>Position de la signature</Label>
                                            <Select
                                              value={signature.position}
                                              onValueChange={(value: 'left' | 'center' | 'right') => {
                                                if (!currentTemplate) return;
                                                const newSignatures = [...currentTemplate.template_json.settings.signatures];
                                                newSignatures[index] = {
                                                  ...newSignatures[index],
                                                  position: value
                                                };
                                                setCurrentTemplate({
                                                  ...currentTemplate,
                                                  template_json: {
                                                    ...currentTemplate.template_json,
                                                    settings: {
                                                      ...currentTemplate.template_json.settings,
                                                      signatures: newSignatures
                                                    }
                                                  }
                                                });
                                              }}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Position" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="left" disabled={usedPositions.includes('left')}>Gauche</SelectItem>
                                                <SelectItem value="center" disabled={usedPositions.includes('center')}>Centre</SelectItem>
                                                <SelectItem value="right" disabled={usedPositions.includes('right')}>Droite</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
