import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useEffect } from "react"
import slugify from "slugify"

interface AgencyBasicInfoProps {
  isPublicRegistration?: boolean
}

export function AgencyBasicInfo({ isPublicRegistration = false }: AgencyBasicInfoProps) {
  const { control, watch, setValue } = useFormContext()
  const agencyName = watch("agency_name")

  useEffect(() => {
    if (agencyName) {
      const slug = slugify(agencyName, {
        lower: true,
        strict: true
      })
      setValue("slug", slug)
    }
  }, [agencyName, setValue])

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

      <FormField
        control={control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Identifiant unique (slug) *</FormLabel>
            <FormControl>
              <Input 
                placeholder="mon-agence"
                {...field}
                onChange={(e) => {
                  const value = slugify(e.target.value, {
                    lower: true,
                    strict: true
                  })
                  field.onChange(value)
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {isPublicRegistration && (
        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe *</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Minimum 8 caractères"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}