import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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