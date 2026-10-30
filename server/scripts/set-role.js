import {
  assertFirebaseConfiguration,
  getFirebaseAuth,
} from "../src/config/firebase.js";
import { logger } from "../src/utils/logger.js";

const ALLOWED_ROLES = new Set(["admin", "cashier"]);
const [email, role] = process.argv.slice(2);

async function main() {
  if (!email || !role) {
    console.error(
      "Uso: npm run set-role -- usuario@ejemplo.com <admin|cashier>"
    );
    process.exit(1);
  }

  if (!ALLOWED_ROLES.has(role)) {
    console.error(`Rol inválido: ${role}. Usa admin o cashier.`);
    process.exit(1);
  }

  assertFirebaseConfiguration();
  const auth = getFirebaseAuth();
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { role });

  logger.info(
    { uid: user.uid, email: user.email, role },
    "Rol asignado. El usuario debe volver a iniciar sesión."
  );
}

main().catch((error) => {
  logger.fatal({ err: error }, "No se pudo asignar el rol");
  process.exit(1);
});
