import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Upload, Star, Trash2, GripVertical } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export default function PropertyImagesPage() {
  const { propertyId, slug } = useParams();
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const { agency } = useAgencyContext();

  const { data: property, refetch } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const onDragEnd = async (result: any) => {
    if (!result.destination || !property) return;

    const items = Array.from(property.photos || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    try {
      const { error } = await supabase
        .from("properties")
        .update({ photos: items })
        .eq("id", propertyId);

      if (error) throw error;
      refetch();
      toast.success("Images réorganisées avec succès");
    } catch (error) {
      console.error("Error reordering images:", error);
      toast.error("Erreur lors de la réorganisation des images");
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    onDrop: async (acceptedFiles) => {
      if (!propertyId) return;

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const uploadedUrls = [];
        const totalFiles = acceptedFiles.length;

        for (let i = 0; i < acceptedFiles.length; i++) {
          const file = acceptedFiles[i];
          const fileExt = file.name.split(".").pop();
          const fileName = `${propertyId}/${crypto.randomUUID()}.${fileExt}`;

          const { error: uploadError, data } = await supabase.storage
            .from("property-images")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("property-images")
            .getPublicUrl(fileName);

          uploadedUrls.push(publicUrl);
          setUploadProgress(((i + 1) / totalFiles) * 100);
        }

        const { error: updateError } = await supabase
          .from("properties")
          .update({
            photos: [...(property?.photos || []), ...uploadedUrls],
          })
          .eq("id", propertyId);

        if (updateError) throw updateError;

        refetch();
        toast.success("Images téléchargées avec succès");
      } catch (error) {
        console.error("Error uploading images:", error);
        toast.error("Erreur lors du téléchargement des images");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        if (rejection.errors[0].code === "file-too-large") {
          toast.error(`${rejection.file.name} dépasse la taille maximale de 5MB`);
        } else {
          toast.error(`${rejection.file.name} : format non supporté`);
        }
      });
    },
  });

  const handleSetMainImage = async (imageUrl: string) => {
    if (!property?.photos) return;

    const newPhotos = property.photos.filter((url) => url !== imageUrl);
    newPhotos.unshift(imageUrl);

    try {
      const { error } = await supabase
        .from("properties")
        .update({ photos: newPhotos })
        .eq("id", propertyId);

      if (error) throw error;
      refetch();
      toast.success("Image principale définie avec succès");
    } catch (error) {
      console.error("Error setting main image:", error);
      toast.error("Erreur lors de la définition de l'image principale");
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!property?.photos) return;

    try {
      const newPhotos = property.photos.filter((url) => url !== imageUrl);
      const { error } = await supabase
        .from("properties")
        .update({ photos: newPhotos })
        .eq("id", propertyId);

      if (error) throw error;
      refetch();
      toast.success("Image supprimée avec succès");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Erreur lors de la suppression de l'image");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/${slug}/properties/${propertyId}`)}
          className="mb-4"
          style={{ color: agency?.primary_color }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au bien
        </Button>
        <h1 className="text-3xl font-bold mb-2">Gestion des images</h1>
        <p className="text-muted-foreground">
          {property?.title || "Chargement..."}
        </p>
      </div>

      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-lg p-8 mb-8 text-center cursor-pointer hover:border-primary transition-colors"
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Glissez-déposez vos images ici, ou cliquez pour sélectionner
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Formats acceptés : JPG, PNG, WebP (max 5MB)
        </p>
      </div>

      {isUploading && (
        <div className="mb-8">
          <Progress value={uploadProgress} className="mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            Téléchargement en cours... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="images">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {property?.photos?.map((url, index) => (
                <Draggable key={url} draggableId={url} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="relative group aspect-[4/3] rounded-lg overflow-hidden border"
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="absolute top-2 left-2 z-10 opacity-50 group-hover:opacity-100 transition-opacity cursor-move"
                      >
                        <GripVertical className="h-5 w-5 text-white drop-shadow-md" />
                      </div>
                      <img
                        src={url}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:text-yellow-400 transition-colors"
                          onClick={() => handleSetMainImage(url)}
                        >
                          <Star
                            className={`h-5 w-5 ${
                              index === 0 ? "fill-yellow-400" : ""
                            }`}
                          />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:text-red-400 transition-colors"
                          onClick={() => handleDeleteImage(url)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
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