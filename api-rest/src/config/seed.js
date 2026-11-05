/**
 * seed.js — Semilla de datos de desarrollo.
 *
 * Se ejecuta automáticamente al iniciar el servidor (ver server.js).
 * Usa findOrCreate en todos los casos: es idempotente, nunca duplica
 * datos aunque se ejecute muchas veces.
 *
 * Las contraseñas se hashean ACÁ con src/helpers/bcrypt.js antes de
 * pasarlas al modelo (los modelos son puramente declarativos).
 */
import { User, Party, Contract } from "../models/index.js";
import { hashPassword } from "../helpers/bcrypt.js";

/**
 * Usuarios de prueba con credenciales simples de desarrollo.
 * La contraseña "123" se permite a propósito en este entorno; el seeder
 * la hashea con bcrypt antes de persistirla.
 */
const seedUsers = async () => {
  const devPassword = await hashPassword("123");

  const [admin] = await User.findOrCreate({
    where: { email: "admin@gmail.com" },
    defaults: {
      name: "Administrador Sistema",
      password: devPassword,
      role: "ADMIN",
    },
  });

  const [lawyer] = await User.findOrCreate({
    where: { email: "abogado@gmail.com" },
    defaults: {
      name: "Dra. Valeria Acosta",
      password: devPassword,
      role: "LAWYER",
      licenseNumber: "T.º 12 F.º 345",
    },
  });

  const [assistant] = await User.findOrCreate({
    where: { email: "asistente@gmail.com" },
    defaults: {
      name: "Marcos Asistente",
      password: devPassword,
      role: "ASSISTANT",
    },
  });

  return { admin, lawyer, assistant };
};

/** Partes / entidades externas reales del caso Acosta & Asociados. */
const seedParties = async () => {
  const [contractor] = await Party.findOrCreate({
    where: { taxId: "30-71234567-8" },
    defaults: {
      legalName: "Distribuidora del Litoral S.R.L.",
      entityType: "COMPANY",
      address: "Av. San Martín 1250, Rosario, Santa Fe",
      representative: "Marcos Ezequiel Ibarra, DNI 28.456.789, socio gerente",
    },
  });

  const [contractee] = await Party.findOrCreate({
    where: { taxId: "35.678.901" },
    defaults: {
      legalName: "Lucía Belén Fernández",
      entityType: "INDIVIDUAL",
      address: "Calle Mitre 845, 3.º B, Rosario, Santa Fe",
    },
  });

  const [counterparty] = await Party.findOrCreate({
    where: { taxId: "30-70987654-3" },
    defaults: {
      legalName: "Transportes Río Paraná S.A.",
      entityType: "COMPANY",
      address: "Ruta Nacional 11 km 12, Santa Fe",
      representative: "Sr. Julián Montiel (Apoderado)",
    },
  });

  return { contractor, contractee, counterparty };
};

/** Contrato de ejemplo: creado por el asistente, pendiente de revisión. */
const seedContract = async ({ contractor, contractee }, { assistant }) => {
  const title =
    "Contrato de Prestación de Servicios Profesionales — Distribuidora del Litoral S.R.L. / Lucía Belén Fernández";

  const [contract] = await Contract.findOrCreate({
    where: { title },
    defaults: {
      type: "PRESTACION_SERVICIOS",
      status: "UNDER_REVIEW",
      contractorId: contractor.id,
      contracteeId: contractee.id,
      createdById: assistant.id,
      approvedById: null,
      content: [
        "CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES",
        "",
        "Entre Distribuidora del Litoral S.R.L. (CUIT 30-71234567-8), con domicilio en Av. San Martín 1250, Rosario, Santa Fe, representada por su socio gerente Marcos Ezequiel Ibarra (DNI 28.456.789), en adelante EL CONTRATANTE; y Lucía Belén Fernández (CUIL 35.678.901), con domicilio en Calle Mitre 845, 3.º B, Rosario, Santa Fe, en adelante LA PRESTADORA; se conviene lo siguiente:",
        "",
        "PRIMERA (Objeto): LA PRESTADORA brindará servicios profesionales de consultoría logística al CONTRATANTE.",
        "SEGUNDA (Plazo): el contrato tendrá una duración de doce (12) meses desde su firma.",
        "TERCERA (Honorarios): el CONTRATANTE abonará la suma de pesos un millón quinientos mil ($1.500.000) mensuales.",
        "CUARTA (Rescisión): cualquiera de las partes podrá rescindir con preaviso de treinta (30) días.",
      ].join("\n"),
      extractedData: {
        objeto: "Servicios profesionales de consultoría logística",
        monto: 1500000,
        moneda: "ARS",
        periodicidad: "mensual",
        plazoMeses: 12,
        preavisoRescisiónDias: 30,
      },
    },
  });

  return contract;
};

/**
 * Ejecuta la semilla completa. Idempotente (findOrCreate).
 * Se llama desde server.js después de sincronizar la base de datos.
 */
export const runSeed = async () => {
  const users = await seedUsers();
  const parties = await seedParties();
  await seedContract(parties, users);

  console.log(
    "🌱 Seed completado: 3 usuarios (admin/abogado/asistente), 3 partes y 1 contrato UNDER_REVIEW.",
  );
};
