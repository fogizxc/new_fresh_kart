# Admin portal consolidation

The application should use **Super Admin Portal** as the single administrative entry point. The former standalone Admin Portal must not be exposed as a separate navigation option.

Administrative capabilities are grouped under Super Admin:

- Dashboard and analytics
- Product and inventory administration
- Shop management
- Staff management
- Order management
- Customer management
- System settings
- Audit logs
- Delivery pricing and operational controls
- Partner applications and credentials

Existing `admin` accounts should be migrated to `super_admin` in the authentication/database layer before deployment, or explicitly mapped to the Super Admin authorization policy. Do not rely only on hiding the navigation item for security; backend authorization must also grant the consolidated Super Admin permissions.
