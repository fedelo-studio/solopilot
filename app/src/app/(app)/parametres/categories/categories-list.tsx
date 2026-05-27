"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExpenseCategory } from "@/types/domain";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/categories";

const DEFAULT_COLORS = [
  "#ff4a1c", // Fedelo hot
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#6b7280",
];

interface Props {
  categories: ExpenseCategory[];
}

export function CategoriesList({ categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<ExpenseCategory | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createCategory({ name: newName.trim(), color: newColor });
      if (result.ok) {
        setNewName("");
        setNewColor(DEFAULT_COLORS[0]);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function startEdit(cat: ExpenseCategory) {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setEditingColor(cat.color);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
    setEditingColor("");
  }

  function handleUpdate(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateCategory({ id, name: editingName.trim(), color: editingColor });
      if (result.ok) {
        cancelEdit();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!confirmDelete) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(confirmDelete.id);
      if (result.ok) {
        setConfirmDelete(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle catégorie</CardTitle>
          <CardDescription>
            Couleur utilisée dans les rapports et sur les pastilles de la liste des dépenses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium">Nom</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ex. Outils & logiciels"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Couleur</label>
              <ColorSwatches value={newColor} onChange={setNewColor} />
            </div>
            <Button type="submit" disabled={pending || !newName.trim()}>
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catégories existantes</CardTitle>
          <CardDescription>
            {categories.length} catégorie{categories.length > 1 ? "s" : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border/70">
          {categories.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Aucune catégorie pour l&apos;instant.</p>
          ) : (
            categories.map((cat) => {
              const isEditing = editingId === cat.id;
              return (
                <div key={cat.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {isEditing ? (
                    <>
                      <ColorSwatches value={editingColor} onChange={setEditingColor} />
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleUpdate(cat.id)}
                        disabled={pending || !editingName.trim()}
                        aria-label="Enregistrer"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancelEdit} aria-label="Annuler">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="flex-1 text-sm">{cat.name}</span>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">
                        {cat.color}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEdit(cat)}
                        aria-label="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setConfirmDelete(cat)}
                        className="text-danger hover:bg-danger-soft hover:text-danger"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Dialog open={confirmDelete !== null} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la catégorie ?</DialogTitle>
            <DialogDescription>
              &quot;{confirmDelete?.name}&quot; sera supprimée. Les dépenses liées garderont la couleur &quot;À
              catégoriser&quot;. Les budgets de cette catégorie seront supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)} disabled={pending}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ColorSwatches({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      {DEFAULT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`h-6 w-6 rounded-full border-2 transition-transform ${
            value === c ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
          }`}
          style={{ backgroundColor: c }}
          aria-label={`Couleur ${c}`}
        />
      ))}
    </div>
  );
}
