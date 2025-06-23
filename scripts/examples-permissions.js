/**
 * Demonstração prática do sistema de permissões
 * Este arquivo mostra exemplos reais de uso
 */

console.log("📋 Exemplos de uso do sistema de permissões:");
console.log("\n1. 🔒 Proteger uma API:");
console.log('   router.use(requirePermission("pacientes"));');

console.log("\n2. 🎛️  Usar no React:");
console.log("   const { hasPermission } = usePermissions();");
console.log('   {hasPermission("pacientes") && <Component />}');

console.log("\n3. 🛡️  PermissionGuard:");
console.log('   <PermissionGuard resource="pacientes">');
console.log("     <RestrictedContent />");
console.log("   </PermissionGuard>");

console.log("\n4. 🎯 Menu dinâmico:");
console.log('   {hasPermission("usuarios") && <MenuItem />}');

console.log("\n5. 🔄 Redirecionamento:");
console.log('   if (userRole === "user") router.replace("/dashboard/agenda");');

console.log("\n✅ Sistema implementado com sucesso!");
console.log("\nResumo da implementação:");
console.log("- ✅ Middleware de permissões criado");
console.log("- ✅ Hook React para verificação de permissões");
console.log("- ✅ Componente PermissionGuard para proteção");
console.log("- ✅ RouteGuard para redirecionamento automático");
console.log("- ✅ Menu dinâmico baseado em permissões");
console.log("- ✅ APIs protegidas por role");
console.log("- ✅ Dashboard adaptado por tipo de usuário");

console.log("\n🎯 Resultado final:");
console.log("👑 ADMIN: Acesso completo ao sistema");
console.log("🏥 TERAPEUTA: Acesso apenas à agenda e perfil");
console.log(
  "📋 SECRETARIA: Acesso operacional (agenda, pacientes, sessões, terapeutas, transações, perfil)\n",
);
