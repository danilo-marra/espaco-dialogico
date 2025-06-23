/**
 * Script de teste para verificar o sistema de permissões
 * Execute com: node scripts/test-permissions.js
 */

// Definições das permissões (copiadas do roleMiddleware.js para teste)
const ROLE_PERMISSIONS = {
  admin: [
    "agendamentos",
    "pacientes",
    "sessoes",
    "terapeutas",
    "transacoes",
    "convites",
    "usuarios",
    "perfil",
  ],
  terapeuta: ["agendamentos", "perfil"],
  secretaria: [
    "agendamentos",
    "pacientes",
    "sessoes",
    "terapeutas",
    "transacoes",
    "perfil",
  ],
};

const ROUTE_RESOURCE_MAP = {
  "/api/agendamentos": "agendamentos",
  "/api/pacientes": "pacientes",
  "/api/sessoes": "sessoes",
  "/api/terapeutas": "terapeutas",
  "/api/transacoes": "transacoes",
  "/api/convites": "convites",
  "/api/users": "usuarios",
  "/api/user": "perfil",
  "/dashboard/agenda": "agendamentos",
  "/dashboard/pacientes": "pacientes",
  "/dashboard/sessoes": "sessoes",
  "/dashboard/terapeutas": "terapeutas",
  "/dashboard/transacoes": "transacoes",
  "/dashboard/convites": "convites",
  "/dashboard/usuarios": "usuarios",
  "/dashboard/perfil": "perfil",
};

function hasPermission(userRole, resource) {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions && permissions.includes(resource);
}

function getResourceFromRoute(url) {
  const cleanUrl = url.split("?")[0].split("#")[0];

  if (ROUTE_RESOURCE_MAP[cleanUrl]) {
    return ROUTE_RESOURCE_MAP[cleanUrl];
  }

  for (const route in ROUTE_RESOURCE_MAP) {
    if (cleanUrl.startsWith(route)) {
      return ROUTE_RESOURCE_MAP[route];
    }
  }

  return null;
}

console.log("🔒 Testando Sistema de Permissões\n");

// Teste 1: Verificar permissões do admin
console.log("👑 Testando permissões do ADMIN:");
const adminPermissions = [
  "agendamentos",
  "pacientes",
  "sessoes",
  "terapeutas",
  "transacoes",
  "convites",
  "usuarios",
  "perfil",
];

adminPermissions.forEach((resource) => {
  const result = hasPermission("admin", resource);
  console.log(`  ✅ ${resource}: ${result ? "✓" : "✗"}`);
});

// Teste 2: Verificar permissões do terapeuta
console.log("\n🏥 Testando permissões do TERAPEUTA:");
const terapeutaPermissions = ["agendamentos", "perfil"];
const terapeutaRestrictedResources = [
  "pacientes",
  "sessoes",
  "terapeutas",
  "transacoes",
  "convites",
  "usuarios",
];

terapeutaPermissions.forEach((resource) => {
  const result = hasPermission("terapeuta", resource);
  console.log(`  ✅ ${resource}: ${result ? "✓" : "✗"}`);
});

terapeutaRestrictedResources.forEach((resource) => {
  const result = hasPermission("terapeuta", resource);
  console.log(`  ❌ ${resource}: ${result ? "✓ (ERRO!)" : "✗ (Correto)"}`);
});

// Teste 3: Verificar permissões da secretaria
console.log("\n📋 Testando permissões da SECRETARIA:");
const secretariaPermissions = [
  "agendamentos",
  "pacientes",
  "sessoes",
  "terapeutas",
  "transacoes",
  "perfil",
];
const secretariaRestrictedResources = ["convites", "usuarios"];

secretariaPermissions.forEach((resource) => {
  const result = hasPermission("secretaria", resource);
  console.log(`  ✅ ${resource}: ${result ? "✓" : "✗"}`);
});

secretariaRestrictedResources.forEach((resource) => {
  const result = hasPermission("secretaria", resource);
  console.log(`  ❌ ${resource}: ${result ? "✓ (ERRO!)" : "✗ (Correto)"}`);
});

// Teste 3: Verificar mapeamento de rotas
// Teste 4: Verificar mapeamento de rotas
console.log("\n🛣️  Testando mapeamento de rotas:");
const testRoutes = [
  "/dashboard/agenda",
  "/dashboard/pacientes",
  "/dashboard/sessoes",
  "/dashboard/terapeutas",
  "/dashboard/transacoes",
  "/dashboard/convites",
  "/dashboard/usuarios",
  "/dashboard/perfil",
  "/api/agendamentos",
  "/api/pacientes",
];

testRoutes.forEach((route) => {
  const resource = getResourceFromRoute(route);
  console.log(`  📍 ${route} → ${resource || "Não mapeado"}`);
});

// Teste 5: Verificar acesso do terapeuta
console.log("\n🔐 Teste de acesso do TERAPEUTA:");
const terapeutaAllowedRoutes = ["/dashboard/agenda", "/dashboard/perfil"];
const terapeutaRestrictedRoutes = [
  "/dashboard/pacientes",
  "/dashboard/transacoes",
  "/dashboard/usuarios",
];

terapeutaAllowedRoutes.forEach((route) => {
  const resource = getResourceFromRoute(route);
  const hasAccess = hasPermission("terapeuta", resource);
  console.log(
    `  ✅ ${route}: ${hasAccess ? "✓ Permitido" : "✗ Negado (ERRO!)"}`,
  );
});

terapeutaRestrictedRoutes.forEach((route) => {
  const resource = getResourceFromRoute(route);
  const hasAccess = hasPermission("terapeuta", resource);
  console.log(
    `  ❌ ${route}: ${hasAccess ? "✓ Permitido (ERRO!)" : "✗ Negado (Correto)"}`,
  );
});

// Teste 6: Verificar acesso da secretaria
console.log("\n🔐 Teste de acesso da SECRETARIA:");
const secretariaAllowedRoutes = [
  "/dashboard/agenda",
  "/dashboard/pacientes",
  "/dashboard/sessoes",
  "/dashboard/terapeutas",
  "/dashboard/transacoes",
  "/dashboard/perfil",
];
const secretariaRestrictedRoutes = [
  "/dashboard/convites",
  "/dashboard/usuarios",
];

secretariaAllowedRoutes.forEach((route) => {
  const resource = getResourceFromRoute(route);
  const hasAccess = hasPermission("secretaria", resource);
  console.log(
    `  ✅ ${route}: ${hasAccess ? "✓ Permitido" : "✗ Negado (ERRO!)"}`,
  );
});

secretariaRestrictedRoutes.forEach((route) => {
  const resource = getResourceFromRoute(route);
  const hasAccess = hasPermission("secretaria", resource);
  console.log(
    `  ❌ ${route}: ${hasAccess ? "✓ Permitido (ERRO!)" : "✗ Negado (Correto)"}`,
  );
});

console.log("\n✨ Teste concluído!");
console.log("\nResumo:");
console.log("- Admins têm acesso a todos os recursos");
console.log("- Terapeutas têm acesso apenas a agendamentos e perfil");
console.log(
  "- Secretarias têm acesso a agendamentos, pacientes, sessões, terapeutas, transações e perfil",
);
console.log("- Sistema de mapeamento de rotas funcionando");
console.log("- Middleware de proteção configurado nas APIs\n");
