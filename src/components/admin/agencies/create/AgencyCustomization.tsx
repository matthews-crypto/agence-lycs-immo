import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export function AgencyCustomization() {
  const { control, watch } = useFormContext()
  const [uploading, setUploading] = useState(false)
  const primaryColor = watch("primary_color")
  const secondaryColor = watch("secondary_color")
  const logoUrl = watch("logo_url")

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.match(/^image\/(jpeg|png)$/)) {
        throw new Error("Format de fichier invalide. Utilisez PNG ou JPG.")
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Le fichier est trop volumineux (max 2MB)")
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from("agency-logos")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("agency-logos").getPublicUrl(filePath)

      control._formValues.logo_url = publicUrl
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      <FormField
        control={control}
        name="logo_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Logo</FormLabel>
            <FormControl>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="w-32 h-32 object-contain"
                  />
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <FormField
          control={control}
          name="primary_color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Couleur principale</FormLabel>
              <FormControl>
                <Input
                  type="color"
                  className="h-12 w-full cursor-pointer"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="secondary_color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Couleur secondaire</FormLabel>
              <FormControl>
                <Input
                  type="color"
                  className="h-12 w-full cursor-pointer"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Prévisualisation</h3>
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: secondaryColor }}
          >
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo preview"
                className="w-16 h-16 object-contain mb-2"
              />
            )}
            <div className="text-white font-semibold">Exemple de carte</div>
          </div>
        </div>
      </Card>
    </div>
  )
}