## ¿Qué hace este PR?
<!-- Descripción breve del cambio -->

## Tipo de cambio
- [ ] feat — nueva funcionalidad
- [ ] fix — corrección de bug
- [ ] test — tests nuevos o corregidos
- [ ] chore — configuración o dependencias
- [ ] docs — documentación

## Checklist
- [ ] Sigue la arquitectura definida en CLAUDE.md
- [ ] No viola las reglas de importación FSD
- [ ] No hay JWT en el body ni en localStorage
- [ ] No hay llamadas HTTP dentro de stores de Pinia
- [ ] No hay v-show para RBAC (solo v-if)
- [ ] Los tests pasan: `npm run test`
- [ ] No hay errores de lint: `npm run lint`
- [ ] Los archivos están en la capa correcta según FSD / Layered Architecture

## Decisiones arquitectónicas tomadas
<!-- Si aplicaste algún patrón o tomaste una decisión de diseño, explícala aquí -->

## Notas para el revisor
<!-- Algo específico que deba revisar o tener en cuenta -->
