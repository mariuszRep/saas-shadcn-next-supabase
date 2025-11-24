-- Enable Row Level Security on all public schema tables
-- This migration establishes the security baseline by requiring authentication
-- for all table access while maintaining service_role bypass capabilities

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BASIC AUTHENTICATION POLICIES
-- These policies require users to be authenticated (auth.uid() IS NOT NULL)
-- to access any data. Service role automatically bypasses RLS.
-- ============================================================================

-- Organizations: Authenticated users can access organizations
-- Note: More granular policies will be added in subsequent migrations
CREATE POLICY "authenticated_access_organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Workspaces: Authenticated users can access workspaces
CREATE POLICY "authenticated_access_workspaces"
ON public.workspaces
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Permissions: Authenticated users can access permissions
-- Required for users_permissions view to function correctly
CREATE POLICY "authenticated_access_permissions"
ON public.permissions
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Roles: Authenticated users can access roles
-- Required for users_permissions view to function correctly
CREATE POLICY "authenticated_access_roles"
ON public.roles
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Invitations: Authenticated users can access invitations
CREATE POLICY "authenticated_access_invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "authenticated_access_organizations" ON public.organizations IS
  'Basic auth policy: Requires authenticated user. More granular policies to follow.';

COMMENT ON POLICY "authenticated_access_workspaces" ON public.workspaces IS
  'Basic auth policy: Requires authenticated user. More granular policies to follow.';

COMMENT ON POLICY "authenticated_access_permissions" ON public.permissions IS
  'Basic auth policy: Requires authenticated user. Enables users_permissions view access.';

COMMENT ON POLICY "authenticated_access_roles" ON public.roles IS
  'Basic auth policy: Requires authenticated user. Enables users_permissions view access.';

COMMENT ON POLICY "authenticated_access_invitations" ON public.invitations IS
  'Basic auth policy: Requires authenticated user. More granular policies to follow.';
