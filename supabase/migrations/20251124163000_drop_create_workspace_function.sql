-- Migration: Drop create_workspace SECURITY DEFINER function
-- No longer needed since org-level workspace permissions enable direct INSERT

DROP FUNCTION IF EXISTS public.create_workspace(text, uuid);

COMMENT ON TABLE public.workspaces IS
  'Workspaces belong to organizations. Users with org-level workspace permissions can create workspaces directly via INSERT.';
