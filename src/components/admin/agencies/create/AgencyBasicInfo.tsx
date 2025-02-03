import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export function AgencyBasicInfo() {
  const { control } = useFormContext()

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="agency_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom de l'agence *</FormLabel>
            <FormControl>
              <Input placeholder="Mon Agence Immobilière" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Identifiant unique *</FormLabel>
            <FormControl>
              <Input 
                placeholder="mon-agence" 
                {...field} 
                onChange={(e) => {
                  // Convertir en slug valide : lowercase, remplacer espaces par tirets, enlever caractères spéciaux
                  const value = e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                  field.onChange(value);
                }}
              />
            </FormControl>
            <FormDescription>
              Cet identifiant sera utilisé dans l'URL de votre agence (ex: monsite.com/mon-agence)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="contact_email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email professionnel *</FormLabel>
            <FormControl>
              <Input type="email" placeholder="contact@monagence.fr" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="contact_phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Téléphone *</FormLabel>
            <FormControl>
              <Input placeholder="771234567" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="license_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Numéro de licence *</FormLabel>
            <FormControl>
              <Input placeholder="12345678" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}