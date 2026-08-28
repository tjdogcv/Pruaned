# Graph Report - .  (2026-08-18)

## Corpus Check
- 110 files · ~257,912 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 323 nodes · 575 edges · 26 communities (23 shown, 3 thin omitted)
- Extraction: 95% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.86)
- Token cost: 62,420 input · 12,750 output

## Community Hubs (Navigation)
- Aplicación y componentes
- Autenticación y datos
- Aula virtual LMS
- Dependencias de producción
- Socios y finanzas
- Seguridad y remediación
- Herramientas de desarrollo
- Supabase y seguridad cliente
- Misión y principios
- Voluntariado
- Estatutos y marco institucional
- Finanzas y transparencia
- Gobierno institucional
- Respuesta a emergencias
- Registro y operación
- Régimen electoral
- Colaboración de agentes
- Ética y disciplina
- Activos de marca
- Limpieza Bash
- Índice de estatutos
- Despliegue Vercel

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 55 edges
2. `AuthProvider()` - 21 edges
3. `normalizeAudience()` - 11 edges
4. `PRUANEDLogo()` - 10 edges
5. `SociosIntranet()` - 9 edges
6. `LmsAcademy()` - 9 edges
7. `LmsEditor()` - 9 edges
8. `Critical Security Audit` - 8 edges
9. `scripts` - 6 edges
10. `AuthModal()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Master User Security Diagnosis` --semantically_similar_to--> `Hardcoded Administrative Credentials`  [INFERRED] [semantically similar]
  DIAGNOSTICO_USUARIO_MAESTRO.md → AUDIT_SEGURIDAD_CRITICO.md
- `Roles Schema Analysis` --semantically_similar_to--> `Master User Security Diagnosis`  [INFERRED] [semantically similar]
  MIGRACION_ROLES_SCHEMA.md → DIAGNOSTICO_USUARIO_MAESTRO.md
- `Server-Side Role Verification` --semantically_similar_to--> `Role-Based Access Control`  [INFERRED] [semantically similar]
  MIGRACION_ROLES_SCHEMA.md → REMEDIACION_TECNICA.md
- `Animal Disaster Risk Management Mission` --conceptually_related_to--> `PRUANED Statutes and General Regulations 2025`  [INFERRED]
  index.html → public/Estatutos-v-3.pdf
- `PRUANED Official Logo` --semantically_similar_to--> `PRUANED Frontend Logo Asset`  [INFERRED] [semantically similar]
  public/pruaned-official-logo.png → src/assets/pruaned-official-logo.png

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Security Audit and Remediation Set** — audit_seguridad_critico_security_audit, remediacion_tecnica_technical_remediation, checklist_seguridad_remediation_checklist, resumen_ejecutivo_seguridad_executive_security_summary [EXTRACTED 1.00]
- **Role Security Migration Set** — diagnostico_usuario_maestro_master_user_diagnosis, migracion_roles_schema_roles_schema_analysis, migracion_roles_schema_user_roles_table, migracion_roles_schema_server_side_role_verification [INFERRED 0.85]
- **Statutes, Governance and Volunteer Framework** — public_estatutos_redisenados_statutes, public_estatutos_redisenados_association_governance, public_estatutos_redisenados_members_and_volunteers, public_estatutos_redisenados_volunteer_regulation, public_estatutos_v_3_statutes [INFERRED 0.95]
- **Disaster risk governance foundations** — public_pdf_preview_pages_page_3_one_health_one_welfare, public_pdf_preview_pages_page_3_sendai_framework, public_pdf_preview_pages_page_4_association_object, public_pdf_preview_pages_page_4_animal_dimension [INFERRED 0.85]
- **Member and volunteer lifecycle** — public_pdf_preview_pages_page_6_membership_categories, public_pdf_preview_pages_page_7_volunteer_induction, public_pdf_preview_pages_page_7_member_rights_and_duties, public_pdf_preview_pages_page_9_member_volunteer_registry [INFERRED 0.85]
- **Institutional governance system** — public_pdf_preview_pages_page_9_association_organs, public_pdf_preview_pages_page_9_general_assembly, public_pdf_preview_pages_page_10_national_board, public_pdf_preview_pages_page_11_board_functions, public_pdf_preview_pages_page_12_secretarial_financial_governance [EXTRACTED 1.00]
- **Volunteer Operational Lifecycle** — public_pdf_preview_pages_page_13_volunteer_lifecycle, public_pdf_preview_pages_page_18_volunteer_accreditation, public_pdf_preview_pages_page_19_volunteer_training, public_pdf_preview_pages_page_19_disciplinary_regime [INFERRED 0.85]
- **Emergency Response Governance** — public_pdf_preview_pages_page_20_operational_hierarchy, public_pdf_preview_pages_page_20_emergency_coordination, public_pdf_preview_pages_page_21_interinstitutional_coordination, public_pdf_preview_pages_page_22_emergency_regime [INFERRED 0.85]
- **PRUANED Brand Assets** — public_pruaned_logo_official_brand_mark, public_pruaned_official_logo_brand_mark, src_assets_pruaned_official_logo_brand_mark [INFERRED 0.95]

## Communities (26 total, 3 thin omitted)

### Community 0 - "Aplicación y componentes"
Cohesion: 0.07
Nodes (33): App(), PRUANEDLogo(), AdminCMS(), CertificateModal(), CertificateVerify(), DocumentManager(), initialForm(), DocumentsSection() (+25 more)

### Community 1 - "Autenticación y datos"
Cohesion: 0.09
Nodes (34): PrivateRoute(), AuthContext, AuthProvider(), DEFAULT_FINANCIAL_CATEGORIES, DOCUMENT_EXTENSIONS, DOCUMENT_MIME_TYPES, fileExtension(), formatChileanRut() (+26 more)

### Community 2 - "Aula virtual LMS"
Cohesion: 0.12
Nodes (17): assessmentLabel(), attachCourseModules(), courseProgress(), getCourseVideoEmbedUrl(), normalizeAudience(), resultForCourse(), audienceLabel(), CourseMaterial() (+9 more)

### Community 3 - "Dependencias de producción"
Cohesion: 0.08
Nodes (23): @emailjs/browser, lucide-react, dependencies, @emailjs/browser, lucide-react, react, react-dom, react-router-dom (+15 more)

### Community 4 - "Socios y finanzas"
Cohesion: 0.15
Nodes (12): FondoDonacionesPanel(), formatCLP(), QUOTA_EXPENSE_CATEGORIES, SEVERITY_CFG, SociosIntranet(), sendApprovalEmail(), sendPagoEmail(), sendRejectionEmail() (+4 more)

### Community 5 - "Seguridad y remediación"
Cohesion: 0.15
Nodes (17): Client-Side Two-Factor Authentication, Hardcoded Administrative Credentials, Insecure Client Sessions, Critical Security Audit, Unprotected Administrative Operations, Potentially Weak RLS Policies, Security Remediation Checklist, Master User Security Diagnosis (+9 more)

### Community 6 - "Herramientas de desarrollo"
Cohesion: 0.12
Nodes (17): autoprefixer, devDependencies, autoprefixer, postcss, puppeteer-core, tailwindcss, @types/react, @types/react-dom (+9 more)

### Community 7 - "Supabase y seguridad cliente"
Cohesion: 0.24
Nodes (10): AuthModal(), BUCKETS, isSupabaseReady(), supabase, uploadFile(), evaluatePasswordStrength(), EVENT_LABELS, humanize() (+2 more)

### Community 8 - "Misión y principios"
Cohesion: 0.17
Nodes (13): Animal and emergency response symbols, Animal and emergency response symbols, PRUANED high-resolution institutional shield, PRUANED institutional shield, Animal inclusion in disaster risk management, Association Gremial PRUANED A.G., PRUANED statutes and regulations cover, Legal nature and duration (+5 more)

### Community 9 - "Voluntariado"
Cohesion: 0.17
Nodes (12): One Health Direction, Risk Reduction and Disaster Response Direction, Statutes Page 13, Technical and Thematic Directions, Volunteer Lifecycle Management, Permanent Volunteers, Spontaneous Volunteers, Volunteer Entry and Accreditation (+4 more)

### Community 10 - "Estatutos y marco institucional"
Cohesion: 0.18
Nodes (11): Cleanup Inventory, Essential Project Assets, Cleanup Execution Guide, Animal Disaster Risk Management Mission, PRUANED Web Application, Association Governance, Members and Volunteers Framework, Redesigned PRUANED Statutes (+3 more)

### Community 11 - "Finanzas y transparencia"
Cohesion: 0.18
Nodes (11): Alliances, Agreements and Donations Direction, Animal Protection Directions, Indigenous Peoples Direction, Statutes Page 14, Conflict of Interest Prevention, Donation Governance, Financial Regime and Transparency, Member Dues (+3 more)

### Community 12 - "Gobierno institucional"
Cohesion: 0.29
Nodes (7): General Assembly sessions, quorum and electronic voting, National Board, National Board functions and executive offices, Board officer succession rules, Secretary and Treasurer governance functions, Association governing organs, General Assembly

### Community 13 - "Respuesta a emergencias"
Cohesion: 0.33
Nodes (6): Emergency Coordination Structure, Three-Level Operational Hierarchy, Interinstitutional Coordination, Operational Protocols and Interoperability, Extraordinary Emergency and Disaster Regime, Extraordinary Operational Actions

### Community 14 - "Registro y operación"
Cohesion: 0.33
Nodes (6): Administrative and technical-operational structures, Governing principles, Member and volunteer categories, Technical-operational emergency response structure, Volunteer induction and operational eligibility, Member and volunteer registry with data protection

### Community 15 - "Régimen electoral"
Cohesion: 0.50
Nodes (4): Electoral Committee, Electoral Regime, Statutory Reform and Dissolution, Incomplete Name Fields

### Community 16 - "Colaboración de agentes"
Cohesion: 1.00
Nodes (3): BAC Backend Architect, BAC–FON Collaboration Protocol, FON Frontend Experience Owner

### Community 18 - "Ética y disciplina"
Cohesion: 0.67
Nodes (3): Member and volunteer rights and duties, Attendance discipline and due process, Ethics Committee

### Community 19 - "Activos de marca"
Cohesion: 0.67
Nodes (3): PRUANED Official Brand Mark, PRUANED Official Logo, PRUANED Frontend Logo Asset

## Ambiguous Edges - Review These
- `Electoral Regime` → `Incomplete Name Fields`  [AMBIGUOUS]
  public/pdf_preview_pages/page_23.png · relation: conceptually_related_to

## Knowledge Gaps
- **62 isolated node(s):** `cleanup-pruaned.sh script`, `name`, `private`, `version`, `type` (+57 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Electoral Regime` and `Incomplete Name Fields`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `AuthProvider()` connect `Autenticación y datos` to `Aplicación y componentes`, `Aula virtual LMS`, `Dependencias de producción`, `Supabase y seguridad cliente`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Why does `react` connect `Dependencias de producción` to `Autenticación y datos`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `AuthProvider()` (e.g. with `normalizeAuditLog()` and `normalizeDocument()`) actually correct?**
  _`AuthProvider()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `cleanup-pruaned.sh script`, `name`, `private` to the rest of the system?**
  _62 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Aplicación y componentes` be split into smaller, more focused modules?**
  _Cohesion score 0.0745637228979376 - nodes in this community are weakly interconnected._
- **Should `Autenticación y datos` be split into smaller, more focused modules?**
  _Cohesion score 0.09413067552602436 - nodes in this community are weakly interconnected._