-- Migration: Grant organization-level workspace permissions when org is created
-- This allows org owners to create workspaces without needing SECURITY DEFINER functions
-- Implements consistent permission model across all object types

-- ============================================================================
-- UPDATE assign_ownership TRIGGER
-- ============================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trg_assign_ownership_organizations ON public.organizations;
DROP TRIGGER IF EXISTS trg_assign_ownership_workspaces ON public.workspaces;
DROP FUNCTION IF EXISTS public.assign_ownership();

-- Recreate assign_ownership function with org-level workspace permissions
CREATE OR REPLACE FUNCTION public.assign_ownership()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_TABLE_NAME = 'organizations' THEN
        -- Grant owner role on the specific organization
        PERFORM public.assign_owner_role(NEW.id, NEW.created_by, 'organization', NEW.id);

        -- Grant organization-level workspace permissions (object_id=NULL)
        -- This allows org owners to create/manage ALL workspaces in their organization
        PERFORM public.assign_owner_role(NULL, NEW.created_by, 'workspace', NEW.id);

    ELSIF TG_TABLE_NAME = 'workspaces' THEN
        -- Grant owner role on the specific workspace
        PERFORM public.assign_owner_role(NEW.id, NEW.created_by, 'workspace', NEW.organization_id);
    END IF;
    RETURN NEW;
END;
$function$;

-- Recreate triggers
CREATE TRIGGER trg_assign_ownership_organizations
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.assign_ownership();

CREATE TRIGGER trg_assign_ownership_workspaces
AFTER INSERT ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.assign_ownership();

-- ============================================================================
-- UPDATE WORKSPACE INSERT POLICY
-- ============================================================================

-- Drop the existing INSERT policy that tries to check permission on new row
DROP POLICY IF EXISTS "workspaces_insert_policy" ON public.workspaces;

-- Create simplified INSERT policy that checks org-level workspace permissions
-- Users can insert workspaces if they have org-level workspace create permission
CREATE POLICY "workspaces_insert_policy"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (
  -- Check if user has organization-level workspace create permission
  EXISTS (
    SELECT 1
    FROM public.permissions p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.principal_type = 'user'
      AND p.principal_id = auth.uid()
      AND p.org_id = organization_id
      AND p.object_type = 'workspace'
      AND p.object_id IS NULL  -- Organization-level permission
      AND r.permissions ? 'create'
      AND p.deleted_at IS NULL
      AND r.deleted_at IS NULL
  )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.assign_ownership() IS
  'Assigns owner role on new organizations and workspaces. For organizations, also grants org-level workspace permissions to enable workspace creation.';

COMMENT ON POLICY "workspaces_insert_policy" ON public.workspaces IS
  'Allow users to create workspaces if they have org-level workspace create permission. Ownership assigned via trigger.';
