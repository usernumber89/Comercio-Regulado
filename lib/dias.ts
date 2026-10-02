import type { DiaSemana } from "@/types";

/** Días de la semana, en el orden en que se muestran en la ficha. */
export const DIAS: { id: DiaSemana; etiqueta: string; nombre: string }[] = [
  { id: "lun", etiqueta: "Lun", nombre: "Lunes" },
  { id: "mar", etiqueta: "Mar", nombre: "Martes" },
  { id: "mie", etiqueta: "Mié", nombre: "Miércoles" },
  { id: "jue", etiqueta: "Jue", nombre: "Jueves" },
  { id: "vie", etiqueta: "Vie", nombre: "Viernes" },
  { id: "sab", etiqueta: "Sáb", nombre: "Sábado" },
  { id: "dom", etiqueta: "Dom", nombre: "Domingo" },
];
