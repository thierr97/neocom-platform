/**
 * RBAC Permissions Configuration
 * Defines what each role can do in the system
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  COMMERCIAL = 'COMMERCIAL',
  DELIVERY = 'DELIVERY',
  CLIENT = 'CLIENT',
}

export enum Permission {
  // User management
  USER_VIEW_ALL = 'user:view:all',
  USER_VIEW_OWN = 'user:view:own',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage:roles',

  // Customer management
  CUSTOMER_VIEW_ALL = 'customer:view:all',
  CUSTOMER_VIEW_OWN = 'customer:view:own',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',
  CUSTOMER_IMPORT = 'customer:import',
  CUSTOMER_EXPORT = 'customer:export',

  // Product management
  PRODUCT_VIEW = 'product:view',
  PRODUCT_CREATE = 'product:create',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
  PRODUCT_IMPORT = 'product:import',
  PRODUCT_EXPORT = 'product:export',
  PRODUCT_MANAGE_STOCK = 'product:manage:stock',

  // Order management
  ORDER_VIEW_ALL = 'order:view:all',
  ORDER_VIEW_OWN = 'order:view:own',
  ORDER_CREATE = 'order:create',
  ORDER_UPDATE = 'order:update',
  ORDER_DELETE = 'order:delete',
  ORDER_CONFIRM = 'order:confirm',
  ORDER_SHIP = 'order:ship',
  ORDER_DELIVER = 'order:deliver',
  ORDER_CANCEL = 'order:cancel',
  ORDER_EXPORT = 'order:export',

  // Quote management
  QUOTE_VIEW_ALL = 'quote:view:all',
  QUOTE_VIEW_OWN = 'quote:view:own',
  QUOTE_CREATE = 'quote:create',
  QUOTE_UPDATE = 'quote:update',
  QUOTE_DELETE = 'quote:delete',
  QUOTE_SEND = 'quote:send',
  QUOTE_ACCEPT = 'quote:accept',
  QUOTE_REJECT = 'quote:reject',

  // Invoice management
  INVOICE_VIEW_ALL = 'invoice:view:all',
  INVOICE_VIEW_OWN = 'invoice:view:own',
  INVOICE_CREATE = 'invoice:create',
  INVOICE_UPDATE = 'invoice:update',
  INVOICE_DELETE = 'invoice:delete',
  INVOICE_SEND = 'invoice:send',
  INVOICE_MARK_PAID = 'invoice:mark:paid',

  // Payment management
  PAYMENT_VIEW_ALL = 'payment:view:all',
  PAYMENT_VIEW_OWN = 'payment:view:own',
  PAYMENT_CREATE = 'payment:create',
  PAYMENT_REFUND = 'payment:refund',

  // GPS tracking
  GPS_VIEW_ALL = 'gps:view:all',
  GPS_VIEW_OWN = 'gps:view:own',
  GPS_CREATE = 'gps:create',
  GPS_DELETE = 'gps:delete',

  // Statistics
  STATS_VIEW_ALL = 'stats:view:all',
  STATS_VIEW_OWN = 'stats:view:own',

  // Accounting
  ACCOUNTING_VIEW = 'accounting:view',
  ACCOUNTING_MANAGE = 'accounting:manage',

  // Suppliers
  SUPPLIER_VIEW = 'supplier:view',
  SUPPLIER_CREATE = 'supplier:create',
  SUPPLIER_UPDATE = 'supplier:update',
  SUPPLIER_DELETE = 'supplier:delete',

  // Settings
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_UPDATE = 'settings:update',

  // Import/Export
  IMPORT_DATA = 'import:data',
  EXPORT_DATA = 'export:data',

  // Activity logs
  ACTIVITY_VIEW_ALL = 'activity:view:all',
  ACTIVITY_VIEW_OWN = 'activity:view:own',
}

/**
 * Role to Permissions mapping
 */
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admins have ALL permissions
    ...Object.values(Permission),
  ],

  [UserRole.COMMERCIAL]: [
    // User permissions (own data only)
    Permission.USER_VIEW_OWN,

    // Customer management (own customers)
    Permission.CUSTOMER_VIEW_OWN,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_EXPORT,

    // Product management (read-only)
    Permission.PRODUCT_VIEW,

    // Order management (own orders)
    Permission.ORDER_VIEW_OWN,
    Permission.ORDER_CREATE,
    Permission.ORDER_UPDATE,
    Permission.ORDER_CONFIRM,
    Permission.ORDER_EXPORT,

    // Quote management (own quotes)
    Permission.QUOTE_VIEW_OWN,
    Permission.QUOTE_CREATE,
    Permission.QUOTE_UPDATE,
    Permission.QUOTE_SEND,
    Permission.QUOTE_ACCEPT,

    // Invoice management (own invoices)
    Permission.INVOICE_VIEW_OWN,
    Permission.INVOICE_CREATE,

    // Payment (view own)
    Permission.PAYMENT_VIEW_OWN,

    // GPS tracking
    Permission.GPS_VIEW_OWN,
    Permission.GPS_CREATE,

    // Statistics (own data)
    Permission.STATS_VIEW_OWN,

    // Activity logs (own)
    Permission.ACTIVITY_VIEW_OWN,

    // Export
    Permission.EXPORT_DATA,
  ],

  [UserRole.DELIVERY]: [
    // User permissions (own data only)
    Permission.USER_VIEW_OWN,

    // View orders assigned for delivery
    Permission.ORDER_VIEW_OWN,
    Permission.ORDER_UPDATE,
    Permission.ORDER_SHIP,
    Permission.ORDER_DELIVER,

    // GPS tracking
    Permission.GPS_VIEW_OWN,
    Permission.GPS_CREATE,

    // View customer info
    Permission.CUSTOMER_VIEW_OWN,

    // Activity logs (own)
    Permission.ACTIVITY_VIEW_OWN,
  ],

  [UserRole.CLIENT]: [
    // View own data only
    Permission.USER_VIEW_OWN,
    Permission.ORDER_VIEW_OWN,
    Permission.QUOTE_VIEW_OWN,
    Permission.QUOTE_ACCEPT,
    Permission.QUOTE_REJECT,
    Permission.INVOICE_VIEW_OWN,
    Permission.PAYMENT_VIEW_OWN,
    Permission.ACTIVITY_VIEW_OWN,
  ],
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 */
export const hasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return rolePermissions[role] || [];
};

/**
 * Get human-readable permission description
 */
export const getPermissionDescription = (permission: Permission): string => {
  const descriptions: Record<Permission, string> = {
    [Permission.USER_VIEW_ALL]: 'Voir tous les utilisateurs',
    [Permission.USER_VIEW_OWN]: 'Voir son propre profil',
    [Permission.USER_CREATE]: 'Créer des utilisateurs',
    [Permission.USER_UPDATE]: 'Modifier des utilisateurs',
    [Permission.USER_DELETE]: 'Supprimer des utilisateurs',
    [Permission.USER_MANAGE_ROLES]: 'Gérer les rôles',

    [Permission.CUSTOMER_VIEW_ALL]: 'Voir tous les clients',
    [Permission.CUSTOMER_VIEW_OWN]: 'Voir ses propres clients',
    [Permission.CUSTOMER_CREATE]: 'Créer des clients',
    [Permission.CUSTOMER_UPDATE]: 'Modifier des clients',
    [Permission.CUSTOMER_DELETE]: 'Supprimer des clients',
    [Permission.CUSTOMER_IMPORT]: 'Importer des clients',
    [Permission.CUSTOMER_EXPORT]: 'Exporter des clients',

    [Permission.PRODUCT_VIEW]: 'Voir les produits',
    [Permission.PRODUCT_CREATE]: 'Créer des produits',
    [Permission.PRODUCT_UPDATE]: 'Modifier des produits',
    [Permission.PRODUCT_DELETE]: 'Supprimer des produits',
    [Permission.PRODUCT_IMPORT]: 'Importer des produits',
    [Permission.PRODUCT_EXPORT]: 'Exporter des produits',
    [Permission.PRODUCT_MANAGE_STOCK]: 'Gérer les stocks',

    [Permission.ORDER_VIEW_ALL]: 'Voir toutes les commandes',
    [Permission.ORDER_VIEW_OWN]: 'Voir ses propres commandes',
    [Permission.ORDER_CREATE]: 'Créer des commandes',
    [Permission.ORDER_UPDATE]: 'Modifier des commandes',
    [Permission.ORDER_DELETE]: 'Supprimer des commandes',
    [Permission.ORDER_CONFIRM]: 'Confirmer des commandes',
    [Permission.ORDER_SHIP]: 'Expédier des commandes',
    [Permission.ORDER_DELIVER]: 'Livrer des commandes',
    [Permission.ORDER_CANCEL]: 'Annuler des commandes',
    [Permission.ORDER_EXPORT]: 'Exporter des commandes',

    [Permission.QUOTE_VIEW_ALL]: 'Voir tous les devis',
    [Permission.QUOTE_VIEW_OWN]: 'Voir ses propres devis',
    [Permission.QUOTE_CREATE]: 'Créer des devis',
    [Permission.QUOTE_UPDATE]: 'Modifier des devis',
    [Permission.QUOTE_DELETE]: 'Supprimer des devis',
    [Permission.QUOTE_SEND]: 'Envoyer des devis',
    [Permission.QUOTE_ACCEPT]: 'Accepter des devis',
    [Permission.QUOTE_REJECT]: 'Rejeter des devis',

    [Permission.INVOICE_VIEW_ALL]: 'Voir toutes les factures',
    [Permission.INVOICE_VIEW_OWN]: 'Voir ses propres factures',
    [Permission.INVOICE_CREATE]: 'Créer des factures',
    [Permission.INVOICE_UPDATE]: 'Modifier des factures',
    [Permission.INVOICE_DELETE]: 'Supprimer des factures',
    [Permission.INVOICE_SEND]: 'Envoyer des factures',
    [Permission.INVOICE_MARK_PAID]: 'Marquer une facture comme payée',

    [Permission.PAYMENT_VIEW_ALL]: 'Voir tous les paiements',
    [Permission.PAYMENT_VIEW_OWN]: 'Voir ses propres paiements',
    [Permission.PAYMENT_CREATE]: 'Créer des paiements',
    [Permission.PAYMENT_REFUND]: 'Effectuer des remboursements',

    [Permission.GPS_VIEW_ALL]: 'Voir tous les points GPS',
    [Permission.GPS_VIEW_OWN]: 'Voir ses propres points GPS',
    [Permission.GPS_CREATE]: 'Créer des points GPS',
    [Permission.GPS_DELETE]: 'Supprimer des points GPS',

    [Permission.STATS_VIEW_ALL]: 'Voir toutes les statistiques',
    [Permission.STATS_VIEW_OWN]: 'Voir ses propres statistiques',

    [Permission.ACCOUNTING_VIEW]: 'Voir la comptabilité',
    [Permission.ACCOUNTING_MANAGE]: 'Gérer la comptabilité',

    [Permission.SUPPLIER_VIEW]: 'Voir les fournisseurs',
    [Permission.SUPPLIER_CREATE]: 'Créer des fournisseurs',
    [Permission.SUPPLIER_UPDATE]: 'Modifier des fournisseurs',
    [Permission.SUPPLIER_DELETE]: 'Supprimer des fournisseurs',

    [Permission.SETTINGS_VIEW]: 'Voir les paramètres',
    [Permission.SETTINGS_UPDATE]: 'Modifier les paramètres',

    [Permission.IMPORT_DATA]: 'Importer des données',
    [Permission.EXPORT_DATA]: 'Exporter des données',

    [Permission.ACTIVITY_VIEW_ALL]: 'Voir tous les logs d\'activité',
    [Permission.ACTIVITY_VIEW_OWN]: 'Voir ses propres logs d\'activité',
  };

  return descriptions[permission] || permission;
};
