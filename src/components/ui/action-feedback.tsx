import { Alert } from "@/components/ui/alert";
import type { ActionState } from "@/lib/forms";

/** Server action sonucunu tek biçimde gösterir. */
export function ActionFeedback({ state }: { state: ActionState }) {
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.success) return <Alert tone="success">{state.success}</Alert>;
  return null;
}
