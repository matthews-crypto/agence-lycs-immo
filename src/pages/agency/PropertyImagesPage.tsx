import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Upload, X, GripVertical, Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp']
};

export default function PropertyImagesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);

  // Fetch property data
  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Update property photos mutation
  const updatePhotosMutation = useMutation({
    mutationFn: async (photos: string[]) => {
      const { error } = await supabase
        .from('properties')
        .update({ photos })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
    },
  });

  // File upload handling
  const onDrop = async (acceptedFiles: File[]) => {
    setIsUploading(true);
    const newProgress = { ...uploadProgress };
    
    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${id}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('property-images')
          .upload(fileName, file, {
            upsert: false,
            onUploadProgress: (event: ProgressEvent) => {
              newProgress[fileName] = (event.loaded / event.total) * 100;
              setUploadProgress(newProgress);
            },
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      const updatedPhotos = [...(property?.photos || []), ...newUrls];
      await updatePhotosMutation.mutateAsync(updatedPhotos);

      toast({
        title: "Images téléchargées avec succès",
        description: `${acceptedFiles.length} image(s) ont été ajoutées`,
      });
    } catch (error) {
      toast({
        title: "Erreur lors du téléchargement",
        description: "Une erreur est survenue lors du téléchargement des images",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  // Handle image reordering
  const handleDragEnd = async (result: any) => {
    if (!result.destination || !property?.photos) return;

    const items = Array.from(property.photos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    await updatePhotosMutation.mutateAsync(items);
  };

  // Handle image deletion
  const handleDeleteImage = async (index: number) => {
    if (!property?.photos) return;
    
    const updatedPhotos = property.photos.filter((_, i) => i !== index);
    await updatePhotosMutation.mutateAsync(updatedPhotos);
    
    toast({
      title: "Image supprimée",
      description: "L'image a été supprimée avec succès",
    });
  };

  // Set main image
  const handleSetMainImage = async (index: number) => {
    if (!property?.photos) return;
    
    const updatedPhotos = [...property.photos];
    const [selectedImage] = updatedPhotos.splice(index, 1);
    updatedPhotos.unshift(selectedImage);
    
    await updatePhotosMutation.mutateAsync(updatedPhotos);
    
    toast({
      title: "Image principale définie",
      description: "L'image a été définie comme image principale",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des images</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2">
          {isDragActive
            ? "Déposez les fichiers ici..."
            : "Glissez-déposez des images ou cliquez pour sélectionner"}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Formats acceptés: JPG, PNG, WebP (max 5MB)
        </p>
      </div>

      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="text-sm text-gray-500">{fileName}</div>
              <Progress value={progress} className="h-2" />
            </div>
          ))}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="images">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {property?.photos?.map((url, index) => (
                <Draggable key={url} draggableId={url} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <Card className="overflow-hidden">
                        <div className="relative group">
                          <img
                            src={url}
                            alt={`Property image ${index + 1}`}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={() => handleSetMainImage(index)}
                                className={index === 0 ? "text-yellow-400" : ""}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="destructive">
                                    <X className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Confirmer la suppression
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir supprimer cette image ?
                                      Cette action est irréversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteImage(index)}
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            <div
                              {...provided.dragHandleProps}
                              className="absolute bottom-2 right-2"
                            >
                              <Button size="icon" variant="secondary">
                                <GripVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
