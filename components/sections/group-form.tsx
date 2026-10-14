import { groupForm } from "@/content/site";

/** Placeholder until Phase 4 builds the form. */
export function GroupForm() {
  return (
    <div className="form glass">
      <h3 className="h3">{groupForm.title}</h3>
      <p className="muted">{groupForm.intro}</p>
    </div>
  );
}
