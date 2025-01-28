import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface RejectionReasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  isSubmitting?: boolean
}

export function RejectionReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting
}: RejectionReasonDialogProps) {
  const [reason, setReason] = useState("")

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Motif du rejet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Veuillez saisir le motif du rejet..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!reason.trim() || isSubmitting}
            >
              Confirmer le rejet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}