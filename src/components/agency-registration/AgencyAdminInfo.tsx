import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export function AgencyAdminInfo() {
  const { control } = useFormContext()

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="first_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Prénom *</FormLabel>
            <FormControl>
              <Input placeholder="John" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="last_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom *</FormLabel>
            <FormControl>
              <Input placeholder="Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="admin_email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email personnelle *</FormLabel>
            <FormControl>
              <Input type="email" placeholder="john.doe@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="admin_phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Téléphone personnelle *</FormLabel>
            <FormControl>
              <Input placeholder="771234567" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="admin_license"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Matricule agent *</FormLabel>
            <FormControl>
              <Input placeholder="12345" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}