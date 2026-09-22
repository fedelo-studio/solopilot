import { UsersRound } from "lucide-react";
import { endOfWeek, format, startOfWeek } from "date-fns";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { Duration } from "@/components/shared/duration";
import { CapacityPill } from "@/components/shared/capacity-pill";
import { PersonFormDialog } from "@/components/people/person-form-dialog";
import { PersonRowActions } from "@/components/people/person-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getPeople, getTimeEntriesByPerson } from "@/lib/data";
import { capacityBand, hoursLogged } from "@/lib/finance/projects";

export default async function EquipePage() {
  const people = await getPeople();

  const weekFrom = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekTo = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const rows = await Promise.all(
    people.map(async (person) => {
      const weekEntries = await getTimeEntriesByPerson(person.id, { from: weekFrom, to: weekTo });
      return {
        person,
        hoursThisWeek: hoursLogged(weekEntries),
        band: capacityBand(person, weekEntries),
      };
    }),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Équipe"
        title="Équipe"
        description="Le roster des personnes qui suivent du temps sur tes projets — toi-même ou des sous-traitant·e·s. Pas de comptes ni de connexions créés ici."
        actions={<PersonFormDialog />}
      />

      {people.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Aucune personne dans le roster"
          description="Ajoute-toi (ou un·e sous-traitant·e) pour pouvoir suivre du temps et voir la charge de travail."
          action={<PersonFormDialog />}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead className="text-right">Tarif coût</TableHead>
              <TableHead className="text-right">Tarif facturable</TableHead>
              <TableHead className="text-right">Capacité hebdo.</TableHead>
              <TableHead className="text-right">Cette semaine</TableHead>
              <TableHead>Charge</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ person, hoursThisWeek, band }) => (
              <TableRow key={person.id}>
                <TableCell className="font-medium">
                  {person.name}
                  {!person.isActive ? (
                    <span className="ml-2 text-xs text-muted-foreground">(inactif·ve)</span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <Money amount={person.costRate} className="text-muted-foreground" />
                  <span className="text-muted-foreground">/h</span>
                </TableCell>
                <TableCell className="text-right">
                  <Money amount={person.billableRate} />
                  <span className="text-muted-foreground">/h</span>
                </TableCell>
                <TableCell className="text-right">
                  <Duration minutes={person.weeklyCapacityHours * 60} />
                </TableCell>
                <TableCell className="text-right">
                  <Duration minutes={hoursThisWeek * 60} />
                </TableCell>
                <TableCell>
                  <CapacityPill band={band} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <PersonFormDialog person={person} />
                    <PersonRowActions personId={person.id} name={person.name} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
