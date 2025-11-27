-- Migration: SECURITY DEFINER function for organization creation
-- Bypasses RLS to allow INSERT with RETURNING (trigger runs after)

CREATE OR REPLACE FUNCTION public.create_organization(org_name text)
RETURNS TABLE (id uuid, name text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_org record;
BEGIN
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate organization name
  IF org_name IS NULL OR trim(org_name) = '' THEN
    RAISE EXCEPTION 'Organization name is required';
  END IF;

  IF length(trim(org_name)) > 100 THEN
    RAISE EXCEPTION 'Organization name must be less than 100 characters';
  END IF;

  -- Insert organization (trigger will assign ownership)
  INSERT INTO public.organizations (name, created_by, updated_by)
  VALUES (trim(org_name), auth.uid(), auth.uid())
  RETURNING organizations.id, organizations.name, organizations.created_at
  INTO new_org;

  RETURN QUERY SELECT new_org.id, new_org.name, new_org.created_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_organization(text) TO authenticated;

COMMENT ON FUNCTION public.create_organization(text) IS
  'Creates an organization with SECURITY DEFINER to bypass RLS. Ownership assigned via trigger.';
