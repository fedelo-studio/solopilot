"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectDetailTabsProps {
  overview: ReactNode;
  tasks: ReactNode;
}

/** Splits the project detail page into "Aperçu" (unchanged financial
 *  dashboard) and "Tâches" (new kanban + time tracking) without disrupting
 *  either — both are rendered server-side and passed through as children. */
export function ProjectDetailTabs({ overview, tasks }: ProjectDetailTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Aperçu</TabsTrigger>
        <TabsTrigger value="tasks">Tâches</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">{overview}</TabsContent>
      <TabsContent value="tasks">{tasks}</TabsContent>
    </Tabs>
  );
}
