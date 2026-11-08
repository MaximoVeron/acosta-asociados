/**
 * caseFiles.js — Expedientes jurídicos de demostración del estudio.
 *
 * El primero (EXP-2026-0147) es el modelo de motor-py/document/expediente_ejemplo_EXP-001.
 * Todos comparten la misma estructura para que la vista de detalle sea única.
 */

export const CASE_FILES = [
  {
    id: 'EXP-2026-0147',
    numero: 'EXP-2026-0147',
    fechaApertura: '12 de febrero de 2026',
    tipo: 'Reclamo por incumplimiento contractual',
    area: 'Derecho Comercial',
    profesional: 'Dra. Valeria Acosta',
    matricula: 'T.º 12 F.º 345',
    estado: 'En trámite',
    prioridad: 'Alta',
    caratula:
      'Distribuidora del Litoral S.R.L. c/ Transportes Río Paraná S.A. s/ incumplimiento de contrato de transporte',
    objeto:
      'Reclamo por daños y perjuicios derivados del incumplimiento de los plazos de entrega pactados en el contrato de transporte de mercaderías.',
    descripcion:
      'La solicitante contrató servicios de transporte para la distribución de mercaderías a sucursales del litoral. Durante el período octubre–diciembre de 2025 se registraron demoras reiteradas y pérdida parcial de carga, con el consiguiente perjuicio económico.',
    solicitante: {
      nombre: 'Distribuidora del Litoral S.R.L.',
      taxId: '30-71234567-8',
      domicilio: 'Av. San Martín 1250, Rosario, Santa Fe',
      email: 'legales@distribuidoradellitoral.example',
      telefono: '+54 341 555-0142',
    },
    contraparte: {
      nombre: 'Transportes Río Paraná S.A.',
      taxId: '30-70987654-3',
      domicilio: 'Ruta Nacional 11 km 12, Santa Fe, Santa Fe',
      info: 'Representada por su apoderado, Sr. Julián Montiel',
    },
    antecedentes: {
      descripcion:
        'En marzo de 2025 las partes celebraron un contrato de transporte con plazos de entrega de 48 horas. Entre octubre y diciembre de 2025 se acumularon 14 entregas fuera de plazo y 3 remitos con faltantes, sin respuesta satisfactoria a los reclamos formales.',
      hecho: '18 de noviembre de 2025',
      origen: 'Consulta presentada por la gerencia de la solicitante el 5 de febrero de 2026',
      documentacion:
        'Contrato de transporte, remitos observados, intercambio de correos y carta documento enviada el 15 de diciembre de 2025.',
    },
    actuaciones: [
      {
        fecha: '12/02/2026',
        actuacion: 'Apertura del expediente y análisis preliminar',
        responsable: 'Dra. Valeria Acosta',
        observaciones: 'Se solicitó documentación adicional',
      },
      {
        fecha: '24/02/2026',
        actuacion: 'Envío de carta documento a la contraparte',
        responsable: 'Dr. Tomás Ledesma',
        observaciones: 'Plazo de respuesta: 10 días',
      },
      {
        fecha: '16/03/2026',
        actuacion: 'Reunión de conciliación entre las partes',
        responsable: 'Dra. Valeria Acosta',
        observaciones: 'Sin acuerdo; se continúa la gestión',
      },
    ],
    documentacion: [
      {
        id: 'DOC-001',
        nombre: 'Contrato de transporte',
        fecha: '12/02/2026',
        descripcion: 'Contrato firmado el 14 de marzo de 2025',
      },
      {
        id: 'DOC-002',
        nombre: 'Remitos observados',
        fecha: '12/02/2026',
        descripcion: '17 remitos con demoras o faltantes',
      },
      {
        id: 'DOC-003',
        nombre: 'Carta documento',
        fecha: '24/02/2026',
        descripcion: 'Intimación formal de cumplimiento',
      },
    ],
    observaciones: {
      generales: 'La contraparte reconoce parte de las demoras pero rechaza la pérdida de carga.',
      infoPendiente: 'Detalle de costos logísticos adicionales asumidos por la solicitante.',
      docPendiente:
        'Constancias de recepción de las sucursales y facturas de las compras de reposición.',
      proximas:
        'Cuantificar el daño, intimar a la contraparte y evaluar la mediación prejudicial obligatoria.',
    },
    conclusiones: {
      estado: 'En trámite',
      resumen:
        'Fracasada la instancia de conciliación directa, se prepara la documentación para iniciar la mediación prejudicial.',
      dictamen:
        'Existen elementos probatorios suficientes para sostener el reclamo por las demoras; la pérdida de carga requiere prueba adicional.',
      actualizacion: '16 de marzo de 2026',
    },
  },
  {
    id: 'EXP-2026-0152',
    numero: 'EXP-2026-0152',
    fechaApertura: '3 de marzo de 2026',
    tipo: 'Desalojo por falta de pago',
    area: 'Derecho Civil',
    profesional: 'Dr. Tomás Ledesma',
    matricula: 'T.º 15 F.º 210',
    estado: 'En trámite',
    prioridad: 'Media',
    caratula: 'Inmobiliaria Pellegrini S.A. c/ Gómez, Marcelo Daniel s/ desalojo',
    objeto:
      'Recuperar la tenencia del inmueble locado por falta de pago de seis cánones locativos consecutivos.',
    descripcion:
      'El locatario dejó de abonar el alquiler desde septiembre de 2025 y no respondió a las intimaciones fehacientes. Se inicia la acción de desalojo y reclamo de los cánones adeudados.',
    solicitante: {
      nombre: 'Inmobiliaria Pellegrini S.A.',
      taxId: '30-68123456-1',
      domicilio: 'Córdoba 980, Rosario, Santa Fe',
      email: 'administracion@pellegrini.example',
      telefono: '+54 341 555-0188',
    },
    contraparte: {
      nombre: 'Gómez, Marcelo Daniel',
      taxId: '20-28456123-4',
      domicilio: 'Mitre 455, 3.º B, Rosario, Santa Fe',
      info: 'Locatario sin representación letrada conocida',
    },
    antecedentes: {
      descripcion:
        'Contrato de locación celebrado en junio de 2024 por 36 meses. El locatario abonó puntualmente hasta agosto de 2025; desde septiembre no registra pagos.',
      hecho: '1 de septiembre de 2025',
      origen: 'Consulta de la administración de la inmobiliaria el 27 de febrero de 2026',
      documentacion: 'Contrato de locación, recibos de pago, cartas documento y estado de cuenta.',
    },
    actuaciones: [
      {
        fecha: '03/03/2026',
        actuacion: 'Apertura del expediente',
        responsable: 'Dr. Tomás Ledesma',
        observaciones: 'Se relevó la documentación disponible',
      },
      {
        fecha: '10/03/2026',
        actuacion: 'Intimación fehaciente de pago',
        responsable: 'Dr. Tomás Ledesma',
        observaciones: 'Plazo de 10 días corridos',
      },
      {
        fecha: '04/04/2026',
        actuacion: 'Presentación de la demanda de desalojo',
        responsable: 'Dr. Tomás Ledesma',
        observaciones: 'Pendiente de sorteo de juzgado',
      },
    ],
    documentacion: [
      {
        id: 'DOC-001',
        nombre: 'Contrato de locación',
        fecha: '03/03/2026',
        descripcion: 'Vigencia junio 2024 – junio 2027',
      },
      {
        id: 'DOC-002',
        nombre: 'Estado de cuenta',
        fecha: '03/03/2026',
        descripcion: 'Deuda por seis cánones y punitorios',
      },
      {
        id: 'DOC-003',
        nombre: 'Carta documento',
        fecha: '10/03/2026',
        descripcion: 'Intimación de pago sin respuesta',
      },
    ],
    observaciones: {
      generales: 'El locatario continúa ocupando el inmueble.',
      infoPendiente: 'Constancia de servicios adeudados (luz y gas).',
      docPendiente: 'Certificado de dominio actualizado del inmueble.',
      proximas: 'Aguardar radicación de la causa y solicitar la audiencia de conciliación.',
    },
    conclusiones: {
      estado: 'En trámite',
      resumen: 'La demanda fue presentada y se espera la asignación del juzgado interviniente.',
      dictamen:
        'La falta de pago está acreditada documentalmente; se estima favorable el curso de la acción.',
      actualizacion: '4 de abril de 2026',
    },
  },
  {
    id: 'EXP-2026-0158',
    numero: 'EXP-2026-0158',
    fechaApertura: '20 de marzo de 2026',
    tipo: 'Sucesión testamentaria',
    area: 'Derecho de Familia y Sucesiones',
    profesional: 'Dra. Valeria Acosta',
    matricula: 'T.º 12 F.º 345',
    estado: 'En espera',
    prioridad: 'Baja',
    caratula: 'Benítez, Roberto Aníbal s/ sucesión testamentaria',
    objeto:
      'Tramitar la apertura de la sucesión y la declaratoria de herederos conforme al testamento otorgado por el causante.',
    descripcion:
      'Fallecido el causante en enero de 2026, sus tres hijos solicitan el patrocinio para iniciar el proceso sucesorio y regularizar los bienes inmuebles y cuentas bancarias.',
    solicitante: {
      nombre: 'Benítez, Laura Inés (en representación de los herederos)',
      taxId: '27-31245678-9',
      domicilio: 'Pasaje Roca 312, Funes, Santa Fe',
      email: 'laura.benitez@example.com',
      telefono: '+54 341 555-0121',
    },
    contraparte: {
      nombre: 'Sin contraparte (proceso voluntario)',
      taxId: '—',
      domicilio: '—',
      info: 'No se registran oposiciones',
    },
    antecedentes: {
      descripcion:
        'El causante otorgó testamento por acto público en 2019 instituyendo a sus tres hijos como herederos. Se relevaron dos inmuebles, un vehículo y cuentas bancarias.',
      hecho: '14 de enero de 2026',
      origen: 'Consulta presencial de los herederos el 12 de marzo de 2026',
      documentacion: 'Acta de defunción, testamento, partidas de nacimiento y títulos de propiedad.',
    },
    actuaciones: [
      {
        fecha: '20/03/2026',
        actuacion: 'Apertura del expediente y reunión con herederos',
        responsable: 'Dra. Valeria Acosta',
        observaciones: 'Se explicó el procedimiento y los costos',
      },
      {
        fecha: '02/04/2026',
        actuacion: 'Solicitud de informes de dominio y bancos',
        responsable: 'Dr. Tomás Ledesma',
        observaciones: 'Respuestas pendientes',
      },
    ],
    documentacion: [
      {
        id: 'DOC-001',
        nombre: 'Acta de defunción',
        fecha: '20/03/2026',
        descripcion: 'Copia certificada',
      },
      {
        id: 'DOC-002',
        nombre: 'Testamento por acto público',
        fecha: '20/03/2026',
        descripcion: 'Escritura n.º 214 del año 2019',
      },
    ],
    observaciones: {
      generales: 'Los herederos acuerdan la distribución de los bienes.',
      infoPendiente: 'Saldos bancarios a la fecha del fallecimiento.',
      docPendiente: 'Informes de dominio e inhibiciones.',
      proximas: 'Recibir informes y presentar el escrito de apertura de la sucesión.',
    },
    conclusiones: {
      estado: 'En espera',
      resumen: 'Se aguarda la recepción de informes para iniciar la presentación judicial.',
      dictamen: 'No se advierten obstáculos formales; se prevé un trámite sin conflicto.',
      actualizacion: '2 de abril de 2026',
    },
  },
  {
    id: 'EXP-2025-0391',
    numero: 'EXP-2025-0391',
    fechaApertura: '8 de septiembre de 2025',
    tipo: 'Despido sin causa',
    area: 'Derecho Laboral',
    profesional: 'Dr. Tomás Ledesma',
    matricula: 'T.º 15 F.º 210',
    estado: 'Cerrado',
    prioridad: 'Media',
    caratula: 'Fernández, Lucía c/ Servicios Integrales del Sur S.R.L. s/ despido',
    objeto: 'Cobro de indemnización por despido sin causa y liquidación final adeudada.',
    descripcion:
      'La trabajadora fue desvinculada sin causa tras cuatro años de antigüedad. Se reclamaron indemnización, preaviso y haberes pendientes; el caso se resolvió por acuerdo en audiencia.',
    solicitante: {
      nombre: 'Fernández, Lucía',
      taxId: '27-35678901-2',
      domicilio: 'San Lorenzo 2210, Rosario, Santa Fe',
      email: 'lucia.fernandez@example.com',
      telefono: '+54 341 555-0170',
    },
    contraparte: {
      nombre: 'Servicios Integrales del Sur S.R.L.',
      taxId: '30-70555123-6',
      domicilio: 'Bv. Oroño 1500, Rosario, Santa Fe',
      info: 'Representada por su gerente, Sr. Pablo Quiroga',
    },
    antecedentes: {
      descripcion:
        'Relación laboral iniciada en 2021 como administrativa. En agosto de 2025 se comunicó el despido sin causa y no se abonó la liquidación final.',
      hecho: '29 de agosto de 2025',
      origen: 'Consulta de la trabajadora el 4 de septiembre de 2025',
      documentacion: 'Recibos de sueldo, telegrama de despido y contrato de trabajo.',
    },
    actuaciones: [
      {
        fecha: '08/09/2025',
        actuacion: 'Apertura del expediente',
        responsable: 'Dr. Tomás Ledesma',
        observaciones: 'Cálculo preliminar de indemnización',
      },
      {
        fecha: '22/09/2025',
        actuacion: 'Audiencia en el Ministerio de Trabajo',
        responsable: 'Dr. Tomás Ledesma',
        observaciones: 'Propuesta de acuerdo de la empleadora',
      },
      {
        fecha: '14/10/2025',
        actuacion: 'Acuerdo homologado y cierre',
        responsable: 'Dr. Tomás Ledesma',
        observaciones: 'Pago en tres cuotas',
      },
    ],
    documentacion: [
      {
        id: 'DOC-001',
        nombre: 'Telegrama de despido',
        fecha: '08/09/2025',
        descripcion: 'Comunicación del 29 de agosto de 2025',
      },
      {
        id: 'DOC-002',
        nombre: 'Acta de acuerdo',
        fecha: '14/10/2025',
        descripcion: 'Homologada por la autoridad laboral',
      },
    ],
    observaciones: {
      generales: 'Cumplimiento de las cuotas bajo seguimiento.',
      infoPendiente: 'Ninguna.',
      docPendiente: 'Constancia de pago de la última cuota.',
      proximas: 'Archivar el expediente al verificar el último pago.',
    },
    conclusiones: {
      estado: 'Cerrado',
      resumen: 'Se alcanzó un acuerdo homologado que satisface el reclamo de la trabajadora.',
      dictamen: 'Resultado favorable; solo resta verificar el pago de la cuota final.',
      actualizacion: '14 de octubre de 2025',
    },
  },
  {
    id: 'EXP-2026-0163',
    numero: 'EXP-2026-0163',
    fechaApertura: '15 de abril de 2026',
    tipo: 'Constitución de sociedad',
    area: 'Derecho Societario',
    profesional: 'Dra. Valeria Acosta',
    matricula: 'T.º 12 F.º 345',
    estado: 'En trámite',
    prioridad: 'Alta',
    caratula: 'Agroinsumos Pampeanos S.A.S. s/ constitución e inscripción registral',
    objeto: 'Redacción del estatuto, constitución e inscripción de una sociedad por acciones simplificada.',
    descripcion:
      'Tres socios fundadores solicitan constituir una S.A.S. para la comercialización de insumos agropecuarios, con capital inicial de $3.000.000.',
    solicitante: {
      nombre: 'Agroinsumos Pampeanos S.A.S. (en formación)',
      taxId: '30-71888999-0',
      domicilio: 'Ruta 9 km 301, Casilda, Santa Fe',
      email: 'socios@agropampeanos.example',
      telefono: '+54 3464 555-0133',
    },
    contraparte: {
      nombre: 'Registro Público de Comercio',
      taxId: '—',
      domicilio: 'Santa Fe, Santa Fe',
      info: 'Organismo ante el cual se tramita la inscripción',
    },
    antecedentes: {
      descripcion:
        'Los socios acordaron los términos del estatuto, el objeto social y la distribución del capital en reunión del 10 de abril de 2026.',
      hecho: '10 de abril de 2026',
      origen: 'Consulta presentada por los socios fundadores',
      documentacion: 'DNI de los socios, acta de reserva de denominación y proyecto de estatuto.',
    },
    actuaciones: [
      {
        fecha: '15/04/2026',
        actuacion: 'Apertura del expediente y reserva de denominación',
        responsable: 'Dra. Valeria Acosta',
        observaciones: 'Denominación reservada por 30 días',
      },
      {
        fecha: '28/04/2026',
        actuacion: 'Redacción y firma del estatuto',
        responsable: 'Dra. Valeria Acosta',
        observaciones: 'Firmado por los tres socios',
      },
    ],
    documentacion: [
      {
        id: 'DOC-001',
        nombre: 'Reserva de denominación',
        fecha: '15/04/2026',
        descripcion: 'Vigente hasta el 15 de mayo de 2026',
      },
      {
        id: 'DOC-002',
        nombre: 'Estatuto social',
        fecha: '28/04/2026',
        descripcion: 'Firmado digitalmente por los socios',
      },
    ],
    observaciones: {
      generales: 'Los socios solicitan celeridad para operar en la próxima campaña.',
      infoPendiente: 'Datos bancarios para la cuenta de integración de capital.',
      docPendiente: 'Comprobante de depósito de capital inicial.',
      proximas: 'Presentar la solicitud de inscripción ante el Registro Público.',
    },
    conclusiones: {
      estado: 'En trámite',
      resumen: 'El estatuto está firmado y resta integrar el capital y presentar la inscripción.',
      dictamen: 'Trámite sin observaciones; se estima inscripción en 15 días hábiles.',
      actualizacion: '28 de abril de 2026',
    },
  },
]

export const getCaseFile = (id) => CASE_FILES.find((c) => c.id === id)
