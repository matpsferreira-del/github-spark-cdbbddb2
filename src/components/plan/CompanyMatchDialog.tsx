import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Company } from "@/types/mentorship";

interface Props {
  open: boolean;
  contactCompanyName: string;
  matchedCompany: Company | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CompanyMatchDialog({ open, contactCompanyName, matchedCompany, onConfirm, onCancel }: Props) {
  if (!matchedCompany) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Empresa identificada</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          O contato informou a empresa <strong className="text-foreground">"{contactCompanyName}"</strong>.
          Identificamos que pode ser a empresa <strong className="text-foreground">"{matchedCompany.name}"</strong> (Tier {matchedCompany.tier}).
        </p>
        <p className="text-muted-foreground text-sm">
          Deseja vincular este contato à empresa <strong className="text-foreground">{matchedCompany.name}</strong>?
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Não, manter como está</Button>
          <Button onClick={onConfirm}>Sim, vincular</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
