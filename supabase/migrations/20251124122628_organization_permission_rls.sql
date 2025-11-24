-- Migration: Permission-based RLS policies for organizations table
-- Replaces basic authenticated_access_organizations policy with granular CRUD policies
-- that check the permissions table via has_permission function

-- ============================================================================
-- DROP EXISTING BASIC POLICY
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_access_organizations" ON public.organizations;

-- ============================================================================
-- CREATE GRANULAR PERMISSION-BASED POLICIES
-- ============================================================================

-- INSERT: Any authenticated user can create an organization
-- The assign_ownership trigger will automatically grant owner role to the creator
CREATE POLICY "organizations_insert_policy"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- SELECT: Users can only see organizations where they have read permission
-- For organizations, the org_id equals the organization's own id (top-level entity)
CREATE POLICY "organizations_select_policy"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  public.has_permission('organization', 'select', id, id)
);

-- UPDATE: Users can only update organizations where they have update permission
CREATE POLICY "organizations_update_policy"
ON public.organizations
FOR UPDATE
TO authenticated
USING (public.has_permission('organization', 'update', id, id))
WITH CHECK (public.has_permission('organization', 'update', id, id));

-- DELETE: Users can only delete organizations where they have delete permission
CREATE POLICY "organizations_delete_policy"
ON public.organizations
FOR DELETE
TO authenticated
USING (public.has_permission('organization', 'delete', id, id));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "organizations_insert_policy" ON public.organizations IS
  'Allow any authenticated user to create organizations. Owner role assigned via trigger.';

COMMENT ON POLICY "organizations_select_policy" ON public.organizations IS
  'Filter organizations based on read permission in permissions table.';

COMMENT ON POLICY "organizations_update_policy" ON public.organizations IS
  'Allow updates only for users with update permission on the organization.';

COMMENT ON POLICY "organizations_delete_policy" ON public.organizations IS
  'Allow deletion only for users with delete permission on the organization.';
