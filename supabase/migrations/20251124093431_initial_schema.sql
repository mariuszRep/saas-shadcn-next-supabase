create type "public"."invitation_status" as enum ('pending', 'accepted', 'expired');


  create table "public"."invitations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "status" public.invitation_status not null default 'pending'::public.invitation_status,
    "expires_at" timestamp with time zone not null,
    "created_by" uuid not null,
    "updated_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."organizations" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_by" uuid not null default auth.uid(),
    "updated_by" uuid not null default auth.uid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."permissions" (
    "id" uuid not null default gen_random_uuid(),
    "org_id" uuid not null,
    "principal_type" text not null,
    "principal_id" uuid not null,
    "role_id" uuid not null,
    "object_type" text not null,
    "object_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "created_by" uuid not null,
    "updated_by" uuid not null
      );



  create table "public"."roles" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "permissions" jsonb not null default '[]'::jsonb,
    "org_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "created_by" uuid,
    "updated_by" uuid
      );



  create table "public"."workspaces" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "organization_id" uuid not null,
    "created_by" uuid not null,
    "updated_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


CREATE INDEX idx_invitations_created_by ON public.invitations USING btree (created_by);

CREATE INDEX idx_invitations_status ON public.invitations USING btree (status);

CREATE INDEX idx_invitations_user_id ON public.invitations USING btree (user_id);

CREATE INDEX idx_permissions_deleted ON public.permissions USING btree (deleted_at) WHERE (deleted_at IS NULL);

CREATE INDEX idx_permissions_object ON public.permissions USING btree (object_type, object_id);

CREATE INDEX idx_permissions_object_lookup ON public.permissions USING btree (object_type, object_id, deleted_at) WHERE (deleted_at IS NULL);

CREATE INDEX idx_permissions_object_type ON public.permissions USING btree (object_type);

CREATE INDEX idx_permissions_principal ON public.permissions USING btree (principal_type, principal_id, org_id);

CREATE INDEX idx_permissions_principal_user ON public.permissions USING btree (principal_id, principal_type) WHERE ((principal_type = 'user'::text) AND (deleted_at IS NULL));

CREATE INDEX idx_permissions_role ON public.permissions USING btree (role_id);

CREATE INDEX idx_roles_deleted ON public.roles USING btree (deleted_at) WHERE (deleted_at IS NULL);

CREATE INDEX idx_roles_name ON public.roles USING btree (name);

CREATE INDEX idx_roles_org ON public.roles USING btree (org_id) WHERE (org_id IS NOT NULL);

CREATE UNIQUE INDEX invitations_pkey ON public.invitations USING btree (id);

CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

CREATE UNIQUE INDEX permissions_pkey ON public.permissions USING btree (id);

CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id);

CREATE UNIQUE INDEX uq_workspace_name_per_org ON public.workspaces USING btree (name, organization_id);

CREATE UNIQUE INDEX uq_workspace_name_per_org_case_insensitive ON public.workspaces USING btree (lower(name), organization_id);

CREATE UNIQUE INDEX workspaces_pkey ON public.workspaces USING btree (id);

alter table "public"."invitations" add constraint "invitations_pkey" PRIMARY KEY using index "invitations_pkey";

alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."permissions" add constraint "permissions_pkey" PRIMARY KEY using index "permissions_pkey";

alter table "public"."roles" add constraint "roles_pkey" PRIMARY KEY using index "roles_pkey";

alter table "public"."workspaces" add constraint "workspaces_pkey" PRIMARY KEY using index "workspaces_pkey";

alter table "public"."invitations" add constraint "invitations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."invitations" validate constraint "invitations_created_by_fkey";

alter table "public"."invitations" add constraint "invitations_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."invitations" validate constraint "invitations_updated_by_fkey";

alter table "public"."invitations" add constraint "invitations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."invitations" validate constraint "invitations_user_id_fkey";

alter table "public"."organizations" add constraint "organizations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."organizations" validate constraint "organizations_created_by_fkey";

alter table "public"."organizations" add constraint "organizations_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."organizations" validate constraint "organizations_updated_by_fkey";

alter table "public"."permissions" add constraint "chk_object_type" CHECK ((object_type = ANY (ARRAY['organization'::text, 'workspace'::text]))) not valid;

alter table "public"."permissions" validate constraint "chk_object_type";

alter table "public"."permissions" add constraint "chk_principal_type" CHECK ((principal_type = ANY (ARRAY['user'::text, 'team'::text]))) not valid;

alter table "public"."permissions" validate constraint "chk_principal_type";

alter table "public"."permissions" add constraint "permissions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."permissions" validate constraint "permissions_created_by_fkey";

alter table "public"."permissions" add constraint "permissions_org_id_fkey" FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."permissions" validate constraint "permissions_org_id_fkey";

alter table "public"."permissions" add constraint "permissions_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE not valid;

alter table "public"."permissions" validate constraint "permissions_role_id_fkey";

alter table "public"."permissions" add constraint "permissions_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."permissions" validate constraint "permissions_updated_by_fkey";

alter table "public"."roles" add constraint "chk_role_name_not_empty" CHECK ((length(TRIM(BOTH FROM name)) > 0)) not valid;

alter table "public"."roles" validate constraint "chk_role_name_not_empty";

alter table "public"."roles" add constraint "roles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."roles" validate constraint "roles_created_by_fkey";

alter table "public"."roles" add constraint "roles_org_id_fkey" FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."roles" validate constraint "roles_org_id_fkey";

alter table "public"."roles" add constraint "roles_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."roles" validate constraint "roles_updated_by_fkey";

alter table "public"."workspaces" add constraint "uq_workspace_name_per_org" UNIQUE using index "uq_workspace_name_per_org";

alter table "public"."workspaces" add constraint "workspaces_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."workspaces" validate constraint "workspaces_created_by_fkey";

alter table "public"."workspaces" add constraint "workspaces_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."workspaces" validate constraint "workspaces_organization_id_fkey";

alter table "public"."workspaces" add constraint "workspaces_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."workspaces" validate constraint "workspaces_updated_by_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.assign_owner_role(object_id_param uuid, user_id_param uuid, object_type_param text, org_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    owner_role_id UUID;
BEGIN
    -- Fetch the system-wide 'owner' role ID
    SELECT id INTO owner_role_id FROM public.roles WHERE name = 'owner' AND org_id IS NULL LIMIT 1;
    IF owner_role_id IS NULL THEN
        RAISE EXCEPTION 'Owner role not found';
    END IF;
    -- Insert permission for the owner role
    INSERT INTO public.permissions (org_id, principal_type, principal_id, role_id, object_type, object_id, created_by, updated_by)
    VALUES (org_id_param, 'user', user_id_param, owner_role_id, object_type_param, object_id_param, user_id_param, user_id_param);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.assign_ownership()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_TABLE_NAME = 'organizations' THEN
        PERFORM public.assign_owner_role(NEW.id, NEW.created_by, 'organization', NEW.id);
    ELSIF TG_TABLE_NAME = 'workspaces' THEN
        PERFORM public.assign_owner_role(NEW.id, NEW.created_by, 'workspace', NEW.organization_id);
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_organization_permissions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  BEGIN
      -- Delete all permissions associated with this organization
      DELETE FROM public.permissions
      WHERE object_type = 'organization'
        AND object_id = OLD.id;

      RETURN OLD;
  END;
  $function$
;

CREATE OR REPLACE FUNCTION public.delete_workspace_permissions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  BEGIN
      -- Delete all permissions associated with this workspace
      DELETE FROM public.permissions
      WHERE object_type = 'workspace'
        AND object_id = OLD.id;

      RETURN OLD;
  END;
  $function$
;

CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email text)
 RETURNS TABLE(id uuid, email character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Check if the executing user is a service_role (admin)
  -- We can check the role or just rely on REVOKE EXECUTE from PUBLIC

  RETURN QUERY
  SELECT au.id, au.email::varchar
  FROM auth.users au
  WHERE au.email ILIKE user_email
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_org_ids(check_user_id uuid)
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT ARRAY_AGG(DISTINCT object_id)
  FROM public.permissions
  WHERE principal_type = 'user'
    AND principal_id = check_user_id
    AND object_type = 'organization'
    AND deleted_at IS NULL
    AND object_id IS NOT NULL;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role_ids(check_user_id uuid)
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT ARRAY_AGG(DISTINCT role_id)
  FROM public.permissions
  WHERE principal_type = 'user'
    AND principal_id = check_user_id
    AND deleted_at IS NULL;
$function$
;

CREATE OR REPLACE FUNCTION public.has_permission(table_name_param text, action_param text, org_id_param uuid, row_id_param uuid DEFAULT NULL::uuid, workspace_id_param uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  permission_action TEXT;
BEGIN
  -- Map SQL actions to permission actions
  permission_action := CASE action_param
    WHEN 'select' THEN 'read'
    WHEN 'insert' THEN 'create'
    WHEN 'update' THEN 'update'
    WHEN 'delete' THEN 'delete'
    ELSE action_param
  END;

  -- Check if user has permission
  RETURN EXISTS (
    SELECT 1
    FROM public.permissions p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.principal_type = 'user'
      AND p.principal_id = auth.uid()
      AND p.org_id = org_id_param
      AND p.object_type = table_name_param
      -- Match either:
      -- 1. Table-level permission (object_id IS NULL) OR
      -- 2. Row-level permission (object_id matches row_id_param)
      AND (p.object_id IS NULL OR p.object_id = row_id_param)
      -- For workspace-scoped objects, also check workspace permission
      AND (workspace_id_param IS NULL OR p.object_type = 'workspace' AND p.object_id = workspace_id_param)
      AND r.permissions ? permission_action
      AND p.deleted_at IS NULL
      AND r.deleted_at IS NULL
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_has_role_on_object(check_user_id uuid, check_object_type text, check_object_id uuid, check_role_names text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.permissions p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.principal_type = 'user'
      AND p.principal_id = check_user_id
      AND p.object_type = check_object_type
      AND (check_object_id IS NULL OR p.object_id = check_object_id)
      AND r.name = ANY(check_role_names)
      AND p.deleted_at IS NULL
      AND r.deleted_at IS NULL
  );
$function$
;

create or replace view "public"."users" as  SELECT id,
    email,
    raw_user_meta_data
   FROM auth.users;


create or replace view "public"."users_permissions" as  SELECT DISTINCT p.org_id,
    p.object_type,
    p.object_id,
    p.principal_id AS user_id,
    p.role_id,
    r.name AS role_name,
    r.permissions AS role_permissions
   FROM (public.permissions p
     JOIN public.roles r ON ((p.role_id = r.id)))
  WHERE ((p.principal_type = 'user'::text) AND (p.deleted_at IS NULL) AND (r.deleted_at IS NULL) AND (p.object_id IS NOT NULL));


grant delete on table "public"."invitations" to "anon";

grant insert on table "public"."invitations" to "anon";

grant references on table "public"."invitations" to "anon";

grant select on table "public"."invitations" to "anon";

grant trigger on table "public"."invitations" to "anon";

grant truncate on table "public"."invitations" to "anon";

grant update on table "public"."invitations" to "anon";

grant delete on table "public"."invitations" to "authenticated";

grant insert on table "public"."invitations" to "authenticated";

grant references on table "public"."invitations" to "authenticated";

grant select on table "public"."invitations" to "authenticated";

grant trigger on table "public"."invitations" to "authenticated";

grant truncate on table "public"."invitations" to "authenticated";

grant update on table "public"."invitations" to "authenticated";

grant delete on table "public"."invitations" to "service_role";

grant insert on table "public"."invitations" to "service_role";

grant references on table "public"."invitations" to "service_role";

grant select on table "public"."invitations" to "service_role";

grant trigger on table "public"."invitations" to "service_role";

grant truncate on table "public"."invitations" to "service_role";

grant update on table "public"."invitations" to "service_role";

grant delete on table "public"."organizations" to "anon";

grant insert on table "public"."organizations" to "anon";

grant references on table "public"."organizations" to "anon";

grant select on table "public"."organizations" to "anon";

grant trigger on table "public"."organizations" to "anon";

grant truncate on table "public"."organizations" to "anon";

grant update on table "public"."organizations" to "anon";

grant delete on table "public"."organizations" to "authenticated";

grant insert on table "public"."organizations" to "authenticated";

grant references on table "public"."organizations" to "authenticated";

grant select on table "public"."organizations" to "authenticated";

grant trigger on table "public"."organizations" to "authenticated";

grant truncate on table "public"."organizations" to "authenticated";

grant update on table "public"."organizations" to "authenticated";

grant delete on table "public"."organizations" to "service_role";

grant insert on table "public"."organizations" to "service_role";

grant references on table "public"."organizations" to "service_role";

grant select on table "public"."organizations" to "service_role";

grant trigger on table "public"."organizations" to "service_role";

grant truncate on table "public"."organizations" to "service_role";

grant update on table "public"."organizations" to "service_role";

grant delete on table "public"."permissions" to "anon";

grant insert on table "public"."permissions" to "anon";

grant references on table "public"."permissions" to "anon";

grant select on table "public"."permissions" to "anon";

grant trigger on table "public"."permissions" to "anon";

grant truncate on table "public"."permissions" to "anon";

grant update on table "public"."permissions" to "anon";

grant delete on table "public"."permissions" to "authenticated";

grant insert on table "public"."permissions" to "authenticated";

grant references on table "public"."permissions" to "authenticated";

grant select on table "public"."permissions" to "authenticated";

grant trigger on table "public"."permissions" to "authenticated";

grant truncate on table "public"."permissions" to "authenticated";

grant update on table "public"."permissions" to "authenticated";

grant delete on table "public"."permissions" to "service_role";

grant insert on table "public"."permissions" to "service_role";

grant references on table "public"."permissions" to "service_role";

grant select on table "public"."permissions" to "service_role";

grant trigger on table "public"."permissions" to "service_role";

grant truncate on table "public"."permissions" to "service_role";

grant update on table "public"."permissions" to "service_role";

grant delete on table "public"."roles" to "anon";

grant insert on table "public"."roles" to "anon";

grant references on table "public"."roles" to "anon";

grant select on table "public"."roles" to "anon";

grant trigger on table "public"."roles" to "anon";

grant truncate on table "public"."roles" to "anon";

grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";

grant insert on table "public"."roles" to "authenticated";

grant references on table "public"."roles" to "authenticated";

grant select on table "public"."roles" to "authenticated";

grant trigger on table "public"."roles" to "authenticated";

grant truncate on table "public"."roles" to "authenticated";

grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."roles" to "service_role";

grant insert on table "public"."roles" to "service_role";

grant references on table "public"."roles" to "service_role";

grant select on table "public"."roles" to "service_role";

grant trigger on table "public"."roles" to "service_role";

grant truncate on table "public"."roles" to "service_role";

grant update on table "public"."roles" to "service_role";

grant delete on table "public"."workspaces" to "anon";

grant insert on table "public"."workspaces" to "anon";

grant references on table "public"."workspaces" to "anon";

grant select on table "public"."workspaces" to "anon";

grant trigger on table "public"."workspaces" to "anon";

grant truncate on table "public"."workspaces" to "anon";

grant update on table "public"."workspaces" to "anon";

grant delete on table "public"."workspaces" to "authenticated";

grant insert on table "public"."workspaces" to "authenticated";

grant references on table "public"."workspaces" to "authenticated";

grant select on table "public"."workspaces" to "authenticated";

grant trigger on table "public"."workspaces" to "authenticated";

grant truncate on table "public"."workspaces" to "authenticated";

grant update on table "public"."workspaces" to "authenticated";

grant delete on table "public"."workspaces" to "service_role";

grant insert on table "public"."workspaces" to "service_role";

grant references on table "public"."workspaces" to "service_role";

grant select on table "public"."workspaces" to "service_role";

grant trigger on table "public"."workspaces" to "service_role";

grant truncate on table "public"."workspaces" to "service_role";

grant update on table "public"."workspaces" to "service_role";

CREATE TRIGGER trg_assign_ownership_organizations AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.assign_ownership();

CREATE TRIGGER trg_delete_organization_permissions BEFORE DELETE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.delete_organization_permissions();

CREATE TRIGGER trg_assign_ownership_workspaces AFTER INSERT ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.assign_ownership();

CREATE TRIGGER trg_delete_workspace_permissions BEFORE DELETE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.delete_workspace_permissions();


-- Seed default system roles
-- These are global roles (org_id IS NULL) that can be assigned to users across organizations

-- Owner role: Full CRUD access (create, read, update, delete)
INSERT INTO public.roles (name, description, permissions, org_id, created_by, updated_by)
VALUES (
  'owner',
  'Organization owner with full administrative privileges including delete capabilities',
  '["create", "read", "update", "delete"]'::jsonb,
  NULL, -- Global role
  NULL, -- System-created
  NULL  -- System-created
)
ON CONFLICT DO NOTHING;

-- Admin role: CRU access (create, read, update) - cannot delete
INSERT INTO public.roles (name, description, permissions, org_id, created_by, updated_by)
VALUES (
  'admin',
  'Administrator with create, read, and update privileges but cannot delete resources',
  '["create", "read", "update"]'::jsonb,
  NULL, -- Global role
  NULL, -- System-created
  NULL  -- System-created
)
ON CONFLICT DO NOTHING;

-- Member role: RU access (read, update) - cannot create or delete
INSERT INTO public.roles (name, description, permissions, org_id, created_by, updated_by)
VALUES (
  'member',
  'Team member with read and update privileges but cannot create or delete resources',
  '["read", "update"]'::jsonb,
  NULL, -- Global role
  NULL, -- System-created
  NULL  -- System-created
)
ON CONFLICT DO NOTHING;

-- User role: R access (read only)
INSERT INTO public.roles (name, description, permissions, org_id, created_by, updated_by)
VALUES (
  'user',
  'Basic user with read-only access to authorized resources',
  '["read"]'::jsonb,
  NULL, -- Global role
  NULL, -- System-created
  NULL  -- System-created
)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE public.roles IS 'Roles define permission sets that can be assigned to users. Global roles (org_id IS NULL) are system-wide, while organization-specific roles are scoped to an org_id.';
