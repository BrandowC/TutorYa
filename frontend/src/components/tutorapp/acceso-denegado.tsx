import Link from "next/link";

import { ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

/** Se muestra cuando el rol del usuario no permite entrar a la sección (SWR-AUTH-004). */
export function AccesoDenegado({ detalle }: { detalle: string }) {
  return (
    <Empty className="bg-card rounded-xl border py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldX />
        </EmptyMedia>
        <EmptyTitle>No tienes permiso para ver esta sección</EmptyTitle>
        <EmptyDescription>{detalle}</EmptyDescription>
      </EmptyHeader>
      <Button asChild>
        <Link href="/dashboard">Volver al panel</Link>
      </Button>
    </Empty>
  );
}
