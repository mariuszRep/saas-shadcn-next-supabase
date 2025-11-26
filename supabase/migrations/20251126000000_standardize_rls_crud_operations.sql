-- ============================================================================
-- STANDARDIZE RLS POLICIES TO USE CRUD OPERATIONS
-- ============================================================================
-- This migration standardizes all RLS policies to use CRUD terminology
-- (create, read, update, delete) instead of SQL operations
-- (select, insert, update, delete) for consistency across the codebase.
--
-- The has_permission() function already handles the mapping:
-- - 'select' → 'read'
-- - 'insert' → 'create'
-- - 'update' → 'update' (unchanged)
-- - 'delete' → 'delete' (unchanged)
-- ============================================================================

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

-- Organizations policies
DROP POLICY IF EXISTS "authenticated_access_organizations" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON public.organizations;

-- Workspaces policies
DROP POLICY IF EXISTS "authenticated_access_workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert_policy" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_select_policy" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update_policy" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete_policy" ON public.workspaces;

-- ============================================================================
-- ORGANIZATIONS: CRUD-BASED POLICIES
-- ============================================================================

-- READ (SELECT): Users can read organizations where they have 'read' permission
CREATE POLICY "organizations_read_policy"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  public.has_permission('organization', 'read', id, id)
);

-- CREATE (INSERT): Any authenticated user can create an organization
-- The assign_ownership trigger will automatically grant owner role to the creator
CREATE POLICY "organizations_create_policy"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Users can update organizations where they have 'update' permission
CREATE POLICY "organizations_update_policy"
ON public.organizations
FOR UPDATE
TO authenticated
USING (public.has_permission('organization', 'update', id, id))
WITH CHECK (public.has_permission('organization', 'update', id, id));

-- DELETE: Users can delete organizations where they have 'delete' permission
CREATE POLICY "organizations_delete_policy"
ON public.organizations
FOR DELETE
TO authenticated
USING (public.has_permission('organization', 'delete', id, id));

-- ============================================================================
-- WORKSPACES: CRUD-BASED POLICIES
-- ============================================================================

-- READ (SELECT): Users can read workspaces where they have 'read' permission
CREATE POLICY "workspaces_read_policy"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  public.has_permission('workspace', 'read', organization_id, id)
);

-- CREATE (INSERT): Users can create workspaces if they have 'create' permission
-- Check organization-level workspace create permission
CREATE POLICY "workspaces_create_policy"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_permission('workspace', 'create', organization_id, NULL)
);

-- UPDATE: Users can update workspaces where they have 'update' permission
CREATE POLICY "workspaces_update_policy"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (public.has_permission('workspace', 'update', organization_id, id))
WITH CHECK (public.has_permission('workspace', 'update', organization_id, id));

-- DELETE: Users can delete workspaces where they have 'delete' permission
CREATE POLICY "workspaces_delete_policy"
ON public.workspaces
FOR DELETE
TO authenticated
USING (public.has_permission('workspace', 'delete', organization_id, id));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "organizations_read_policy" ON public.organizations IS
'Users can read organizations where they have read permission. Uses CRUD terminology.';

COMMENT ON POLICY "organizations_create_policy" ON public.organizations IS
'Any authenticated user can create organizations. Ownership assigned via trigger.';

COMMENT ON POLICY "organizations_update_policy" ON public.organizations IS
'Users can update organizations where they have update permission. Uses CRUD terminology.';

COMMENT ON POLICY "organizations_delete_policy" ON public.organizations IS
'Users can delete organizations where they have delete permission. Uses CRUD terminology.';

COMMENT ON POLICY "workspaces_read_policy" ON public.workspaces IS
'Users can read workspaces where they have read permission. Uses CRUD terminology.';

COMMENT ON POLICY "workspaces_create_policy" ON public.workspaces IS
'Users can create workspaces if they have organization-level create permission. Uses CRUD terminology.';

COMMENT ON POLICY "workspaces_update_policy" ON public.workspaces IS
'Users can update workspaces where they have update permission. Uses CRUD terminology.';

COMMENT ON POLICY "workspaces_delete_policy" ON public.workspaces IS
'Users can delete workspaces where they have delete permission. Uses CRUD terminology.';
