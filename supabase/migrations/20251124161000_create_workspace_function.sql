-- Migration: SECURITY DEFINER function for workspace creation
-- Bypasses RLS to allow INSERT with RETURNING (trigger runs after)
-- Ensures users can create workspaces and get ownership assigned via trigger

CREATE OR REPLACE FUNCTION public.create_workspace(workspace_name text, org_id uuid)
RETURNS TABLE (id uuid, name text, organization_id uuid, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_workspace record;
BEGIN
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate workspace name
  IF workspace_name IS NULL OR trim(workspace_name) = '' THEN
    RAISE EXCEPTION 'Workspace name is required';
  END IF;

  IF length(trim(workspace_name)) > 100 THEN
    RAISE EXCEPTION 'Workspace name must be less than 100 characters';
  END IF;

  -- Validate organization exists
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID is required';
  END IF;

  -- Verify organization exists and user has permission
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = org_id
    AND public.has_permission('organization', 'select', o.id, o.id)
  ) THEN
    RAISE EXCEPTION 'Organization not found or access denied';
  END IF;

  -- Insert workspace (trigger will assign ownership)
  INSERT INTO public.workspaces (name, organization_id, created_by, updated_by)
  VALUES (trim(workspace_name), org_id, auth.uid(), auth.uid())
  RETURNING workspaces.id, workspaces.name, workspaces.organization_id, workspaces.created_at
  INTO new_workspace;

  RETURN QUERY SELECT new_workspace.id, new_workspace.name, new_workspace.organization_id, new_workspace.created_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_workspace(text, uuid) TO authenticated;

COMMENT ON FUNCTION public.create_workspace(text, uuid) IS
  'Creates a workspace with SECURITY DEFINER to bypass RLS. Ownership assigned via trigger. User must have access to the organization.';
