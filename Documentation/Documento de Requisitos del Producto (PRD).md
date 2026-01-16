# **PRD**

# **Product Requirements Document (PRD): JamMaster AI Toolkit**

**Versión:** 1.2

**Estado:** Especificación de Frameworks y Autonomía

**Rol:** Senior Product Manager (AI/Web Solutions)

## **1\. Visión del Producto**

**JamMaster AI** es un portal web "todo en uno" para participantes de Game Jams. Su objetivo es maximizar la productividad mediante la ideación basada en teoría de juegos, el control de alcance (scope) consultivo y la gestión dinámica de tareas, todo centralizado en un flujo de trabajo asistido por IA.

## **2\. Especificaciones de Funcionalidades (MVP Refinado)**

### **Módulo 1: "The Oracle" (Ideación & Teoría de la Diversión)**

* **Input:** Tema de la Jam y Género.  
* **Output:** 3 Conceptos de juego con:  
  * **Mecánica Core (Loop):** Definición del ciclo básico de juego (Acción \-\> Feedback \-\> Recompensa).  
  * **Justificación Teórica (Breve y Práctica):** \* **MDA Framework:** Desglose de Mecánica, Dinámica y Estética.  
    * **Teoría de la Diversión (Koster):** Explicación de qué "patrón" está aprendiendo el cerebro del jugador para mantener el interés.  
    * **Análisis de Flow (Csikszentmihalyi):** Cómo la idea equilibra el reto vs. la habilidad para evitar el aburrimiento o la ansiedad.  
  * **Feedback Loop:** Diagrama de texto sobre el sistema de respuesta del juego ante las acciones del usuario.

### **Módulo 2: "Scope Guardian" (El Consultor de Riesgos)**

* **Análisis de Capacidad:** Cruza la idea del Módulo 1 con el perfil del equipo (manual o automático).  
* **Output de Advertencia (No Limitante):**  
  * **Semáforo de Viabilidad:** Verde (Seguro), Amarillo (Riesgoso), Rojo (Crítico).  
  * **Reporte de Riesgos:** Listado de las 3 mecánicas o assets que más tiempo consumirán.  
  * **Cláusula de Autonomía:** El sistema presentará una advertencia visual clara ("Riesgo de Scope Alto"), pero permitirá al usuario proceder con el proyecto. La IA actuará como un "copiloto" que avisa de la tormenta, pero deja al capitán decidir el rumbo.  
* **Sugerencia de "Recorte Inteligente":** Propuestas de simplificación (ej: "Tu idea de mundo abierto es Riesgo Rojo; sugerimos una estructura de niveles lineales para garantizar el cierre").

### **Módulo 3: "Smart Kanban" (Gestión Híbrida)**

* **Generación Dinámica:** Crea el tablero inicial basándose en el concepto y el análisis de riesgo.  
* **Control Total:** El usuario tiene permisos completos para ignorar las sugerencias de la IA, mover tarjetas, o eliminar secciones enteras del roadmap generado.

### **Módulo 4: "Asset Manifest" (Planificación de Producción)**

* **Funcionalidad:** Listado técnico de assets mínimos viables.  
* **Prompting:** Genera descripciones precisas orientadas a herramientas externas, manteniendo la coherencia con el estilo visual definido en la etapa de ideación.

## **3\. Arquitectura Técnica Sugerida**

### **IA & Lógica de Teoría**

* **Contextual Prompting:** Uso de prompts del sistema cargados con principios de *Game Design* para asegurar que la "Justificación Teórica" sea académica pero aplicable.  
* **Heurísticas de Scope:** El motor de análisis usará una base de datos de "costos estimados" (ej: "un sistema de inventario básico \= 4-6 horas de dev") para calcular la viabilidad.

## **4\. Roadmap de Desarrollo**

1. **Fase 1 (Core):** Perfiles de usuario \+ "The Oracle" con validación de Flow/Koster.  
2. **Fase 2 (Risk Management):** Implementación del Scope Guardian con sistema de advertencias visuales no restrictivas.  
3. **Fase 3 (Workflow):** Kanban editable y sincronizado.  
4. **Fase 4 (Production):** Manifestador de assets y generador de prompts técnicos.

# **Arquitectura del Portal & Workflow**

# **Arquitectura del Portal & Workflow: JamMaster Toolkit**

**Estado:** Definición de Sistema y UX

**Objetivo:** Establecer la jerarquía del portal y el flujo de datos del MVP (Jam Tool).

## **1\. Estructura Global del Portal (High-Level)**

El portal se diseña bajo una arquitectura de **"Hub & Spokes"** (Núcleo y Extensiones).

### **A. El Núcleo (Core Engine)**

* **User Identity:** Perfiles con XP, habilidades validadas y portafolio.  
* **Project Vault:** Base de datos centralizada de los juegos creados.  
* **AI Context Layer:** Una capa de memoria que permite que la IA "recuerde" tus preferencias de diseño entre diferentes herramientas.

### **B. Las Toolkits (Módulos)**

* **Módulo 1: Jam Master (MVP):** Optimizado para velocidad y scope.  
* **Módulo 2: Asset Forge (Futuro):** Generación y edición profunda de assets.  
* **Módulo 3: Dev-to-Market (Futuro):** Herramientas de marketing, itch.io integration y pulido.

## **2\. Flujo de Entrada: "The Jam Onboarding"**

Para que el **Scope Guardian** y **The Oracle** funcionen, necesitamos datos de alta calidad. El usuario completará un formulario dinámico:

### **Datos de la Jam**

1. **Nombre y Tema:** (Ej: "Global Game Jam \- Theme: Roots").  
2. **Ventana de Tiempo:** Horas totales (ej: 48h) y fecha de entrega.  
3. **Motor (Engine):** Unity, Godot, Unreal, PyGame, etc.

### **Perfil del Equipo (La "Capacidad")**

* **Selección de Miembros:** (Si son usuarios del portal, se extraen sus tags automáticamente).  
* **Carga Manual:** Si no están en el portal, se definen roles por "Power Level":  
  * *Ejemplo:* Programación (Senior), Arte (Novato), Audio (No hay).

### **Preferencias Creativas**

* **Género:** (Plataformas, Horror, Puzzle, etc.).  
* **Vibe/Estética:** (Pixel Art, Low Poly, Noir, etc.).

## **3\. Estructura del Reporte: "The Reality Check"**

Una vez procesado, el sistema devuelve un documento estructurado que sirve de guía al equipo:

### **A. Dashboard de Viabilidad (Visual)**

* **Scope Score:** Un porcentaje de 0 a 100% de probabilidad de éxito.  
* **Critical Path:** Identificación del "cuello de botella" (ej: "Mucho código para un solo programador").

### **B. Justificación de Diseño (The Oracle)**

* **Propuesta de Concepto:** El "Elevator Pitch" del juego.  
* **Validación de Diversión:** \* *Análisis de Koster:* "¿Cuál es el patrón que el jugador debe aprender?".  
  * *Análisis de Flow:* Curva de dificultad sugerida para las 48 horas.

### **C. Estrategia de Producción**

* **Mecánicas a Priorizar:** Top 3 funciones que hacen que el juego sea "jugable".  
* **Mecánicas a Recortar (Kill-List):** Qué cosas omitir si el tiempo llega al 50%.

## **4\. Arquitectura de Datos (Para el Dev)**

| Entidad | Descripción |
| :---- | :---- |
| User | ID, Skills (Array), History. |
| Project | Context\_JSON (Guarda el GDD y el Scope Report). |
| Task | ID, Project\_ID, Role\_Assigned, Status, AI\_Suggestion (Booleano). |
| Asset\_Entry | Name, Type, Technical\_Spec, AI\_Prompt. |

## **5\. Prototipo de Interfaz (Wireframe Log)**

1. **Vista Dashboard:** Sidebar con herramientas, área central con el Kanban.  
2. **Modales de IA:** Ventanas flotantes de "Advertencia de Scope" que aparecen cuando el usuario agrega demasiadas tareas al Kanban.

# **Pestaña 3**

# **Documento de Visión y Arquitectura: Portal de Desarrollo Gamificado (DevHub)**

**Producto:** Portal "All-in-One" para Game Developers

**Proyecto Inicial (MVP):** JamMaster Toolkit

**Responsable:** Senior Product Manager

## **1\. Visión General del Producto**

El objetivo es crear un ecosistema centralizado basado en web que elimine la fricción creativa y técnica en el desarrollo de videojuegos. A diferencia de las herramientas aisladas (ChatGPT, Trello, Midjourney), este portal ofrece **Interoperabilidad de Contexto**: la información fluye entre herramientas (ideación \-\> gestión \-\> producción) mediante una capa de Inteligencia Artificial que comprende el proyecto de forma integral.

## **2\. Estrategia de Arquitectura: Modularidad y Escalamiento**

Para que el sistema sea **mantensible y expansivo**, se propone una arquitectura de **Núcleo y Micro-Módulos**.

### **A. El Núcleo (The Core)**

Es la base sobre la cual se "enchufan" las herramientas. Contiene:

* **Gestión de Contexto (Context API):** Un "almacén de datos" del proyecto (GDD, estilo, género) que todas las herramientas pueden consultar.  
* **Sistema de Identidad:** Perfiles de usuario con habilidades técnicas validadas.  
* **Capa de Orquestación de IA:** Un puente unificado para conectar con diferentes modelos (OpenAI, Anthropic, Replicate) sin reescribir código en cada herramienta.

### **B. Los Toolkits (Módulos Independientes)**

Cada herramienta (como la Jam Toolkit) funciona como un módulo aislado.

* **Independencia:** Si el módulo de Jams falla, el portal sigue funcionando.  
* **Escalabilidad:** Permite añadir el "Módulo de Marketing" o el "Módulo de Audio" en el futuro sin tocar el núcleo.

## **3\. El MVP: JamMaster Toolkit**

La primera vertical de negocio enfocada en velocidad y ejecución.

### **Componentes Críticos del MVP:**

1. **The Oracle (Ideación):** Generador de conceptos basado en frameworks de diseño (MDA, Flow, Koster).  
2. **Scope Guardian (Validador):** Sistema consultivo que cruza capacidad del equipo vs. ambición del proyecto. Genera advertencias claras pero no restrictivas.  
3. **Smart Kanban:** Gestor de tareas auto-generado, totalmente editable por el usuario.  
4. **Asset Manifest:** Planificador de producción con descripciones técnicas y prompts.

## **4\. Requerimientos Técnicos (Qué se necesita)**

### **Infraestructura & Backend**

* **Entorno de Ejecución:** Node.js (con Next.js para el frontend) o Python (FastAPI) para el manejo eficiente de datos y modelos de IA.  
* **Base de Datos Relacional:** PostgreSQL (ej. Supabase) para manejar las relaciones complejas entre usuarios, proyectos y tareas.  
* **Almacenamiento de Estado:** Redis o similar para que el "contexto de la IA" sea rápido y persistente durante la sesión.

### **Capa de Inteligencia Artificial**

* **LLM (Large Language Model):** Acceso a APIs de GPT-4o o Claude 3.5 Sonnet para el razonamiento lógico y teoría de juegos.  
* **Framework de Orquestación:** LangChain o Vercel AI SDK para encadenar las respuestas de la IA entre módulos.

### **Interfaz de Usuario (UX/UI)**

* **Diseño Modular:** Uso de componentes reutilizables (ej. Tailwind CSS \+ Shadcn/UI).  
* **Interactividad:** Librerías de Drag & Drop para el Kanban y gráficos dinámicos para los reportes de riesgo del Scope Guardian.

## **5\. Hoja de Ruta de Implementación (Fases)**

### **Fase 1: Infraestructura Base (Core)**

* Configuración del portal, login de usuarios y creación de perfil de habilidades.  
* Implementación de la "Base de Datos de Contexto".

### **Fase 2: Implementación de la Lógica "Jam"**

* Desarrollo de los motores de Ideación (Módulo 1\) y Scope (Módulo 2).  
* Creación del algoritmo de cálculo de riesgos.

### **Fase 3: Gestión y Visualización**

* Construcción del Kanban dinámico y los tableros de control.  
* Generador de reportes en PDF/Markdown para los equipos.

### **Fase 4: Expansión**

* Apertura de nuevas Toolkits (Assets, Publicación, Academia).

