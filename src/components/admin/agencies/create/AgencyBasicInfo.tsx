import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useFormContext } from "react-hook-form"
import { useEffect } from "react"
import slugify from "slugify"

interface AgencyBasicInfoProps {
  showPassword?: boolean;
}

export function AgencyBasicInfo({ showPassword = false }: AgencyBasicInfoProps) {
  const { watch, setValue } = useFormContext()
  const agencyName = watch("agency_name")

  useEffect(() => {
    if (agencyName) {
      const slug = slugify(agencyName, {
        lower: true,
        strict: true,
      })
      setValue("slug", slug)
    }
  }, [agencyName, setValue])

  return (
    <div className="space-y-4">
      <FormField
        name="agency_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom de l'agence</FormLabel>
            <FormControl>
              <Input placeholder="Entrez le nom de l'agence" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="contact_email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email de contact</FormLabel>
            <FormControl>
              <Input type="email" placeholder="contact@agence.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="contact_phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Téléphone de contact</FormLabel>
            <FormControl>
              <Input placeholder="771234567" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="license_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Numéro de licence</FormLabel>
            <FormControl>
              <Input placeholder="Entrez le numéro de licence" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {showPassword && (
        <FormField
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Entrez votre mot de passe" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Slug</FormLabel>
            <FormControl>
              <Input placeholder="slug-de-lagence" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}