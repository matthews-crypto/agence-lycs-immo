import { useFormContext, useWatch } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useEffect } from "react"

interface AgencyBasicInfoProps {
  isPublicRegistration?: boolean;
}

export function AgencyBasicInfo({ isPublicRegistration = false }: AgencyBasicInfoProps) {
  const { control, setValue } = useFormContext()
  
  const agencyName = useWatch({
    control,
    name: "agency_name"
  });

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')     // Replace special chars with hyphens
      .replace(/^-+|-+$/g, '')         // Remove leading/trailing hyphens
  }

  useEffect(() => {
    if (agencyName) {
      setValue('slug', generateSlug(agencyName), { 
        shouldValidate: true,
        shouldDirty: true 
      });
    }
  }, [agencyName, setValue]);

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
            <FormLabel>NINEA ou RCC *</FormLabel>
            <FormControl>
              <Input placeholder="Entrez votre NINEA ou RCC" {...field} />
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
            <FormLabel>URL *</FormLabel>
            <FormControl>
              <div className="flex items-center w-full relative">
                <div className="absolute left-3 text-gray-500 pointer-events-none">
                  https://{window.location.hostname}/ 
                </div>
                <Input 
                  placeholder="mon-agence"
                  {...field}
                  className="pl-[calc(7px+7ch+var(--hostname-length))]" 
                  style={{
                    '--hostname-length': `${window.location.hostname.length}ch`
                  } as React.CSSProperties}
                  onChange={(e) => {
                    const value = generateSlug(e.target.value);
                    field.onChange(value);
                  }}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}