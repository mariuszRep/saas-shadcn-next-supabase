-- Migration: Permission-based RLS policies for workspaces table
-- Replaces basic authenticated_access_workspaces policy with granular CRUD policies
-- that check the permissions table via has_permission function

-- ============================================================================
-- DROP EXISTING BASIC POLICY
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_access_workspaces" ON public.workspaces;

-- ============================================================================
-- CREATE GRANULAR PERMISSION-BASED POLICIES
-- ============================================================================

-- INSERT: Users can create workspaces if they have create permission on the workspace object within the organization
-- The assign_ownership trigger will automatically grant owner role to the creator
CREATE POLICY "workspaces_insert_policy"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_permission('workspace', 'insert', organization_id, id)
);

-- SELECT: Users can only see workspaces where they have read permission
-- The org_id is the workspace's organization_id, row_id is the workspace's id
CREATE POLICY "workspaces_select_policy"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  public.has_permission('workspace', 'select', organization_id, id)
);

-- UPDATE: Users can only update workspaces where they have update permission
CREATE POLICY "workspaces_update_policy"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (public.has_permission('workspace', 'update', organization_id, id))
WITH CHECK (public.has_permission('workspace', 'update', organization_id, id));

-- DELETE: Users can only delete workspaces where they have delete permission
CREATE POLICY "workspaces_delete_policy"
ON public.workspaces
FOR DELETE
TO authenticated
USING (public.has_permission('workspace', 'delete', organization_id, id));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "workspaces_insert_policy" ON public.workspaces IS
  'Allow users with create permission on workspace object type within organization. Owner role assigned via trigger.';

COMMENT ON POLICY "workspaces_select_policy" ON public.workspaces IS
  'Filter workspaces based on read permission in permissions table.';

COMMENT ON POLICY "workspaces_update_policy" ON public.workspaces IS
  'Allow updates only for users with update permission on the workspace.';

COMMENT ON POLICY "workspaces_delete_policy" ON public.workspaces IS
  'Allow deletion only for users with delete permission on the workspace.';
