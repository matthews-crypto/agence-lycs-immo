import { useState } from "react"
import { AgencyRegistrationDialog } from "@/components/agency-registration/AgencyRegistrationDialog"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"

export default function IndexPage() {
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-10 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Bienvenue sur notre plateforme</h1>
          <p className="text-muted-foreground">
            Inscrivez votre agence immobilière et commencez à gérer vos biens
          </p>
          <Button 
            onClick={() => setShowRegistrationDialog(true)}
            style={{
              backgroundColor: '#aa1ca0',
            }}
          >
            Inscrire mon agence
          </Button>
        </div>

        <div className="py-10">
          <Carousel className="w-full max-w-xs mx-auto">
            <CarouselContent>
              {Array.from({ length: 5 }).map((_, index) => (
                <CarouselItem key={index}>
                  <Card>
                    <CardContent className="flex aspect-square items-center justify-center p-6">
                      <span className="text-4xl font-semibold">{index + 1}</span>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>

      <AgencyRegistrationDialog
        open={showRegistrationDialog}
        onOpenChange={setShowRegistrationDialog}
      />
    </div>
  )
}