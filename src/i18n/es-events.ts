/** Textos del pool ampliado de eventos y crisis finales (hito 4). */
type CardText = { title: string; text: string; choices?: Record<string, { label: string; res: string }>; fact?: string };

export const eventTexts: Record<string, CardText> = {
  // ── Genéricos ──
  ev_gen_humo: {
    title: 'Olor a quemado',
    text: 'El generador tose, se acelera y vuelve a toser. Por la junta del escape sale un hilo de humo azulado.',
    choices: {
      revisar: { label: 'Pararlo y revisarlo a fondo', res: 'Limpias el filtro de aire y aprietas la abrazadera del escape.' },
      seguir: { label: 'Dejarlo funcionando', res: 'Necesitas la electricidad. Cruzas los dedos.' },
    },
    fact: 'Los CDC insisten en que un generador nunca debe funcionar dentro de casa, en un garaje ni cerca de ventanas. El monóxido de carbono no se ve ni se huele y puede matar en minutos.',
  },
  ev_gen_humo_rompe: { title: '', text: 'Un chasquido metálico y silencio. El generador ha dicho basta.' },
  ev_gen_humo_aguanta: { title: '', text: 'Aguanta. Por ahora.' },
  ev_bateria_hinchada: {
    title: 'Batería hinchada',
    text: 'Una de las baterías tiene los costados abombados y está caliente al tacto.',
    choices: {
      desconectar: { label: 'Desconectarla y apartarla', res: 'Pierdes capacidad, pero duermes tranquilo.' },
      vigilar: { label: 'Dejarla y vigilarla', res: 'La miras cada pocas horas.' },
    },
  },
  ev_bateria_revienta: { title: '', text: 'Un estallido sordo y olor a ácido. Te salpica en el brazo.' },
  ev_filtro_silba: {
    title: 'El filtro silba',
    text: 'El ventilador suena forzado: el filtro está saturado de polvo y apenas pasa aire.',
    choices: {
      cambiar: { label: 'Poner un filtro HEPA nuevo', res: 'El aire vuelve a fluir con un suspiro.' },
      limpiar: { label: 'Sacudirlo y limpiarlo a mano', res: 'Algo mejora, pero el filtro queda tocado.' },
    },
    fact: 'Un filtro HEPA retiene al menos el 99,97 % de las partículas de 0,3 µm (norma DOE). Las más grandes y las más pequeñas se atrapan todavía mejor.',
  },
  ev_moho: {
    title: 'Moho',
    text: 'Manchas negras trepan por la esquina más húmeda. Huele a cerrado y a tierra mojada.',
    choices: {
      lejia: { label: 'Frotar con lejía diluida', res: 'Te escuecen los ojos, pero la pared queda limpia.' },
      ignorar: { label: 'Ignorarlo', res: 'Total, es solo una mancha.' },
    },
    fact: 'Según la OMS, la humedad y el moho en interiores aumentan el riesgo de síntomas respiratorios, infecciones y asma.',
  },
  ev_moho_tarde: { title: '', text: 'El moho se ha extendido. Toses al despertar.' },
  ev_pesadilla: {
    title: 'Pesadillas',
    text: 'Despiertas empapado. En el sueño, la escotilla no cerraba.',
    choices: {
      escribir: { label: 'Levantarte y escribir lo que has soñado', res: 'Ponerlo en palabras le quita fuerza.' },
      quieto: { label: 'Quedarte quieto con los ojos abiertos', res: 'Esperas a que pase. Tarda.' },
    },
  },
  ev_cumple: {
    title: 'Cumpleaños',
    text: 'Haces cuentas: hoy es tu cumpleaños.',
    choices: {
      celebrar: { label: 'Celebrarlo con las galletas buenas y una vela', res: 'Te cantas el cumpleaños feliz. Te ríes. Luego lloras un poco.' },
      nada: { label: 'Hacer como si fuera un día más', res: 'Es un día más.' },
    },
  },
  ev_muela: {
    title: 'Dolor de muelas',
    text: 'Un dolor pulsátil en la mandíbula que no te deja pensar.',
    choices: {
      pastilla: { label: 'Tomar paracetamol', res: 'El dolor se amortigua.' },
      aguantar: { label: 'Aguantar', res: 'Muerdes un trapo.' },
      sacar: { label: 'Intentar sacártela con unos alicates', res: 'Sale. No quieres volver a pensar en ello.' },
    },
  },
  ev_tobillo: {
    title: 'Mal paso',
    text: 'El tercer peldaño cede y te tuerces el tobillo.',
    choices: {
      tablilla: { label: 'Inmovilizarlo con una tablilla de madera', res: 'Lo inmovilizas bien. Duele menos.' },
      seguir: { label: 'Seguir como si nada', res: 'Se hincha más.' },
    },
  },
  ev_cable: {
    title: 'Cable roído',
    text: 'Algo ha mordisqueado el cable del ventilador. Asoma el cobre.',
    choices: {
      reparar: { label: 'Repararlo con cinta americana', res: 'Un apaño, pero funciona.' },
      dejar: { label: 'Dejarlo', res: 'Un chispazo, y el ventilador se para.' },
    },
  },
  ev_bidon_olvidado: {
    title: 'Un bidón olvidado',
    text: 'Detrás de unas cajas aparece un bidón de agua que no recordabas haber guardado.',
    choices: { coger: { label: '¡Qué suerte!', res: '12 litros más.' } },
  },
  ev_silencio: {
    title: 'Silencio',
    text: 'Ni un ruido. Oyes tu sangre en los oídos y el latido en el cuello.',
    choices: {
      hablar: { label: 'Hablar en voz alta, contarte el día', res: 'Tu propia voz te hace compañía.' },
      respirar: { label: 'Respirar despacio y contar hasta cien', res: 'Te calmas.' },
    },
  },
  ev_condensacion: {
    title: 'Condensación',
    text: 'Gotas en el techo, en las paredes, en la manta: tu respiración se condensa en el aire frío y cargado.',
    choices: {
      ventilar: { label: 'Bombear aire un buen rato', res: 'El aire se renueva y la humedad baja.' },
      trapos: { label: 'Secar con trapos', res: 'Los trapos acaban mojados en un rincón.' },
    },
  },
  ev_marcas: {
    title: 'Marcas en la pared',
    text: 'Una raya por día, en grupos de cinco. Ya ocupan un buen trozo de pared.',
    choices: {
      contar: { label: 'Contarlas con orgullo', res: 'Sigues aquí.' },
      borrar: { label: 'Borrarlas: mejor no contar', res: 'Sin números, los días pesan menos.' },
    },
  },
  ev_cucarachas: {
    title: 'Cucarachas',
    text: 'Al encender la luz, decenas de cucarachas corren hacia las grietas de la despensa.',
    choices: {
      lejia: { label: 'Limpiar con lejía y sellar las grietas', res: 'Desaparecen. Las grietas también.' },
      ignorar: { label: 'Ignorarlas', res: 'Conviven contigo. Y con tu comida.' },
    },
  },
  ev_cae_tierra: {
    title: 'Cae tierra',
    text: 'Un hilo de tierra cae del techo de una galería. El entibado cruje.',
    choices: {
      apuntalar: { label: 'Apuntalar con dos tablones', res: 'Lo refuerzas a conciencia.' },
      dejar: { label: 'Dejarlo para más tarde', res: 'Parece que se ha parado.' },
    },
  },
  ev_cae_tierra_tarde: { title: '', text: 'Se desprende un trozo de techo sobre los equipos.' },
  ev_agua_rara: {
    title: 'El agua huele raro',
    text: 'Uno de los bidones huele a cerrado. El agua tiene un brillo extraño.',
    choices: {
      hervir: { label: 'Hervirla (1 cartucho de gas)', res: 'Un minuto de hervor y a salvo.' },
      tirar: { label: 'Tirar el bidón', res: '10 litros menos.' },
      beber: { label: 'Bebérsela igual', res: 'Sabe a plástico.' },
    },
    fact: 'Los CDC aconsejan hervir el agua dudosa durante 1 minuto (3 por encima de unos 2.000 m) o desinfectarla con lejía doméstica sin aditivos.',
  },
  ev_carta: {
    title: 'Una carta',
    text: 'Te apetece escribir a alguien, aunque no haya forma de enviarlo.',
    choices: {
      escribir: { label: 'Escribirla con calma', res: 'Tres páginas. La doblas y la guardas.' },
      romper: { label: 'Empezarla y romperla', res: 'No encuentras las palabras.' },
    },
  },
  ev_escalofrios: {
    title: 'Escalofríos',
    text: 'Te duele el cuerpo y tienes escalofríos. Quizá sea solo cansancio.',
    choices: {
      reposo: { label: 'Guardar reposo', res: 'Duermes casi todo el día.' },
      pastilla: { label: 'Paracetamol y seguir', res: 'Te encuentras algo mejor.' },
    },
  },
  ev_reloj: {
    title: 'El reloj se ha parado',
    text: 'Las agujas marcan las 4:17. ¿Desde cuándo?',
    choices: {
      calendario: { label: 'Hacer un calendario en la pared', res: 'Recuperas la cuenta.' },
      olvidar: { label: 'Dejar de contar las horas', res: 'Duermes cuando tienes sueño. Es raro, pero relaja.' },
    },
  },
  ev_mareo_generador: {
    title: 'Mareo',
    text: 'Cada vez que funciona el generador te duele la cabeza y te mareas.',
    choices: {
      revisar_escape: { label: 'Revisar a fondo el tubo de escape', res: 'Había una fuga en una junta. La sellas.' },
      ignorar: { label: 'Será el cansancio', res: 'Vuelves a encenderlo.' },
    },
    fact: 'Dolor de cabeza, mareo, debilidad y náuseas son los primeros síntomas de la intoxicación por monóxido de carbono (CDC). Si mejoran al salir del recinto, la causa está dentro.',
  },
  ev_armonica: {
    title: 'Una armónica',
    text: 'En una caja de cosas viejas aparece una armónica.',
    choices: {
      tocar: { label: 'Aprender a tocarla', res: 'Suena fatal. Te encanta.' },
      guardar: { label: 'Guardarla', res: 'Para otro día.' },
    },
  },
  ev_suenio: {
    title: 'Un buen sueño',
    text: 'Esta noche has soñado con el mar. Te despiertas con una sonrisa.',
    choices: { despertar: { label: 'Quedarte un rato con esa sensación', res: 'Te dura toda la mañana.' } },
  },
  ev_ejercicio: {
    title: 'Moverse',
    text: 'Te notas rígido. Llevas días casi sin moverte.',
    choices: {
      rutina: { label: 'Hacer una rutina de ejercicio', res: 'Flexiones, sentadillas, estiramientos. Te sienta bien.' },
      tumbarse: { label: 'Mejor no gastar energía', res: 'Te quedas tumbado.' },
    },
  },
  ev_herramienta_rota: {
    title: 'Mango partido',
    text: 'El mango de la pala se ha partido por la mitad.',
    choices: {
      arreglar: { label: 'Hacer un mango nuevo con un tablón', res: 'Queda tosco, pero sirve.' },
      dejar: { label: 'Tirarla', res: 'Te quedas sin herramientas.' },
    },
  },
  // ── Nuclear ──
  ev_nuc_yodo: {
    title: 'Yoduro potásico',
    text: 'La radio pide a la población de ciertas zonas que tome yoduro potásico. En tu botiquín hay un frasco de Lugol.',
    choices: {
      esperar: { label: 'Esperar a que digan si tu zona está incluida', res: 'Tu zona no está en la lista.' },
      lugol: { label: 'Tomar unas gotas de Lugol por si acaso', res: 'Te arde el estómago todo el día.' },
    },
    fact: 'La OMS explica que el yoduro potásico solo protege el tiroides frente al yodo radiactivo (I-131) y únicamente si se toma en el momento indicado por las autoridades. No protege de la radiación externa. El Lugol y otros antisépticos yodados no lo sustituyen y pueden ser tóxicos.',
  },
  ev_nuc_ropa: {
    title: 'Polvo en la ropa',
    text: 'Al cerrar la escotilla te ha caído encima polvo gris del exterior. Lo tienes en el pelo y en la chaqueta.',
    choices: {
      descontaminar: { label: 'Quitarte la ropa, meterla en una bolsa y lavarte (4 L)', res: 'Bolsa cerrada, piel frotada. Mucho mejor.' },
      ignorar: { label: 'Sacudirte y seguir', res: 'Lo sacudes como puedes.' },
    },
    fact: 'Según Ready.gov, quitarse la ropa exterior elimina hasta el 90 % de la contaminación radiactiva. Después hay que lavarse con agua y jabón, sin acondicionador, y guardar la ropa en una bolsa cerrada.',
  },
  ev_nuc_lluvia: {
    title: 'Lluvia sobre el tejado',
    text: 'Llueve con fuerza. El canalón de la casa desagua junto a la entrada.',
    choices: {
      recoger: { label: 'Recoger 40 L en cubos (para filtrar por tierra después)', res: 'Llenas los cubos deprisa bajo la lluvia.' },
      no: { label: 'No salir', res: 'Escuchas el agua correr.' },
    },
    fact: 'Kearny explica que filtrar el agua a través de tierra retiene casi todas las partículas radiactivas y el yodo disuelto. El agua de depósitos tapados y de pozos es mucho más segura que la de lluvia recién caída.',
  },
  ev_nuc_latas: {
    title: 'La despensa de arriba',
    text: 'Te acuerdas de que en la cocina de la casa quedan latas. Son diez minutos de ida y vuelta.',
    choices: {
      subir: { label: 'Subir a por ellas y lavar las latas al bajar', res: 'Subes, llenas una bolsa y bajas sin mirar atrás.' },
      no: { label: 'No arriesgarte', res: 'Las latas seguirán ahí.' },
    },
    fact: 'Ready.gov indica que la comida en latas y envases cerrados es segura: basta con limpiar el exterior antes de abrirlos. Lo que se contamina es el polvo de fuera, no el interior.',
  },
  ev_nuc_nauseas: {
    title: 'Náuseas',
    text: 'Vomitas al despertar. Te notas débil, con la boca seca.',
    choices: {
      sro: { label: 'Tomar suero oral y descansar', res: 'Recuperas algo de líquido.' },
      reposo: { label: 'Tumbarte y esperar', res: 'Pasa, poco a poco.' },
    },
    fact: 'Los CDC describen que, en el síndrome de irradiación aguda, las náuseas y los vómitos aparecen antes cuanto mayor es la dosis: horas después a partir de ~1 Gy y en minutos con dosis altas. Después llega una fase de latencia engañosa.',
  },
  ev_nuc_contador: {
    title: 'La regla 7-10',
    text: 'Apuntas la lectura del dosímetro. Comparada con la de hace una semana, es una fracción.',
    choices: { anotar: { label: 'Anotarlo en la pared, junto al primer día', res: 'La física está de tu parte: cada día que aguantas, fuera hay menos.' } },
    fact: 'Glasstone y Dolan describen la "regla 7-10": cada vez que el tiempo desde la detonación se multiplica por 7, la tasa de dosis de la lluvia radiactiva baja unas 10 veces. A las 49 h es un 1 % de la tasa a la hora 1.',
  },
  ev_nuc_escotilla: {
    title: 'Golpes en la escotilla',
    text: 'Alguien golpea la escotilla. Una voz ronca: «Por favor. Tengo quemaduras. Solo un rato».',
    choices: {
      abrir: { label: 'Dejarle entrar y compartir agua y comida', res: 'Se queda un día. Habla de su familia. Se va al amanecer.' },
      agua: { label: 'Pasarle agua por la rendija', res: 'Oyes cómo bebe. Luego se aleja.' },
      no: { label: 'No contestar', res: 'Los golpes duran una eternidad.' },
    },
  },
  ev_nuc_pem: {
    title: 'Todo muerto',
    text: 'Arriba, ningún aparato funciona: ni el móvil, ni la tele, ni el coche del vecino.',
    choices: {
      revisar: { label: 'Revisar tus equipos uno a uno', res: 'Abajo, todo parece funcionar.' },
      ignorar: { label: 'No darle importancia', res: 'Ya lo mirarás.' },
    },
    fact: 'Una detonación a gran altitud genera un pulso electromagnético (PEM) que puede dañar equipos electrónicos conectados a cables o antenas largas (Glasstone, cap. 11).',
  },
  ev_nuc_pelo: {
    title: 'Mechones',
    text: 'Al pasarte la mano por el pelo te quedas con un mechón entre los dedos.',
    choices: { aceptar: { label: 'Mirarlo un rato largo', res: 'Sabes lo que significa.' } },
    fact: 'Los CDC citan la caída del pelo (epilación) como signo de exposición a dosis altas, a partir de unos 3 Gy, que aparece unas 2-3 semanas después.',
  },
  ev_nuc_sirenas: {
    title: 'Sirenas otra vez',
    text: 'Las sirenas suenan de nuevo. ¿Otro ataque? ¿Un simulacro? ¿Un error?',
    choices: {
      fondo: { label: 'Bajar a lo más hondo y esperar', res: 'Esperas horas. No pasa nada.' },
      asomarse: { label: 'Asomarte a ver qué pasa', res: 'Subes y miras el horizonte.' },
    },
  },
  // ── Pandemia ──
  ev_pan_paquete: {
    title: 'Un paquete',
    text: 'Alguien ha dejado una caja con comida en tu puerta. No hay nota.',
    choices: {
      lejia: { label: 'Desinfectarla con lejía y abrirla', res: 'Limpias el exterior y lo guardas todo.' },
      esperar: { label: 'Dejarla 72 h en cuarentena', res: 'La dejas en un rincón, sin tocarla.' },
      abrir: { label: 'Abrirla ya', res: 'Comida, al fin.' },
    },
    fact: 'Un estudio publicado en NEJM (2020) halló coronavirus viable hasta 24 h en cartón y 72 h en plástico. Hoy se sabe que el contagio por superficies es mucho menos importante que el aéreo.',
  },
  ev_pan_paquete_tarde: { title: '', text: 'Pasadas las 72 h, abres la caja con tranquilidad.' },
  ev_pan_ambulancias: {
    title: 'Sirenas',
    text: 'Ambulancias toda la noche. Una se para delante de la casa de enfrente.',
    choices: {
      escuchar: { label: 'Escuchar', res: 'Bajan una camilla. Tardan mucho en volver a subirla.' },
      tapones: { label: 'Ponerte tapones', res: 'Mejor no saber.' },
    },
  },
  ev_pan_bulo: {
    title: 'Un remedio milagroso',
    text: 'Un mensaje reenviado mil veces asegura que beber un poco de lejía diluida «mata el virus».',
    choices: {
      ignorar: { label: 'Ignorarlo: es un bulo', res: 'Lo borras.' },
      probar: { label: 'Probar un poco por si acaso', res: 'Te abrasa la garganta. Vomitas toda la tarde.' },
    },
    fact: 'La OMS advierte de que ingerir lejía u otros desinfectantes es peligroso y no protege de ninguna infección. La lejía solo sirve para desinfectar superficies y, en dosis mínimas, para potabilizar agua.',
  },
  ev_pan_gomas: {
    title: 'Mascarillas viejas',
    text: 'Las gomas de algunas mascarillas se han dado de sí con la humedad.',
    choices: {
      coser: { label: 'Arreglarlas con hilo', res: 'Ajustan otra vez.' },
      tirar: { label: 'Tirar las inservibles', res: 'Tres menos.' },
    },
  },
  ev_pan_tos: {
    title: '¿Es eso?',
    text: 'Toses dos veces al levantarte. Te llevas la mano a la frente.',
    choices: {
      aislarse: { label: 'Descansar y vigilar los síntomas', res: 'Te tomas el día con calma.' },
      restar: { label: 'Quitarle importancia', res: 'Será el polvo.' },
    },
    fact: 'Según los CDC, la gripe se incuba 1-4 días (unos 2 de media) y se puede contagiar desde un día antes de tener síntomas.',
  },
  ev_pan_reparto: {
    title: 'Reparto de alimentos',
    text: 'Un camión de Protección Civil reparte cajas de comida en la plaza. Hay cola.',
    choices: {
      ffp2: { label: 'Ir con FFP2 y guardando distancia', res: 'Vuelves con una caja de 6.000 kcal.' },
      sin: { label: 'Ir sin mascarilla', res: 'Vuelves con una caja de 6.000 kcal.' },
      quedarse: { label: 'Quedarte en casa', res: 'Ya habrá otra ocasión.' },
    },
  },
  ev_pan_sellado: {
    title: 'Fugas de aire',
    text: 'Te preguntas si el aire de fuera entra por algún sitio además del filtro.',
    choices: {
      revisar: { label: 'Revisar y sellar todas las juntas', res: 'Encuentras dos rendijas y las tapas.' },
      confiar: { label: 'Confiar en el filtro', res: 'El filtro hará su trabajo.' },
    },
    fact: 'Los filtros HEPA retienen eficazmente los aerosoles que transportan virus. Pero el aire que entra por rendijas sin filtrar se salta el filtro: un buen sellado importa tanto como el filtro.',
  },
  ev_pan_duelo: {
    title: 'Una mala noticia',
    text: 'Te llega por la radio el nombre de alguien a quien conocías.',
    choices: {
      carta: { label: 'Escribirle unas palabras de despedida', res: 'Te ayuda a cerrarlo.' },
      apagar: { label: 'Apagar la radio y no pensar', res: 'Pero piensas.' },
    },
  },
  ev_pan_cortes: {
    title: 'Cortes de agua',
    text: 'Anuncian cortes de agua de varias horas al día para «garantizar el suministro».',
    choices: {
      llenar: { label: 'Llenar todo lo que tengas mientras sale', res: '20 litros más guardados.' },
      nada: { label: 'Seguir igual', res: 'Ya veremos.' },
    },
  },
  ev_pan_videollamada: {
    title: 'Una videollamada',
    text: 'Mientras hay red, puedes llamar a alguien.',
    choices: {
      llamar: { label: 'Llamar', res: 'Media hora de risas y alguna lágrima. Lo necesitabas.' },
      no: { label: 'Ahorrar batería', res: 'Quizá mañana.' },
    },
  },
  // ── Colapso ──
  ev_col_humo: {
    title: 'Humo',
    text: 'Huele a humo. Arde una casa a dos calles y nadie va a apagarla.',
    choices: {
      tapar: { label: 'Tapar respiraderos 12 h', res: 'Sellas las entradas de aire hasta que pasa.' },
      vigilar: { label: 'Vigilar el fuego por si se acerca', res: 'Respiras humo toda la noche.' },
    },
  },
  ev_col_gritos: {
    title: 'Cristales rotos',
    text: 'Gritos, cristales rotos y una alarma de coche que nadie apaga.',
    choices: {
      apagar: { label: 'Apagarlo todo y no hacer ruido', res: 'Esperas a oscuras.' },
      mirar: { label: 'Mirar por la rendija', res: 'Ves sombras corriendo calle abajo.' },
    },
  },
  ev_col_mercado: {
    title: 'Mercado negro',
    text: 'Un vecino ofrece diésel… a cambio de comida, claro.',
    choices: {
      comprar: { label: '4.000 kcal por 10 L de diésel', res: 'Trato hecho.' },
      no: { label: 'No te interesa', res: 'Se va a probar suerte en otra puerta.' },
    },
  },
  ev_col_rondas: {
    title: 'Rondas vecinales',
    text: 'Los vecinos que quedan organizan rondas nocturnas. Te piden que te unas.',
    choices: {
      unirse: { label: 'Unirte unas noches', res: 'Cansa, pero la calle está más tranquila. Y hablas con gente.' },
      no: { label: 'No: tu búnker no debe verse', res: 'Te miran raro.' },
    },
  },
  ev_col_reparto: {
    title: 'Agua en el polideportivo',
    text: 'Corre el rumor de que el ejército reparte agua en el polideportivo.',
    choices: {
      ir: { label: 'Ir con dos bidones', res: 'Cola de horas. Vuelves con 20 litros.' },
      no: { label: 'No arriesgarte', res: 'Te quedas.' },
    },
  },
  ev_col_reparto_empujones: { title: '', text: 'Hay empujones en la cola. Te llevas un golpe.' },
  ev_col_marca: {
    title: 'Una marca en la puerta',
    text: 'Alguien ha pintado con espray una cruz en tu puerta.',
    choices: {
      borrar: { label: 'Borrarla esta misma noche', res: 'Rascas la pintura hasta que no se ve.' },
      dejar: { label: 'Dejarla', res: 'Quizá no significa nada.' },
    },
  },
  ev_col_nino: {
    title: 'Un niño perdido',
    text: 'Un niño de unos ocho años llama a la puerta. Busca a su madre.',
    choices: {
      ayudar: { label: 'Darle agua y comida y llevarle con los vecinos', res: 'Una vecina lo reconoce. Vas a casa con el pecho caliente.' },
      indicar: { label: 'Indicarle dónde está el centro de acogida', res: 'Se va corriendo.' },
    },
  },
  ev_col_ferreteria: {
    title: 'La ferretería saqueada',
    text: 'La ferretería de enfrente ha sido saqueada. Quizá quede algo.',
    choices: {
      ir: { label: 'Ir rápido antes de que vuelvan', res: 'Encuentras tablones y sacos vacíos.' },
      no: { label: 'No te la juegas', res: 'Otros se llevarán lo que quede.' },
    },
  },
  ev_col_luz: {
    title: 'Diez minutos de luz',
    text: 'De pronto, las farolas de la calle se encienden… y a los diez minutos se apagan otra vez.',
    choices: { mirar: { label: 'Disfrutar esos diez minutos', res: 'Alguien, en algún sitio, sigue intentándolo.' } },
  },
  // ── Clima ──
  ev_frio_respiradero: {
    title: 'Respiradero helado',
    text: 'La escarcha está cerrando la boca del respiradero.',
    choices: {
      limpiar: { label: 'Salir a limpiarlo', res: 'Rascas el hielo con los dedos entumecidos.' },
      dejar: { label: 'Dejarlo', res: 'Entra menos frío… y menos aire.' },
    },
  },
  ev_frio_sabanones: {
    title: 'Sabañones',
    text: 'Tienes los dedos de los pies hinchados, rojos y con picor.',
    choices: {
      calentar: { label: 'Calentarlos poco a poco y abrigarlos', res: 'Mejoran en un par de días.' },
      frotar: { label: 'Frotarlos con fuerza para que entren en calor', res: 'Duelen más y se agrietan.' },
    },
    fact: 'NIOSH recomienda recalentar las zonas afectadas por el frío de forma gradual y no frotarlas, porque frotar daña los tejidos congelados.',
  },
  ev_frio_coche: {
    title: 'Un coche en la nieve',
    text: 'Un coche está atrapado en la nieve de la calle. Dentro hay alguien con el motor apagado.',
    choices: {
      ayudar: { label: 'Salir a ayudar y traerlo a calentarse un rato', res: 'Le cuesta hablar. Recupera el color con tu manta.' },
      no: { label: 'No salir', res: 'A la mañana, el coche sigue ahí.' },
    },
    fact: 'Según NIOSH, la confusión, la torpeza y el habla lenta son signos de hipotermia. A una persona con hipotermia hay que llevarla a un lugar cálido, quitarle la ropa húmeda y calentarle primero el tronco.',
  },
  ev_inu_freatico: {
    title: 'Sube el agua',
    text: 'Con tanta lluvia, el nivel freático sube: hay charcos en el nivel más bajo.',
    choices: {
      achicar: { label: 'Achicar durante horas', res: 'Cubo a cubo, el suelo vuelve a verse.' },
      sacos: { label: 'Hacer un murete con 12 sacos', res: 'El agua se queda al otro lado.' },
      nada: { label: 'Dejarlo', res: 'La humedad lo oxida todo.' },
    },
  },
  ev_inu_mosquitos: {
    title: 'Mosquitos',
    text: 'El agua estancada ha traído nubes de mosquitos.',
    choices: {
      tapar: { label: 'Poner plástico en las entradas', res: 'Menos bichos y algo de paz.' },
      aguantar: { label: 'Aguantar', res: 'No duermes por los picores.' },
    },
    fact: 'Según la OMS, tras las inundaciones aumentan las enfermedades de transmisión hídrica, como el cólera, y las transmitidas por mosquitos.',
  },
  ev_inu_grifo: {
    title: 'Agua marrón',
    text: 'Abres el grifo de la casa y sale agua marrón con olor a gasoil.',
    choices: {
      hervir: { label: 'Dejarla reposar, filtrarla con un paño y hervirla', res: 'Diez litros aprovechables.' },
      beber: { label: 'Guardarla tal cual', res: 'Diez litros más… de algo.' },
      tirar: { label: 'No tocarla', res: 'Mejor así.' },
    },
    fact: 'Los CDC no recomiendan usar agua contaminada con combustible o productos químicos: hervirla no elimina los químicos. Si solo es turbia, se deja reposar, se filtra y se hierve.',
  },
  ev_inu_barca: {
    title: 'Una barca',
    text: 'Una barca de rescate avanza por la calle inundada.',
    choices: {
      senales: { label: 'Hacer señales', res: 'Te lanzan una bolsa con raciones y siguen su ruta.' },
      esconderse: { label: 'Esconderte', res: 'Pasa de largo.' },
    },
  },
  ev_sol_auroras: {
    title: 'Auroras',
    text: 'El cielo nocturno brilla en verde y rojo, ondulando como una cortina.',
    choices: {
      mirar: { label: 'Subir a mirar un rato', res: 'Es lo más bonito que has visto en mucho tiempo.' },
      no: { label: 'No salir', res: 'Las ves reflejadas en la rendija.' },
    },
    fact: 'Durante la tormenta de Carrington (1859) se vieron auroras cerca del trópico y los telégrafos echaban chispas. La escala de la NOAA llama G5 a las tormentas geomagnéticas extremas.',
  },
  ev_sol_brujula: {
    title: 'La brújula',
    text: 'La aguja de la brújula oscila sin parar, como si buscara el norte y no lo encontrara.',
    choices: { anotar: { label: 'Anotar sus oscilaciones', res: 'Un experimento para pasar el rato.' } },
    fact: 'Las tormentas geomagnéticas alteran el campo magnético terrestre lo bastante como para desviar las brújulas y degradar el GPS y las comunicaciones por radio en HF (NOAA SWPC).',
  },
  ev_sol_transformador: {
    title: 'Un estallido',
    text: 'Un estallido y un resplandor azul: el transformador del barrio ha reventado.',
    choices: {
      refugio: { label: 'Quedarte a cubierto', res: 'El resplandor se apaga.' },
      ver: { label: 'Ir a ver si se puede aprovechar algo', res: 'Te acercas con cuidado.' },
    },
  },
  ev_sol_transformador_mal: { title: '', text: 'Un cable aún da calambre. Te quemas la mano.' },
  ev_sol_transformador_bien: { title: '', text: 'Rescatas unos tablones de la caseta.' },
  ev_sol_coches: {
    title: '¿Funcionan los coches?',
    text: 'Un vecino jura que «la tormenta ha quemado todos los coches». Pero ves pasar uno.',
    choices: { entender: { label: 'Pensarlo con calma', res: 'No es un pulso nuclear: los coches siguen funcionando.' } },
    fact: 'Las tormentas geomagnéticas inducen corrientes en conductores muy largos (líneas eléctricas, oleoductos). Los aparatos pequeños, como los coches, apenas se ven afectados, a diferencia de lo que ocurre con un PEM nuclear.',
  },
  // ── Crisis finales extra ──
  boss_apagon: {
    title: 'Apagón total',
    text: 'Un olor acre y un chasquido: el banco de baterías ha fallado. Oscuridad absoluta.',
    choices: {
      reparar: { label: 'Intentar repararlo a la luz de la linterna', res: 'Desmontas, limpias bornes, rehaces conexiones.' },
      oscuras: { label: 'Aguantar a oscuras', res: 'Las horas a oscuras se hacen eternas.' },
    },
  },
  boss_apagon_ok: { title: '', text: 'Un clic y vuelve la luz. Lo has conseguido.' },
  boss_apagon_mal: { title: '', text: 'No hay manera. Necesitarás tiempo y materiales.' },
  boss_soledad: {
    title: 'La pared que te habla',
    text: 'Llevas días hablando solo. Hoy, por un momento, te ha parecido que la pared contestaba.',
    choices: {
      escribir: { label: 'Escribirlo todo, ordenar la cabeza', res: 'Llenas un cuaderno. Las letras ponen el mundo en su sitio.' },
      rutina: { label: 'Imponerte una rutina estricta', res: 'Horarios, tareas, ejercicio. El orden te sostiene.' },
      cama: { label: 'Quedarte en la cama', res: 'No te levantas en todo el día.' },
    },
  },
  boss_polvo: {
    title: 'Tormenta de polvo',
    text: 'Un viento seco levanta el polvo radiactivo asentado y lo arrastra contra todas las rendijas.',
    choices: {
      sellar: { label: 'Sellar con plástico y cinta durante 48 h', res: 'Sellas todo. El aire se carga.' },
      filtro: { label: 'Confiar en la ventilación filtrada', res: 'El filtro trabaja a destajo.' },
      nada: { label: 'No hacer nada especial', res: 'Esperas a que pase el viento.' },
    },
    fact: 'Glasstone describe la resuspensión: el viento puede volver a levantar el polvo radiactivo ya depositado. Por eso conviene filtrar el aire y mantener cerradas las entradas.',
  },
  boss_fiebre: {
    title: 'Fiebre',
    text: 'El virus ha llegado hasta ti: escalofríos, tos seca, el pecho en llamas.',
    choices: {
      reposo: { label: 'Reposo absoluto y beber mucho', res: 'Duermes, bebes, duermes.' },
      medicinas: { label: 'Paracetamol cada 8 horas', res: 'La fiebre baja a ratos.' },
    },
    fact: 'Contra la mayoría de los virus respiratorios no hay un tratamiento casero específico. El reposo, la hidratación y los antitérmicos alivian los síntomas, y hay que vigilar la dificultad para respirar (CDC).',
  },
  boss_incendio: {
    title: 'Incendio en la manzana',
    text: 'Arde la manzana entera. El humo baja por la escalera y se mete en el búnker.',
    choices: {
      sellar: { label: 'Sellar la entrada con plástico y cinta', res: 'Sellas la escotilla. El humo se queda fuera.' },
      ventilar: { label: 'Bombear aire a la desesperada', res: 'Bombeas aire… y humo.' },
      esperar: { label: 'Tumbarte en el suelo y esperar', res: 'Respiras lo justo a ras de suelo.' },
    },
  },
  boss_nevada: {
    title: 'Sepultado',
    text: 'Una nevada histórica: dos metros de nieve sobre la entrada. Apenas entra aire.',
    choices: {
      palear: { label: 'Abrir un túnel a paladas', res: 'Horas de pala hasta ver el cielo.' },
      esperar: { label: 'Esperar a que se asiente', res: 'El aire se vicia día a día.' },
    },
  },
  boss_colera: {
    title: 'Cólera',
    text: 'El agua contaminada de la crecida trae un brote de diarrea grave a la zona.',
    choices: {
      sro: { label: 'Prepararte con suero oral', res: 'Tienes el suero a mano.' },
      hervir: { label: 'Hervirlo absolutamente todo', res: 'Gastas gas, pero ni una gota sin hervir.' },
      aguantar: { label: 'Seguir igual', res: 'Esperas que no te toque.' },
    },
    fact: 'Según la OMS, la mayoría de los casos de cólera se tratan con éxito solo con sales de rehidratación oral. Sin tratamiento, los casos graves pueden matar en horas por deshidratación.',
  },
  boss_sol_saqueo: {
    title: 'Semanas sin luz',
    text: 'Tras semanas de apagón, la ciudad está desesperada. Un grupo registra las casas de tu calle.',
    choices: {
      esconderse: { label: 'Apagarlo todo y esconderte', res: 'Silencio absoluto.' },
      negociar: { label: 'Ofrecer comida', res: 'Se llevan su parte.' },
      resistir: { label: 'Atrancar la puerta', res: 'Apuntalas la puerta.' },
    },
  },
  // ── Amenazas secundarias ──
  sec_colapso: {
    title: 'El orden se rompe',
    text: 'La radio lo confirma: los servicios ya no llegan. Sin luz, sin policía y sin abastecimiento, empiezan los saqueos.',
    choices: {
      reforzar: { label: 'Reforzar la puerta con tablones', res: 'Clavas tablones en diagonal. Ahora aguanta más.' },
      aceptar: { label: 'Prepararte mentalmente', res: 'Ahora el peligro también tiene cara.' },
    },
  },
  sec_pandemia: {
    title: 'Epidemia',
    text: 'Sin agua corriente ni recogida de basuras, se extiende una epidemia. La gente enferma a tu alrededor.',
    choices: {
      higiene: { label: 'Extremar la higiene con lejía', res: 'Desinfectas todo lo que tocas.' },
      aceptar: { label: 'Seguir igual', res: 'Mantienes tu rutina.' },
    },
    fact: 'Según la OMS, las epidemias de cólera y otras enfermedades diarreicas aparecen allí donde fallan el agua potable y el saneamiento: tras catástrofes, conflictos y colapsos de servicios.',
  },
};
